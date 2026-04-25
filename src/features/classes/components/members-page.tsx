"use client";

import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";

import { UserX } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Heading, Text } from "@/components/ui/typography";
import { enrollmentApi } from "@/features/classes/api/enrollmentApi";
import { memberApi } from "@/features/classes/api/memberApi";
import { useEnrollments } from "@/features/classes/hooks/useEnrollments";
import { useClassRole, useMembers } from "@/features/classes/hooks/useMembers";
import { getInitials } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";

import type { ClassMember, ClassRole, Enrollment } from "@/types";

// Update RoleBadge
function RoleBadge({ role }: { role: ClassRole }) {
    const t = useTranslations("members");
    const roleConfig = {
        teacher: { label: t("teacher"), variant: "default" as const },
        ta: { label: t("ta"), variant: "secondary" as const },
        student: { label: t("student"), variant: "outline" as const },
    };

    const config = roleConfig[role];

    return (
        <Badge variant={config.variant} className="rounded-lg font-serif text-xs">
            {config.label}
        </Badge>
    );
}

// Update RoleSelector
function RoleSelector({
    currentRole,
    userId,
    classId,
    currentUserId,
    onRoleChange,
}: {
    currentRole: ClassRole;
    userId: string;
    classId: string;
    currentUserId: string | null;
    onRoleChange: () => void;
}) {
    const t = useTranslations("members");
    const [isChanging, setIsChanging] = useState(false);

    const isSelf = userId === currentUserId;

    const handleRoleChange = useCallback(
        async (newRole: ClassRole) => {
            if (newRole === currentRole) return;

            setIsChanging(true);
            try {
                await memberApi.setRole(classId, userId, newRole);
                toast.success(t("roleUpdated", { role: newRole }));
                onRoleChange();
            } catch (error) {
                toast.error("Failed to update role");
                console.error("Role update error:", error);
            } finally {
                setIsChanging(false);
            }
        },
        [classId, userId, currentRole, onRoleChange, t],
    );

    return (
        <Select
            value={currentRole}
            onValueChange={(value) => handleRoleChange(value as ClassRole)}
            disabled={isChanging || isSelf}
        >
            <SelectTrigger
                size="sm"
                className="w-28"
                title={isSelf ? t("cannotChangeOwnRole") : undefined}
            >
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="teacher">{t("teacher")}</SelectItem>
                <SelectItem value="ta">{t("ta")}</SelectItem>
                <SelectItem value="student">{t("student")}</SelectItem>
            </SelectContent>
        </Select>
    );
}

// Update MemberRow - now accepts member + optional enrollment
function MemberRow({
    member,
    enrollment,
    currentUserRole,
    currentUserId,
    classId,
    onRoleChange,
    isLastTeacher,
}: {
    member: ClassMember;
    enrollment: Enrollment | null;
    currentUserRole: ClassRole | null;
    currentUserId: string | null;
    classId: string;
    onRoleChange: () => void;
    isLastTeacher: boolean;
}) {
    const t = useTranslations("members");
    const tCommon = useTranslations("common");

    const attendanceRate =
        enrollment && enrollment.sessionsEligible > 0
            ? Math.round((enrollment.sessionsAttended / enrollment.sessionsEligible) * 100)
            : null;

    const canManageRoles = currentUserRole === "teacher";

    // Use member profile data first, fallback to enrollment data
    const displayName = member.displayName || enrollment?.studentName || "Unknown Member";
    const displayEmail = member.email || enrollment?.studentEmail || "";

    // Prevent removing self if last teacher
    const isSelf = member.userId === currentUserId;
    const canRemove = canManageRoles && !(isSelf && isLastTeacher);

    const handleRemove = useCallback(async () => {
        try {
            // Remove from members subcollection (works for all roles)
            await memberApi.removeMember(classId, member.userId);

            // Also deactivate enrollment if exists (for students)
            if (enrollment) {
                await enrollmentApi.deactivate(enrollment.id);
            }

            toast.success(`${displayName} removed.`);
        } catch (error) {
            toast.error("Failed to remove member.");
            console.error("Remove member error:", error);
        }
    }, [classId, member.userId, enrollment, displayName]);

    return (
        <div className="group border-border/30 bg-card hover:ring-border/60 whisper-shadow animate-fade-in flex items-center justify-between gap-4 rounded-2xl border px-6 py-5 transition-all hover:ring-1">
            <div className="flex min-w-0 items-center gap-4">
                <Avatar className="ring-border/40 h-12 w-12 shrink-0 rounded-2xl ring-1">
                    <AvatarFallback className="bg-background text-foreground font-serif text-sm font-semibold">
                        {getInitials(displayName)}
                    </AvatarFallback>
                </Avatar>
                <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                        <Text size="4" weight="semibold" className="block truncate">
                            {displayName}
                            {isSelf && (
                                <Text as="span" size="3" color="olive" className="ml-2">
                                    ({t("you")})
                                </Text>
                            )}
                        </Text>
                        {canManageRoles ? (
                            <RoleSelector
                                currentRole={member.role}
                                userId={member.userId}
                                classId={classId}
                                currentUserId={currentUserId}
                                onRoleChange={onRoleChange}
                            />
                        ) : (
                            <RoleBadge role={member.role} />
                        )}
                    </div>
                    {displayEmail && (
                        <Text size="2" color="olive" className="block truncate">
                            {displayEmail}
                        </Text>
                    )}
                </div>
            </div>

            <div className="flex shrink-0 items-center gap-6">
                {/* Aggregated Score - only for students with enrollment */}
                {enrollment && (
                    <div className="hidden text-right sm:block">
                        <Text
                            size="1"
                            weight="bold"
                            color="stone"
                            className="mb-1 block tracking-widest uppercase"
                        >
                            {t("score")}
                        </Text>
                        <Heading size="4" className="text-foreground">
                            {enrollment.aggregatedScore ?? 0}
                        </Heading>
                    </div>
                )}

                {/* Attendance Rate - only for students with enrollment */}
                {attendanceRate !== null && (
                    <div className="hidden text-right sm:block">
                        <Text
                            size="1"
                            weight="bold"
                            color="stone"
                            className="mb-1 block tracking-widest uppercase"
                        >
                            {t("rate")}
                        </Text>
                        <Heading
                            size="4"
                            className={
                                attendanceRate >= 80
                                    ? "text-foreground"
                                    : attendanceRate >= 60
                                      ? "text-primary"
                                      : "text-destructive"
                            }
                        >
                            {attendanceRate}%
                        </Heading>
                    </div>
                )}

                {/* Remove Button - only for teachers, disabled if last teacher removing self */}
                {canManageRoles && (
                    <AlertDialog>
                        <AlertDialogTrigger
                            render={
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    disabled={!canRemove}
                                    title={
                                        !canRemove && isSelf && isLastTeacher
                                            ? t("cannotRemoveLastTeacher")
                                            : t("remove")
                                    }
                                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/5 h-10 w-10 rounded-xl opacity-0 transition-all group-hover:opacity-100 disabled:opacity-30"
                                >
                                    <UserX className="h-5 w-5" />
                                    <span className="sr-only">{t("remove")}</span>
                                </Button>
                            }
                        />
                        <AlertDialogContent className="border-border/40 bg-card whisper-shadow rounded-[32px] p-8">
                            <AlertDialogHeader>
                                <AlertDialogTitle>
                                    {t("removeConfirmTitle", { name: displayName })}
                                </AlertDialogTitle>
                                <AlertDialogDescription className="pt-2 leading-relaxed">
                                    {t("removeConfirmDesc")}
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="pt-6">
                                <AlertDialogCancel className="border-border/60 rounded-xl px-6 font-serif">
                                    {tCommon("cancel")}
                                </AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={handleRemove}
                                    variant="destructive"
                                    className="rounded-xl px-6 font-serif"
                                >
                                    {t("remove")}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
            </div>
        </div>
    );
}

// Update MembersPage
export function MembersPage({ classId }: { classId: string }) {
    const t = useTranslations("members");
    const { enrollments, isLoading: enrollmentsLoading } = useEnrollments(classId);
    const { members, isLoading: membersLoading } = useMembers(classId);
    const currentUserRole = useClassRole(classId);
    const { user } = useAuth();

    const isLoading = enrollmentsLoading || membersLoading;

    // Build a map of userId -> enrollment for quick lookup
    const enrollmentMap = new Map<string, Enrollment>();
    enrollments.forEach((enrollment) => {
        enrollmentMap.set(enrollment.studentId, enrollment);
    });

    // FIXED: Iterate over MEMBERS (not enrollments) to show ALL roles
    // Left join with enrollments for analytics data (students only)
    const membersWithData = members.map((member) => ({
        member,
        enrollment: enrollmentMap.get(member.userId) ?? null,
    }));

    // Sort by role priority: teacher > ta > student, then alphabetically
    const sortedMembers = membersWithData.sort((a, b) => {
        const rolePriority = { teacher: 0, ta: 1, student: 2 };
        const priorityDiff = rolePriority[a.member.role] - rolePriority[b.member.role];
        if (priorityDiff !== 0) return priorityDiff;

        // Same role - sort alphabetically by display name
        const nameA = a.member.displayName || a.enrollment?.studentName || "Unknown";
        const nameB = b.member.displayName || b.enrollment?.studentName || "Unknown";
        return nameA.localeCompare(nameB);
    });

    // Count teachers to prevent removing last one
    const teacherCount = members.filter((m) => m.role === "teacher").length;
    const isLastTeacher = teacherCount === 1;

    if (isLoading) {
        return (
            <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-20 w-full rounded-2xl" />
                ))}
            </div>
        );
    }

    if (members.length === 0) {
        return (
            <div className="bg-card/50 border-border/40 flex h-64 flex-col items-center justify-center rounded-[32px] border border-dashed p-8 text-center">
                <Text size="4" color="stone" className="max-w-xs">
                    {t("noMembers")}
                </Text>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <Heading size="2" color="stone" className="uppercase">
                    {t("enrolledCount", { count: members.length })}
                </Heading>
            </div>
            <div className="flex flex-col gap-3">
                {sortedMembers.map(({ member, enrollment }) => (
                    <MemberRow
                        key={member.userId}
                        member={member}
                        enrollment={enrollment}
                        currentUserRole={currentUserRole}
                        currentUserId={user?.uid ?? null}
                        classId={classId}
                        isLastTeacher={isLastTeacher}
                        onRoleChange={() => {
                            // Trigger re-fetch by React Query
                        }}
                    />
                ))}
            </div>
        </div>
    );
}
