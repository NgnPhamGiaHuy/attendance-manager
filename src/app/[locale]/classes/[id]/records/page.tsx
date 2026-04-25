"use client";

import { Suspense, use } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { RecordsPage as RecordsContent } from "@/features/classes/components/records-page";

export default function RecordsRoute(props: { params: Promise<{ id: string }> }) {
    const { id } = use(props.params);
    return (
        <Suspense fallback={<Skeleton className="h-96 w-full rounded-[32px]" />}>
            <RecordsContent classId={id} />
        </Suspense>
    );
}
