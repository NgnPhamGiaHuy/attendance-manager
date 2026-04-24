"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import { CheckCheck, Clock, Lock, Users } from "lucide-react";
import { toast } from "sonner";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusChipRow } from "@/components/ui/status-chip";
import { Heading, Text } from "@/components/ui/typography";
import { useEnrollments } from "@/features/classes/hooks/useEnrollments";
import { sessionApi } from "@/features/sessions/api/sessionApi";
import {
    useFinalizeSession,
    useMarkAttendance,
    useSession,
    useSessionAttendance,
    useUpdateSession,
} from "@/features/sessions/hooks/useSessions";
import { formatTime, getInitials } from "@/lib/utils";

import type { Class, StatusDefinition } from "@/types";

// ─── Student Row ──────────────────────────────────────────────────────────────

interface StudentRowProps {
    studentId: string;
    studentName: string;
    currentStatusId: string | null;
    statuses: StatusDefinition[];
    onMark: (statusId: string) => void;
    isDisabled: boolean;
}

function StudentRow({
    studentId,
    studentName,
    currentStatusId,
    statuses,
    onMark,
    isDisabled,
}: StudentRowProps) {
    return (
        <div className="group border-border/60 bg-ivory hover:ring-terracotta/20 whisper-shadow animate-fade-in flex items-center justify-between gap-4 rounded-2xl border p-6 transition-all duration-300 hover:ring-1">
            <div className="flex min-w-0 items-center gap-4">
                <Avatar className="border-border/40 h-10 w-10 shrink-0 border">
                    <AvatarFallback className="bg-background text-stone-gray text-[11px] font-bold tracking-wider uppercase">
                        {getInitials(studentName)}
                    </AvatarFallback>
                </Avatar>
                <Text size="5" weight="medium" className="truncate">
                    {studentName}
                </Text>
            </div>

            <StatusChipRow
                statuses={statuses.map((s) => ({
                    id: s.id,
                    label: s.label,
                    acronym: s.acronym,
                    color: s.color,
                }))}
                activeStatusId={currentStatusId}
                onSelect={onMark}
                disabled={isDisabled}
                size="md"
            />
        </div>
    );
}

// ─── Session Stats Bar ────────────────────────────────────────────────────────

interface StatsBarProps {
    total: number;
    marked: number;
    statuses: StatusDefinition[];
    statusCounts: Record<string, number>;
}

function StatsBar({ total, marked, statuses, statusCounts }: StatsBarProps) {
    const presentStatus = statuses.find((s) => s.isDefault);
    const presentCount = presentStatus ? (statusCounts[presentStatus.id] ?? 0) : 0;
    const absentStatus = statuses.find((s) => s.acronym === "A");
    const absentCount = absentStatus ? (statusCounts[absentStatus.id] ?? 0) : 0;
    const lateStatus = statuses.find((s) => s.acronym === "L");
    const lateCount = lateStatus ? (statusCounts[lateStatus.id] ?? 0) : 0;
    const unmarked = total - marked;

    return (
        <div className="border-border/40 flex flex-wrap items-center gap-x-8 gap-y-3 border-b pb-8">
            <div className="flex items-center gap-2.5">
                <Users className="text-stone-gray h-4.5 w-4.5" />
                <Text size="5" weight="medium" className="text-near-black">
                    {total}
                </Text>
                <Text size="1" weight="bold" color="stone" className="tracking-widest uppercase">
                    students
                </Text>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
                {presentStatus && (
                    <div className="flex items-center gap-1.5">
                        <div
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: presentStatus.color }}
                        />
                        <Text size="2" weight="medium" className="text-near-black">
                            {presentCount} Present
                        </Text>
                    </div>
                )}
                {lateStatus && (
                    <div className="flex items-center gap-1.5">
                        <div
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: lateStatus.color }}
                        />
                        <Text size="2" weight="medium" className="text-near-black">
                            {lateCount} Late
                        </Text>
                    </div>
                )}
                {absentStatus && (
                    <div className="flex items-center gap-1.5">
                        <div
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: absentStatus.color }}
                        />
                        <Text size="2" weight="medium" className="text-near-black">
                            {absentCount} Absent
                        </Text>
                    </div>
                )}
                {unmarked > 0 && (
                    <Text size="2" color="stone" className="border-border/60 border-l pl-2 italic">
                        {unmarked} unmarked
                    </Text>
                )}
            </div>
        </div>
    );
}

// ─── Main Session Page ────────────────────────────────────────────────────────

interface SessionPageProps {
    sessionId: string;
    classData: Class;
}

export function SessionPage({ sessionId, classData }: SessionPageProps) {
    const router = useRouter();
    const { session, isLoading: sessionLoading } = useSession(sessionId);
    const { enrollments, isLoading: enrollmentsLoading } = useEnrollments(classData.id);
    const { recordMap, isLoading: recordsLoading } = useSessionAttendance(sessionId);

    const markAttendance = useMarkAttendance();
    const finalizeSession = useFinalizeSession();
    const updateSession = useUpdateSession();
    const [isMarkingAll, setIsMarkingAll] = useState(false);

    const statuses = useMemo(
        () => Object.values(classData.statusDefinitions).sort((a, b) => a.order - b.order),
        [classData.statusDefinitions],
    );

    const defaultStatus = statuses.find((s) => s.isDefault) ?? statuses[0];

    const handleMarkAll = useCallback(async () => {
        if (!defaultStatus) return;
        setIsMarkingAll(true);
        try {
            await sessionApi.markAllWithStatus(sessionId, defaultStatus.id);
            toast.success(`All students marked as ${defaultStatus.label}`);
        } catch {
            toast.error("Failed to mark all students.");
        } finally {
            setIsMarkingAll(false);
        }
    }, [sessionId, defaultStatus]);

    const handleMark = useCallback(
        (studentId: string, studentName: string, statusId: string) => {
            const status = statuses.find((s) => s.id === statusId);
            if (!status) return;
            const prevRecord = recordMap[studentId];

            markAttendance.mutate({
                sessionId,
                classId: classData.id,
                studentId,
                studentName,
                statusId,
                statusLabel: status.label,
                multiplierSnapshot: status.multiplier,
                absenceWeightSnapshot: status.absenceWeight,
                previousRecord: prevRecord,
            });
        },
        [sessionId, classData.id, statuses, recordMap, markAttendance],
    );

    const handleFinalize = useCallback(async () => {
        await finalizeSession.mutateAsync(sessionId);
        router.push(`/classes/${classData.id}/records`);
    }, [sessionId, classData.id, finalizeSession, router]);

    const statusCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        counts[sessionId] = 0; // Trigger refresh
        Object.values(recordMap).forEach((r) => {
            counts[r.statusId] = (counts[r.statusId] ?? 0) + 1;
        });
        return counts;
    }, [recordMap, sessionId]);

    const marked = Object.keys(recordMap).length;
    const isFinalized = session?.isFinalized ?? false;

    if (sessionLoading) {
        return (
            <div className="space-y-6">
                {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-24 w-full rounded-2xl" />
                ))}
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8">
            {isFinalized && (
                <div className="border-stone-gray/20 bg-ivory animate-fade-in flex items-center gap-3 rounded-xl border px-6 py-4">
                    <Lock className="text-stone-gray h-5 w-5 shrink-0" />
                    <Text size="2" color="olive" weight="medium">
                        This session has been finalized and is read-only.
                    </Text>
                </div>
            )}

            {session && (
                <div className="border-border/40 bg-background/50 flex flex-wrap items-end gap-10 rounded-2xl border p-8">
                    <div className="grid max-w-sm grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <Label className="text-stone-gray ml-1 text-[11px] font-bold tracking-widest uppercase">
                                Start Time
                            </Label>
                            <Input
                                type="time"
                                defaultValue={session.startAt ? formatTime(session.startAt) : ""}
                                onBlur={async (e) => {
                                    const val = e.target.value;
                                    if (!val) return;
                                    try {
                                        await updateSession.mutateAsync({
                                            id: sessionId,
                                            data: { startTime: val },
                                        });
                                        toast.success("Start time updated.");
                                    } catch {
                                        toast.error("Failed to update start time.");
                                    }
                                }}
                                disabled={isFinalized || updateSession.isPending}
                                className="bg-background border-border/40 focus:border-terracotta h-12"
                            />
                        </div>
                        <div className="space-y-3">
                            <Label className="text-stone-gray ml-1 text-[11px] font-bold tracking-widest uppercase">
                                End Time
                            </Label>
                            <Input
                                type="time"
                                defaultValue={session.endAt ? formatTime(session.endAt) : ""}
                                onBlur={async (e) => {
                                    const val = e.target.value;
                                    if (!val) return;
                                    try {
                                        await updateSession.mutateAsync({
                                            id: sessionId,
                                            data: { endTime: val },
                                        });
                                        toast.success("End time updated.");
                                    } catch {
                                        toast.error("Failed to update end time.");
                                    }
                                }}
                                disabled={isFinalized || updateSession.isPending}
                                className="bg-background border-border/40 focus:border-terracotta h-12"
                            />
                        </div>
                    </div>
                    <div className="flex-1 pb-1.5">
                        <Text
                            size="1"
                            weight="bold"
                            color="stone"
                            className="tracking-widest uppercase"
                        >
                            Session Schedule
                        </Text>
                        <Text size="2" color="olive" className="mt-1 block">
                            Times are used for self-check-in rules and student records.
                        </Text>
                    </div>
                </div>
            )}

            {!enrollmentsLoading && (
                <StatsBar
                    total={enrollments.length}
                    marked={marked}
                    statuses={statuses}
                    statusCounts={statusCounts}
                />
            )}

            {!isFinalized && (
                <div className="flex flex-wrap items-center justify-between gap-6">
                    <Button
                        variant="secondary"
                        onClick={handleMarkAll}
                        disabled={isMarkingAll || enrollmentsLoading}
                        className="bg-background border-border/60 gap-2.5 rounded-xl border px-8 font-semibold"
                    >
                        <CheckCheck className="h-4.5 w-4.5" />
                        {isMarkingAll
                            ? "Marking all…"
                            : `Mark All ${defaultStatus?.label ?? "Present"}`}
                    </Button>

                    <AlertDialog>
                        <AlertDialogTrigger
                            render={
                                <Button
                                    className="whisper-shadow gap-2.5 rounded-xl px-8 font-semibold"
                                    disabled={finalizeSession.isPending}
                                >
                                    <Lock className="h-4.5 w-4.5" />
                                    Finalize Session
                                </Button>
                            }
                        />
                        <AlertDialogContent className="border-border/60 bg-ivory whisper-shadow max-w-md rounded-3xl">
                            <AlertDialogHeader>
                                <AlertDialogTitle className="font-serif">
                                    Finalize session?
                                </AlertDialogTitle>
                                <AlertDialogDescription className="leading-relaxed">
                                    Attendance records will be locked. This action ensures the
                                    scoring engine can process the final results for this class.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="pt-6">
                                <AlertDialogCancel className="border-border/60 rounded-xl">
                                    Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={handleFinalize}
                                    className="bg-near-black text-ivory hover:bg-near-black/90 rounded-xl px-8"
                                >
                                    Yes, Finalize
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            )}

            {enrollmentsLoading ? (
                <div className="space-y-6">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} className="h-24 w-full rounded-2xl" />
                    ))}
                </div>
            ) : enrollments.length === 0 ? (
                <div className="border-border/60 bg-ivory flex h-64 flex-col items-center justify-center rounded-3xl border border-dashed p-12 text-center">
                    <Text size="4" color="olive" weight="medium">
                        Waiting for students to join…
                    </Text>
                    <div className="bg-background border-border/40 mt-4 rounded-lg border px-6 py-2">
                        <Text size="9" weight="bold" className="font-mono tracking-widest">
                            {classData.code}
                        </Text>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col gap-6">
                    {enrollments.map((enrollment) => (
                        <StudentRow
                            key={enrollment.studentId}
                            studentId={enrollment.studentId}
                            studentName={enrollment.studentName}
                            currentStatusId={recordMap[enrollment.studentId]?.statusId ?? null}
                            statuses={statuses}
                            onMark={(statusId) =>
                                handleMark(enrollment.studentId, enrollment.studentName, statusId)
                            }
                            isDisabled={isFinalized || markAttendance.isPending}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
