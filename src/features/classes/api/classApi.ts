import {
    addDoc,
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
import { Class, DEFAULT_STATUSES, StatusDefinition } from "@/types";

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
            memberCount: 1, // Owner counts as a member
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
};
