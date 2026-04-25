"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { CheckSquare, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Text } from "@/components/ui/typography";

import type { StatusDefinition } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface BulkActionToolbarProps {
    selectedIds: Set<string>;
    statuses: StatusDefinition[];
    onApply: (statusId: string) => Promise<void>;
    onSelectAll: () => void;
    onDeselectAll: () => void;
}

// ─── Bulk Action Toolbar ──────────────────────────────────────────────────────

/**
 * BulkActionToolbar component for bulk attendance marking.
 * Shows selected count, status picker, and apply/deselect buttons.
 */
export function BulkActionToolbar({
    selectedIds,
    statuses,
    onApply,
    onSelectAll,
    onDeselectAll,
}: BulkActionToolbarProps) {
    const t = useTranslations("sessions");
    const [selectedStatusId, setSelectedStatusId] = useState<string>("");
    const [isApplying, setIsApplying] = useState(false);

    // Filter to only active (non-archived) statuses
    const activeStatuses = statuses.filter((s) => !s.isArchived).sort((a, b) => a.order - b.order);

    const handleApply = async () => {
        if (!selectedStatusId || selectedIds.size === 0) return;

        setIsApplying(true);
        try {
            await onApply(selectedStatusId);
            setSelectedStatusId(""); // Reset selection
        } finally {
            setIsApplying(false);
        }
    };

    const isApplyDisabled = selectedIds.size === 0 || !selectedStatusId || isApplying;

    return (
        <div className="bg-terracotta/5 border-terracotta/20 animate-fade-in flex flex-wrap items-center gap-4 rounded-2xl border p-4">
            {/* Selected Count */}
            <div className="flex items-center gap-2">
                <CheckSquare className="text-terracotta h-5 w-5" />
                <Text size="3" weight="semibold">
                    {t("bulkSelected", { count: selectedIds.size })}
                </Text>
            </div>

            {/* Status Picker */}
            <Select
                value={selectedStatusId}
                onValueChange={(value) => setSelectedStatusId(value ?? "")}
            >
                <SelectTrigger className="w-48">
                    <SelectValue placeholder={t("selectStatus")} />
                </SelectTrigger>
                <SelectContent>
                    {activeStatuses.map((status) => (
                        <SelectItem key={status.id} value={status.id}>
                            <div className="flex items-center gap-2">
                                <div
                                    className="h-3 w-3 rounded-full"
                                    style={{ backgroundColor: status.color }}
                                />
                                {status.label}
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {/* Apply Button */}
            <Button
                onClick={handleApply}
                disabled={isApplyDisabled}
                className="bg-terracotta hover:bg-terracotta/90"
            >
                {isApplying ? t("applying") : t("apply")}
            </Button>

            {/* Deselect All Button */}
            <Button variant="ghost" onClick={onDeselectAll} className="ml-auto">
                <X className="mr-2 h-4 w-4" />
                {t("deselectAll")}
            </Button>

            {/* Select All Button */}
            <Button variant="outline" onClick={onSelectAll}>
                {t("selectAll")}
            </Button>
        </div>
    );
}
