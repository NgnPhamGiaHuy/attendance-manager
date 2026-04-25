import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

/**
 * retroactiveRecalculate Cloud Function
 * 
 * Callable function: { classId, statusId, newMultiplier, newAbsenceWeight }
 * 
 * Algorithm:
 * 1. Verify caller is teacher of classId via classMembers subcollection
 * 2. Query all AttendanceRecords for classId where statusId matches
 * 3. Chunk into batches of ≤500
 * 4. Update multiplierSnapshot and absenceWeightSnapshot
 * 5. Commit batches
 * 6. Trigger scoring recalculation for affected students
 * 7. Return { updatedCount }
 * 
 * Returns structured error response if any batch fails
 */

const db = admin.firestore();

interface CallableRequest {
    classId: string;
    statusId: string;
    newMultiplier: number;
    newAbsenceWeight: number;
}

interface ClassMember {
    role: "teacher" | "ta" | "student";
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
            "Only teachers can perform retroactive recalculation"
        );
    }
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
 * Trigger scoring recalculation for affected students
 */
async function triggerScoringRecalculation(
    classId: string,
    studentIds: Set<string>
): Promise<void> {
    functions.logger.info(
        `Triggering scoring recalculation for ${studentIds.size} students`
    );

    // Note: In a real implementation, this would trigger the scoringEngine
    // for each affected student. For now, we'll just log it.
    // The scoringEngine will be triggered automatically when records are updated.
    
    for (const studentId of studentIds) {
        functions.logger.info(
            `Scoring recalculation needed for student ${studentId} in class ${classId}`
        );
    }
}

/**
 * Main retroactive recalculation logic
 */
export const retroactiveRecalculate = functions.https.onCall(
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
        const { classId, statusId, newMultiplier, newAbsenceWeight } = data;

        // Validate input
        if (!classId || !statusId) {
            throw new functions.https.HttpsError(
                "invalid-argument",
                "classId and statusId are required"
            );
        }

        if (
            typeof newMultiplier !== "number" ||
            typeof newAbsenceWeight !== "number"
        ) {
            throw new functions.https.HttpsError(
                "invalid-argument",
                "newMultiplier and newAbsenceWeight must be numbers"
            );
        }

        if (
            newMultiplier < 0 ||
            newMultiplier > 1 ||
            newAbsenceWeight < 0 ||
            newAbsenceWeight > 1
        ) {
            throw new functions.https.HttpsError(
                "invalid-argument",
                "Multiplier and absence weight must be between 0 and 1"
            );
        }

        functions.logger.info(
            `Retroactive recalculation requested for class ${classId}, ` +
            `status ${statusId} by user ${userId}`
        );

        try {
            // 1. Verify caller is teacher
            await verifyTeacherAccess(classId, userId);

            // 2. Query all attendance records for this class and status
            const recordsSnap = await db
                .collection("attendance_records")
                .where("classId", "==", classId)
                .where("statusId", "==", statusId)
                .get();

            if (recordsSnap.empty) {
                functions.logger.info(
                    `No records found for class ${classId} with status ${statusId}`
                );
                return { updatedCount: 0 };
            }

            const recordDocs = recordsSnap.docs;
            const affectedStudents = new Set<string>();

            // Track affected students
            recordDocs.forEach((doc) => {
                affectedStudents.add(doc.data().studentId);
            });

            functions.logger.info(
                `Found ${recordDocs.length} records affecting ${affectedStudents.size} students`
            );

            // 3. Chunk into batches of 500 (Firestore limit)
            const chunks = chunkArray(recordDocs, 500);

            // 4. Update records in batches
            let updatedCount = 0;

            for (let i = 0; i < chunks.length; i++) {
                const batch = db.batch();
                const chunk = chunks[i];

                for (const doc of chunk) {
                    batch.update(doc.ref, {
                        multiplierSnapshot: newMultiplier,
                        absenceWeightSnapshot: newAbsenceWeight,
                    });
                }

                try {
                    await batch.commit();
                    updatedCount += chunk.length;
                    functions.logger.info(
                        `Committed batch ${i + 1}/${chunks.length} (${chunk.length} records)`
                    );
                } catch (error) {
                    functions.logger.error(
                        `Batch ${i + 1}/${chunks.length} failed`,
                        { error }
                    );
                    throw new functions.https.HttpsError(
                        "internal",
                        `Failed to update records: ${error}`
                    );
                }
            }

            // 5. Trigger scoring recalculation for affected students
            await triggerScoringRecalculation(classId, affectedStudents);

            const duration = Date.now() - startTime;
            functions.logger.info(
                `Retroactive recalculation complete: ${updatedCount} records updated ` +
                `for ${affectedStudents.size} students (${duration}ms)`
            );

            return {
                updatedCount,
                affectedStudents: affectedStudents.size,
                duration,
            };
        } catch (error) {
            if (error instanceof functions.https.HttpsError) {
                throw error;
            }

            functions.logger.error(
                `Retroactive recalculation failed for class ${classId}`,
                { error }
            );

            throw new functions.https.HttpsError(
                "internal",
                `Retroactive recalculation failed: ${error}`
            );
        }
    }
);
