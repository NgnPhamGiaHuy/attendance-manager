"use client";

import { Suspense, use } from "react";

import { PageContainer } from "@/components/layout/app-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { SessionDetailPage as SessionContent } from "@/features/sessions/components/session-detail-page";

export default function SessionRoute(props: {
    params: Promise<{ id: string; sessionId: string }>;
}) {
    const { id, sessionId } = use(props.params);

    return (
        <Suspense
            fallback={
                <PageContainer>
                    <div className="space-y-3">
                        <Skeleton className="h-10 w-64" />
                        <Skeleton className="h-5 w-44" />
                        <div className="mt-6 space-y-2">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <Skeleton key={i} className="h-16 w-full rounded-xl" />
                            ))}
                        </div>
                    </div>
                </PageContainer>
            }
        >
            <SessionContent classId={id} sessionId={sessionId} />
        </Suspense>
    );
}
