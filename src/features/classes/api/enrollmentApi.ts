import {
    collection,
    doc,
    getDocs,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
    where,
} from "firebase/firestore";

import { Collections } from "@/lib/collections";

import type { Unsubscribe } from "firebase/firestore";
import type { Enrollment } from "@/types";

export const enrollmentApi = {
    /**
     * Fetch all active enrollments for a class (one-time read).
     */
    getByClassId: async (classId: string): Promise<Enrollment[]> => {
        const q = query(
            Collections.enrollments(),
            where("classId", "==", classId),
            where("isActive", "==", true),
            orderBy("studentName", "asc"),
        );
        const snap = await getDocs(q);
        return snap.docs.map((d) => ({ ...d.data(), id: d.id }) as Enrollment);
    },

    /**
     * Subscribe to real-time enrollment changes for a class.
     * Returns an unsubscribe function.
     */
    subscribeByClassId: (
        classId: string,
        onData: (enrollments: Enrollment[]) => void,
        onError?: (err: Error) => void,
    ): Unsubscribe => {
        const q = query(
            Collections.enrollments(),
            where("classId", "==", classId),
            where("isActive", "==", true),
            orderBy("studentName", "asc"),
        );
        return onSnapshot(
            q,
            (snap) => {
                const enrollments = snap.docs.map((d) => ({ ...d.data(), id: d.id }) as Enrollment);
                onData(enrollments);
            },
            onError,
        );
    },

    /**
     * Soft-delete: deactivate an enrollment (never hard-delete for audit trail).
     */
    deactivate: async (enrollmentId: string): Promise<void> => {
        const ref = doc(Collections.enrollments(), enrollmentId);
        await updateDoc(ref, {
            isActive: false,
            deactivatedAt: serverTimestamp(),
        });
    },
};
