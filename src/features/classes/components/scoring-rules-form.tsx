"use client";

import { useCallback, useState } from "react";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Heading, Text } from "@/components/ui/typography";
import { classApi } from "@/features/classes/api/classApi";

import type { ScoringRules } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ScoringRulesFormProps {
    classId: string;
    currentRules: ScoringRules;
    onUpdate: () => void;
}

interface FormData {
    basePoints: string;
    allowedAbsences: string;
    penaltyPerAbsence: string;
    capAtZero: boolean;
}

// ─── Helper Functions ─────────────────────────────────────────────────────────

/**
 * Compute the score based on scoring rules and weighted absences.
 * Implements: score = max(0, basePoints − max(0, weightedAbsences − allowedAbsences) × penaltyPerAbsence)
 */
function computeScore(rules: ScoringRules, weightedAbsences: number): number {
    const excessAbsences = Math.max(0, weightedAbsences - rules.allowedAbsences);
    const penalty = excessAbsences * rules.penaltyPerAbsence;
    const score = rules.basePoints - penalty;
    return rules.capAtZero ? Math.max(0, score) : score;
}

// ─── Scoring Rules Form ───────────────────────────────────────────────────────

/**
 * ScoringRulesForm component for configuring class scoring rules.
 * Includes live preview of score calculation with sample absence values.
 */
export function ScoringRulesForm({ classId, currentRules, onUpdate }: ScoringRulesFormProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState<FormData>({
        basePoints: currentRules.basePoints.toString(),
        allowedAbsences: currentRules.allowedAbsences.toString(),
        penaltyPerAbsence: currentRules.penaltyPerAbsence.toString(),
        capAtZero: currentRules.capAtZero,
    });
    const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

    const handleEdit = useCallback(() => {
        setIsEditing(true);
        setFormData({
            basePoints: currentRules.basePoints.toString(),
            allowedAbsences: currentRules.allowedAbsences.toString(),
            penaltyPerAbsence: currentRules.penaltyPerAbsence.toString(),
            capAtZero: currentRules.capAtZero,
        });
        setErrors({});
    }, [currentRules]);

    const handleSave = useCallback(async () => {
        // Validate
        const newErrors: Partial<Record<keyof FormData, string>> = {};

        const basePoints = parseInt(formData.basePoints, 10);
        if (isNaN(basePoints) || basePoints < 1 || basePoints > 1000) {
            newErrors.basePoints = "Must be between 1 and 1000";
        }

        const allowedAbsences = parseInt(formData.allowedAbsences, 10);
        if (isNaN(allowedAbsences) || allowedAbsences < 0 || allowedAbsences > 50) {
            newErrors.allowedAbsences = "Must be between 0 and 50";
        }

        const penaltyPerAbsence = parseFloat(formData.penaltyPerAbsence);
        if (isNaN(penaltyPerAbsence) || penaltyPerAbsence < 0 || penaltyPerAbsence > 100) {
            newErrors.penaltyPerAbsence = "Must be between 0 and 100";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setIsSaving(true);
        try {
            const rules: ScoringRules = {
                basePoints,
                allowedAbsences,
                penaltyPerAbsence,
                capAtZero: formData.capAtZero,
            };

            await classApi.saveScoringRules(classId, rules);
            toast.success("Scoring rules updated");
            setIsEditing(false);
            onUpdate();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to update scoring rules");
        } finally {
            setIsSaving(false);
        }
    }, [classId, formData, onUpdate]);

    // Live preview calculation
    const previewRules: ScoringRules = {
        basePoints: parseInt(formData.basePoints, 10) || 0,
        allowedAbsences: parseInt(formData.allowedAbsences, 10) || 0,
        penaltyPerAbsence: parseFloat(formData.penaltyPerAbsence) || 0,
        capAtZero: formData.capAtZero,
    };

    // Sample absence values for preview
    const sampleAbsences = [0, 2, 4, 6, 8];

    if (!isEditing) {
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <Heading size="3" className="mb-2">
                            Scoring Rules
                        </Heading>
                        <Text size="3" color="olive">
                            Configure how attendance affects student scores.
                        </Text>
                    </div>
                    <Button onClick={handleEdit} variant="outline">
                        Edit Rules
                    </Button>
                </div>

                <div className="border-border/40 bg-ivory whisper-shadow grid grid-cols-2 gap-6 rounded-2xl border p-6 md:grid-cols-4">
                    <div>
                        <Text size="1" weight="bold" color="stone" className="mb-2 uppercase">
                            Base Points
                        </Text>
                        <Heading size="4">{currentRules.basePoints}</Heading>
                    </div>
                    <div>
                        <Text size="1" weight="bold" color="stone" className="mb-2 uppercase">
                            Allowed Absences
                        </Text>
                        <Heading size="4">{currentRules.allowedAbsences}</Heading>
                    </div>
                    <div>
                        <Text size="1" weight="bold" color="stone" className="mb-2 uppercase">
                            Penalty / Absence
                        </Text>
                        <Heading size="4">{currentRules.penaltyPerAbsence}</Heading>
                    </div>
                    <div>
                        <Text size="1" weight="bold" color="stone" className="mb-2 uppercase">
                            Cap at Zero
                        </Text>
                        <Heading size="4">{currentRules.capAtZero ? "Yes" : "No"}</Heading>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <Heading size="3" className="mb-2">
                    Edit Scoring Rules
                </Heading>
                <Text size="3" color="olive">
                    Configure how attendance affects student scores.
                </Text>
            </div>

            <div className="border-border/40 bg-ivory whisper-shadow space-y-6 rounded-2xl border p-6">
                {/* Form Fields */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="basePoints">Base Points</Label>
                        <Input
                            id="basePoints"
                            type="number"
                            min="1"
                            max="1000"
                            value={formData.basePoints}
                            onChange={(e) =>
                                setFormData({ ...formData, basePoints: e.target.value })
                            }
                        />
                        {errors.basePoints && (
                            <Text size="1" className="text-destructive mt-1">
                                {errors.basePoints}
                            </Text>
                        )}
                        <Text size="1" color="olive" className="mt-1">
                            Starting score for all students (1-1000)
                        </Text>
                    </div>

                    <div>
                        <Label htmlFor="allowedAbsences">Allowed Absences</Label>
                        <Input
                            id="allowedAbsences"
                            type="number"
                            min="0"
                            max="50"
                            value={formData.allowedAbsences}
                            onChange={(e) =>
                                setFormData({ ...formData, allowedAbsences: e.target.value })
                            }
                        />
                        {errors.allowedAbsences && (
                            <Text size="1" className="text-destructive mt-1">
                                {errors.allowedAbsences}
                            </Text>
                        )}
                        <Text size="1" color="olive" className="mt-1">
                            Grace period before penalties apply (0-50)
                        </Text>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="penaltyPerAbsence">Penalty per Absence</Label>
                        <Input
                            id="penaltyPerAbsence"
                            type="number"
                            step="0.5"
                            min="0"
                            max="100"
                            value={formData.penaltyPerAbsence}
                            onChange={(e) =>
                                setFormData({ ...formData, penaltyPerAbsence: e.target.value })
                            }
                        />
                        {errors.penaltyPerAbsence && (
                            <Text size="1" className="text-destructive mt-1">
                                {errors.penaltyPerAbsence}
                            </Text>
                        )}
                        <Text size="1" color="olive" className="mt-1">
                            Points deducted per excess absence (0-100)
                        </Text>
                    </div>

                    <div>
                        <Label htmlFor="capAtZero">Cap at Zero</Label>
                        <div className="flex items-center gap-3 pt-2">
                            <Checkbox
                                id="capAtZero"
                                checked={formData.capAtZero}
                                onCheckedChange={(checked) =>
                                    setFormData({ ...formData, capAtZero: !!checked })
                                }
                            />
                            <Text size="2" color="olive">
                                Prevent scores from going below zero
                            </Text>
                        </div>
                    </div>
                </div>

                {/* Live Preview */}
                <div className="border-border/40 bg-background/50 space-y-3 rounded-xl border p-4">
                    <Text size="2" weight="bold" color="stone" className="uppercase">
                        Live Preview
                    </Text>
                    <div className="grid grid-cols-5 gap-3">
                        {sampleAbsences.map((absences) => {
                            const score = computeScore(previewRules, absences);
                            return (
                                <div
                                    key={absences}
                                    className="bg-ivory border-border/30 rounded-lg border p-3 text-center"
                                >
                                    <Text size="1" color="olive" className="mb-1">
                                        {absences} {absences === 1 ? "absence" : "absences"}
                                    </Text>
                                    <Heading
                                        size="4"
                                        className={
                                            score < 0 ? "text-destructive" : "text-near-black"
                                        }
                                    >
                                        {score}
                                    </Heading>
                                </div>
                            );
                        })}
                    </div>
                    <Text size="1" color="olive" className="italic">
                        Formula: max(0, {previewRules.basePoints} − max(0, absences −{" "}
                        {previewRules.allowedAbsences}) × {previewRules.penaltyPerAbsence})
                    </Text>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={() => setIsEditing(false)} disabled={isSaving}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? "Saving..." : "Save Rules"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
