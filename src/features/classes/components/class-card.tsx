"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import {
    Archive,
    ArchiveRestore,
    Calendar,
    MoreVertical,
    Settings,
    Trash2,
    Users,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Heading, Text } from "@/components/ui/typography";
import { hasPermission } from "@/features/classes/config/permissions.config";
import {
    useArchiveClass,
    useDeleteClass,
    useUnarchiveClass,
} from "@/features/classes/hooks/useClasses";
import { useClassRole } from "@/features/classes/hooks/useMembers";
import { Link } from "@/i18n/routing";

import type { Class } from "@/types";

interface ClassCardProps {
    classItem: Class;
    isArchived?: boolean;
}

export function ClassCard({ classItem, isArchived = false }: ClassCardProps) {
    const t = useTranslations("classes");
    const role = useClassRole(classItem.id);
    const deleteClass = useDeleteClass();
    const archiveClass = useArchiveClass();
    const unarchiveClass = useUnarchiveClass();

    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showArchiveDialog, setShowArchiveDialog] = useState(false);
    const [showUnarchiveDialog, setShowUnarchiveDialog] = useState(false);

    // Permission checks
    const canDelete = hasPermission(role, "class", "delete");
    const canArchive = hasPermission(role, "class", "archive");
    const canAccessSettings = hasPermission(role, "class", "viewSettings");

    // Show menu if user has any permissions
    const showMenu = canAccessSettings || canArchive || canDelete;

    const handleDelete = async () => {
        try {
            await deleteClass.mutateAsync(classItem.id);
            toast.success(t("deleteSuccess", { name: classItem.name }));
        } catch (error) {
            console.error("Failed to delete class:", error);
            toast.error(t("deleteError"));
        }
    };

    const handleArchive = async () => {
        try {
            await archiveClass.mutateAsync(classItem.id);
            toast.success(t("archiveSuccess", { name: classItem.name }));
        } catch (error) {
            console.error("Failed to archive class:", error);
            toast.error(t("archiveError"));
        }
    };

    const handleUnarchive = async () => {
        try {
            await unarchiveClass.mutateAsync(classItem.id);
            toast.success(t("unarchiveSuccess", { name: classItem.name }));
        } catch (error) {
            console.error("Failed to unarchive class:", error);
            toast.error(t("unarchiveError"));
        }
    };

    const menuItems = [
        canAccessSettings &&
            !isArchived && {
                id: "settings",
                label: t("settings"),
                icon: <Settings className="mr-2 h-4 w-4" />,
                href: `/classes/${classItem.id}/settings`,
            },
        canArchive &&
            !isArchived && {
                id: "archive",
                label: t("archive"),
                icon: <Archive className="mr-2 h-4 w-4" />,
                onClick: () => setShowArchiveDialog(true),
            },
        canArchive &&
            isArchived && {
                id: "unarchive",
                label: t("unarchive"),
                icon: <ArchiveRestore className="mr-2 h-4 w-4" />,
                onClick: () => setShowUnarchiveDialog(true),
            },
    ].filter(Boolean) as Array<{
        id: string;
        label: string;
        icon: React.ReactNode;
        href?: string;
        onClick?: () => void;
    }>;

    return (
        <>
            <Card className="hover:ring-terracotta/20 bg-ivory border-border/30 whisper-shadow group relative flex flex-col overflow-hidden rounded-[32px] transition-all duration-300 hover:ring-2">
                <CardHeader className="p-8 pb-2">
                    <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1 space-y-2">
                            <Heading size="5" asChild>
                                <Link
                                    href={`/classes/${classItem.id}`}
                                    className="text-near-black hover:text-terracotta block truncate transition-colors"
                                >
                                    {classItem.name}
                                </Link>
                            </Heading>
                            {classItem.description && (
                                <Text
                                    size="3"
                                    color="olive"
                                    className="line-clamp-2 h-10 leading-relaxed"
                                    as="p"
                                >
                                    {classItem.description}
                                </Text>
                            )}
                        </div>
                        {/* Show menu if user has any permissions */}
                        {showMenu && (
                            <DropdownMenu>
                                <DropdownMenuTrigger
                                    render={
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={(e) => e.stopPropagation()}
                                            className="-mr-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                                        >
                                            <MoreVertical className="text-stone-gray h-4.5 w-4.5" />
                                            <span className="sr-only">{t("menu")}</span>
                                        </Button>
                                    }
                                />
                                <DropdownMenuContent
                                    align="end"
                                    className="animate-scale-in whisper-shadow border-border/40 w-44 rounded-xl p-1"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {menuItems.map((item) => (
                                        <DropdownMenuItem
                                            key={item.id}
                                            {...(item.href
                                                ? {
                                                      render: (
                                                          <Link
                                                              href={item.href}
                                                              className="flex w-full items-center"
                                                          />
                                                      ),
                                                  }
                                                : {})}
                                            {...(item.onClick
                                                ? {
                                                      onClick: (e) => {
                                                          e.preventDefault();
                                                          item.onClick?.();
                                                      },
                                                  }
                                                : {})}
                                        >
                                            {item.icon}
                                            {item.label}
                                        </DropdownMenuItem>
                                    ))}

                                    {canDelete && (
                                        <>
                                            {menuItems.length > 0 && <DropdownMenuSeparator />}
                                            <DropdownMenuItem
                                                variant="destructive"
                                                className="flex w-full items-center"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    setShowDeleteDialog(true);
                                                }}
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                {t("delete")}
                                            </DropdownMenuItem>
                                        </>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="flex-1 px-8 py-6">
                    <div className="flex gap-8">
                        <div
                            className="flex items-center gap-2"
                            title={t("members", { count: classItem.memberCount })}
                        >
                            <Users className="text-stone-gray h-4 w-4" />
                            <Text
                                size="1"
                                weight="bold"
                                color="olive"
                                className="tracking-widest uppercase"
                            >
                                {t("members", { count: classItem.memberCount })}
                            </Text>
                        </div>
                        <div
                            className="flex items-center gap-2"
                            title={t("sessions", { count: classItem.sessionCount })}
                        >
                            <Calendar className="text-stone-gray h-4 w-4" />
                            <Text
                                size="1"
                                weight="bold"
                                color="olive"
                                className="tracking-widest uppercase"
                            >
                                {t("sessions", { count: classItem.sessionCount })}
                            </Text>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="mt-auto p-8 pt-0">
                    <Button
                        asChild
                        variant="secondary"
                        className="border-border/60 h-11 w-full rounded-2xl border font-serif text-sm font-medium"
                    >
                        <Link href={`/classes/${classItem.id}`}>{t("viewClass")}</Link>
                    </Button>
                </CardFooter>
            </Card>

            {/* Archive Dialog - Available to all roles */}
            {canArchive && (
                <ConfirmDialog
                    open={showArchiveDialog}
                    onOpenChange={setShowArchiveDialog}
                    title={t("archiveDialogTitle")}
                    description={t("archiveDialogDescription", { name: classItem.name })}
                    confirmText={t("archiveConfirm")}
                    cancelText={t("cancel")}
                    onConfirm={handleArchive}
                    variant="default"
                    isLoading={archiveClass.isPending}
                />
            )}

            {/* Unarchive Dialog - Available to all roles */}
            {canArchive && (
                <ConfirmDialog
                    open={showUnarchiveDialog}
                    onOpenChange={setShowUnarchiveDialog}
                    title={t("unarchiveDialogTitle")}
                    description={t("unarchiveDialogDescription", { name: classItem.name })}
                    confirmText={t("unarchiveConfirm")}
                    cancelText={t("cancel")}
                    onConfirm={handleUnarchive}
                    variant="default"
                    isLoading={unarchiveClass.isPending}
                />
            )}

            {/* Delete Dialog - Only for teachers */}
            {canDelete && (
                <ConfirmDialog
                    open={showDeleteDialog}
                    onOpenChange={setShowDeleteDialog}
                    title={t("deleteDialogTitle")}
                    description={t("deleteDialogDescription", { name: classItem.name })}
                    confirmText={t("deleteConfirm")}
                    cancelText={t("cancel")}
                    onConfirm={handleDelete}
                    variant="destructive"
                    isLoading={deleteClass.isPending}
                />
            )}
        </>
    );
}
