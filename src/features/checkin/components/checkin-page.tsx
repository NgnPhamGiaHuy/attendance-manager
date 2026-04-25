"use client";

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

// ─── Error Messages ───────────────────────────────────────────────────────────

const ERROR_MESSAGES: Record<CheckinErrorCode, { title: string; message: string }> = {
    [CheckinErrorCode.INVALID_TOKEN]: {
        title: "Invalid QR Code",
        message: "This QR code is invalid. Please scan the current code displayed by your teacher.",
    },
    [CheckinErrorCode.EXPIRED_TOKEN]: {
        title: "QR Code Expired",
        message: "This QR code has expired. Please ask your teacher to refresh it and scan again.",
    },
    [CheckinErrorCode.SESSION_NOT_ACTIVE]: {
        title: "Session Not Active",
        message: "This session is not currently accepting check-ins.",
    },
    [CheckinErrorCode.SESSION_FINALIZED]: {
        title: "Session Finalized",
        message: "This session has been finalized and cannot accept new check-ins.",
    },
    [CheckinErrorCode.ALREADY_CHECKED_IN]: {
        title: "Already Checked In",
        message: "You have already checked in to this session.",
    },
    [CheckinErrorCode.SESSION_NOT_FOUND]: {
        title: "Session Not Found",
        message: "The session you're trying to check in to could not be found.",
    },
    [CheckinErrorCode.CLASS_NOT_FOUND]: {
        title: "Class Not Found",
        message: "The class for this session could not be found.",
    },
    [CheckinErrorCode.UNKNOWN_ERROR]: {
        title: "Check-In Failed",
        message: "An unexpected error occurred. Please try again or contact your teacher.",
    },
};

// ─── Check-In Page ────────────────────────────────────────────────────────────

/**
 * CheckinPage component for student self-check-in via QR code.
 * Validates token and creates attendance record automatically.
 */
export function CheckinPage({ sessionId, token }: CheckinPageProps) {
    const { user } = useAuth();
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

    // Loading state
    if (state === "loading") {
        return (
            <div className="bg-background flex min-h-screen items-center justify-center p-6">
                <div className="bg-ivory whisper-shadow border-border/40 w-full max-w-md space-y-6 rounded-[32px] border p-10 text-center">
                    <Loader2 className="text-terracotta mx-auto h-16 w-16 animate-spin" />
                    <Heading size="3" className="font-serif">
                        Checking you in...
                    </Heading>
                    <Text size="3" color="olive">
                        Please wait while we verify your check-in.
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
                        Check-In Successful!
                    </Heading>
                    <Text size="4" color="olive" className="leading-relaxed">
                        You have been successfully checked in to this session. You may close this
                        page.
                    </Text>
                    <Button
                        onClick={() => window.close()}
                        variant="outline"
                        className="mt-6 w-full"
                    >
                        Close
                    </Button>
                </div>
            </div>
        );
    }

    // Error state
    const errorInfo = errorCode
        ? ERROR_MESSAGES[errorCode]
        : ERROR_MESSAGES[CheckinErrorCode.UNKNOWN_ERROR];

    return (
        <div className="bg-background flex min-h-screen items-center justify-center p-6">
            <div className="bg-ivory whisper-shadow border-border/40 w-full max-w-md space-y-6 rounded-[32px] border p-10 text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-50">
                    <XCircle className="h-12 w-12 text-red-600" />
                </div>
                <Heading size="2" className="font-serif">
                    {errorInfo.title}
                </Heading>
                <Text size="4" color="olive" className="leading-relaxed">
                    {errorInfo.message}
                </Text>
                <Button
                    onClick={() => window.location.reload()}
                    variant="outline"
                    className="mt-6 w-full"
                >
                    Try Again
                </Button>
            </div>
        </div>
    );
}
