import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { computeScore } from "./scoringEngine";

/**
 * recalculateScoresForClass Cloud Function
 * 
 * Callable function: { classId }
 * 
 * Algorithm:
 * 1. Verify caller is teacher of classId
 * 2. Fetch updated Class.scoringRules
 * 3. Query all active enrollments
 * 4. For each enrollment, run scoring algorithm
 * 5. Batch update aggregatedScore values
 * 6. Return { recalculatedCount }
 */

const db = admin.firestore();

interface CallableRequest {
    classId: string;
}

interface ClassMember {
    role: "teacher" | "ta" | "student";
}

interface ScoringRules {
    basePoints: number;
    allowedAbsences: number;
    penaltyPerAbsence: number;
    capAtZero: boolean;
}

interface Class {
    scoringRules: ScoringRules;
}

interface Enrollment {
    studentId: string;
    isActive: boolean;
}

interface AttendanceRecord {
    sessionId: string;
    absenceWeightSnapshot: number;
    multiplierSnapshot: number;
}

interface Session {
    isFinalized: boolean;
}

/**
 * Verify caller is a teacher of the class
 */
async function verifyTeacherAccess(
    classId: string,
    userId: string
): Promise<void> {
    const memberRef = db
        .collection("classes")
        .doc(classId)
        .collection("members")
        .doc(userId);

    const memberSnap = await memberRef.get();

    if (!memberSnap.exists) {
        throw new functions.https.HttpsError(
            "permission-denied",
            "You are not a member of this class"
        );
    }

    const member = memberSnap.data() as ClassMember;

    if (member.role !== "teacher") {
        throw new functions.https.HttpsError(
            "permission-denied",
            "Only teachers can recalculate scores"
        );
    }
}

/**
 * Calculate score for a single student
 */
async function calculateStudentScore(
    classId: string,
    studentId: string,
    scoringRules: ScoringRules
): Promise<{
    aggregatedScore: number;
    totalAbsences: number;
    sessionsAttended: number;
    sessionsEligible: number;
}> {
    // Query all attendance records for this student in this class
    const recordsSnap = await db
        .collection("attendance_records")
        .where("classId", "==", classId)
        .where("studentId", "==", studentId)
        .get();

    // Filter to only finalized sessions and compute metrics
    const sessionIds = new Set<string>();
    let weightedAbsences = 0;
    let sessionsAttended = 0;

    for (const recordDoc of recordsSnap.docs) {
        const record = recordDoc.data() as AttendanceRecord;
        sessionIds.add(record.sessionId);

        // Check if session is finalized
        const sessionSnap = await db
            .collection("sessions")
            .doc(record.sessionId)
            .get();

        if (sessionSnap.exists) {
            const session = sessionSnap.data() as Session;
            if (session.isFinalized) {
                weightedAbsences += record.absenceWeightSnapshot || 0;

                // Count as attended if multiplier > 0
                if (record.multiplierSnapshot > 0) {
                    sessionsAttended++;
                }
            }
        }
    }

    const sessionsEligible = sessionIds.size;
    const aggregatedScore = computeScore(scoringRules, weightedAbsences);

    return {
        aggregatedScore,
        totalAbsences: weightedAbsences,
        sessionsAttended,
        sessionsEligible,
    };
}

/**
 * Chunk array into batches of specified size
 */
function chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}

/**
 * Main recalculation logic
 */
export const recalculateScoresForClass = functions.https.onCall(
    async (data: CallableRequest, context) => {
        const startTime = Date.now();

        // Verify authentication
        if (!context.auth) {
            throw new functions.https.HttpsError(
                "unauthenticated",
                "User must be authenticated"
            );
        }

        const userId = context.auth.uid;
        const { classId } = data;

        // Validate input
        if (!classId) {
            throw new functions.https.HttpsError(
                "invalid-argument",
                "classId is required"
            );
        }

        functions.logger.info(
            `Score recalculation requested for class ${classId} by user ${userId}`
        );

        try {
            // 1. Verify caller is teacher
            await verifyTeacherAccess(classId, userId);

            // 2. Fetch class and scoring rules
            const classSnap = await db.collection("classes").doc(classId).get();

            if (!classSnap.exists) {
                throw new functions.https.HttpsError(
                    "not-found",
                    `Class ${classId} not found`
                );
            }

            const classData = classSnap.data() as Class;
            const scoringRules = classData.scoringRules;

            // 3. Query all active enrollments
            const enrollmentsSnap = await db
                .collection("enrollments")
                .where("classId", "==", classId)
                .where("isActive", "==", true)
                .get();

            if (enrollmentsSnap.empty) {
                functions.logger.info(
                    `No active enrollments found for class ${classId}`
                );
                return { recalculatedCount: 0 };
            }

            const enrollments = enrollmentsSnap.docs;
            functions.logger.info(
                `Recalculating scores for ${enrollments.length} students`
            );

            // 4. Calculate scores for each student
            const updates: Array<{
                ref: admin.firestore.DocumentReference;
                data: any;
            }> = [];

            for (const enrollmentDoc of enrollments) {
                const enrollment = enrollmentDoc.data() as Enrollment;
                const studentId = enrollment.studentId;

                const scoreData = await calculateStudentScore(
                    classId,
                    studentId,
                    scoringRules
                );

                updates.push({
                    ref: enrollmentDoc.ref,
                    data: scoreData,
                });
            }

            // 5. Batch update scores
            const chunks = chunkArray(updates, 500);
            let recalculatedCount = 0;

            for (let i = 0; i < chunks.length; i++) {
                const batch = db.batch();
                const chunk = chunks[i];

                for (const update of chunk) {
                    batch.update(update.ref, update.data);
                }

                try {
                    await batch.commit();
                    recalculatedCount += chunk.length;
                    functions.logger.info(
                        `Committed batch ${i + 1}/${chunks.length} (${chunk.length} enrollments)`
                    );
                } catch (error) {
                    functions.logger.error(
                        `Batch ${i + 1}/${chunks.length} failed`,
                        { error }
                    );
                    throw new functions.https.HttpsError(
                        "internal",
                        `Failed to update scores: ${error}`
                    );
                }
            }

            const duration = Date.now() - startTime;
            functions.logger.info(
                `Score recalculation complete for class ${classId}: ` +
                `${recalculatedCount} students updated (${duration}ms)`
            );

            return {
                recalculatedCount,
                duration,
            };
        } catch (error) {
            if (error instanceof functions.https.HttpsError) {
                throw error;
            }

            functions.logger.error(
                `Score recalculation failed for class ${classId}`,
                { error }
            );

            throw new functions.https.HttpsError(
                "internal",
                `Score recalculation failed: ${error}`
            );
        }
    }
);
