"use client";

import { useTranslations } from "next-intl";
import { Suspense, useState } from "react";

import { Archive } from "lucide-react";

import { PageContainer, PageHeader } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Heading, Text } from "@/components/ui/typography";
import { ClassCard } from "@/features/classes/components/class-card";
import { CreateClassSheet } from "@/features/classes/components/create-class-sheet";
import { JoinClassDialog } from "@/features/classes/components/join-class-dialog";
import { useArchivedClasses, useClasses } from "@/features/classes/hooks/useClasses";

function DashboardContent({ showArchived }: { showArchived: boolean }) {
    const { data: classes } = useClasses();
    const { data: archivedClasses } = useArchivedClasses();
    const t = useTranslations("classes");

    const displayClasses = showArchived ? archivedClasses : classes;

    if (!displayClasses || displayClasses.length === 0) {
        if (showArchived) {
            return (
                <div className="border-border/30 bg-card animate-fade-in whisper-shadow flex min-h-[440px] flex-col items-center justify-center rounded-[32px] border border-dashed p-12 text-center">
                    <div className="bg-background ring-border/20 mb-8 flex h-24 w-24 items-center justify-center rounded-3xl ring-1">
                        <Archive className="text-muted-foreground h-10 w-10 opacity-30" />
                    </div>
                    <Heading size="6" as="h3" className="mb-3">
                        {t("noArchivedClasses")}
                    </Heading>
                    <Text size="5" color="olive" className="max-w-sm leading-relaxed" as="p">
                        {t("noArchivedClassesDesc")}
                    </Text>
                </div>
            );
        }

        return (
            <div className="border-border/30 bg-card animate-fade-in whisper-shadow flex min-h-[440px] flex-col items-center justify-center rounded-[32px] border border-dashed p-12 text-center">
                <div className="bg-background ring-border/20 mb-8 flex h-24 w-24 items-center justify-center rounded-3xl ring-1">
                    <span className="text-muted-foreground font-serif text-4xl font-bold opacity-30">
                        A
                    </span>
                </div>
                <Heading size="6" as="h3" className="mb-3">
                    {t("noClasses")}
                </Heading>
                <Text size="5" color="olive" className="mb-10 max-w-sm leading-relaxed" as="p">
                    {t("readyToStart")}
                </Text>
                <div className="flex items-center gap-4">
                    <JoinClassDialog />
                    <CreateClassSheet />
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in grid grid-cols-1 gap-10 pb-12 md:grid-cols-2 lg:grid-cols-3">
            {displayClasses.map((c) => (
                <ClassCard key={c.id} classItem={c} isArchived={showArchived} />
            ))}
        </div>
    );
}

function DashboardSkeleton() {
    return (
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                    key={i}
                    className="border-border/30 bg-card whisper-shadow h-64 animate-pulse rounded-3xl border"
                />
            ))}
        </div>
    );
}

export function DashboardPage() {
    const t = useTranslations("classes");
    const [showArchived, setShowArchived] = useState(false);

    return (
        <PageContainer>
            <PageHeader
                title={t("title")}
                description={t("description")}
                actions={
                    <div className="flex items-center gap-3">
                        <Button
                            variant={showArchived ? "secondary" : "ghost"}
                            size="sm"
                            onClick={() => setShowArchived(!showArchived)}
                            className="rounded-xl font-serif"
                        >
                            <Archive className="mr-2 h-4 w-4" />
                            {showArchived ? t("showActive") : t("showArchived")}
                        </Button>
                        <div className="hidden items-center gap-3 sm:flex">
                            <JoinClassDialog />
                            <CreateClassSheet />
                        </div>
                    </div>
                }
                className="mb-12"
            />

            <Suspense fallback={<DashboardSkeleton />}>
                <DashboardContent showArchived={showArchived} />
            </Suspense>
        </PageContainer>
    );
}
