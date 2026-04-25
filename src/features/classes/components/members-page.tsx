"use client";

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

import type { ClassRole, Enrollment } from "@/types";

// ─── Role Badge ───────────────────────────────────────────────────────────────

/**
 * Displays a role badge with appropriate styling for teacher, TA, or student roles.
 */
function RoleBadge({ role }: { role: ClassRole }) {
    const roleConfig = {
        teacher: { label: "Teacher", variant: "default" as const },
        ta: { label: "TA", variant: "secondary" as const },
        student: { label: "Student", variant: "outline" as const },
    };

    const config = roleConfig[role];

    return (
        <Badge variant={config.variant} className="rounded-lg font-serif text-xs">
            {config.label}
        </Badge>
    );
}

// ─── Role Selector ────────────────────────────────────────────────────────────

/**
 * Dropdown for promoting/demoting a member's role.
 * Only visible to teachers.
 */
function RoleSelector({
    currentRole,
    userId,
    classId,
    onRoleChange,
}: {
    currentRole: ClassRole;
    userId: string;
    classId: string;
    onRoleChange: () => void;
}) {
    const [isChanging, setIsChanging] = useState(false);

    const handleRoleChange = useCallback(
        async (newRole: ClassRole) => {
            if (newRole === currentRole) return;

            setIsChanging(true);
            try {
                await memberApi.setRole(classId, userId, newRole);
                toast.success(`Role updated to ${newRole}`);
                onRoleChange();
            } catch (error) {
                toast.error("Failed to update role");
                console.error("Role update error:", error);
            } finally {
                setIsChanging(false);
            }
        },
        [classId, userId, currentRole, onRoleChange],
    );

    return (
        <Select
            value={currentRole}
            onValueChange={(value) => handleRoleChange(value as ClassRole)}
            disabled={isChanging}
        >
            <SelectTrigger size="sm" className="w-28">
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="teacher">Teacher</SelectItem>
                <SelectItem value="ta">TA</SelectItem>
                <SelectItem value="student">Student</SelectItem>
            </SelectContent>
        </Select>
    );
}

// ─── Member Row ───────────────────────────────────────────────────────────────

function MemberRow({
    enrollment,
    role,
    currentUserRole,
    classId,
    onRoleChange,
}: {
    enrollment: Enrollment;
    role: ClassRole;
    currentUserRole: ClassRole | null;
    classId: string;
    onRoleChange: () => void;
}) {
    const handleRemove = useCallback(async () => {
        try {
            await enrollmentApi.deactivate(enrollment.id);
            toast.success(`${enrollment.studentName} removed from class.`);
        } catch {
            toast.error("Failed to remove student.");
        }
    }, [enrollment]);

    const attendanceRate =
        enrollment.sessionsEligible > 0
            ? Math.round((enrollment.sessionsAttended / enrollment.sessionsEligible) * 100)
            : null;

    const canManageRoles = currentUserRole === "teacher";

    return (
        <div className="group border-border/30 bg-ivory hover:ring-border/60 whisper-shadow animate-fade-in flex items-center justify-between gap-4 rounded-2xl border px-6 py-5 transition-all hover:ring-1">
            <div className="flex min-w-0 items-center gap-4">
                <Avatar className="ring-border/40 h-12 w-12 shrink-0 rounded-2xl ring-1">
                    <AvatarFallback className="bg-background text-near-black font-serif text-sm font-semibold">
                        {getInitials(enrollment.studentName)}
                    </AvatarFallback>
                </Avatar>
                <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                        <Text size="4" weight="semibold" className="block truncate">
                            {enrollment.studentName}
                        </Text>
                        {canManageRoles ? (
                            <RoleSelector
                                currentRole={role}
                                userId={enrollment.studentId}
                                classId={classId}
                                onRoleChange={onRoleChange}
                            />
                        ) : (
                            <RoleBadge role={role} />
                        )}
                    </div>
                    <Text size="2" color="olive" className="block truncate">
                        {enrollment.studentEmail}
                    </Text>
                </div>
            </div>

            <div className="flex shrink-0 items-center gap-6">
                {/* Aggregated Score */}
                <div className="hidden text-right sm:block">
                    <Text
                        size="1"
                        weight="bold"
                        color="stone"
                        className="mb-1 block tracking-widest uppercase"
                    >
                        Score
                    </Text>
                    <Heading size="4" className="text-near-black">
                        {enrollment.aggregatedScore ?? 0}
                    </Heading>
                </div>

                {/* Attendance Rate */}
                {attendanceRate !== null && (
                    <div className="hidden text-right sm:block">
                        <Text
                            size="1"
                            weight="bold"
                            color="stone"
                            className="mb-1 block tracking-widest uppercase"
                        >
                            Rate
                        </Text>
                        <Heading
                            size="4"
                            className={
                                attendanceRate >= 80
                                    ? "text-near-black"
                                    : attendanceRate >= 60
                                      ? "text-terracotta"
                                      : "text-red-800"
                            }
                        >
                            {attendanceRate}%
                        </Heading>
                    </div>
                )}

                {/* Remove Button */}
                <AlertDialog>
                    <AlertDialogTrigger
                        render={
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-stone-gray hover:text-terracotta hover:bg-terracotta/5 h-10 w-10 rounded-xl opacity-0 transition-all group-hover:opacity-100"
                            >
                                <UserX className="h-5 w-5" />
                                <span className="sr-only">Remove student</span>
                            </Button>
                        }
                    />
                    <AlertDialogContent className="border-border/40 bg-ivory whisper-shadow rounded-[32px] p-8">
                        <AlertDialogHeader>
                            <AlertDialogTitle>Remove {enrollment.studentName}?</AlertDialogTitle>
                            <AlertDialogDescription className="pt-2 leading-relaxed">
                                This will remove them from the active class roster. Their historical
                                attendance records will be preserved for archival purposes.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="pt-6">
                            <AlertDialogCancel className="border-border/60 rounded-xl px-6 font-serif">
                                Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleRemove}
                                className="bg-terracotta hover:bg-terracotta/90 rounded-xl px-6 font-serif"
                            >
                                Remove student
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
    );
}

// ─── Members Page ─────────────────────────────────────────────────────────────

export function MembersPage({ classId }: { classId: string }) {
    const { enrollments, isLoading: enrollmentsLoading } = useEnrollments(classId);
    const { members, isLoading: membersLoading } = useMembers(classId);
    const currentUserRole = useClassRole(classId);

    const isLoading = enrollmentsLoading || membersLoading;

    // Build a map of userId -> role for quick lookup
    const roleMap = new Map<string, ClassRole>();
    members.forEach((member) => {
        roleMap.set(member.userId, member.role);
    });

    // Merge enrollments with roles (default to "student" if not found in members)
    const membersWithRoles = enrollments.map((enrollment) => ({
        enrollment,
        role: roleMap.get(enrollment.studentId) ?? "student",
    }));

    if (isLoading) {
        return (
            <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-20 w-full rounded-2xl" />
                ))}
            </div>
        );
    }

    if (enrollments.length === 0) {
        return (
            <div className="bg-ivory/50 border-border/40 flex h-64 flex-col items-center justify-center rounded-[32px] border border-dashed p-8 text-center">
                <Text size="4" color="stone" className="max-w-xs">
                    No students enrolled yet. Share the class join code to get started.
                </Text>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <Heading size="2" color="stone" className="uppercase">
                    {enrollments.length} {enrollments.length === 1 ? "student" : "students"}{" "}
                    enrolled
                </Heading>
            </div>
            <div className="flex flex-col gap-3">
                {membersWithRoles.map(({ enrollment, role }) => (
                    <MemberRow
                        key={enrollment.id}
                        enrollment={enrollment}
                        role={role}
                        currentUserRole={currentUserRole}
                        classId={classId}
                        onRoleChange={() => {
                            // Trigger re-fetch by React Query
                        }}
                    />
                ))}
            </div>
        </div>
    );
}
