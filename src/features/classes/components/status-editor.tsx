"use client";

import { useCallback, useState } from "react";

import { Pencil, Plus, Trash2 } from "lucide-react";
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
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Heading, Text } from "@/components/ui/typography";
import { classApi } from "@/features/classes/api/classApi";

import type { StatusDefinition } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StatusEditorProps {
    classId: string;
    statuses: Record<string, StatusDefinition>;
    onUpdate: () => void;
}

interface StatusFormData {
    label: string;
    acronym: string;
    color: string;
    multiplier: string;
    absenceWeight: string;
    isDefault: boolean;
}

// ─── Status Row ───────────────────────────────────────────────────────────────

function StatusRow({
    status,
    classId,
    isLastActive,
    onUpdate,
}: {
    status: StatusDefinition;
    classId: string;
    isLastActive: boolean;
    onUpdate: () => void;
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [formData, setFormData] = useState<StatusFormData>({
        label: status.label,
        acronym: status.acronym,
        color: status.color,
        multiplier: status.multiplier.toString(),
        absenceWeight: status.absenceWeight.toString(),
        isDefault: status.isDefault,
    });
    const [errors, setErrors] = useState<Partial<Record<keyof StatusFormData, string>>>({});

    const handleEdit = useCallback(() => {
        setIsEditing(true);
        setFormData({
            label: status.label,
            acronym: status.acronym,
            color: status.color,
            multiplier: status.multiplier.toString(),
            absenceWeight: status.absenceWeight.toString(),
            isDefault: status.isDefault,
        });
        setErrors({});
    }, [status]);

    const handleSave = useCallback(async () => {
        // Validate
        const newErrors: Partial<Record<keyof StatusFormData, string>> = {};

        if (formData.label.length < 1 || formData.label.length > 30) {
            newErrors.label = "Label must be 1-30 characters";
        }
        if (formData.acronym.length < 1 || formData.acronym.length > 3) {
            newErrors.acronym = "Acronym must be 1-3 characters";
        }
        if (!/^#[0-9A-Fa-f]{6}$/.test(formData.color)) {
            newErrors.color = "Must be valid hex color (#RRGGBB)";
        }

        const multiplier = parseFloat(formData.multiplier);
        if (isNaN(multiplier) || multiplier < 0 || multiplier > 1) {
            newErrors.multiplier = "Must be between 0 and 1";
        }

        const absenceWeight = parseFloat(formData.absenceWeight);
        if (isNaN(absenceWeight) || absenceWeight < 0 || absenceWeight > 1) {
            newErrors.absenceWeight = "Must be between 0 and 1";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        try {
            await classApi.updateStatus(classId, status.id, {
                label: formData.label,
                acronym: formData.acronym.toUpperCase(),
                color: formData.color,
                multiplier,
                absenceWeight,
                isDefault: formData.isDefault,
            });
            toast.success("Status updated");
            setIsEditing(false);
            onUpdate();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to update status");
        }
    }, [classId, status.id, formData, onUpdate]);

    const handleDelete = useCallback(async () => {
        try {
            await classApi.deleteStatus(classId, status.id);
            toast.success("Status archived");
            setIsDeleting(false);
            onUpdate();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to delete status");
        }
    }, [classId, status.id, onUpdate]);

    if (isEditing) {
        return (
            <div className="border-border/40 bg-ivory whisper-shadow space-y-4 rounded-2xl border p-6">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor={`label-${status.id}`}>Label</Label>
                        <Input
                            id={`label-${status.id}`}
                            value={formData.label}
                            onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                            placeholder="Present"
                        />
                        {errors.label && (
                            <Text size="1" className="text-destructive mt-1">
                                {errors.label}
                            </Text>
                        )}
                    </div>
                    <div>
                        <Label htmlFor={`acronym-${status.id}`}>Acronym</Label>
                        <Input
                            id={`acronym-${status.id}`}
                            value={formData.acronym}
                            onChange={(e) =>
                                setFormData({ ...formData, acronym: e.target.value.toUpperCase() })
                            }
                            placeholder="P"
                            maxLength={3}
                        />
                        {errors.acronym && (
                            <Text size="1" className="text-destructive mt-1">
                                {errors.acronym}
                            </Text>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <Label htmlFor={`color-${status.id}`}>Color</Label>
                        <div className="flex gap-2">
                            <Input
                                id={`color-${status.id}`}
                                type="color"
                                value={formData.color}
                                onChange={(e) =>
                                    setFormData({ ...formData, color: e.target.value })
                                }
                                className="h-10 w-16"
                            />
                            <Input
                                value={formData.color}
                                onChange={(e) =>
                                    setFormData({ ...formData, color: e.target.value })
                                }
                                placeholder="#16a34a"
                            />
                        </div>
                        {errors.color && (
                            <Text size="1" className="text-destructive mt-1">
                                {errors.color}
                            </Text>
                        )}
                    </div>
                    <div>
                        <Label htmlFor={`multiplier-${status.id}`}>Multiplier</Label>
                        <Input
                            id={`multiplier-${status.id}`}
                            type="number"
                            step="0.1"
                            min="0"
                            max="1"
                            value={formData.multiplier}
                            onChange={(e) =>
                                setFormData({ ...formData, multiplier: e.target.value })
                            }
                        />
                        {errors.multiplier && (
                            <Text size="1" className="text-destructive mt-1">
                                {errors.multiplier}
                            </Text>
                        )}
                    </div>
                    <div>
                        <Label htmlFor={`absenceWeight-${status.id}`}>Absence Weight</Label>
                        <Input
                            id={`absenceWeight-${status.id}`}
                            type="number"
                            step="0.1"
                            min="0"
                            max="1"
                            value={formData.absenceWeight}
                            onChange={(e) =>
                                setFormData({ ...formData, absenceWeight: e.target.value })
                            }
                        />
                        {errors.absenceWeight && (
                            <Text size="1" className="text-destructive mt-1">
                                {errors.absenceWeight}
                            </Text>
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={() => setIsEditing(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave}>Save Changes</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="group border-border/30 bg-ivory hover:ring-border/60 whisper-shadow flex items-center justify-between gap-4 rounded-2xl border px-6 py-4 transition-all hover:ring-1">
            <div className="flex items-center gap-4">
                <Badge
                    style={{ backgroundColor: status.color }}
                    className="h-8 w-12 font-serif text-sm text-white"
                >
                    {status.acronym}
                </Badge>
                <div>
                    <Text size="4" weight="semibold">
                        {status.label}
                    </Text>
                    <Text size="2" color="olive">
                        Multiplier: {status.multiplier} · Weight: {status.absenceWeight}
                    </Text>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleEdit}
                    className="text-stone-gray hover:text-near-black h-9 w-9 rounded-xl opacity-0 transition-all group-hover:opacity-100"
                >
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">Edit status</span>
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsDeleting(true)}
                    disabled={isLastActive}
                    title={isLastActive ? "Cannot delete the last active status" : "Archive status"}
                    className="text-stone-gray hover:text-terracotta hover:bg-terracotta/5 h-9 w-9 rounded-xl opacity-0 transition-all group-hover:opacity-100 disabled:opacity-50"
                >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete status</span>
                </Button>
            </div>

            <AlertDialog open={isDeleting} onOpenChange={setIsDeleting}>
                <AlertDialogContent className="border-border/40 bg-ivory whisper-shadow rounded-[32px] p-8">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Archive &quot;{status.label}&quot;?</AlertDialogTitle>
                        <AlertDialogDescription className="pt-2 leading-relaxed">
                            This status will be archived and hidden from new attendance records.
                            Historical records using this status will be preserved.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="pt-6">
                        <AlertDialogCancel className="border-border/60 rounded-xl px-6 font-serif">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-terracotta hover:bg-terracotta/90 rounded-xl px-6 font-serif"
                        >
                            Archive Status
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

// ─── Add Status Form ──────────────────────────────────────────────────────────

function AddStatusForm({ classId, onAdd }: { classId: string; onAdd: () => void }) {
    const [isAdding, setIsAdding] = useState(false);
    const [formData, setFormData] = useState<StatusFormData>({
        label: "",
        acronym: "",
        color: "#3b82f6",
        multiplier: "1.0",
        absenceWeight: "0",
        isDefault: false,
    });
    const [errors, setErrors] = useState<Partial<Record<keyof StatusFormData, string>>>({});

    const handleAdd = useCallback(async () => {
        // Validate
        const newErrors: Partial<Record<keyof StatusFormData, string>> = {};

        if (formData.label.length < 1 || formData.label.length > 30) {
            newErrors.label = "Label must be 1-30 characters";
        }
        if (formData.acronym.length < 1 || formData.acronym.length > 3) {
            newErrors.acronym = "Acronym must be 1-3 characters";
        }
        if (!/^#[0-9A-Fa-f]{6}$/.test(formData.color)) {
            newErrors.color = "Must be valid hex color (#RRGGBB)";
        }

        const multiplier = parseFloat(formData.multiplier);
        if (isNaN(multiplier) || multiplier < 0 || multiplier > 1) {
            newErrors.multiplier = "Must be between 0 and 1";
        }

        const absenceWeight = parseFloat(formData.absenceWeight);
        if (isNaN(absenceWeight) || absenceWeight < 0 || absenceWeight > 1) {
            newErrors.absenceWeight = "Must be between 0 and 1";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        try {
            await classApi.addStatus(classId, {
                label: formData.label,
                acronym: formData.acronym.toUpperCase(),
                color: formData.color,
                multiplier,
                absenceWeight,
                isDefault: formData.isDefault,
            });
            toast.success("Status added");
            setIsAdding(false);
            setFormData({
                label: "",
                acronym: "",
                color: "#3b82f6",
                multiplier: "1.0",
                absenceWeight: "0",
                isDefault: false,
            });
            setErrors({});
            onAdd();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to add status");
        }
    }, [classId, formData, onAdd]);

    if (!isAdding) {
        return (
            <Button onClick={() => setIsAdding(true)} variant="outline" className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Add Status
            </Button>
        );
    }

    return (
        <div className="border-border/40 bg-ivory whisper-shadow space-y-4 rounded-2xl border p-6">
            <Heading size="4">Add New Status</Heading>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="new-label">Label</Label>
                    <Input
                        id="new-label"
                        value={formData.label}
                        onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                        placeholder="Present"
                    />
                    {errors.label && (
                        <Text size="1" className="text-destructive mt-1">
                            {errors.label}
                        </Text>
                    )}
                </div>
                <div>
                    <Label htmlFor="new-acronym">Acronym</Label>
                    <Input
                        id="new-acronym"
                        value={formData.acronym}
                        onChange={(e) =>
                            setFormData({ ...formData, acronym: e.target.value.toUpperCase() })
                        }
                        placeholder="P"
                        maxLength={3}
                    />
                    {errors.acronym && (
                        <Text size="1" className="text-destructive mt-1">
                            {errors.acronym}
                        </Text>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div>
                    <Label htmlFor="new-color">Color</Label>
                    <div className="flex gap-2">
                        <Input
                            id="new-color"
                            type="color"
                            value={formData.color}
                            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                            className="h-10 w-16"
                        />
                        <Input
                            value={formData.color}
                            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                            placeholder="#3b82f6"
                        />
                    </div>
                    {errors.color && (
                        <Text size="1" className="text-destructive mt-1">
                            {errors.color}
                        </Text>
                    )}
                </div>
                <div>
                    <Label htmlFor="new-multiplier">Multiplier</Label>
                    <Input
                        id="new-multiplier"
                        type="number"
                        step="0.1"
                        min="0"
                        max="1"
                        value={formData.multiplier}
                        onChange={(e) => setFormData({ ...formData, multiplier: e.target.value })}
                    />
                    {errors.multiplier && (
                        <Text size="1" className="text-destructive mt-1">
                            {errors.multiplier}
                        </Text>
                    )}
                </div>
                <div>
                    <Label htmlFor="new-absenceWeight">Absence Weight</Label>
                    <Input
                        id="new-absenceWeight"
                        type="number"
                        step="0.1"
                        min="0"
                        max="1"
                        value={formData.absenceWeight}
                        onChange={(e) =>
                            setFormData({ ...formData, absenceWeight: e.target.value })
                        }
                    />
                    {errors.absenceWeight && (
                        <Text size="1" className="text-destructive mt-1">
                            {errors.absenceWeight}
                        </Text>
                    )}
                </div>
            </div>

            <div className="flex justify-end gap-2">
                <Button
                    variant="ghost"
                    onClick={() => {
                        setIsAdding(false);
                        setErrors({});
                    }}
                >
                    Cancel
                </Button>
                <Button onClick={handleAdd}>Add Status</Button>
            </div>
        </div>
    );
}

// ─── Status Editor ────────────────────────────────────────────────────────────

/**
 * StatusEditor component for managing class status definitions.
 * Allows adding, editing, and archiving (soft-delete) status definitions.
 */
export function StatusEditor({ classId, statuses, onUpdate }: StatusEditorProps) {
    // Filter active (non-archived) statuses and sort by order
    const activeStatuses = Object.values(statuses)
        .filter((s) => !s.isArchived)
        .sort((a, b) => a.order - b.order);

    const isLastActive = activeStatuses.length === 1;

    return (
        <div className="space-y-4">
            <div>
                <Heading size="3" className="mb-2">
                    Status Definitions
                </Heading>
                <Text size="3" color="olive">
                    Define attendance statuses with custom colors, scoring multipliers, and absence
                    weights.
                </Text>
            </div>

            <div className="space-y-3">
                {activeStatuses.map((status) => (
                    <StatusRow
                        key={status.id}
                        status={status}
                        classId={classId}
                        isLastActive={isLastActive}
                        onUpdate={onUpdate}
                    />
                ))}
            </div>

            <AddStatusForm classId={classId} onAdd={onUpdate} />
        </div>
    );
}
