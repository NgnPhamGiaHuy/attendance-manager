"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

import { Calendar, CheckCircle2, Clock, Lock, Plus, Trash2, Users } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Heading, Text } from "@/components/ui/typography";
import { useClass } from "@/features/classes/hooks/useClasses";
import {
    useClassSessions,
    useCreateSession,
    useDeleteSession,
} from "@/features/sessions/hooks/useSessions";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";

import type { Session } from "@/types";

// ─── Single Session Row ───────────────────────────────────────────────────────

function SessionRow({
    session,
    classId,
    ownerId,
}: {
    session: Session;
    classId: string;
    ownerId: string;
}) {
    const router = useRouter();
    const { user } = useAuth();
    const deleteSession = useDeleteSession();
    const totalMarked = Object.values(session.attendanceSummary ?? {}).reduce((a, b) => a + b, 0);

    const isOwner = user?.uid === ownerId;

    return (
        <div className="group border-border/30 bg-ivory hover:ring-border/60 whisper-shadow animate-fade-in flex w-full items-center justify-between gap-4 rounded-2xl border px-6 py-5 transition-all hover:ring-1">
            <button
                onClick={() => router.push(`/classes/${classId}/sessions/${session.id}`)}
                className="flex min-w-0 flex-1 items-center gap-4 text-left outline-none"
            >
                <div className="bg-background ring-border/20 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1">
                    {session.isFinalized ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : session.isActive ? (
                        <Clock className="animate-pulse-soft text-terracotta h-5 w-5" />
                    ) : (
                        <Lock className="text-stone-gray h-5 w-5" />
                    )}
                </div>
                <div className="min-w-0">
                    <Text size="4" weight="semibold" className="block truncate">
                        {session.title}
                    </Text>
                    <Text
                        size="2"
                        color="stone"
                        weight="medium"
                        className="tracking-wide uppercase"
                    >
                        {formatDate(session.date)} · {totalMarked} marked
                    </Text>
                </div>
            </button>
            <div className="flex shrink-0 items-center gap-4">
                {session.isActive && !session.isFinalized && (
                    <Badge className="bg-terracotta/10 text-terracotta border-terracotta/20 rounded-lg px-2.5 py-0.5 font-serif text-[11px] font-bold tracking-widest uppercase">
                        Live
                    </Badge>
                )}
                {session.isFinalized && (
                    <Badge
                        variant="secondary"
                        className="rounded-lg px-2.5 py-0.5 font-serif text-[11px] font-bold tracking-widest uppercase"
                    >
                        Finalized
                    </Badge>
                )}

                {isOwner && (
                    <AlertDialog>
                        <AlertDialogTrigger
                            render={
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 rounded-xl opacity-0 transition-all group-hover:opacity-100 hover:bg-red-50 hover:text-red-600"
                                    aria-label="Delete session"
                                />
                            }
                        >
                            <Trash2 className="h-4 w-4" />
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Delete Session?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will permanently remove this session and all associated
                                    attendance records. This action cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={() => deleteSession.mutate(session.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                >
                                    {deleteSession.isPending ? "Deleting..." : "Delete Session"}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
            </div>
        </div>
    );
}

// ─── Class Overview with sessions list ───────────────────────────────────────

export function ClassOverviewPage({ classId }: { classId: string }) {
    const { data: classData } = useClass(classId);
    const { sessions, isLoading: sessionsLoading } = useClassSessions(classId);
    const router = useRouter();
    const createSession = useCreateSession(classId, classData.name);

    const handleStartSession = useCallback(async () => {
        try {
            const sessionId = await createSession.mutateAsync({
                startTime: classData.defaultStartTime,
                endTime: classData.defaultEndTime,
            });
            router.push(`/classes/${classId}/sessions/${sessionId}`);
        } catch {
            toast.error("Failed to start session.");
        }
    }, [createSession, classId, router, classData.defaultStartTime, classData.defaultEndTime]);

    const activeSession = sessions.find((s) => s.isActive && !s.isFinalized);

    return (
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
            {/* Main: session list */}
            <div className="space-y-8 lg:col-span-2">
                {/* Active session banner */}
                {activeSession && (
                    <div
                        onClick={() =>
                            router.push(`/classes/${classId}/sessions/${activeSession.id}`)
                        }
                        className="bg-terracotta/[0.03] border-terracotta/20 whisper-shadow animate-fade-in hover:ring-terracotta/40 flex cursor-pointer items-center justify-between gap-4 rounded-2xl border px-6 py-5 transition-all hover:ring-1"
                    >
                        <div className="flex items-center gap-4">
                            <span className="relative flex h-3 w-3">
                                <span className="bg-terracotta absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" />
                                <span className="bg-terracotta relative inline-flex h-3 w-3 rounded-full" />
                            </span>
                            <div>
                                <Heading size="3" className="text-terracotta">
                                    Active Session: {activeSession.title}
                                </Heading>
                                <Text
                                    size="2"
                                    color="stone"
                                    className="font-bold tracking-widest uppercase"
                                >
                                    Attendance is currently open
                                </Text>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="border-terracotta/20 text-terracotta hover:bg-terracotta/5 rounded-xl font-serif"
                        >
                            Continue →
                        </Button>
                    </div>
                )}

                <div className="flex items-center justify-between">
                    <Heading size="4">Sessions</Heading>
                    <Button
                        size="sm"
                        onClick={handleStartSession}
                        disabled={createSession.isPending || !!activeSession}
                        className="bg-near-black rounded-xl font-serif text-sm shadow-sm"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        New Session
                    </Button>
                </div>

                {sessionsLoading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-20 w-full rounded-2xl" />
                        ))}
                    </div>
                ) : sessions.length === 0 ? (
                    <div className="bg-ivory/50 border-border/40 flex h-64 flex-col items-center justify-center rounded-[32px] border border-dashed p-8 text-center">
                        <Text size="4" color="stone" className="mb-6 max-w-xs">
                            No attendance sessions recorded yet. Start your first session to begin
                            tracking.
                        </Text>
                        <Button
                            onClick={handleStartSession}
                            disabled={createSession.isPending}
                            className="bg-terracotta whisper-shadow rounded-xl px-8 font-serif"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Start First Session
                        </Button>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {sessions.map((s) => (
                            <SessionRow
                                key={s.id}
                                session={s}
                                classId={classId}
                                ownerId={classData.ownerId}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Sidebar: class details */}
            <div className="space-y-6">
                <Card className="ring-border/40 rounded-[32px] border-none shadow-none ring-1">
                    <CardHeader className="px-8 pt-8">
                        <Text
                            size="1"
                            weight="bold"
                            color="stone"
                            className="tracking-widest uppercase"
                        >
                            Class Insights
                        </Text>
                    </CardHeader>
                    <CardContent className="space-y-6 px-8 pb-8">
                        <div>
                            <Text
                                size="2"
                                color="stone"
                                weight="bold"
                                className="mb-2 block tracking-widest uppercase"
                            >
                                Join Code
                            </Text>
                            <div className="bg-background ring-border/20 flex h-16 items-center justify-center rounded-2xl ring-1">
                                <span className="text-near-black font-mono text-3xl font-bold tracking-[0.2em]">
                                    {classData.code}
                                </span>
                            </div>
                        </div>

                        <div className="bg-border/20 h-px" />

                        <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-1">
                                <div className="text-stone-gray flex items-center gap-2">
                                    <Users className="h-4 w-4" />
                                    <Text
                                        size="1"
                                        weight="bold"
                                        className="tracking-widest uppercase"
                                    >
                                        Members
                                    </Text>
                                </div>
                                <Heading size="6">{classData.memberCount}</Heading>
                            </div>
                            <div className="space-y-1">
                                <div className="text-stone-gray flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    <Text
                                        size="1"
                                        weight="bold"
                                        className="tracking-widest uppercase"
                                    >
                                        Sessions
                                    </Text>
                                </div>
                                <Heading size="6">{sessions.length}</Heading>
                            </div>
                        </div>

                        <Button
                            variant="secondary"
                            className="border-border/60 w-full rounded-xl font-serif"
                            asChild
                        >
                            <Link href={`/classes/${classId}/members`}>View All Members</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
