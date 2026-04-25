import {
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    onSnapshot,
    serverTimestamp,
    setDoc,
    updateDoc,
} from "firebase/firestore";

import { Collections } from "@/lib/collections";

import type { ClassMember, ClassRole } from "@/types";

/**
 * Service layer for class member management (RBAC).
 *
 * Handles role promotion/demotion and real-time member subscriptions.
 * All writes include proper error handling and validation.
 *
 * @module memberApi
 */
export const memberApi = {
    /**
     * Fetch all members of a class (one-time read).
     *
     * @param classId - The class document ID
     * @returns Array of ClassMember objects
     * @throws Error if Firestore read fails
     */
    getMembers: async (classId: string): Promise<ClassMember[]> => {
        try {
            const snapshot = await getDocs(Collections.classMembers(classId));
            return snapshot.docs.map((doc) => ({
                ...doc.data(),
                userId: doc.id,
            })) as ClassMember[];
        } catch (error) {
            console.error("[memberApi.getMembers] Failed to fetch members:", error);
            throw new Error("Failed to fetch class members");
        }
    },

    /**
     * Subscribe to real-time updates of class members.
     *
     * @param classId - The class document ID
     * @param onData - Callback invoked with updated member array
     * @returns Unsubscribe function
     *
     * @example
     * ```ts
     * const unsubscribe = memberApi.subscribeMembers(classId, (members) => {
     *   console.log('Members updated:', members);
     * });
     * // Later: unsubscribe();
     * ```
     */
    subscribeMembers: (classId: string, onData: (members: ClassMember[]) => void): (() => void) => {
        return onSnapshot(
            Collections.classMembers(classId),
            (snapshot) => {
                const members = snapshot.docs.map((doc) => ({
                    ...doc.data(),
                    userId: doc.id,
                })) as ClassMember[];
                onData(members);
            },
            (error) => {
                console.error("[memberApi.subscribeMembers] Subscription error:", error);
                // Pass empty array on error to prevent UI crash
                onData([]);
            },
        );
    },

    /**
     * Update a member's role (promotion/demotion).
     *
     * Validates role is one of: "teacher" | "ta" | "student"
     * Does NOT modify the associated Enrollment document.
     *
     * @param classId - The class document ID
     * @param userId - The user ID to update
     * @param role - New role to assign
     * @throws Error if role is invalid or Firestore write fails
     *
     * @example
     * ```ts
     * // Promote student to TA
     * await memberApi.setRole(classId, userId, 'ta');
     * ```
     */
    setRole: async (classId: string, userId: string, role: ClassRole): Promise<void> => {
        // Validate role (Property 1: ClassMember role is always valid)
        const validRoles: ClassRole[] = ["teacher", "ta", "student"];
        if (!validRoles.includes(role)) {
            throw new Error(`Invalid role: ${role}. Must be one of: ${validRoles.join(", ")}`);
        }

        try {
            const memberRef = doc(Collections.classMembers(classId), userId);

            // Check if member exists
            const memberSnap = await getDoc(memberRef);
            if (!memberSnap.exists()) {
                throw new Error("Member not found in this class");
            }

            // Update role field only
            await updateDoc(memberRef, {
                role,
            });
        } catch (error) {
            console.error("[memberApi.setRole] Failed to update role:", error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error("Failed to update member role");
        }
    },

    /**
     * Add a new member to a class (used during enrollment).
     *
     * @param classId - The class document ID
     * @param userId - The user ID to add
     * @param role - Role to assign (default: "student")
     * @param displayName - User's display name (optional, for teachers/TAs)
     * @param email - User's email (optional, for teachers/TAs)
     * @throws Error if member already exists or write fails
     */
    addMember: async (
        classId: string,
        userId: string,
        role: ClassRole = "student",
        displayName?: string,
        email?: string,
    ): Promise<void> => {
        try {
            const memberRef = doc(Collections.classMembers(classId), userId);

            // Check if already exists
            const memberSnap = await getDoc(memberRef);
            if (memberSnap.exists()) {
                throw new Error("User is already a member of this class");
            }

            await setDoc(memberRef, {
                userId,
                role,
                displayName,
                email,
                addedAt: serverTimestamp(),
            });
        } catch (error) {
            console.error("[memberApi.addMember] Failed to add member:", error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error("Failed to add member to class");
        }
    },

    /**
     * Remove a member from a class (hard delete).
     * Also deactivates their enrollment if they are a student.
     *
     * @param classId - The class document ID
     * @param userId - The user ID to remove
     * @throws Error if member not found or delete fails
     *
     * @example
     * ```ts
     * await memberApi.removeMember(classId, userId);
     * ```
     */
    removeMember: async (classId: string, userId: string): Promise<void> => {
        try {
            const memberRef = doc(Collections.classMembers(classId), userId);

            // Check if member exists
            const memberSnap = await getDoc(memberRef);
            if (!memberSnap.exists()) {
                throw new Error("Member not found in this class");
            }

            // Delete the member document
            await deleteDoc(memberRef);
        } catch (error) {
            console.error("[memberApi.removeMember] Failed to remove member:", error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error("Failed to remove member from class");
        }
    },
};
