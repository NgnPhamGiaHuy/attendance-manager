import * as XLSX from "xlsx";
import { attendanceApi, sessionApi } from "@/features/sessions/api/sessionApi";
import { enrollmentApi } from "@/features/classes/api/enrollmentApi";

export interface ExportTranslations {
    reportTitle?: string;
    classNameLabel?: string;
    exportDateLabel?: string;
    studentNameLabel?: string;
    studentEmailLabel?: string;
    sessionsAttendedLabel?: string;
    sessionsEligibleLabel?: string;
    totalAbsencesLabel?: string;
    finalScoreLabel?: string;
}

/**
 * Service facilitating automated attendance spreadsheets creation securely.
 */
export async function exportAttendanceToExcel(
    classId: string, 
    className: string,
    translations?: ExportTranslations
): Promise<void> {
    const reportTitle = translations?.reportTitle ?? "Class Attendance Report";
    const classNameLabel = translations?.classNameLabel ?? "Class Name:";
    const exportDateLabel = translations?.exportDateLabel ?? "Export Date:";
    const studentNameLabel = translations?.studentNameLabel ?? "Student Name";
    const studentEmailLabel = translations?.studentEmailLabel ?? "Student Email";
    const sessionsAttendedLabel = translations?.sessionsAttendedLabel ?? "Sessions Attended";
    const sessionsEligibleLabel = translations?.sessionsEligibleLabel ?? "Sessions Eligible";
    const totalAbsencesLabel = translations?.totalAbsencesLabel ?? "Total Absences";
    const finalScoreLabel = translations?.finalScoreLabel ?? "Final Score";

    const sessions = await sessionApi.getByClassId(classId);
    const enrollments = await enrollmentApi.getByClassId(classId);
    const records = await attendanceApi.getByClassId(classId);

    const lookup: Record<string, Record<string, any>> = {};
    records.forEach((r) => {
        if (!lookup[r.studentId]) lookup[r.studentId] = {};
        lookup[r.studentId][r.sessionId] = r;
    });

    const data: any[][] = [];

    data.push([reportTitle]);
    data.push([classNameLabel, className]);
    data.push([exportDateLabel, new Date().toLocaleDateString()]);
    data.push([]); 

    const headers = [studentNameLabel, studentEmailLabel];
    const finalizedSessions = sessions.filter((s) => s.isFinalized);

    finalizedSessions.forEach((s) => {
        const dateObj = s.date && "toDate" in s.date ? s.date.toDate() : new Date(s.date as any);
        headers.push(dateObj.toLocaleDateString());
    });

    headers.push(
        sessionsAttendedLabel, 
        sessionsEligibleLabel, 
        totalAbsencesLabel, 
        finalScoreLabel
    );
    data.push(headers);

    enrollments.forEach((student) => {
        const row: (string | number)[] = [student.studentName, student.studentEmail];
        
        finalizedSessions.forEach((s) => {
            const r = lookup[student.studentId]?.[s.id];
            row.push(r ? r.statusLabel : "—");
        });

        row.push(
            student.sessionsAttended ?? 0,
            student.sessionsEligible ?? 0,
            student.totalAbsences ?? 0,
            student.aggregatedScore ?? 100
        );

        data.push(row);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");

    XLSX.writeFile(workbook, `${className}_Attendance.xlsx`);
}
