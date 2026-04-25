"use client";

import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-chip";
import { Heading, Text } from "@/components/ui/typography";
import { useClass } from "@/features/classes/hooks/useClasses";
import { useEnrollments } from "@/features/classes/hooks/useEnrollments";
import { attendanceApi } from "@/features/sessions/api/sessionApi";
import { useClassSessions } from "@/features/sessions/hooks/useSessions";
import { formatDate } from "@/lib/utils";

import type { AttendanceRecord, Session, StatusDefinition } from "@/types";

// ─── Records Matrix ───────────────────────────────────────────────────────────

function RecordsMatrix({
    classId,
    sessions,
    enrollments,
    classData,
}: {
    classId: string;
    sessions: Session[];
    enrollments: { studentId: string; studentName: string }[];
    classData: { statusDefinitions: Record<string, StatusDefinition> };
}) {
    const t = useTranslations("records");
    const [records, setRecords] = useState<AttendanceRecord[]>([]);

    useEffect(() => {
        if (!classId) return;
        const unsubscribe = attendanceApi.subscribeByClassId(classId, setRecords);
        return () => unsubscribe();
    }, [classId]);

    const lookup = useMemo(() => {
        const map: Record<string, Record<string, AttendanceRecord>> = {};
        records.forEach((r) => {
            if (!map[r.studentId]) map[r.studentId] = {};
            map[r.studentId][r.sessionId] = r;
        });
        return map;
    }, [records]);

    const statuses = useMemo(
        () => Object.values(classData.statusDefinitions),
        [classData.statusDefinitions],
    );

    if (sessions.length === 0) {
        return (
            <div className="bg-card/50 border-border/40 whisper-shadow animate-fade-in flex h-64 flex-col items-center justify-center rounded-[32px] border border-dashed p-12 text-center">
                <Text size="4" color="stone" className="max-w-md leading-relaxed">
                    {t("noFinalizedSessions")}
                </Text>
            </div>
        );
    }

    return (
        <div className="border-border/30 bg-card whisper-shadow animate-fade-in overflow-hidden rounded-[32px] border">
            <ScrollArea className="w-full">
                <div className="w-max min-w-full">
                    <table className="w-full border-separate border-spacing-0">
                        <thead>
                            <tr className="bg-background/80 backdrop-blur-md">
                                <th className="border-border/20 sticky left-0 z-20 min-w-[240px] border-r border-b px-8 py-6 text-left backdrop-blur-md">
                                    <Text
                                        size="1"
                                        weight="bold"
                                        color="stone"
                                        className="tracking-widest uppercase"
                                    >
                                        {t("studentName")}
                                    </Text>
                                </th>
                                {sessions.map((s, idx) => (
                                    <th
                                        key={s.id}
                                        className={`border-border/20 min-w-[100px] border-b px-4 py-6 text-center ${
                                            idx < sessions.length - 1 ? "border-r" : ""
                                        }`}
                                    >
                                        <div className="flex flex-col items-center gap-1.5">
                                            <Text
                                                size="1"
                                                weight="bold"
                                                color="stone"
                                                className="tracking-[0.1em] uppercase"
                                            >
                                                {formatDate(s.date, { month: "short" })}
                                            </Text>
                                            <Heading size="5" className="font-serif leading-none">
                                                {formatDate(s.date, { day: "numeric" })}
                                            </Heading>
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-border/20 divide-y">
                            {enrollments.map((enrollment) => {
                                const studentRecords = lookup[enrollment.studentId] ?? {};
                                return (
                                    <tr
                                        key={enrollment.studentId}
                                        className="group hover:bg-background transition-colors"
                                    >
                                        <td className="bg-card/95 border-border/20 group-hover:bg-background sticky left-0 z-10 max-w-[240px] truncate border-r px-8 py-5 backdrop-blur-sm">
                                            <Text
                                                size="3"
                                                weight="medium"
                                                className="text-foreground"
                                            >
                                                {enrollment.studentName}
                                            </Text>
                                        </td>
                                        {sessions.map((s, idx) => {
                                            const record = studentRecords[s.id];
                                            const status = record
                                                ? statuses.find((st) => st.id === record.statusId)
                                                : null;
                                            return (
                                                <td
                                                    key={s.id}
                                                    className={`border-border/20 group-hover:bg-background px-4 py-5 text-center transition-colors ${
                                                        idx < sessions.length - 1 ? "border-r" : ""
                                                    }`}
                                                >
                                                    {status ? (
                                                        <StatusBadge
                                                            label={status.label}
                                                            acronym={status.acronym}
                                                            color={status.color}
                                                            size="sm"
                                                        />
                                                    ) : (
                                                        <Text
                                                            size="3"
                                                            weight="bold"
                                                            className="text-muted-foreground/20"
                                                        >
                                                            —
                                                        </Text>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                <ScrollBar orientation="horizontal" className="h-3" />
            </ScrollArea>
        </div>
    );
}

// ─── Records Page ─────────────────────────────────────────────────────────────

export function RecordsPage({ classId }: { classId: string }) {
    const t = useTranslations("records");
    const { data: classData } = useClass(classId);
    const { sessions, isLoading: sessionsLoading } = useClassSessions(classId);
    const { enrollments, isLoading: enrollmentsLoading } = useEnrollments(classId);

    const finalizedSessions = useMemo(() => sessions.filter((s) => s.isFinalized), [sessions]);

    // Separate active and inactive enrollments
    const activeEnrollments = useMemo(() => enrollments.filter((e) => e.isActive), [enrollments]);

    const inactiveEnrollments = useMemo(
        () => enrollments.filter((e) => !e.isActive),
        [enrollments],
    );

    if (sessionsLoading || enrollmentsLoading || !classData) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-6 w-48 rounded-lg" />
                <Skeleton className="h-96 w-full rounded-[32px]" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Active Members Section */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <Heading size="2" color="stone" className="uppercase">
                        {t("finalizedSessions", { count: finalizedSessions.length })} ·{" "}
                        {t("activeStudents", { count: activeEnrollments.length })}
                    </Heading>
                </div>
                <RecordsMatrix
                    classId={classId}
                    sessions={finalizedSessions}
                    enrollments={activeEnrollments}
                    classData={classData}
                />
            </div>

            {/* Inactive Members Section */}
            {inactiveEnrollments.length > 0 && (
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="bg-muted/20 h-px flex-1" />
                        <Heading size="3" color="stone" className="uppercase">
                            {t("inactiveMembers", { count: inactiveEnrollments.length })}
                        </Heading>
                        <div className="bg-muted/20 h-px flex-1" />
                    </div>
                    <Text size="2" color="stone" className="text-center italic">
                        {t("inactiveDesc")}
                    </Text>
                    <RecordsMatrix
                        classId={classId}
                        sessions={finalizedSessions}
                        enrollments={inactiveEnrollments}
                        classData={classData}
                    />
                </div>
            )}
        </div>
    );
}
