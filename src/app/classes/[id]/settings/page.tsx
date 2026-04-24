"use client";

import { Suspense, use } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { SettingsPage as SettingsContent } from "@/features/classes/components/settings-page";

export default function SettingsRoute(props: { params: Promise<{ id: string }> }) {
    const { id } = use(props.params);

    return (
        <Suspense
            fallback={
                <div className="max-w-4xl space-y-6">
                    <Skeleton className="h-[250px] w-full rounded-xl" />
                    <Skeleton className="h-[400px] w-full rounded-xl" />
                </div>
            }
        >
            <SettingsContent classId={id} />
        </Suspense>
    );
}
