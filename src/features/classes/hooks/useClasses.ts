"use client";

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
    return useSuspenseQuery({
        queryKey: classKeys.detail(id),
        queryFn: () => classApi.getClassById(id),
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
