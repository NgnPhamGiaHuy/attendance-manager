/**
 * Permission hook for role-based access control (RBAC).
 *
 * Provides granular permission checks based on user's role in a class.
 * Used for UI-level access control (hiding/disabling buttons).
 *
 * SECURITY NOTE: This is UX-only. Backend enforcement is in Firestore rules.
 *
 * @module usePermissions
 * @skills typescript-expert, react-best-practices
 */

import { useClassRole } from "./useMembers";
import { hasPermission, PERMISSION_PRESETS } from "../config/permissions.config";

import type { ClassRole } from "@/types";

export interface Permissions {
    /** Can edit session times, class details */
    canEdit: boolean;
    /** Can delete sessions, classes (teacher only) */
    canDelete: boolean;
    /** Can add/remove members, change roles (teacher only) */
    canManageMembers: boolean;
    /** Can edit class settings, statuses, scoring rules (teacher only) */
    canManageSettings: boolean;
    /** Can finalize sessions (teacher/TA) */
    canFinalizeSession: boolean;
    /** Can mark attendance (teacher/TA) */
    canMarkAttendance: boolean;
    /** Can create sessions (teacher/TA) */
    canCreateSession: boolean;
    /** Can archive class for themselves (all roles) */
    canArchive: boolean;
    /** Is teacher role */
    isTeacher: boolean;
    /** Is TA role */
    isTA: boolean;
    /** Is student role */
    isStudent: boolean;
    /** Current user's role (null if loading or not a member) */
    role: ClassRole | null;
    /** Is role data still loading */
    isLoading: boolean;
}

/**
 * Get permission flags for current user in a class.
 *
 * Returns permission object with boolean flags for each action.
 * All permissions default to false while loading or if user is not a member.
 *
 * @param classId - The class document ID
 * @returns Permission object with access flags
 *
 * @example
 * ```tsx
 * function SessionControls({ classId }: { classId: string }) {
 *   const { canMarkAttendance, canFinalizeSession, isLoading } = usePermissions(classId);
 *
 *   if (isLoading) return <Spinner />;
 *
 *   return (
 *     <>
 *       {canMarkAttendance && <MarkAllButton />}
 *       {canFinalizeSession && <FinalizeButton />}
 *     </>
 *   );
 * }
 * ```
 */
export function usePermissions(classId: string): Permissions {
    const role = useClassRole(classId);
    const isLoading = role === null;

    // Default to no permissions while loading or if not a member
    if (!role) {
        return {
            canEdit: false,
            canDelete: false,
            canManageMembers: false,
            canManageSettings: false,
            canFinalizeSession: false,
            canMarkAttendance: false,
            canCreateSession: false,
            canArchive: false,
            isTeacher: false,
            isTA: false,
            isStudent: false,
            role: null,
            isLoading,
        };
    }

    // Use centralized permission configuration
    const isTeacher = role === "teacher";
    const isTA = role === "ta";
    const isStudent = role === "student";

    return {
        // Use permission config for all checks
        canEdit: hasPermission(role, "sessions", "update"),
        canDelete: hasPermission(role, "sessions", "delete"),
        canManageMembers: hasPermission(role, "members", "changeRole"),
        canManageSettings: hasPermission(role, "class", "editSettings"),
        canFinalizeSession: hasPermission(role, "sessions", "finalize"),
        canMarkAttendance: hasPermission(role, "attendance", "mark"),
        canCreateSession: hasPermission(role, "sessions", "create"),
        canArchive: hasPermission(role, "class", "archive"),

        // Role flags
        isTeacher,
        isTA,
        isStudent,
        role,
        isLoading: false,
    };
}
