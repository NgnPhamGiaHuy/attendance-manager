"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";

import { DragDropContext, Draggable, Droppable, DropResult } from "@hello-pangea/dnd";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, GripVertical, Loader2, Plus, Save } from "lucide-react";
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
import { StatusBadge } from "@/components/ui/status-chip";
import { Text } from "@/components/ui/typography";
import { useClass, useUpdateClass } from "@/features/classes/hooks/useClasses";

import type { StatusDefinition } from "@/types";

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
            toast.success("Class details updated.");
        } catch {
            toast.error("Failed to update class details.");
        }
    };

    return (
        <Card className="border-border/40 bg-ivory whisper-shadow rounded-3xl">
            <CardHeader className="px-10 pt-10 pb-2">
                <CardTitle size="6" className="font-serif">
                    Class Details
                </CardTitle>
                <CardDescription className="leading-relaxed">
                    Update the name and description of this class.
                </CardDescription>
            </CardHeader>
            <CardContent className="px-10 pt-6 pb-10">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                    <div className="space-y-3">
                        <Label
                            htmlFor="name"
                            className="text-stone-gray ml-1 text-[11px] font-bold tracking-widest uppercase"
                        >
                            Class Name
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
                            Description
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
                            Session Timing
                        </Text>
                        <div className="grid max-w-md grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <Label
                                    htmlFor="defaultStartTime"
                                    className="text-stone-gray ml-1 text-[11px] font-bold tracking-widest uppercase"
                                >
                                    Default Start
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
                                    Default End
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
                        Save Changes
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}

// ─── Status Definitions ───────────────────────────────────────────────────────

function StatusSettings({
    classId,
    statusMap,
}: {
    classId: string;
    statusMap: Record<string, StatusDefinition>;
}) {
    const updateClass = useUpdateClass();
    const [statuses, setStatuses] = useState<StatusDefinition[]>(() =>
        Object.values(statusMap).sort((a, b) => a.order - b.order),
    );

    const onDragEnd = async (result: DropResult) => {
        if (!result.destination) return;

        const items = Array.from(statuses);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        // Update local order
        const reordered = items.map((item, index) => ({ ...item, order: index }));
        setStatuses(reordered);

        // Save to Firestore
        const newMap = reordered.reduce(
            (acc, curr) => {
                acc[curr.id] = curr;
                return acc;
            },
            {} as Record<string, StatusDefinition>,
        );

        try {
            await updateClass.mutateAsync({ id: classId, data: { statusDefinitions: newMap } });
            toast.success("Status order saved.");
        } catch {
            toast.error("Failed to save status order.");
            setStatuses(Object.values(statusMap).sort((a, b) => a.order - b.order));
        }
    };

    return (
        <Card className="border-border/40 bg-ivory whisper-shadow rounded-3xl">
            <CardHeader className="px-10 pt-10 pb-2">
                <CardTitle size="6" className="font-serif">
                    Attendance Statuses
                </CardTitle>
                <CardDescription className="leading-relaxed">
                    Drag to reorder how statuses appear during attendance taking. The first item is
                    usually your default status (e.g. Present).
                </CardDescription>
            </CardHeader>
            <CardContent className="px-10 pt-6 pb-10">
                <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="statuses">
                        {(provided) => (
                            <div
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                                className="space-y-3"
                            >
                                {statuses.map((status, index) => (
                                    <Draggable
                                        key={status.id}
                                        draggableId={status.id}
                                        index={index}
                                    >
                                        {(provided, snapshot) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                className={`bg-background flex items-center gap-4 rounded-2xl border p-4 transition-all duration-200 ${
                                                    snapshot.isDragging
                                                        ? "border-terracotta/30 ring-terracotta/5 z-50 scale-[1.02] shadow-xl ring-4"
                                                        : "border-border/30 hover:border-border/60 hover:shadow-sm"
                                                }`}
                                            >
                                                <div
                                                    {...provided.dragHandleProps}
                                                    className="text-stone-gray/40 hover:text-stone-gray cursor-grab p-1 transition-colors active:cursor-grabbing"
                                                >
                                                    <GripVertical className="h-5 w-5" />
                                                </div>
                                                <div className="flex flex-1 items-center gap-8">
                                                    <div className="flex min-w-[140px] items-center gap-3.5">
                                                        <StatusBadge
                                                            label={status.label}
                                                            acronym={status.acronym}
                                                            color={status.color}
                                                        />
                                                        <Text size="4" weight="semibold">
                                                            {status.label}
                                                        </Text>
                                                    </div>
                                                    <div className="flex items-center gap-8">
                                                        <div className="flex items-center gap-2">
                                                            <Text
                                                                size="1"
                                                                weight="bold"
                                                                color="stone"
                                                                className="tracking-widest uppercase opacity-60"
                                                            >
                                                                Multiplier
                                                            </Text>
                                                            <Text
                                                                size="2"
                                                                weight="bold"
                                                                className="font-mono"
                                                            >
                                                                {status.multiplier}x
                                                            </Text>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Text
                                                                size="1"
                                                                weight="bold"
                                                                color="stone"
                                                                className="tracking-widest uppercase opacity-60"
                                                            >
                                                                Absence Weight
                                                            </Text>
                                                            <Text
                                                                size="2"
                                                                weight="bold"
                                                                className="font-mono"
                                                            >
                                                                {status.absenceWeight}
                                                            </Text>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>
                <div className="mt-10 flex">
                    <Button
                        variant="outline"
                        disabled
                        className="border-border/60 text-stone-gray h-12 w-full rounded-2xl border-dashed bg-transparent px-8 sm:w-auto"
                    >
                        <Plus className="mr-2.5 h-4 w-4" /> Add Custom Status (Coming Soon)
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

// ─── Danger Zone ──────────────────────────────────────────────────────────────

function DangerZone({ classId }: { classId: string }) {
    const updateClass = useUpdateClass();

    const handleArchive = async () => {
        try {
            await updateClass.mutateAsync({ id: classId, data: { isArchived: true } });
            toast.success("Class archived.");
            window.location.href = "/dashboard";
        } catch {
            toast.error("Failed to archive class.");
        }
    };

    return (
        <Card className="border-terracotta/20 bg-terracotta/[0.03] rounded-3xl">
            <CardHeader className="px-10 pt-10 pb-4">
                <CardTitle size="6" className="text-terracotta flex items-center gap-3 font-serif">
                    <AlertTriangle className="h-6 w-6" />
                    Danger Zone
                </CardTitle>
                <CardDescription className="text-terracotta/70 leading-relaxed">
                    Archiving a class will hide it from your dashboard but preserve all historical
                    records and attendance data.
                </CardDescription>
            </CardHeader>
            <CardContent className="px-10 pt-2 pb-10">
                <AlertDialog>
                    <AlertDialogTrigger
                        render={
                            <Button
                                variant="destructive"
                                className="bg-terracotta hover:bg-terracotta/90 h-11 rounded-xl px-8 font-serif text-base shadow-sm"
                            >
                                Archive Class
                            </Button>
                        }
                    />
                    <AlertDialogContent className="border-border/40 bg-ivory whisper-shadow rounded-3xl p-8">
                        <AlertDialogHeader className="gap-2">
                            <AlertDialogTitle className="font-serif">
                                Are you absolutely sure?
                            </AlertDialogTitle>
                            <AlertDialogDescription className="leading-relaxed">
                                This will archive the class. You can restore it later if needed, but
                                it will be hidden from your active dashboard.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="mt-8 gap-3">
                            <AlertDialogCancel className="border-border/40 hover:bg-background/80 h-11 rounded-xl px-6 font-serif">
                                Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleArchive}
                                className="bg-terracotta hover:bg-terracotta/90 h-11 rounded-xl px-8 font-serif text-base text-white shadow-sm"
                            >
                                Archive
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
    const { data: classData } = useClass(classId);

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
            <StatusSettings classId={classId} statusMap={classData.statusDefinitions} />
            <DangerZone classId={classId} />
        </div>
    );
}
