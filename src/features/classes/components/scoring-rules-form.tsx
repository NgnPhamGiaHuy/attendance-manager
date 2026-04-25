"use client";

import { useTranslations } from "next-intl";
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
    const t = useTranslations("classSettings");
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
            newErrors.basePoints = t("basePointsError");
        }

        const allowedAbsences = parseInt(formData.allowedAbsences, 10);
        if (isNaN(allowedAbsences) || allowedAbsences < 0 || allowedAbsences > 50) {
            newErrors.allowedAbsences = t("allowedAbsencesError");
        }

        const penaltyPerAbsence = parseFloat(formData.penaltyPerAbsence);
        if (isNaN(penaltyPerAbsence) || penaltyPerAbsence < 0 || penaltyPerAbsence > 100) {
            newErrors.penaltyPerAbsence = t("penaltyError");
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
            toast.success(t("saveRulesSuccess"));
            setIsEditing(false);
            onUpdate();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : t("saveRulesFailed"));
        } finally {
            setIsSaving(false);
        }
    }, [classId, formData, onUpdate, t]);

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
                            {t("scoringRules")}
                        </Heading>
                        <Text size="3" color="olive">
                            {t("scoringRulesDesc")}
                        </Text>
                    </div>
                    <Button onClick={handleEdit} variant="outline">
                        {t("editRules")}
                    </Button>
                </div>

                <div className="border-border/40 bg-ivory whisper-shadow grid grid-cols-2 gap-6 rounded-2xl border p-6 md:grid-cols-4">
                    <div>
                        <Text size="1" weight="bold" color="stone" className="mb-2 uppercase">
                            {t("basePoints")}
                        </Text>
                        <Heading size="4">{currentRules.basePoints}</Heading>
                    </div>
                    <div>
                        <Text size="1" weight="bold" color="stone" className="mb-2 uppercase">
                            {t("allowedAbsences")}
                        </Text>
                        <Heading size="4">{currentRules.allowedAbsences}</Heading>
                    </div>
                    <div>
                        <Text size="1" weight="bold" color="stone" className="mb-2 uppercase">
                            {t("penaltyPerAbsence")}
                        </Text>
                        <Heading size="4">{currentRules.penaltyPerAbsence}</Heading>
                    </div>
                    <div>
                        <Text size="1" weight="bold" color="stone" className="mb-2 uppercase">
                            {t("capAtZero")}
                        </Text>
                        <Heading size="4">{currentRules.capAtZero ? t("yes") : t("no")}</Heading>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <Heading size="3" className="mb-2">
                    {t("editScoringRules")}
                </Heading>
                <Text size="3" color="olive">
                    {t("scoringRulesDesc")}
                </Text>
            </div>

            <div className="border-border/40 bg-ivory whisper-shadow space-y-6 rounded-2xl border p-6">
                {/* Form Fields */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="basePoints">{t("basePoints")}</Label>
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
                            {t("startingScore")}
                        </Text>
                    </div>

                    <div>
                        <Label htmlFor="allowedAbsences">{t("allowedAbsences")}</Label>
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
                            {t("gracePeriod")}
                        </Text>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="penaltyPerAbsence">{t("penaltyPerAbsence")}</Label>
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
                            {t("excessAbsence")}
                        </Text>
                    </div>

                    <div>
                        <Label htmlFor="capAtZero">{t("capAtZero")}</Label>
                        <div className="flex items-center gap-3 pt-2">
                            <Checkbox
                                id="capAtZero"
                                checked={formData.capAtZero}
                                onCheckedChange={(checked) =>
                                    setFormData({ ...formData, capAtZero: !!checked })
                                }
                            />
                            <Text size="2" color="olive">
                                {t("preventBelowZero")}
                            </Text>
                        </div>
                    </div>
                </div>

                {/* Live Preview */}
                <div className="border-border/40 bg-background/50 space-y-3 rounded-xl border p-4">
                    <Text size="2" weight="bold" color="stone" className="uppercase">
                        {t("livePreview")}
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
                                        {t("absence", { count: absences })}
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
                        {t("formula", {
                            basePoints: previewRules.basePoints,
                            allowedAbsences: previewRules.allowedAbsences,
                            penalty: previewRules.penaltyPerAbsence,
                        })}
                    </Text>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={() => setIsEditing(false)} disabled={isSaving}>
                        {t("cancel")}
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? t("saving") : t("saveRules")}
                    </Button>
                </div>
            </div>
        </div>
    );
}
