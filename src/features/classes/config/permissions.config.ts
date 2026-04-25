/**
 * Centralized RBAC Permission Configuration
 *
 * Single source of truth for all role-based permissions across the application.
 * Follow feature-based architecture for easy configuration and maintenance.
 *
 * @module permissions.config
 * @skills cc-skill-coding-standards, code-refactoring-refactor-clean
 */

import type { ClassRole } from "@/types";

/**
 * Permission matrix defining what each role can do.
 *
 * SECURITY NOTE: This is for UI/UX only. Backend enforcement is in Firestore rules.
 *
 * Permission Categories:
 * - Class Management: Create, update, delete classes
 * - Member Management: Add, remove, change roles
 * - Session Management: Create, update, delete, finalize sessions
 * - Attendance Management: Mark attendance, bulk actions
 * - Settings Management: Edit class settings, statuses, scoring rules
 */
export const PERMISSIONS_MATRIX = {
    // ─── Class Management ─────────────────────────────────────────────────────
    class: {
        create: ["teacher", "ta", "student"] as ClassRole[],
        update: ["teacher"] as ClassRole[],
        delete: ["teacher"] as ClassRole[],
        archive: ["teacher", "ta", "student"] as ClassRole[], // All roles can archive for themselves
        viewSettings: ["teacher"] as ClassRole[],
        editSettings: ["teacher"] as ClassRole[],
    },

    // ─── Member Management ────────────────────────────────────────────────────
    members: {
        view: ["teacher", "ta", "student"] as ClassRole[],
        add: ["teacher"] as ClassRole[],
        remove: ["teacher"] as ClassRole[],
        changeRole: ["teacher"] as ClassRole[],
    },

    // ─── Session Management ───────────────────────────────────────────────────
    sessions: {
        view: ["teacher", "ta", "student"] as ClassRole[],
        create: ["teacher", "ta"] as ClassRole[],
        update: ["teacher", "ta"] as ClassRole[],
        delete: ["teacher"] as ClassRole[],
        finalize: ["teacher", "ta"] as ClassRole[],
        editTimes: ["teacher", "ta"] as ClassRole[],
    },

    // ─── Attendance Management ────────────────────────────────────────────────
    attendance: {
        view: ["teacher", "ta", "student"] as ClassRole[],
        mark: ["teacher", "ta"] as ClassRole[],
        bulkMark: ["teacher", "ta"] as ClassRole[],
        markAll: ["teacher", "ta"] as ClassRole[],
        qrCheckIn: ["teacher", "ta"] as ClassRole[],
        selfCheckIn: ["student"] as ClassRole[], // Via QR code only
    },

    // ─── Status Management ────────────────────────────────────────────────────
    statuses: {
        view: ["teacher", "ta", "student"] as ClassRole[],
        create: ["teacher"] as ClassRole[],
        update: ["teacher"] as ClassRole[],
        delete: ["teacher"] as ClassRole[],
    },

    // ─── Scoring Rules Management ─────────────────────────────────────────────
    scoring: {
        view: ["teacher", "ta", "student"] as ClassRole[],
        edit: ["teacher"] as ClassRole[],
    },

    // ─── Records & Analytics ──────────────────────────────────────────────────
    records: {
        viewAll: ["teacher", "ta"] as ClassRole[],
        viewOwn: ["student"] as ClassRole[],
        export: ["teacher"] as ClassRole[],
    },
} as const;

/**
 * Helper function to check if a role has a specific permission.
 *
 * @param role - User's role in the class
 * @param category - Permission category (e.g., "sessions", "attendance")
 * @param action - Specific action (e.g., "create", "mark")
 * @returns true if role has permission, false otherwise
 *
 * @example
 * ```ts
 * hasPermission("teacher", "sessions", "delete") // true
 * hasPermission("student", "sessions", "delete") // false
 * hasPermission("ta", "attendance", "mark") // true
 * ```
 */
export function hasPermission(
    role: ClassRole | null,
    category: keyof typeof PERMISSIONS_MATRIX,
    action: string,
): boolean {
    if (!role) return false;

    const permissions = PERMISSIONS_MATRIX[category];
    if (!permissions) return false;

    const allowedRoles = permissions[action as keyof typeof permissions];
    if (!allowedRoles) return false;

    return (allowedRoles as readonly ClassRole[]).includes(role);
}

/**
 * Get all permissions for a specific role.
 * Useful for debugging and permission audits.
 *
 * @param role - User's role in the class
 * @returns Object with all permission flags
 *
 * @example
 * ```ts
 * const perms = getAllPermissions("teacher");
 * console.log(perms.sessions.create); // true
 * console.log(perms.sessions.delete); // true
 * ```
 */
export function getAllPermissions(role: ClassRole | null) {
    return {
        class: {
            create: hasPermission(role, "class", "create"),
            update: hasPermission(role, "class", "update"),
            delete: hasPermission(role, "class", "delete"),
            archive: hasPermission(role, "class", "archive"),
            viewSettings: hasPermission(role, "class", "viewSettings"),
            editSettings: hasPermission(role, "class", "editSettings"),
        },
        members: {
            view: hasPermission(role, "members", "view"),
            add: hasPermission(role, "members", "add"),
            remove: hasPermission(role, "members", "remove"),
            changeRole: hasPermission(role, "members", "changeRole"),
        },
        sessions: {
            view: hasPermission(role, "sessions", "view"),
            create: hasPermission(role, "sessions", "create"),
            update: hasPermission(role, "sessions", "update"),
            delete: hasPermission(role, "sessions", "delete"),
            finalize: hasPermission(role, "sessions", "finalize"),
            editTimes: hasPermission(role, "sessions", "editTimes"),
        },
        attendance: {
            view: hasPermission(role, "attendance", "view"),
            mark: hasPermission(role, "attendance", "mark"),
            bulkMark: hasPermission(role, "attendance", "bulkMark"),
            markAll: hasPermission(role, "attendance", "markAll"),
            qrCheckIn: hasPermission(role, "attendance", "qrCheckIn"),
            selfCheckIn: hasPermission(role, "attendance", "selfCheckIn"),
        },
        statuses: {
            view: hasPermission(role, "statuses", "view"),
            create: hasPermission(role, "statuses", "create"),
            update: hasPermission(role, "statuses", "update"),
            delete: hasPermission(role, "statuses", "delete"),
        },
        scoring: {
            view: hasPermission(role, "scoring", "view"),
            edit: hasPermission(role, "scoring", "edit"),
        },
        records: {
            viewAll: hasPermission(role, "records", "viewAll"),
            viewOwn: hasPermission(role, "records", "viewOwn"),
            export: hasPermission(role, "records", "export"),
        },
    };
}

/**
 * Permission presets for common use cases.
 * Use these for quick permission checks in components.
 */
export const PERMISSION_PRESETS = {
    /** Can manage all class settings (teacher only) */
    isClassAdmin: (role: ClassRole | null) => role === "teacher",

    /** Can manage attendance (teacher/TA) */
    canManageAttendance: (role: ClassRole | null) => role === "teacher" || role === "ta",

    /** Can edit class content (teacher/TA) */
    canEditContent: (role: ClassRole | null) => role === "teacher" || role === "ta",

    /** Is read-only user (student) */
    isReadOnly: (role: ClassRole | null) => role === "student",
} as const;
