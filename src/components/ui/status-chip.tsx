"use client";

import { cn } from "@/lib/utils";

interface StatusChipProps {
    label: string;
    acronym: string;
    color: string;
    isActive?: boolean;
    onClick?: () => void;
    disabled?: boolean;
    size?: "sm" | "md";
}

/**
 * StatusChip — the core attendance marking UI element.
 * One tap toggles between active (filled) and inactive (ghost outline) states.
 * Designed for 44px minimum touch target per UX guidelines.
 */
export function StatusChip({
    label,
    acronym,
    color,
    isActive = false,
    onClick,
    disabled = false,
    size = "md",
}: StatusChipProps) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            aria-label={`Mark as ${label}`}
            aria-pressed={isActive}
            title={label}
            className={cn(
                // Base styles
                "inline-flex cursor-pointer items-center justify-center rounded-lg border font-medium transition-all duration-200",
                "focus-visible:ring-2 focus-visible:ring-[#3898ec] focus-visible:ring-offset-1",
                "disabled:cursor-not-allowed disabled:opacity-40",
                // Size
                size === "md" && "h-10 min-w-10 px-3 text-sm",
                size === "sm" && "h-8 min-w-8 px-2 text-xs",
                // Active/inactive states
                isActive
                    ? "ring-1 ring-offset-0"
                    : "bg-background border-border/60 text-stone-gray hover:bg-secondary hover:text-near-black",
            )}
            style={
                isActive
                    ? {
                          backgroundColor: `${color}15`,
                          borderColor: color,
                          color: color,
                          boxShadow: `0 0 0 1px ${color}`,
                      }
                    : {}
            }
        >
            {acronym}
        </button>
    );
}

// ─── Status Badge (read-only display) ─────────────────────────────────────────

interface StatusBadgeProps {
    label: string;
    acronym: string;
    color: string;
    size?: "sm" | "md";
    className?: string;
}

export function StatusBadge({ label, acronym, color, size = "md", className }: StatusBadgeProps) {
    return (
        <span
            title={label}
            className={cn(
                "inline-flex items-center justify-center rounded-md border font-medium",
                size === "md" && "h-7 min-w-7 px-2.5 text-[10px] tracking-wider uppercase",
                size === "sm" && "h-5 min-w-5 px-1.5 text-[9px] tracking-wider uppercase",
                className,
            )}
            style={{
                backgroundColor: `${color}10`,
                borderColor: `${color}30`,
                color,
            }}
        >
            {acronym}
        </span>
    );
}

// ─── Status Chip Row (for attendance session) ──────────────────────────────────

interface StatusChipRowProps {
    statuses: Array<{
        id: string;
        label: string;
        acronym: string;
        color: string;
    }>;
    activeStatusId: string | null;
    onSelect: (statusId: string) => void;
    disabled?: boolean;
    size?: "sm" | "md";
}

export function StatusChipRow({
    statuses,
    activeStatusId,
    onSelect,
    disabled = false,
    size = "md",
}: StatusChipRowProps) {
    return (
        <div className="flex items-center gap-2" role="group" aria-label="Select status">
            {statuses.map((status) => (
                <StatusChip
                    key={status.id}
                    label={status.label}
                    acronym={status.acronym}
                    color={status.color}
                    isActive={activeStatusId === status.id}
                    onClick={() => onSelect(status.id)}
                    disabled={disabled}
                    size={size}
                />
            ))}
        </div>
    );
}
