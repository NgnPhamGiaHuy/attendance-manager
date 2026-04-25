"use client";

import { useEffect } from "react";

import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";

import { classApi } from "@/features/classes/api/classApi";
import { useAuth } from "@/providers/auth-provider";

export const classKeys = {
    all: ["classes"] as const,
    lists: () => [...classKeys.all, "list"] as const,
    list: (userId: string) => [...classKeys.lists(), userId] as const,
    details: () => [...classKeys.all, "detail"] as const,
    detail: (id: string) => [...classKeys.details(), id] as const,
};

export function useClasses() {
    const { user } = useAuth();

    return useSuspenseQuery({
        queryKey: classKeys.list(user?.uid ?? ""),
        queryFn: () => {
            if (!user?.uid) return Promise.resolve([]);
            return classApi.getClassesByUserId(user.uid);
        },
    });
}

export function useClass(id: string) {
    const queryClient = useQueryClient();

    useEffect(() => {
        return () => {
            // Remove failed queries from cache on unmount so navigating back
            // always triggers a fresh fetch instead of replaying the error.
            const state = queryClient.getQueryState(classKeys.detail(id));
            if (state?.status === "error") {
                queryClient.removeQueries({ queryKey: classKeys.detail(id) });
            }
        };
    }, [id, queryClient]);

    return useSuspenseQuery({
        queryKey: classKeys.detail(id),
        queryFn: () => classApi.getClassById(id),
        // Don't retry on 404-style errors — the class simply doesn't exist
        retry: (failureCount, error) => {
            const msg = (error as Error)?.message?.toLowerCase() ?? "";
            if (msg.includes("not found") || msg.includes("does not exist")) return false;
            return failureCount < 1;
        },
    });
}

export function useCreateClass() {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    return useMutation({
        mutationFn: (data: { name: string; description?: string }) => {
            if (!user) throw new Error("Must be logged in to create a class.");
            return classApi.createClass(data, user.uid, user.displayName);
        },
        onSuccess: () => {
            // Invalidate classes list so it refetches and shows the new class
            queryClient.invalidateQueries({ queryKey: classKeys.lists() });
        },
    });
}

export function useJoinClass() {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    return useMutation({
        mutationFn: (code: string) => {
            if (!user) throw new Error("Must be logged in to join a class.");
            return classApi.joinClassByCode(code, user.uid, user.displayName, user.email);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: classKeys.lists() });
        },
    });
}

export function useUpdateClass() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<import("@/types").Class> }) =>
            classApi.updateClass(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: classKeys.detail(variables.id) });
            queryClient.invalidateQueries({ queryKey: classKeys.lists() });
        },
    });
}
