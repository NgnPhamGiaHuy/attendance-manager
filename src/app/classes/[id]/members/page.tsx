"use client";

import { Suspense, use } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { MembersPage as MembersContent } from "@/features/classes/components/members-page";

export default function MembersRoute(props: { params: Promise<{ id: string }> }) {
    const { id } = use(props.params);

    return (
        <Suspense
            fallback={
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-20 w-full rounded-2xl" />
                    ))}
                </div>
            }
        >
            <MembersContent classId={id} />
        </Suspense>
    );
}
