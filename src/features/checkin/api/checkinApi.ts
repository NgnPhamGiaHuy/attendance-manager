import { doc, getDoc, Timestamp } from "firebase/firestore";

import { attendanceApi } from "@/features/sessions/api/sessionApi";
import { Collections } from "@/lib/collections";

import type { Class, Session } from "@/types";

// ─── Error Codes ──────────────────────────────────────────────────────────────

export enum CheckinErrorCode {
    INVALID_TOKEN = "INVALID_TOKEN",
    EXPIRED_TOKEN = "EXPIRED_TOKEN",
    SESSION_NOT_ACTIVE = "SESSION_NOT_ACTIVE",
    SESSION_FINALIZED = "SESSION_FINALIZED",
    ALREADY_CHECKED_IN = "ALREADY_CHECKED_IN",
    SESSION_NOT_FOUND = "SESSION_NOT_FOUND",
    CLASS_NOT_FOUND = "CLASS_NOT_FOUND",
    UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

export class CheckinError extends Error {
    constructor(
        public code: CheckinErrorCode,
        message: string,
    ) {
        super(message);
        this.name = "CheckinError";
    }
}

// ─── Check-In API ─────────────────────────────────────────────────────────────

export const checkinApi = {
    /**
     * Self-check-in for a student using QR code token.
     * Validates token, expiration, session state, and creates attendance record.
     *
     * @throws CheckinError with specific error code for each validation failure
     *
     * @example
     * try {
     *   await checkinApi.selfCheckIn(sessionId, token, studentId, studentName);
     *   // Success!
     * } catch (error) {
     *   if (error instanceof CheckinError) {
     *     switch (error.code) {
     *       case CheckinErrorCode.INVALID_TOKEN:
     *         // Show "Invalid QR code" message
     *         break;
     *       case CheckinErrorCode.EXPIRED_TOKEN:
     *         // Show "QR code expired" message
     *         break;
     *       // ... handle other cases
     *     }
     *   }
     * }
     */
    selfCheckIn: async (
        sessionId: string,
        token: string,
        studentId: string,
        studentName: string,
    ): Promise<void> => {
        try {
            // 1. Fetch session document
            const sessionRef = doc(Collections.sessions(), sessionId);
            const sessionSnap = await getDoc(sessionRef);

            if (!sessionSnap.exists()) {
                throw new CheckinError(CheckinErrorCode.SESSION_NOT_FOUND, "Session not found.");
            }

            const session = { ...sessionSnap.data(), id: sessionSnap.id } as Session;

            // 2. Validate token matches
            if (session.qrSecret !== token) {
                throw new CheckinError(
                    CheckinErrorCode.INVALID_TOKEN,
                    "Invalid or expired QR code. Please scan the current code.",
                );
            }

            // 3. Validate token not expired
            if (
                !session.qrExpiresAt ||
                (session.qrExpiresAt as Timestamp).toMillis() < Date.now()
            ) {
                throw new CheckinError(
                    CheckinErrorCode.EXPIRED_TOKEN,
                    "QR code has expired. Please ask your teacher to refresh it.",
                );
            }

            // 4. Validate session is active
            if (!session.isActive) {
                throw new CheckinError(
                    CheckinErrorCode.SESSION_NOT_ACTIVE,
                    "This session is not accepting check-ins.",
                );
            }

            // 5. Validate session is not finalized
            if (session.isFinalized) {
                throw new CheckinError(
                    CheckinErrorCode.SESSION_FINALIZED,
                    "This session has been finalized and cannot accept new check-ins.",
                );
            }

            // 6. Check if already checked in (idempotency check)
            const recordId = `${sessionId}_${studentId}`;
            const recordRef = doc(Collections.attendanceRecords(), recordId);
            const recordSnap = await getDoc(recordRef);

            if (recordSnap.exists()) {
                throw new CheckinError(
                    CheckinErrorCode.ALREADY_CHECKED_IN,
                    "You are already checked in for this session.",
                );
            }

            // 7. Fetch class to get default status
            const classRef = doc(Collections.classes(), session.classId);
            const classSnap = await getDoc(classRef);

            if (!classSnap.exists()) {
                throw new CheckinError(CheckinErrorCode.CLASS_NOT_FOUND, "Class not found.");
            }

            const classData = { ...classSnap.data(), id: classSnap.id } as Class;

            // 8. Determine which status to use (session default or class default)
            let statusId: string;
            let statusDef;

            if (session.defaultStatusId) {
                statusId = session.defaultStatusId;
                statusDef = classData.statusDefinitions[statusId];
            } else {
                // Find the first default status in the class
                const defaultStatus = Object.values(classData.statusDefinitions).find(
                    (s) => s.isDefault && !s.isArchived,
                );
                if (!defaultStatus) {
                    throw new CheckinError(
                        CheckinErrorCode.UNKNOWN_ERROR,
                        "No default status found for this class.",
                    );
                }
                statusId = defaultStatus.id;
                statusDef = defaultStatus;
            }

            if (!statusDef) {
                throw new CheckinError(
                    CheckinErrorCode.UNKNOWN_ERROR,
                    "Status definition not found.",
                );
            }

            // 9. Create attendance record with source: "qr"
            await attendanceApi.mark({
                sessionId,
                classId: session.classId,
                studentId,
                studentName,
                statusId,
                statusLabel: statusDef.label,
                multiplierSnapshot: statusDef.multiplier,
                absenceWeightSnapshot: statusDef.absenceWeight,
                markedBy: studentId, // Student marks themselves
                source: "qr",
            });
        } catch (error) {
            // Re-throw CheckinError as-is
            if (error instanceof CheckinError) {
                throw error;
            }

            // Wrap other errors
            console.error("Check-in error:", error);
            throw new CheckinError(
                CheckinErrorCode.UNKNOWN_ERROR,
                error instanceof Error ? error.message : "An unknown error occurred.",
            );
        }
    },
};
