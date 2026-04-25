"use client";

import { Suspense, use, useEffect } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/typography";
import { SettingsPage as SettingsContent } from "@/features/classes/components/settings-page";
import { usePermissions } from "@/features/classes/hooks/usePermissions";
import { useRouter } from "@/i18n/routing";

function SettingsGuard({ classId }: { classId: string }) {
    const permissions = usePermissions(classId);
    const router = useRouter();

    useEffect(() => {
        if (!permissions.isLoading && !permissions.canManageSettings) {
            router.replace(`/classes/${classId}`);
        }
    }, [permissions.isLoading, permissions.canManageSettings, router, classId]);

    // Show loading while checking permissions
    if (permissions.isLoading) {
        return (
            <div className="max-w-4xl space-y-6">
                <Skeleton className="h-[250px] w-full rounded-xl" />
                <Skeleton className="h-[400px] w-full rounded-xl" />
            </div>
        );
    }

    if (!permissions.canManageSettings) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Text size="4" color="olive">
                    Redirecting...
                </Text>
            </div>
        );
    }

    // Show loading while checking permissions
    if (permissions.isLoading) {
        return (
            <div className="max-w-4xl space-y-6">
                <Skeleton className="h-[250px] w-full rounded-xl" />
                <Skeleton className="h-[400px] w-full rounded-xl" />
            </div>
        );
    }

    return <SettingsContent classId={classId} />;
}

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
            <SettingsGuard classId={id} />
        </Suspense>
    );
}
