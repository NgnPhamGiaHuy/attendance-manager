"use client";

import { useTranslations } from "next-intl";
import { Suspense } from "react";

import { ArrowLeft, Play } from "lucide-react";

import { AppShell, PageContainer } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Heading, Text } from "@/components/ui/typography";
import { useClass } from "@/features/classes/hooks/useClasses";
import { usePermissions } from "@/features/classes/hooks/usePermissions";
import { Link, usePathname } from "@/i18n/routing";
import { cn } from "@/lib/utils";

interface ClassLayoutProps {
    classId: string;
    children: React.ReactNode;
}

function ClassLayoutContent({ classId, children }: ClassLayoutProps) {
    const { data: classItem } = useClass(classId);
    const pathname = usePathname();
    const t = useTranslations("classes");
    const tCommon = useTranslations("common");

    const activeTab =
        ["records", "members", "settings"].find((tab) => pathname.includes(`/${tab}`)) ||
        "overview";

    const permissions = usePermissions(classId);

    const tabs = [
        { id: "overview", label: t("overview"), href: `/classes/${classId}` },
        { id: "records", label: t("records"), href: `/classes/${classId}/records` },
        {
            id: "members",
            label: t("members_tab", { fallback: "Members" }),
            href: `/classes/${classId}/members`,
        },
        { id: "settings", label: t("settings"), href: `/classes/${classId}/settings` },
    ].filter(
        (tab) => tab.id !== "settings" || permissions.isLoading || permissions.canManageSettings,
    );

    return (
        <AppShell title={classItem.name}>
            <PageContainer>
                <div className="animate-fade-in flex flex-col gap-10">
                    <div className="flex flex-col gap-6">
                        <Link
                            href="/dashboard"
                            className="text-stone-gray hover:text-near-black inline-flex w-fit items-center text-[10px] font-bold tracking-widest uppercase transition-colors"
                        >
                            <ArrowLeft className="mr-2 h-3.5 w-3.5" />
                            {tCommon("backToDashboard")}
                        </Link>

                        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
                            <div className="space-y-3">
                                <Heading size="8" as="h1">
                                    {classItem.name}
                                </Heading>
                                <Text size="4" color="olive" className="max-w-xl">
                                    {classItem.description ||
                                        t("classCode", { code: classItem.code })}
                                </Text>
                            </div>
                            <Button className="whisper-shadow h-12 rounded-2xl px-8 font-serif text-base">
                                <Play className="mr-2.5 h-4 w-4 fill-current" />
                                {t("startAttendance")}
                            </Button>
                        </div>
                    </div>

                    <div className="border-border/30 border-b">
                        <nav className="-mb-[1px] flex space-x-10" aria-label="Tabs">
                            {tabs.map((tab) => {
                                const isActive = activeTab === tab.id;
                                return (
                                    <Link
                                        key={tab.id}
                                        href={tab.href}
                                        className={cn(
                                            "border-b-2 px-1 py-4 font-serif text-base whitespace-nowrap transition-all duration-200",
                                            isActive
                                                ? "border-terracotta text-near-black font-medium"
                                                : "text-stone-gray hover:text-olive-gray hover:border-border/60 border-transparent",
                                        )}
                                        aria-current={isActive ? "page" : undefined}
                                    >
                                        {tab.label}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>

                    <div className="animate-fade-in">{children}</div>
                </div>
            </PageContainer>
        </AppShell>
    );
}

function ClassLayoutSkeleton() {
    const t = useTranslations("classes");
    return (
        <AppShell title={t("loadingClass")}>
            <PageContainer>
                <div className="flex animate-pulse flex-col gap-10">
                    <div className="bg-ivory ring-border/40 h-4 w-32 rounded ring-1" />
                    <div className="border-border/20 flex items-end justify-between border-b pb-10">
                        <div className="space-y-4">
                            <div className="bg-ivory ring-border/40 h-14 w-96 rounded-2xl ring-1" />
                            <div className="bg-ivory ring-border/40 h-6 w-64 rounded-xl ring-1" />
                        </div>
                        <div className="bg-ivory ring-border/40 h-12 w-44 rounded-2xl ring-1" />
                    </div>
                    <div className="bg-ivory/50 ring-border/20 h-14 w-full rounded-2xl ring-1" />
                    <div className="bg-ivory whisper-shadow mt-4 h-96 w-full rounded-[32px]" />
                </div>
            </PageContainer>
        </AppShell>
    );
}

export function ClassLayout({ classId, children }: ClassLayoutProps) {
    return (
        <Suspense fallback={<ClassLayoutSkeleton />}>
            <ClassLayoutContent classId={classId}>{children}</ClassLayoutContent>
        </Suspense>
    );
}
