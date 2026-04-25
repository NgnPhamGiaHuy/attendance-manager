"use client";

import { useEffect, useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { classKeys } from "@/features/classes/hooks/useClasses";
import { attendanceApi, sessionApi } from "@/features/sessions/api/sessionApi";
import { useAuth } from "@/providers/auth-provider";

import type { AttendanceRecord, Session } from "@/types";

// ─── Real-time session hook ───────────────────────────────────────────────────

export function useSession(sessionId: string) {
    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!sessionId) return;
        setIsLoading(true);

        const unsubscribe = sessionApi.subscribe(
            sessionId,
            (data) => {
                setSession(data);
                setIsLoading(false);
            },
            (err) => {
                setError(err);
                setIsLoading(false);
            },
        );

        return () => unsubscribe();
    }, [sessionId]);

    return { session, isLoading, error };
}

// ─── Real-time attendance records for a session ───────────────────────────────

export function useSessionAttendance(sessionId: string) {
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!sessionId) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);

        const unsubscribe = attendanceApi.subscribeBySessionId(
            sessionId,
            (data) => {
                setRecords(data);
                setIsLoading(false);
            },
            () => {
                setIsLoading(false);
            },
        );

        return () => unsubscribe();
    }, [sessionId]);

    // Build a lookup map: studentId → record
    // We prefer the record with the deterministic ID (sessionId_studentId)
    // to handle legacy data from the previous addDoc bug.
    const recordMap = records.reduce<Record<string, AttendanceRecord>>((acc, r) => {
        const studentId = r.studentId;
        const deterministicId = `${sessionId}_${studentId}`;
        const existing = acc[studentId];

        if (!existing || r.id === deterministicId) {
            acc[studentId] = r;
        }
        return acc;
    }, {});

    return { records, recordMap, isLoading };
}

// ─── Real-time sessions list for a class ─────────────────────────────────────

export function useClassSessions(classId: string) {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!classId) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);

        const unsubscribe = sessionApi.subscribeByClassId(
            classId,
            (data) => {
                setSessions(data);
                setIsLoading(false);
            },
            () => {
                setIsLoading(false);
            },
        );

        return () => unsubscribe();
    }, [classId]);

    return { sessions, isLoading };
}

// ─── Create session mutation ──────────────────────────────────────────────────

export function useCreateSession(classId: string, className: string) {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (params?: { startTime?: string; endTime?: string }) => {
            if (!user) throw new Error("Must be logged in.");
            return sessionApi.create({
                classId,
                className,
                createdBy: user.uid,
                startTime: params?.startTime,
                endTime: params?.endTime,
            });
        },
        onError: () => {
            toast.error("Failed to start session.");
        },
    });
}

// ─── Mark attendance mutation ─────────────────────────────────────────────────

export function useMarkAttendance() {
    const { user } = useAuth();

    return useMutation({
        mutationFn: (params: {
            sessionId: string;
            classId: string;
            studentId: string;
            studentName: string;
            statusId: string;
            statusLabel: string;
            multiplierSnapshot: number;
            absenceWeightSnapshot: number;
            previousRecord?: AttendanceRecord;
        }) => {
            if (!user) throw new Error("Must be logged in.");
            return attendanceApi.mark({
                ...params,
                markedBy: user.uid,
                source: "instructor",
            });
        },
        onError: () => {
            toast.error("Failed to update attendance. Please try again.");
        },
    });
}

export function useDeleteSession() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (sessionId: string) => sessionApi.delete(sessionId),
        onSuccess: (_, sessionId) => {
            queryClient.invalidateQueries({ queryKey: ["sessions"] });
            toast.success("Session deleted successfully.");
        },
        onError: (error) => {
            console.error("[useDeleteSession] Mutation failed:", error);
            toast.error("Failed to delete session. Please try again.");
        },
    });
}

// ─── Finalize session mutation ────────────────────────────────────────────────

export function useFinalizeSession() {
    return useMutation({
        mutationFn: (sessionId: string) => sessionApi.finalize(sessionId),
        onSuccess: () => {
            toast.success("Session finalized and locked.");
        },
        onError: () => {
            toast.error("Failed to finalize session.");
        },
    });
}

export function useUpdateSession() {
    return useMutation({
        mutationFn: (params: { id: string; data: { startTime?: string; endTime?: string } }) =>
            sessionApi.update(params.id, params.data),
        onError: (error) => {
            console.error("[useUpdateSession] Mutation failed:", error);
            toast.error("Failed to update session details.");
        },
    });
}

// ─── Bulk mark attendance mutation ────────────────────────────────────────────

export function useBulkMarkAttendance(sessionId: string) {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (params: {
            classId: string;
            studentIds: Set<string>;
            statusId: string;
            statusDef: { label: string; multiplier: number; absenceWeight: number };
            studentNames: Map<string, string>;
        }) => {
            if (!user) throw new Error("Must be logged in.");

            const { bulkMarkAttendance } = await import("@/features/sessions/api/sessionApi");

            return bulkMarkAttendance(
                sessionId,
                params.classId,
                params.studentIds,
                params.statusId,
                params.statusDef,
                user.uid,
                params.studentNames,
            );
        },
        onMutate: async (params) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: ["attendance", sessionId] });

            // Snapshot previous value
            const previous = queryClient.getQueryData(["attendance", sessionId]);

            // Optimistically update (if we had query-based attendance)
            // For now, real-time subscription will handle the update

            return { previous };
        },
        onError: (err, vars, context) => {
            // Rollback on error (real-time will revert automatically)
            toast.error("Failed to apply bulk changes. No records were modified.");
            console.error("Bulk mark error:", err);
        },
        onSuccess: (_, params) => {
            toast.success(`Marked ${params.studentIds.size} students as ${params.statusDef.label}`);
        },
    });
}
