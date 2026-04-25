"use client";

import { useEffect, useState } from "react";

import { enrollmentApi } from "@/features/classes/api/enrollmentApi";

import type { Enrollment } from "@/types";

export function useEnrollments(classId: string) {
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!classId) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);

        const unsubscribe = enrollmentApi.subscribeByClassId(
            classId,
            (data) => {
                setEnrollments(data);
                setIsLoading(false);
            },
            () => {
                // On error, stop loading so UI doesn't hang on skeleton
                setIsLoading(false);
            },
        );

        return () => unsubscribe();
    }, [classId]);

    return { enrollments, isLoading };
}
