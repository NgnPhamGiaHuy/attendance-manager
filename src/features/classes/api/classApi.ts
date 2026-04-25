import {
    doc,
    documentId,
    getDoc,
    getDocs,
    increment,
    limit,
    query,
    serverTimestamp,
    setDoc,
    updateDoc,
    where,
} from "firebase/firestore";

import { Collections } from "@/lib/collections";
import { generateClassCode } from "@/lib/utils";
import { Class, DEFAULT_STATUSES, ScoringRules, StatusDefinition } from "@/types";

export const classApi = {
    /**
     * Fetch all classes owned by the user or where they are enrolled.
     */
    getClassesByUserId: async (userId: string): Promise<Class[]> => {
        // 1. Fetch owned classes
        const ownedQuery = query(
            Collections.classes(),
            where("ownerId", "==", userId),
            where("isArchived", "==", false),
        );
        const ownedSnapshot = await getDocs(ownedQuery);
        const ownedClasses = ownedSnapshot.docs.map((doc) => ({
            ...doc.data(),
            id: doc.id,
        })) as Class[];

        // 2. Fetch enrollments to find joined classes
        const enrollmentQuery = query(
            Collections.enrollments(),
            where("studentId", "==", userId),
            where("isActive", "==", true),
        );
        const enrollmentSnapshot = await getDocs(enrollmentQuery);
        const enrolledClassIds = enrollmentSnapshot.docs.map((doc) => doc.data().classId);

        // Filter out classes we already have as owner
        const joinedClassIds = enrolledClassIds.filter(
            (id) => !ownedClasses.some((c) => c.id === id),
        );

        if (joinedClassIds.length === 0) {
            return ownedClasses;
        }

        // 3. Fetch joined class details using an 'in' query for efficiency
        const joinedClasses: Class[] = [];
        if (joinedClassIds.length > 0) {
            // Note: Firebase 'in' queries are limited to 30 items
            // For most users this is fine; for power users we'd need to chunk
            const joinedQuery = query(
                Collections.classes(),
                where(documentId(), "in", joinedClassIds.slice(0, 30)),
            );
            const joinedSnapshot = await getDocs(joinedQuery);
            joinedClasses.push(
                ...joinedSnapshot.docs
                    .map((d) => ({ ...d.data(), id: d.id }) as Class)
                    .filter((c) => !c.isArchived),
            );
        }

        return [...ownedClasses, ...joinedClasses];
    },

    /**
     * Update a class document.
     */
    updateClass: async (id: string, data: Partial<Class>): Promise<void> => {
        const docRef = doc(Collections.classes(), id);
        await updateDoc(docRef, {
            ...data,
            updatedAt: serverTimestamp(),
        });
    },

    /**
     * Fetch a single class by its ID.
     */
    getClassById: async (id: string): Promise<Class> => {
        const docRef = doc(Collections.classes(), id);
        const snapshot = await getDoc(docRef);

        if (!snapshot.exists()) {
            throw new Error("Class not found");
        }

        return {
            ...snapshot.data(),
            id: snapshot.id,
        } as Class;
    },

    /**
     * Create a new class, setting up default statuses, scoring rules, and the initial member (owner).
     */
    createClass: async (
        data: { name: string; description?: string },
        ownerId: string,
        ownerName: string,
    ): Promise<string> => {
        const classRef = doc(Collections.classes());

        // Convert DEFAULT_STATUSES array into a mapped object
        const statusDefinitions = DEFAULT_STATUSES.reduce(
            (acc, status, index) => {
                const id = `status_${index}`;
                acc[id] = { id, ...status };
                return acc;
            },
            {} as Record<string, StatusDefinition>,
        );

        const newClass = {
            name: data.name,
            description: data.description || "",
            ownerId,
            ownerName,
            code: generateClassCode(),
            statusDefinitions,
            scoringRules: {
                basePoints: 100,
                allowedAbsences: 2,
                penaltyPerAbsence: 5,
                capAtZero: true,
            },
            memberCount: 1,
            sessionCount: 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            isArchived: false,
        };

        // Create the class document
        await setDoc(classRef, newClass);

        // Add the owner to the classMembers subcollection
        const memberRef = doc(Collections.classMembers(classRef.id), ownerId);
        await setDoc(memberRef, {
            userId: ownerId,
            role: "teacher",
            addedAt: serverTimestamp(),
        });

        return classRef.id;
    },

    /**
     * Join a class using a 6-character code.
     */
    joinClassByCode: async (
        code: string,
        studentId: string,
        studentName: string,
        studentEmail: string,
    ): Promise<string> => {
        // Find the class by code
        const q = query(Collections.classes(), where("code", "==", code.toUpperCase()), limit(1));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            throw new Error("Invalid class code.");
        }

        const classDoc = snapshot.docs[0];
        const classId = classDoc.id;

        // Check if already enrolled
        const memberRef = doc(Collections.classMembers(classId), studentId);
        const memberSnap = await getDoc(memberRef);
        if (memberSnap.exists()) {
            throw new Error("You are already enrolled in this class.");
        }

        // Add to classMembers (RBAC subcollection)
        await setDoc(memberRef, {
            userId: studentId,
            role: "student",
            addedAt: serverTimestamp(),
        });

        // Create the Enrollment document (for analytics/grading aggregation)
        const enrollmentRef = doc(Collections.enrollments());
        await setDoc(enrollmentRef, {
            id: enrollmentRef.id,
            classId,
            studentId,
            studentName,
            studentEmail,
            enrolledAt: serverTimestamp(),
            isActive: true,
            aggregatedScore: 100,
            totalAbsences: 0,
            sessionsAttended: 0,
            sessionsEligible: 0,
        });

        // Increment member count atomically
        await updateDoc(classDoc.ref, {
            memberCount: increment(1),
        });

        return classId;
    },

    /**
     * Add a new status definition to a class.
     * Validates uniqueness of label and acronym among non-archived statuses.
     * Assigns next available order number automatically.
     *
     * @throws Error if label or acronym already exists (non-archived)
     * @throws Error if validation fails
     *
     * @example
     * await classApi.addStatus(classId, {
     *   label: "Remote",
     *   acronym: "R",
     *   color: "#3b82f6",
     *   multiplier: 1.0,
     *   absenceWeight: 0,
     *   isDefault: false
     * });
     */
    addStatus: async (
        classId: string,
        newStatus: Omit<StatusDefinition, "id" | "order">,
    ): Promise<string> => {
        // Fetch current class to validate
        const classDoc = await classApi.getClassById(classId);
        const existingStatuses = classDoc.statusDefinitions || {};

        // Validate uniqueness among non-archived statuses
        const activeStatuses = Object.values(existingStatuses).filter((s) => !s.isArchived);
        const labelExists = activeStatuses.some(
            (s) => s.label.toLowerCase() === newStatus.label.toLowerCase(),
        );
        const acronymExists = activeStatuses.some(
            (s) => s.acronym.toLowerCase() === newStatus.acronym.toLowerCase(),
        );

        if (labelExists) {
            throw new Error(`Status label "${newStatus.label}" already exists.`);
        }
        if (acronymExists) {
            throw new Error(`Status acronym "${newStatus.acronym}" already exists.`);
        }

        // Validate field constraints
        if (newStatus.label.length < 1 || newStatus.label.length > 30) {
            throw new Error("Status label must be 1-30 characters.");
        }
        if (newStatus.acronym.length < 1 || newStatus.acronym.length > 3) {
            throw new Error("Status acronym must be 1-3 characters.");
        }
        if (!/^#[0-9A-Fa-f]{6}$/.test(newStatus.color)) {
            throw new Error("Status color must be a valid hex color (#RRGGBB).");
        }
        if (newStatus.multiplier < 0 || newStatus.multiplier > 1) {
            throw new Error("Status multiplier must be between 0 and 1.");
        }
        if (newStatus.absenceWeight < 0 || newStatus.absenceWeight > 1) {
            throw new Error("Status absenceWeight must be between 0 and 1.");
        }

        // Calculate next order
        const maxOrder = Math.max(...Object.values(existingStatuses).map((s) => s.order), -1);
        const nextOrder = maxOrder + 1;

        // Generate ID using Firebase's doc() without arguments (creates unique ID)
        const statusId = doc(Collections.classes()).id;
        const status: StatusDefinition = {
            ...newStatus,
            id: statusId,
            order: nextOrder,
            isArchived: false,
        };

        // Update class document
        const docRef = doc(Collections.classes(), classId);
        await updateDoc(docRef, {
            [`statusDefinitions.${statusId}`]: status,
            updatedAt: serverTimestamp(),
        });

        return statusId;
    },

    /**
     * Update an existing status definition.
     * Validates uniqueness if label or acronym is being changed.
     *
     * @throws Error if new label/acronym conflicts with existing (non-archived) status
     * @throws Error if validation fails
     *
     * @example
     * await classApi.updateStatus(classId, statusId, {
     *   label: "Present (Remote)",
     *   color: "#10b981"
     * });
     */
    updateStatus: async (
        classId: string,
        statusId: string,
        updates: Partial<Omit<StatusDefinition, "id">>,
    ): Promise<void> => {
        // Fetch current class to validate
        const classDoc = await classApi.getClassById(classId);
        const existingStatuses = classDoc.statusDefinitions || {};
        const currentStatus = existingStatuses[statusId];

        if (!currentStatus) {
            throw new Error("Status not found.");
        }

        // Validate uniqueness if label or acronym is being changed
        if (updates.label || updates.acronym) {
            const activeStatuses = Object.values(existingStatuses).filter(
                (s) => !s.isArchived && s.id !== statusId,
            );

            if (updates.label) {
                const labelExists = activeStatuses.some(
                    (s) => s.label.toLowerCase() === updates.label!.toLowerCase(),
                );
                if (labelExists) {
                    throw new Error(`Status label "${updates.label}" already exists.`);
                }
                if (updates.label.length < 1 || updates.label.length > 30) {
                    throw new Error("Status label must be 1-30 characters.");
                }
            }

            if (updates.acronym) {
                const acronymExists = activeStatuses.some(
                    (s) => s.acronym.toLowerCase() === updates.acronym!.toLowerCase(),
                );
                if (acronymExists) {
                    throw new Error(`Status acronym "${updates.acronym}" already exists.`);
                }
                if (updates.acronym.length < 1 || updates.acronym.length > 3) {
                    throw new Error("Status acronym must be 1-3 characters.");
                }
            }
        }

        // Validate other field constraints
        if (updates.color && !/^#[0-9A-Fa-f]{6}$/.test(updates.color)) {
            throw new Error("Status color must be a valid hex color (#RRGGBB).");
        }
        if (
            updates.multiplier !== undefined &&
            (updates.multiplier < 0 || updates.multiplier > 1)
        ) {
            throw new Error("Status multiplier must be between 0 and 1.");
        }
        if (
            updates.absenceWeight !== undefined &&
            (updates.absenceWeight < 0 || updates.absenceWeight > 1)
        ) {
            throw new Error("Status absenceWeight must be between 0 and 1.");
        }

        // Merge updates with current status
        const updatedStatus = { ...currentStatus, ...updates };

        // Update class document
        const docRef = doc(Collections.classes(), classId);
        await updateDoc(docRef, {
            [`statusDefinitions.${statusId}`]: updatedStatus,
            updatedAt: serverTimestamp(),
        });
    },

    /**
     * Soft-delete a status definition by setting isArchived to true.
     * Prevents deletion if it would leave zero active statuses.
     *
     * @throws Error if this is the last active status
     *
     * @example
     * await classApi.deleteStatus(classId, statusId);
     */
    deleteStatus: async (classId: string, statusId: string): Promise<void> => {
        // Fetch current class to validate
        const classDoc = await classApi.getClassById(classId);
        const existingStatuses = classDoc.statusDefinitions || {};
        const currentStatus = existingStatuses[statusId];

        if (!currentStatus) {
            throw new Error("Status not found.");
        }

        // Count active (non-archived) statuses
        const activeStatuses = Object.values(existingStatuses).filter((s) => !s.isArchived);

        if (activeStatuses.length <= 1) {
            throw new Error(
                "Cannot delete the last active status. At least one status is required.",
            );
        }

        // Soft-delete by setting isArchived
        const updatedStatus = { ...currentStatus, isArchived: true };

        // Update class document
        const docRef = doc(Collections.classes(), classId);
        await updateDoc(docRef, {
            [`statusDefinitions.${statusId}`]: updatedStatus,
            updatedAt: serverTimestamp(),
        });
    },

    /**
     * Save scoring rules for a class.
     * Validates all field constraints before saving.
     *
     * @throws Error if validation fails
     *
     * @example
     * await classApi.saveScoringRules(classId, {
     *   basePoints: 100,
     *   allowedAbsences: 3,
     *   penaltyPerAbsence: 10,
     *   capAtZero: true
     * });
     */
    saveScoringRules: async (classId: string, rules: ScoringRules): Promise<void> => {
        // Validate constraints
        if (rules.basePoints < 1 || rules.basePoints > 1000) {
            throw new Error("Base points must be between 1 and 1000.");
        }
        if (rules.allowedAbsences < 0 || rules.allowedAbsences > 50) {
            throw new Error("Allowed absences must be between 0 and 50.");
        }
        if (rules.penaltyPerAbsence < 0 || rules.penaltyPerAbsence > 100) {
            throw new Error("Penalty per absence must be between 0 and 100.");
        }

        // Update class document
        const docRef = doc(Collections.classes(), classId);
        await updateDoc(docRef, {
            scoringRules: rules,
            updatedAt: serverTimestamp(),
        });
    },
};
