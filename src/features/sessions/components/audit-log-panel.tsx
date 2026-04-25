"use client";

import { ArrowRight, ChevronDown, ChevronUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/typography";

import type { AuditEntry, StatusDefinition } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuditLogPanelProps {
    auditTrail: AuditEntry[];
    statuses: Record<string, StatusDefinition>;
    isExpanded: boolean;
    onToggle: () => void;
}

// ─── Helper Functions ─────────────────────────────────────────────────────────

/**
 * Format timestamp to local timezone with date and time.
 */
function formatTimestamp(timestamp: any): string {
    if (!timestamp) return "Unknown";

    // Handle Firestore Timestamp
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);

    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    }).format(date);
}

// ─── Audit Log Panel ──────────────────────────────────────────────────────────

/**
 * AuditLogPanel component for displaying attendance change history.
 * Shows all audit entries in reverse-chronological order with status badges.
 */
export function AuditLogPanel({ auditTrail, statuses, isExpanded, onToggle }: AuditLogPanelProps) {
    // Sort entries in reverse-chronological order (most recent first)
    const sortedEntries = [...auditTrail].sort((a, b) => {
        const aTime = a.changedAt && "toMillis" in a.changedAt ? a.changedAt.toMillis() : 0;
        const bTime = b.changedAt && "toMillis" in b.changedAt ? b.changedAt.toMillis() : 0;
        return bTime - aTime;
    });

    return (
        <div className="border-border/40 bg-background/50 animate-fade-in rounded-xl border">
            {/* Header */}
            <Button
                variant="ghost"
                onClick={onToggle}
                className="hover:bg-background/80 w-full justify-between rounded-xl p-4"
            >
                <Text size="2" weight="semibold" color="olive">
                    Change History ({auditTrail.length})
                </Text>
                {isExpanded ? (
                    <ChevronUp className="text-muted-foreground h-4 w-4" />
                ) : (
                    <ChevronDown className="text-muted-foreground h-4 w-4" />
                )}
            </Button>

            {/* Audit Entries */}
            {isExpanded && (
                <div className="border-border/40 space-y-3 border-t p-4">
                    {sortedEntries.length === 0 ? (
                        <Text size="2" color="stone" className="py-4 text-center italic">
                            No changes recorded
                        </Text>
                    ) : (
                        sortedEntries.map((entry, index) => {
                            const prevStatus = statuses[entry.prevStatusId];
                            const newStatus = statuses[entry.newStatusId];

                            return (
                                <div
                                    key={index}
                                    className="border-border/30 flex flex-wrap items-center gap-3 rounded-lg border p-3"
                                >
                                    {/* Previous Status Badge */}
                                    {prevStatus && (
                                        <Badge
                                            style={{
                                                backgroundColor: prevStatus.color,
                                                color: "#fff",
                                            }}
                                            className="font-semibold"
                                        >
                                            {prevStatus.label}
                                        </Badge>
                                    )}

                                    {/* Arrow */}
                                    <ArrowRight className="text-muted-foreground h-4 w-4" />

                                    {/* New Status Badge */}
                                    {newStatus && (
                                        <Badge
                                            style={{
                                                backgroundColor: newStatus.color,
                                                color: "#fff",
                                            }}
                                            className="font-semibold"
                                        >
                                            {newStatus.label}
                                        </Badge>
                                    )}

                                    {/* Metadata */}
                                    <div className="ml-auto flex flex-col items-end gap-1">
                                        <Text size="1" weight="medium" color="olive">
                                            {entry.changedBy || "Unknown"}
                                        </Text>
                                        <Text size="1" color="stone">
                                            {formatTimestamp(entry.changedAt)}
                                        </Text>
                                    </div>

                                    {/* Reason (if provided) */}
                                    {entry.reason && (
                                        <div className="border-border/30 mt-2 w-full border-t pt-2">
                                            <Text
                                                size="1"
                                                weight="bold"
                                                color="stone"
                                                className="mb-1 uppercase"
                                            >
                                                Reason
                                            </Text>
                                            <Text size="2" color="olive">
                                                {entry.reason}
                                            </Text>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
}
