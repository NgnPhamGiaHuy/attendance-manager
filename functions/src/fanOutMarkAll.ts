import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

/**
 * fanOutMarkAll Cloud Function
 * 
 * Trigger: onDocumentUpdated("sessions/{sessionId}")
 * Fires when defaultStatusId changes from null to non-null
 * 
 * Algorithm:
 * 1. Read classId from session
 * 2. Query active enrollments
 * 3. Query existing attendance records
 * 4. Build set of already-marked students
 * 5. For each un-marked student, build AttendanceRecord with snapshots
 * 6. Chunk into batches of ≤500
 * 7. Commit sequentially
 * 8. Update session.attendanceSummary
 * 
 * Retry: Up to 3 times with exponential backoff
 * Error handling: Write error doc to sessions/{sessionId}/errors/{timestamp}
 */

const db = admin.firestore();

interface StatusDefinition {
    id: string;
    label: string;
    multiplier: number;
    absenceWeight: number;
    isArchived?: boolean;
}

interface Class {
    id: string;
    statusDefinitions: Record<string, StatusDefinition>;
}

interface Enrollment {
    studentId: string;
    studentName: string;
    isActive: boolean;
}

interface AttendanceRecord {
    sessionId: string;
    classId: string;
    studentId: string;
    studentName: string;
    statusId: string;
    statusLabel: string;
    multiplierSnapshot: number;
    absenceWeightSnapshot: number;
    markedAt: admin.firestore.FieldValue;
    markedBy: string;
    source: "instructor";
    auditTrail: any[];
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
 * Main fan-out logic with retry
 */
async function fanOutWithRetry(
    sessionId: string,
    sessionData: any,
    retries = 3
): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            await executeFanOut(sessionId, sessionData);
            return; // Success
        } catch (error) {
            lastError = error as Error;
            functions.logger.warn(
                `Fan-out attempt ${attempt}/${retries} failed for session ${sessionId}`,
                { error: lastError.message }
            );

            if (attempt < retries) {
                // Exponential backoff: 1s, 2s, 4s
                const delay = Math.pow(2, attempt - 1) * 1000;
                await new Promise((resolve) => setTimeout(resolve, delay));
            }
        }
    }

    // All retries failed - write error document
    if (lastError) {
        const errorRef = db
            .collection("sessions")
            .doc(sessionId)
            .collection("errors")
            .doc(Date.now().toString());

        await errorRef.set({
            error: lastError.message,
            stack: lastError.stack,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            sessionData,
        });

        throw lastError;
    }
}

/**
 * Execute the fan-out operation
 */
async function executeFanOut(
    sessionId: string,
    sessionData: any
): Promise<void> {
    const { classId, defaultStatusId, createdBy } = sessionData;

    if (!defaultStatusId) {
        functions.logger.info(`Session ${sessionId} has no defaultStatusId, skipping`);
        return;
    }

    // 1. Fetch class to get status definition
    const classRef = db.collection("classes").doc(classId);
    const classSnap = await classRef.get();

    if (!classSnap.exists) {
        throw new Error(`Class ${classId} not found`);
    }

    const classData = classSnap.data() as Class;
    const statusDef = classData.statusDefinitions[defaultStatusId];

    if (!statusDef) {
        throw new Error(`Status ${defaultStatusId} not found in class ${classId}`);
    }

    // 2. Query active enrollments
    const enrollmentsSnap = await db
        .collection("enrollments")
        .where("classId", "==", classId)
        .where("isActive", "==", true)
        .get();

    const enrollments = enrollmentsSnap.docs.map(
        (doc) => doc.data() as Enrollment
    );

    if (enrollments.length === 0) {
        functions.logger.info(`No active enrollments for class ${classId}`);
        return;
    }

    // 3. Query existing attendance records for this session
    const recordsSnap = await db
        .collection("attendance_records")
        .where("sessionId", "==", sessionId)
        .get();

    const markedStudentIds = new Set(
        recordsSnap.docs.map((doc) => doc.data().studentId)
    );

    // 4. Build list of un-marked students
    const unmarkedStudents = enrollments.filter(
        (e) => !markedStudentIds.has(e.studentId)
    );

    if (unmarkedStudents.length === 0) {
        functions.logger.info(`All students already marked for session ${sessionId}`);
        return;
    }

    functions.logger.info(
        `Marking ${unmarkedStudents.length} students for session ${sessionId}`
    );

    // 5. Build attendance records
    const records: AttendanceRecord[] = unmarkedStudents.map((student) => ({
        sessionId,
        classId,
        studentId: student.studentId,
        studentName: student.studentName,
        statusId: defaultStatusId,
        statusLabel: statusDef.label,
        multiplierSnapshot: statusDef.multiplier,
        absenceWeightSnapshot: statusDef.absenceWeight,
        markedAt: admin.firestore.FieldValue.serverTimestamp(),
        markedBy: createdBy || "system",
        source: "instructor" as const,
        auditTrail: [],
    }));

    // 6. Chunk into batches of 500 (Firestore limit)
    const chunks = chunkArray(records, 500);

    // 7. Commit batches sequentially
    for (let i = 0; i < chunks.length; i++) {
        const batch = db.batch();
        const chunk = chunks[i];

        for (const record of chunk) {
            const recordId = `${sessionId}_${record.studentId}`;
            const recordRef = db.collection("attendance_records").doc(recordId);
            batch.set(recordRef, record);
        }

        await batch.commit();
        functions.logger.info(
            `Committed batch ${i + 1}/${chunks.length} (${chunk.length} records)`
        );
    }

    // 8. Update session.attendanceSummary
    const updatedSummary: Record<string, number> = {};
    const allRecordsSnap = await db
        .collection("attendance_records")
        .where("sessionId", "==", sessionId)
        .get();

    allRecordsSnap.docs.forEach((doc) => {
        const statusId = doc.data().statusId;
        updatedSummary[statusId] = (updatedSummary[statusId] || 0) + 1;
    });

    await db.collection("sessions").doc(sessionId).update({
        attendanceSummary: updatedSummary,
    });

    functions.logger.info(
        `Fan-out complete for session ${sessionId}: ${records.length} records created`
    );
}

/**
 * Cloud Function trigger
 */
export const fanOutMarkAll = functions.firestore
    .document("sessions/{sessionId}")
    .onUpdate(async (change, context) => {
        const before = change.before.data();
        const after = change.after.data();
        const sessionId = context.params.sessionId;

        // Only trigger when defaultStatusId changes from null to non-null
        if (before.defaultStatusId === null && after.defaultStatusId !== null) {
            functions.logger.info(
                `Fan-out triggered for session ${sessionId} with status ${after.defaultStatusId}`
            );

            try {
                await fanOutWithRetry(sessionId, after);
            } catch (error) {
                functions.logger.error(
                    `Fan-out failed for session ${sessionId} after all retries`,
                    { error }
                );
                // Error document already written by fanOutWithRetry
            }
        }
    });
