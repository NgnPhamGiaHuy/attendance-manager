"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { CheckCircle, Loader2, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Heading, Text } from "@/components/ui/typography";
import { checkinApi, CheckinError, CheckinErrorCode } from "@/features/checkin/api/checkinApi";
import { useAuth } from "@/providers/auth-provider";

// ─── Types ────────────────────────────────────────────────────────────────────

type CheckinState = "loading" | "success" | "error";

interface CheckinPageProps {
    sessionId: string;
    token: string;
}

// ─── Check-In Page ────────────────────────────────────────────────────────────

/**
 * CheckinPage component for student self-check-in via QR code.
 * Validates token and creates attendance record automatically.
 */
export function CheckinPage({ sessionId, token }: CheckinPageProps) {
    const { user } = useAuth();
    const t = useTranslations("checkin");
    const tCommon = useTranslations("common");
    const [state, setState] = useState<CheckinState>("loading");
    const [errorCode, setErrorCode] = useState<CheckinErrorCode | null>(null);

    useEffect(() => {
        // Wait for user to be loaded
        if (!user) return;

        const performCheckin = async () => {
            try {
                setState("loading");
                await checkinApi.selfCheckIn(
                    sessionId,
                    token,
                    user.uid,
                    user.displayName || user.email || "Student",
                );
                setState("success");
            } catch (error) {
                if (error instanceof CheckinError) {
                    setErrorCode(error.code);
                } else {
                    setErrorCode(CheckinErrorCode.UNKNOWN_ERROR);
                }
                setState("error");
            }
        };

        performCheckin();
    }, [sessionId, token, user]);

    // Helper to get error translation keys
    const getErrorKeys = (code: CheckinErrorCode | null) => {
        switch (code) {
            case CheckinErrorCode.INVALID_TOKEN:
                return { title: "invalidToken", message: "invalidTokenDesc" };
            case CheckinErrorCode.EXPIRED_TOKEN:
                return { title: "expiredToken", message: "expiredTokenDesc" };
            case CheckinErrorCode.SESSION_NOT_ACTIVE:
                return { title: "sessionNotActive", message: "sessionNotActiveDesc" };
            case CheckinErrorCode.SESSION_FINALIZED:
                return { title: "sessionFinalized", message: "sessionFinalizedDesc" };
            case CheckinErrorCode.ALREADY_CHECKED_IN:
                return { title: "alreadyCheckedIn", message: "alreadyCheckedInDesc" };
            case CheckinErrorCode.SESSION_NOT_FOUND:
                return { title: "sessionNotFound", message: "sessionNotFoundDesc" };
            case CheckinErrorCode.CLASS_NOT_FOUND:
                return { title: "classNotFound", message: "classNotFoundDesc" };
            default:
                return { title: "failed", message: "failedDesc" };
        }
    };

    // Loading state
    if (state === "loading") {
        return (
            <div className="bg-background flex min-h-screen items-center justify-center p-6">
                <div className="bg-ivory whisper-shadow border-border/40 w-full max-w-md space-y-6 rounded-[32px] border p-10 text-center">
                    <Loader2 className="text-terracotta mx-auto h-16 w-16 animate-spin" />
                    <Heading size="3" className="font-serif">
                        {t("checkingIn")}
                    </Heading>
                    <Text size="3" color="olive">
                        {t("verifyCheckin")}
                    </Text>
                </div>
            </div>
        );
    }

    // Success state
    if (state === "success") {
        return (
            <div className="bg-background flex min-h-screen items-center justify-center p-6">
                <div className="bg-ivory whisper-shadow border-border/40 w-full max-w-md space-y-6 rounded-[32px] border p-10 text-center">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-50">
                        <CheckCircle className="h-12 w-12 text-green-600" />
                    </div>
                    <Heading size="2" className="font-serif">
                        {t("success")}
                    </Heading>
                    <Text size="4" color="olive" className="leading-relaxed">
                        {t("successDesc")}
                    </Text>
                    <Button
                        onClick={() => window.close()}
                        variant="outline"
                        className="mt-6 w-full"
                    >
                        {t("close")}
                    </Button>
                </div>
            </div>
        );
    }

    // Error state
    const errorKeys = getErrorKeys(errorCode);

    return (
        <div className="bg-background flex min-h-screen items-center justify-center p-6">
            <div className="bg-ivory whisper-shadow border-border/40 w-full max-w-md space-y-6 rounded-[32px] border p-10 text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-50">
                    <XCircle className="h-12 w-12 text-red-600" />
                </div>
                <Heading size="2" className="font-serif">
                    {t(errorKeys.title)}
                </Heading>
                <Text size="4" color="olive" className="leading-relaxed">
                    {t(errorKeys.message)}
                </Text>
                <Button
                    onClick={() => window.location.reload()}
                    variant="outline"
                    className="mt-6 w-full"
                >
                    {tCommon("tryAgain")}
                </Button>
            </div>
        </div>
    );
}
