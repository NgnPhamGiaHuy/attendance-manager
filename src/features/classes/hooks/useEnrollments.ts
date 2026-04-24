"use client";

import { useEffect, useState } from "react";

import { enrollmentApi } from "@/features/classes/api/enrollmentApi";

import type { Enrollment } from "@/types";

export function useEnrollments(classId: string) {
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!classId) return;
        setIsLoading(true);

        const unsubscribe = enrollmentApi.subscribeByClassId(classId, (data) => {
            setEnrollments(data);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [classId]);

    return { enrollments, isLoading };
}
