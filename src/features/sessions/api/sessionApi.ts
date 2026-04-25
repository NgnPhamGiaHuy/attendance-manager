import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    Timestamp,
    updateDoc,
    where,
    writeBatch,
} from "firebase/firestore";

import { Collections } from "@/lib/collections";
import { db } from "@/lib/firebase";
import { formatSessionTitle } from "@/lib/utils";

import type { Unsubscribe } from "firebase/firestore";
import type { AttendanceRecord, AttendanceSource, AuditEntry, Session } from "@/types";

export const sessionApi = {
    /**
     * Create a new attendance session for a class.
     */
    create: async (params: {
        classId: string;
        className: string;
        createdBy: string;
        startTime?: string;
        endTime?: string;
    }): Promise<string> => {
        const { classId, className, createdBy, startTime, endTime } = params;
        const now = new Date();

        let startAt: Timestamp | null = null;
        let endAt: Timestamp | null = null;

        if (startTime) {
            const [h, m] = startTime.split(":").map(Number);
            const d = new Date(now);
            d.setHours(h, m, 0, 0);
            startAt = Timestamp.fromDate(d);
        }

        if (endTime) {
            const [h, m] = endTime.split(":").map(Number);
            const d = new Date(now);
            d.setHours(h, m, 0, 0);
            endAt = Timestamp.fromDate(d);
        }

        const ref = collection(db, "sessions");
        const docRef = await addDoc(ref, {
            classId,
            className,
            title: formatSessionTitle(now),
            date: Timestamp.fromDate(now),
            isActive: true,
            isFinalized: false,
            defaultStatusId: null,
            qrSecret: null,
            qrExpiresAt: null,
            createdBy,
            createdAt: serverTimestamp(),
            closedAt: null,
            startAt,
            endAt,
            attendanceSummary: {},
        } satisfies Omit<Session, "id">);
        return docRef.id;
    },

    /**
     * Finalize a session — locks it from further edits.
     */
    finalize: async (sessionId: string): Promise<void> => {
        const ref = doc(Collections.sessions(), sessionId);
        await updateDoc(ref, {
            isActive: false,
            isFinalized: true,
            closedAt: serverTimestamp(),
        });
    },

    /**
     * Set the defaultStatusId field — triggers Cloud Function fan-out
     * to mark all un-marked students with this status.
     */
    markAllWithStatus: async (sessionId: string, defaultStatusId: string): Promise<void> => {
        const ref = doc(Collections.sessions(), sessionId);
        await updateDoc(ref, { defaultStatusId });
    },

    /**
     * Subscribe to a single session in real-time.
     */
    subscribe: (
        sessionId: string,
        onData: (session: Session) => void,
        onError?: (err: Error) => void,
    ): Unsubscribe => {
        const ref = doc(Collections.sessions(), sessionId);
        return onSnapshot(
            ref,
            (snap) => {
                if (snap.exists()) {
                    onData({ ...snap.data(), id: snap.id } as Session);
                }
            },
            onError,
        );
    },

    /**
     * Fetch all sessions for a class, most recent first.
     */
    getByClassId: async (classId: string): Promise<Session[]> => {
        const q = query(
            Collections.sessions(),
            where("classId", "==", classId),
            orderBy("date", "desc"),
        );
        const snap = await getDocs(q);
        return snap.docs.map((d) => ({ ...d.data(), id: d.id }) as Session);
    },

    /**
     * Subscribe to sessions list for a class in real-time.
     */
    subscribeByClassId: (
        classId: string,
        onData: (sessions: Session[]) => void,
        onError?: (err: Error) => void,
    ): Unsubscribe => {
        const q = query(
            Collections.sessions(),
            where("classId", "==", classId),
            orderBy("date", "desc"),
        );
        return onSnapshot(
            q,
            (snap) => {
                onData(snap.docs.map((d) => ({ ...d.data(), id: d.id }) as Session));
            },
            onError,
        );
    },

    /**
     * Delete a session and all its attendance records.
     */
    delete: async (sessionId: string): Promise<void> => {
        const batch = writeBatch(db);

        // 1. Fetch all attendance records for this session
        const q = query(Collections.attendanceRecords(), where("sessionId", "==", sessionId));
        const snap = await getDocs(q);

        // 2. Add records to batch deletion
        snap.docs.forEach((d) => {
            batch.delete(d.ref);
        });

        // 3. Add session to batch deletion
        const sessionRef = doc(Collections.sessions(), sessionId);
        batch.delete(sessionRef);

        // 4. Commit atomic batch
        await batch.commit();
    },

    /**
     * Update session metadata (e.g. times).
     */
    update: async (
        sessionId: string,
        data: { startTime?: string; endTime?: string },
    ): Promise<void> => {
        const ref = doc(Collections.sessions(), sessionId);
        const updates: any = {};
        const now = new Date(); // Use today's date for simplicity

        if (data.startTime) {
            const [h, m] = data.startTime.split(":").map(Number);
            const d = new Date(now);
            d.setHours(h, m, 0, 0);
            updates.startAt = Timestamp.fromDate(d);
        }

        if (data.endTime) {
            const [h, m] = data.endTime.split(":").map(Number);
            const d = new Date(now);
            d.setHours(h, m, 0, 0);
            updates.endAt = Timestamp.fromDate(d);
        }

        await updateDoc(ref, updates);
    },

    /**
     * Activate QR check-in for a session.
     * Generates a unique secret token and sets expiration to 5 minutes from now.
     *
     * @throws Error if session update fails
     *
     * @example
     * await sessionApi.activateQR(sessionId);
     */
    activateQR: async (sessionId: string): Promise<void> => {
        const ref = doc(Collections.sessions(), sessionId);
        const qrSecret = doc(collection(db, "_temp")).id; // Generate unique ID
        const qrExpiresAt = Timestamp.fromMillis(Date.now() + 300000); // 5 minutes = 300,000ms

        await updateDoc(ref, {
            qrSecret,
            qrExpiresAt,
        });
    },

    /**
     * Refresh QR check-in for a session.
     * Generates a NEW unique secret token (different from previous) and resets expiration.
     *
     * @throws Error if session update fails
     *
     * @example
     * await sessionApi.refreshQR(sessionId);
     */
    refreshQR: async (sessionId: string): Promise<void> => {
        const ref = doc(Collections.sessions(), sessionId);
        const qrSecret = doc(collection(db, "_temp")).id; // Generate new unique ID
        const qrExpiresAt = Timestamp.fromMillis(Date.now() + 300000); // 5 minutes = 300,000ms

        await updateDoc(ref, {
            qrSecret,
            qrExpiresAt,
        });
    },
};

export const attendanceApi = {
    /**
     * Mark or update attendance for a student in a session.
     * Creates or overwrites the record, preserving the audit trail.
     *
     * @param params.reason - Optional reason for the change (required when isFinalized is true)
     * @param params.isFinalized - Whether the session is finalized (requires reason if true)
     * @throws Error if isFinalized is true but reason is missing or empty
     */
    mark: async (params: {
        sessionId: string;
        classId: string;
        studentId: string;
        studentName: string;
        statusId: string;
        statusLabel: string;
        multiplierSnapshot: number;
        absenceWeightSnapshot: number;
        markedBy: string;
        source: AttendanceSource;
        previousRecord?: AttendanceRecord;
        reason?: string;
        isFinalized?: boolean;
    }): Promise<void> => {
        const {
            sessionId,
            classId,
            studentId,
            studentName,
            statusId,
            statusLabel,
            multiplierSnapshot,
            absenceWeightSnapshot,
            markedBy,
            source,
            previousRecord,
            reason,
            isFinalized,
        } = params;

        // Validate: if session is finalized, reason is required
        if (isFinalized && (!reason || reason.trim() === "")) {
            throw new Error("Reason is required when editing attendance in a finalized session.");
        }

        // Build audit trail entry if this is a change
        const auditTrail: AuditEntry[] = previousRecord
            ? [
                  ...(previousRecord.auditTrail ?? []),
                  {
                      prevStatusId: previousRecord.statusId,
                      newStatusId: statusId,
                      changedBy: markedBy,
                      changedAt: Timestamp.now(),
                      ...(reason ? { reason } : {}),
                  },
              ]
            : [];

        // Use deterministic ID: sessionId_studentId for idempotent writes
        const recordId = `${sessionId}_${studentId}`;
        const ref = doc(Collections.attendanceRecords(), recordId);

        await setDoc(
            ref,
            {
                sessionId,
                classId,
                studentId,
                studentName,
                statusId,
                statusLabel,
                multiplierSnapshot,
                absenceWeightSnapshot,
                markedAt: serverTimestamp(),
                markedBy,
                source,
                auditTrail,
            },
            { merge: true },
        );
    },

    /**
     * Subscribe to all attendance records for a session in real-time.
     * This is the live view teachers use when taking attendance.
     */
    subscribeBySessionId: (
        sessionId: string,
        onData: (records: AttendanceRecord[]) => void,
        onError?: (err: Error) => void,
    ): Unsubscribe => {
        const q = query(Collections.attendanceRecords(), where("sessionId", "==", sessionId));
        return onSnapshot(
            q,
            (snap) => {
                onData(snap.docs.map((d) => ({ ...d.data(), id: d.id }) as AttendanceRecord));
            },
            onError,
        );
    },

    /**
     * Subscribe to all attendance records for a class (for the history matrix).
     */
    subscribeByClassId: (
        classId: string,
        onData: (records: AttendanceRecord[]) => void,
        onError?: (err: Error) => void,
    ): Unsubscribe => {
        const q = query(Collections.attendanceRecords(), where("classId", "==", classId));
        return onSnapshot(
            q,
            (snap) => {
                onData(snap.docs.map((d) => ({ ...d.data(), id: d.id }) as AttendanceRecord));
            },
            onError,
        );
    },
    /**
     * Fetch all attendance records for a class (for history & data exports).
     */
    getByClassId: async (classId: string): Promise<AttendanceRecord[]> => {
        const q = query(Collections.attendanceRecords(), where("classId", "==", classId));
        const snap = await getDocs(q);
        return snap.docs.map((d) => ({ ...d.data(), id: d.id }) as AttendanceRecord);
    },
};

/**
 * Build the check-in URL for QR code generation.
 * Students scan this QR code to self-check-in to a session.
 *
 * @param sessionId - The session document ID
 * @param qrSecret - The secret token from the session
 * @returns Full check-in URL with query parameters
 *
 * @example
 * const url = buildCheckinUrl(sessionId, session.qrSecret);
 * // Returns: "/checkin?session=abc123&token=xyz789"
 */
export function buildCheckinUrl(sessionId: string, qrSecret: string): string {
    return `/checkin?session=${sessionId}&token=${qrSecret}`;
}

/**
 * Bulk mark attendance for multiple students with the same status.
 * Chunks operations into batches of ≤500 for Firestore limits.
 * Atomic: if any batch fails, the entire operation fails.
 *
 * @throws Error if any batch write fails
 *
 * @example
 * await bulkMarkAttendance(
 *   sessionId,
 *   classId,
 *   new Set(['student1', 'student2', 'student3']),
 *   statusId,
 *   statusDef,
 *   teacherId
 * );
 */
export async function bulkMarkAttendance(
    sessionId: string,
    classId: string,
    studentIds: Set<string>,
    statusId: string,
    statusDef: { label: string; multiplier: number; absenceWeight: number },
    markedBy: string,
    studentNames: Map<string, string>, // studentId -> studentName
): Promise<void> {
    const studentArray = Array.from(studentIds);

    // Chunk into batches of 500 (Firestore limit)
    const chunks: string[][] = [];
    for (let i = 0; i < studentArray.length; i += 500) {
        chunks.push(studentArray.slice(i, i + 500));
    }

    // Process each chunk sequentially (atomic behavior)
    for (const chunk of chunks) {
        const batch = writeBatch(db);

        for (const studentId of chunk) {
            const recordId = `${sessionId}_${studentId}`;
            const ref = doc(Collections.attendanceRecords(), recordId);
            const studentName = studentNames.get(studentId) || "Unknown Student";

            batch.set(
                ref,
                {
                    sessionId,
                    classId,
                    studentId,
                    studentName,
                    statusId,
                    statusLabel: statusDef.label,
                    multiplierSnapshot: statusDef.multiplier,
                    absenceWeightSnapshot: statusDef.absenceWeight,
                    markedAt: serverTimestamp(),
                    markedBy,
                    source: "instructor" as const,
                    auditTrail: [],
                },
                { merge: true },
            );
        }

        // Commit batch - throws on failure
        await batch.commit();
    }
}
