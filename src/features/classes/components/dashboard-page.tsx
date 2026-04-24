"use client";

import { Suspense } from "react";

import { PageContainer, PageHeader } from "@/components/layout/app-shell";
import { Heading, Text } from "@/components/ui/typography";
import { ClassCard } from "@/features/classes/components/class-card";
import { CreateClassSheet } from "@/features/classes/components/create-class-sheet";
import { JoinClassDialog } from "@/features/classes/components/join-class-dialog";
import { useClasses } from "@/features/classes/hooks/useClasses";

function DashboardContent() {
    const { data: classes } = useClasses();

    if (!classes || classes.length === 0) {
        return (
            <div className="border-border/30 bg-ivory animate-fade-in whisper-shadow flex min-h-[440px] flex-col items-center justify-center rounded-[32px] border border-dashed p-12 text-center">
                <div className="bg-background ring-border/20 mb-8 flex h-24 w-24 items-center justify-center rounded-3xl ring-1">
                    <span className="text-stone-gray font-serif text-4xl font-bold opacity-30">
                        A
                    </span>
                </div>
                <Heading size="6" as="h3" className="mb-3">
                    No classes yet
                </Heading>
                <Text size="5" color="olive" className="mb-10 max-w-sm leading-relaxed" as="p">
                    Ready to start? Create your first class or join an existing one to begin taking
                    attendance.
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
            {classes.map((c) => (
                <ClassCard key={c.id} classItem={c} />
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
                    className="border-border/30 bg-ivory whisper-shadow h-64 animate-pulse rounded-3xl border"
                />
            ))}
        </div>
    );
}

export function DashboardPage() {
    return (
        <PageContainer>
            <PageHeader
                title="Your Classes"
                description="The quietest way to manage attendance. Simple, thoughtful, and unhurried."
                actions={
                    <div className="hidden items-center gap-3 sm:flex">
                        <JoinClassDialog />
                        <CreateClassSheet />
                    </div>
                }
                className="mb-12"
            />

            <Suspense fallback={<DashboardSkeleton />}>
                <DashboardContent />
            </Suspense>
        </PageContainer>
    );
}
