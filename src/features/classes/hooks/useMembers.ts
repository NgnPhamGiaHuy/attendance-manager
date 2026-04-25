import { useEffect, useState } from "react";

import { useAuth } from "@/providers/auth-provider";
import { memberApi } from "../api/memberApi";

import type { ClassMember, ClassRole } from "@/types";

/**
 * Real-time subscription to class members.
 *
 * Automatically subscribes/unsubscribes based on classId changes.
 * Returns loading state and member array.
 *
 * @param classId - The class document ID
 * @returns Object with members array and loading state
 *
 * @example
 * ```tsx
 * function MembersList({ classId }: { classId: string }) {
 *   const { members, isLoading } = useMembers(classId);
 *
 *   if (isLoading) return <Spinner />;
 *   return <ul>{members.map(m => <li key={m.userId}>{m.role}</li>)}</ul>;
 * }
 * ```
 */
export function useMembers(classId: string) {
    const [members, setMembers] = useState<ClassMember[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!classId) {
            setMembers([]);
            setIsLoading(false);
            return;
        }

        // Track if component is still mounted
        let isMounted = true;

        // Set loading state
        if (isMounted) {
            setIsLoading(true);
        }

        // Subscribe to real-time updates
        const unsubscribe = memberApi.subscribeMembers(classId, (updatedMembers) => {
            if (isMounted) {
                setMembers(updatedMembers);
                setIsLoading(false);
            }
        });

        // Cleanup subscription on unmount or classId change
        return () => {
            isMounted = false;
            unsubscribe();
        };
    }, [classId]);

    return { members, isLoading };
}

/**
 * Derive the current user's role in a specific class.
 *
 * Returns null if user is not a member or data is still loading.
 * Useful for conditional rendering based on permissions.
 *
 * @param classId - The class document ID
 * @returns The user's ClassRole or null
 *
 * @example
 * ```tsx
 * function SettingsButton({ classId }: { classId: string }) {
 *   const role = useClassRole(classId);
 *
 *   // Only teachers can access settings
 *   if (role !== 'teacher') return null;
 *   return <Button>Settings</Button>;
 * }
 * ```
 */
export function useClassRole(classId: string): ClassRole | null {
    const { user } = useAuth();
    const { members, isLoading } = useMembers(classId);

    if (isLoading || !user) {
        return null;
    }

    const currentMember = members.find((m) => m.userId === user.uid);
    return currentMember?.role ?? null;
}
