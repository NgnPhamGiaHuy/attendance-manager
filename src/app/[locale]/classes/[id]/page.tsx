"use client";

import { Suspense, use } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { ClassOverviewPage as OverviewContent } from "@/features/classes/components/class-overview-page";

export default function ClassOverviewRoute(props: { params: Promise<{ id: string }> }) {
    const { id } = use(props.params);

    return (
        <Suspense
            fallback={
                <div className="grid gap-10 lg:grid-cols-3">
                    <div className="space-y-8 lg:col-span-2">
                        <Skeleton className="h-8 w-48 rounded-lg" />
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-20 rounded-2xl" />
                        ))}
                    </div>
                    <Skeleton className="h-80 rounded-[32px]" />
                </div>
            }
        >
            <OverviewContent classId={id} />
        </Suspense>
    );
}
