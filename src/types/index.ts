import { FieldValue, Timestamp } from "firebase/firestore";

type FirestoreDate = Timestamp | FieldValue;

// --- User ---

export type UserRole = "admin" | "teacher" | "student";

export interface AppUser {
    uid: string;
    email: string;
    displayName: string;
    photoURL: string | null;
    role: UserRole;
    createdAt: FirestoreDate;
}

// --- Status Definitions ---

export interface StatusDefinition {
    id: string;
    label: string; // "Present", "Late", "Absent", "Excused"
    acronym: string; // "P", "L", "A", "E"
    color: string; // hex color for chip
    multiplier: number; // 1.0 = full points, 0 = no points
    absenceWeight: number; // 1.0 = full absence, 0.5 = half, 0 = not counted
    isDefault: boolean; // true = applied when "Mark All" is pressed
    order: number; // display order
}

export const DEFAULT_STATUSES: Omit<StatusDefinition, "id">[] = [
    {
        label: "Present",
        acronym: "P",
        color: "#16a34a",
        multiplier: 1.0,
        absenceWeight: 0,
        isDefault: true,
        order: 0,
    },
    {
        label: "Late",
        acronym: "L",
        color: "#d97706",
        multiplier: 0.5,
        absenceWeight: 0.5,
        isDefault: false,
        order: 1,
    },
    {
        label: "Absent",
        acronym: "A",
        color: "#dc2626",
        multiplier: 0,
        absenceWeight: 1.0,
        isDefault: false,
        order: 2,
    },
    {
        label: "Excused",
        acronym: "E",
        color: "#7c3aed",
        multiplier: 0,
        absenceWeight: 0,
        isDefault: false,
        order: 3,
    },
];

// --- Scoring Rules ---

export interface ScoringRules {
    basePoints: number; // total points per session (default: 100)
    allowedAbsences: number; // grace period before penalty kicks in (default: 2)
    penaltyPerAbsence: number; // points deducted per excess absence (default: 5)
    capAtZero: boolean; // score cannot go below 0 (default: true)
}

// --- Class ---

export interface Class {
    id: string;
    name: string;
    description: string;
    ownerId: string;
    ownerName: string;
    code: string; // 6-char join code e.g. "CS-XK9P"
    statusDefinitions: Record<string, StatusDefinition>;
    scoringRules: ScoringRules;
    memberCount: number;
    sessionCount: number;
    createdAt: FirestoreDate;
    updatedAt: FirestoreDate;
    isArchived: boolean;
    // Default session times (HH:mm)
    defaultStartTime?: string;
    defaultEndTime?: string;
}

// --- Class Member (subcollection) ---

export type ClassRole = "teacher" | "ta" | "student";

export interface ClassMember {
    userId: string;
    role: ClassRole;
    addedAt: FirestoreDate;
}

// --- Enrollment ---

export interface Enrollment {
    id: string;
    classId: string;
    studentId: string;
    studentName: string;
    studentEmail: string;
    enrolledAt: FirestoreDate;
    isActive: boolean;
    deactivatedAt?: FirestoreDate;
    // Aggregated fields — maintained by Cloud Functions
    aggregatedScore: number;
    totalAbsences: number;
    sessionsAttended: number;
    sessionsEligible: number;
}

// --- Session ---

export interface Session {
    id: string;
    classId: string;
    className: string;
    title: string; // "Lecture 1", auto-generated from date
    date: FirestoreDate;
    isActive: boolean; // true = currently taking attendance
    isFinalized: boolean; // true = locked, no more edits
    defaultStatusId: string | null; // triggers CF fan-out when set
    qrSecret: string | null;
    qrExpiresAt: FirestoreDate | null;
    createdBy: string;
    createdAt: FirestoreDate;
    closedAt: FirestoreDate | null;
    startAt: FirestoreDate | null;
    endAt: FirestoreDate | null;
    // Summary — maintained by Cloud Functions
    attendanceSummary: Record<string, number>; // { [statusId]: count }
}

// --- Attendance Record ---

export type AttendanceSource = "instructor" | "self" | "qr";

export interface AuditEntry {
    prevStatusId: string;
    newStatusId: string;
    changedBy: string;
    changedAt: FirestoreDate;
    reason?: string;
}

export interface AttendanceRecord {
    id: string;
    sessionId: string;
    classId: string;
    studentId: string;
    studentName: string;
    statusId: string;
    statusLabel: string;
    multiplierSnapshot: number;
    absenceWeightSnapshot: number;
    markedAt: FirestoreDate;
    markedBy: string;
    source: AttendanceSource;
    auditTrail: AuditEntry[];
}

// --- Analytics Aggregate ---

export interface ClassAnalytics {
    classId: string;
    totalSessions: number;
    averageAttendanceRate: number;
    updatedAt: FirestoreDate;
}
