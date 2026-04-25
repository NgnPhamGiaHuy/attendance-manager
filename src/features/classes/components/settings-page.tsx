"use client";

import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import * as z from "zod";

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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Text } from "@/components/ui/typography";
import { ScoringRulesForm } from "@/features/classes/components/scoring-rules-form";
import { StatusEditor } from "@/features/classes/components/status-editor";
import { useClass, useDeleteClass, useUpdateClass } from "@/features/classes/hooks/useClasses";

// ─── Details Form ─────────────────────────────────────────────────────────────

const detailsSchema = z.object({
    name: z.string().min(2).max(50),
    description: z.string().max(100).optional(),
    defaultStartTime: z
        .string()
        .regex(/^([01]\d|2[0-3]):?([0-5]\d)$/, "Invalid time format (HH:mm)")
        .optional(),
    defaultEndTime: z
        .string()
        .regex(/^([01]\d|2[0-3]):?([0-5]\d)$/, "Invalid time format (HH:mm)")
        .optional(),
});

function ClassDetailsForm({
    classId,
    initialData,
}: {
    classId: string;
    initialData: z.infer<typeof detailsSchema>;
}) {
    const t = useTranslations("classSettings");
    const updateClass = useUpdateClass();

    const {
        register,
        handleSubmit,
        formState: { errors, isDirty },
    } = useForm({
        resolver: zodResolver(detailsSchema),
        defaultValues: {
            name: initialData.name,
            description: initialData.description || "",
            defaultStartTime: initialData.defaultStartTime || "09:00",
            defaultEndTime: initialData.defaultEndTime || "10:30",
        },
    });

    const onSubmit = async (data: z.infer<typeof detailsSchema>) => {
        try {
            await updateClass.mutateAsync({ id: classId, data });
            toast.success(t("updateSuccess"));
        } catch {
            toast.error(t("updateFailed"));
        }
    };

    return (
        <Card className="border-border/40 bg-ivory whisper-shadow rounded-3xl">
            <CardHeader className="px-10 pt-10 pb-2">
                <CardTitle size="6" className="font-serif">
                    {t("classDetails")}
                </CardTitle>
                <CardDescription className="leading-relaxed">
                    {t("classDetailsDesc")}
                </CardDescription>
            </CardHeader>
            <CardContent className="px-10 pt-6 pb-10">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                    <div className="space-y-3">
                        <Label
                            htmlFor="name"
                            className="text-stone-gray ml-1 text-[11px] font-bold tracking-widest uppercase"
                        >
                            {t("className")}
                        </Label>
                        <Input
                            id="name"
                            {...register("name")}
                            className="bg-background border-border/40 focus:border-terracotta focus:ring-terracotta/10 h-12 max-w-md"
                            disabled={updateClass.isPending}
                        />
                        {errors.name && (
                            <Text size="1" color="terracotta" className="ml-1 font-medium">
                                {errors.name.message}
                            </Text>
                        )}
                    </div>
                    <div className="space-y-3">
                        <Label
                            htmlFor="description"
                            className="text-stone-gray ml-1 text-[11px] font-bold tracking-widest uppercase"
                        >
                            {t("description")}
                        </Label>
                        <Input
                            id="description"
                            {...register("description")}
                            className="bg-background border-border/40 focus:border-terracotta focus:ring-terracotta/10 h-12 max-w-md"
                            disabled={updateClass.isPending}
                        />
                        {errors.description && (
                            <Text size="1" color="terracotta" className="ml-1 font-medium">
                                {errors.description.message}
                            </Text>
                        )}
                    </div>

                    <div className="space-y-6 pt-4">
                        <Text
                            size="1"
                            weight="bold"
                            color="stone"
                            className="tracking-widest uppercase"
                        >
                            {t("sessionTiming")}
                        </Text>
                        <div className="grid max-w-md grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <Label
                                    htmlFor="defaultStartTime"
                                    className="text-stone-gray ml-1 text-[11px] font-bold tracking-widest uppercase"
                                >
                                    {t("defaultStart")}
                                </Label>
                                <Input
                                    id="defaultStartTime"
                                    type="time"
                                    {...register("defaultStartTime")}
                                    className="bg-background border-border/40 focus:border-terracotta focus:ring-terracotta/10 h-12"
                                    disabled={updateClass.isPending}
                                />
                                {errors.defaultStartTime && (
                                    <Text size="1" color="terracotta" className="ml-1 font-medium">
                                        {errors.defaultStartTime.message}
                                    </Text>
                                )}
                            </div>
                            <div className="space-y-3">
                                <Label
                                    htmlFor="defaultEndTime"
                                    className="text-stone-gray ml-1 text-[11px] font-bold tracking-widest uppercase"
                                >
                                    {t("defaultEnd")}
                                </Label>
                                <Input
                                    id="defaultEndTime"
                                    type="time"
                                    {...register("defaultEndTime")}
                                    className="bg-background border-border/40 focus:border-terracotta focus:ring-terracotta/10 h-12"
                                    disabled={updateClass.isPending}
                                />
                                {errors.defaultEndTime && (
                                    <Text size="1" color="terracotta" className="ml-1 font-medium">
                                        {errors.defaultEndTime.message}
                                    </Text>
                                )}
                            </div>
                        </div>
                    </div>
                    <Button
                        type="submit"
                        disabled={!isDirty || updateClass.isPending}
                        className="h-11 rounded-xl px-8 font-serif text-base shadow-sm"
                    >
                        {updateClass.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="mr-2.5 h-4 w-4" />
                        )}
                        {t("saveChanges")}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}

// ─── Danger Zone ──────────────────────────────────────────────────────────────

function DangerZone({ classId }: { classId: string }) {
    const t = useTranslations("classSettings");
    const deleteClass = useDeleteClass();

    const handleDelete = async () => {
        try {
            await deleteClass.mutateAsync(classId);
            toast.success(t("deleteSuccess"));
            window.location.href = "/dashboard";
        } catch {
            toast.error(t("deleteFailed"));
        }
    };

    return (
        <Card className="border-destructive/20 bg-destructive/[0.03] rounded-3xl">
            <CardHeader className="px-10 pt-10 pb-4">
                <CardTitle size="6" className="text-destructive flex items-center gap-3 font-serif">
                    <AlertTriangle className="h-6 w-6" />
                    {t("dangerZone")}
                </CardTitle>
                <CardDescription className="text-destructive/70 leading-relaxed">
                    {t("deleteDesc")}
                </CardDescription>
            </CardHeader>
            <CardContent className="px-10 pt-2 pb-10">
                <AlertDialog>
                    <AlertDialogTrigger
                        render={
                            <Button
                                variant="destructive"
                                className="h-11 rounded-xl px-8 font-serif text-base shadow-sm"
                            >
                                {t("deleteClass")}
                            </Button>
                        }
                    />
                    <AlertDialogContent className="border-border/40 bg-ivory whisper-shadow rounded-3xl p-8">
                        <AlertDialogHeader className="gap-2">
                            <AlertDialogTitle className="font-serif">
                                {t("deleteConfirmTitle")}
                            </AlertDialogTitle>
                            <AlertDialogDescription className="leading-relaxed">
                                {t("deleteConfirmDesc")}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="mt-8 gap-3">
                            <AlertDialogCancel className="border-border/40 hover:bg-background/80 h-11 rounded-xl px-6 font-serif">
                                {t("cancel")}
                            </AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleDelete}
                                variant="destructive"
                                className="h-11 rounded-xl px-8 font-serif text-base shadow-sm"
                            >
                                {t("deleteConfirm")}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardContent>
        </Card>
    );
}

// ─── Settings Page ────────────────────────────────────────────────────────────

export function SettingsPage({ classId }: { classId: string }) {
    const { data: classData, refetch } = useClass(classId);

    return (
        <div className="animate-fade-in max-w-4xl space-y-10 pb-12">
            <ClassDetailsForm
                classId={classId}
                initialData={{
                    name: classData.name,
                    description: classData.description,
                    defaultStartTime: classData.defaultStartTime,
                    defaultEndTime: classData.defaultEndTime,
                }}
            />
            <Card className="border-border/40 bg-ivory whisper-shadow rounded-3xl">
                <CardContent className="px-10 pt-10 pb-10">
                    <StatusEditor
                        classId={classId}
                        statuses={classData.statusDefinitions}
                        onUpdate={() => refetch()}
                    />
                </CardContent>
            </Card>
            <Card className="border-border/40 bg-ivory whisper-shadow rounded-3xl">
                <CardContent className="px-10 pt-10 pb-10">
                    <ScoringRulesForm
                        classId={classId}
                        currentRules={classData.scoringRules}
                        onUpdate={() => refetch()}
                    />
                </CardContent>
            </Card>
            <DangerZone classId={classId} />
        </div>
    );
}
