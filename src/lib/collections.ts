import { collection, CollectionReference, DocumentData } from "firebase/firestore";

import { db } from "@/lib/firebase";

import type {
    AppUser,
    AttendanceRecord,
    Class,
    ClassAnalytics,
    ClassMember,
    Enrollment,
    Session,
} from "@/types";

// ─── Type-safe collection references ─────────────────────────────────────────
// These provide type safety without runtime overhead; Firestore still uses
// generic converters under the hood.

function typedCollection<T = DocumentData>(
    path: string,
    ...pathSegments: string[]
): CollectionReference<T> {
    return collection(db, path, ...pathSegments) as CollectionReference<T>;
}

export const Collections = {
    users: () => typedCollection<AppUser>("users"),
    classes: () => typedCollection<Class>("classes"),
    classMembers: (classId: string) => typedCollection<ClassMember>(`classes/${classId}/members`),
    enrollments: () => typedCollection<Enrollment>("enrollments"),
    sessions: () => typedCollection<Session>("sessions"),
    attendanceRecords: () => typedCollection<AttendanceRecord>("attendance_records"),
    analytics: () => typedCollection<ClassAnalytics>("analytics_aggregates"),
} as const;
