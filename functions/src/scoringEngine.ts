import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

/**
 * scoringEngine Cloud Function
 * 
 * Trigger: onDocumentWritten("attendance_records/{recordId}")
 * Fires on any create/update of an attendance record
 * 
 * Algorithm:
 * 1. Extract classId, studentId from the record
 * 2. Fetch enrollment (skip if inactive)
 * 3. Query all records for student in finalized sessions
 * 4. Compute weightedAbsences = Σ absenceWeightSnapshot
 * 5. Fetch Class.scoringRules
 * 6. Compute score using formula
 * 7. Update enrollment: aggregatedScore, totalAbsences, sessionsAttended, sessionsEligible
 * 
 * Must complete within 10 seconds (Req 3.6)
 */

const db = admin.firestore();

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
 * Compute score based on scoring rules and weighted absences
 * 
 * Formula: max(0, basePoints − max(0, weightedAbsences − allowedAbsences) × penaltyPerAbsence)
 */
export function computeScore(
    rules: ScoringRules,
    weightedAbsences: number
): number {
    const excessAbsences = Math.max(0, weightedAbsences - rules.allowedAbsences);
    const penalty = excessAbsences * rules.penaltyPerAbsence;
    const score = rules.basePoints - penalty;

    return rules.capAtZero ? Math.max(0, score) : score;
}

/**
 * Main scoring engine logic
 */
async function updateStudentScore(
    classId: string,
    studentId: string
): Promise<void> {
    const startTime = Date.now();

    // 1. Fetch enrollment
    const enrollmentsSnap = await db
        .collection("enrollments")
        .where("classId", "==", classId)
        .where("studentId", "==", studentId)
        .limit(1)
        .get();

    if (enrollmentsSnap.empty) {
        functions.logger.warn(
            `No enrollment found for student ${studentId} in class ${classId}`
        );
        return;
    }

    const enrollmentDoc = enrollmentsSnap.docs[0];
    const enrollment = enrollmentDoc.data() as Enrollment;

    // 2. Skip if inactive
    if (!enrollment.isActive) {
        functions.logger.info(
            `Skipping inactive student ${studentId} in class ${classId}`
        );
        return;
    }

    // 3. Query all attendance records for this student in this class
    const recordsSnap = await db
        .collection("attendance_records")
        .where("classId", "==", classId)
        .where("studentId", "==", studentId)
        .get();

    // 4. Filter to only finalized sessions and compute metrics
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

    // 5. Fetch class scoring rules
    const classSnap = await db.collection("classes").doc(classId).get();

    if (!classSnap.exists) {
        throw new Error(`Class ${classId} not found`);
    }

    const classData = classSnap.data() as Class;
    const scoringRules = classData.scoringRules;

    // 6. Compute score
    const aggregatedScore = computeScore(scoringRules, weightedAbsences);

    // 7. Update enrollment
    await enrollmentDoc.ref.update({
        aggregatedScore,
        totalAbsences: weightedAbsences,
        sessionsAttended,
        sessionsEligible,
    });

    const duration = Date.now() - startTime;
    functions.logger.info(
        `Updated score for student ${studentId} in class ${classId}: ` +
        `score=${aggregatedScore}, absences=${weightedAbsences}, ` +
        `attended=${sessionsAttended}/${sessionsEligible} (${duration}ms)`
    );

    // Ensure we complete within 10 seconds
    if (duration > 10000) {
        functions.logger.warn(
            `Scoring engine took ${duration}ms for student ${studentId} (exceeds 10s limit)`
        );
    }
}

/**
 * Cloud Function trigger
 */
export const scoringEngine = functions.firestore
    .document("attendance_records/{recordId}")
    .onWrite(async (change, context) => {
        // Get the record data (after write)
        const recordData = change.after.exists ? change.after.data() : null;

        if (!recordData) {
            functions.logger.info("Record deleted, skipping scoring update");
            return;
        }

        const { classId, studentId } = recordData;

        functions.logger.info(
            `Scoring engine triggered for student ${studentId} in class ${classId}`
        );

        try {
            await updateStudentScore(classId, studentId);
        } catch (error) {
            functions.logger.error(
                `Scoring engine failed for student ${studentId} in class ${classId}`,
                { error }
            );
            throw error;
        }
    });
