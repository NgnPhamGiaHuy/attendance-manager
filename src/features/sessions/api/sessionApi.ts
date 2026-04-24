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
};

export const attendanceApi = {
    /**
     * Mark or update attendance for a student in a session.
     * Creates or overwrites the record, preserving the audit trail.
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
        } = params;

        // Build audit trail entry if this is a change
        const auditTrail: AuditEntry[] = previousRecord
            ? [
                  ...(previousRecord.auditTrail ?? []),
                  {
                      prevStatusId: previousRecord.statusId,
                      newStatusId: statusId,
                      changedBy: markedBy,
                      changedAt: Timestamp.now(),
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
};
