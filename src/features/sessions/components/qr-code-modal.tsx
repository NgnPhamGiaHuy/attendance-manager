"use client";

import { useCallback, useEffect, useState } from "react";

import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Heading, Text } from "@/components/ui/typography";
import { buildCheckinUrl, sessionApi } from "@/features/sessions/api/sessionApi";

import type { Timestamp } from "firebase/firestore";

// ─── Types ────────────────────────────────────────────────────────────────────

interface QRCodeModalProps {
    sessionId: string;
    qrSecret: string | null;
    qrExpiresAt: Timestamp | null;
    isOpen: boolean;
    onClose: () => void;
}

// ─── Helper Functions ─────────────────────────────────────────────────────────

/**
 * Calculate seconds remaining until expiration.
 */
function getSecondsRemaining(expiresAt: Timestamp | null): number {
    if (!expiresAt) return 0;
    const now = Date.now();
    const expiryMs = expiresAt.toMillis();
    return Math.max(0, Math.floor((expiryMs - now) / 1000));
}

// ─── QR Code Modal ────────────────────────────────────────────────────────────

/**
 * QRCodeModal component for displaying QR check-in codes.
 * Includes countdown timer and auto-refresh on expiry.
 */
export function QRCodeModal({
    sessionId,
    qrSecret,
    qrExpiresAt,
    isOpen,
    onClose,
}: QRCodeModalProps) {
    const [isActivating, setIsActivating] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [secondsRemaining, setSecondsRemaining] = useState(0);

    // Update countdown timer every second
    useEffect(() => {
        if (!qrExpiresAt || !isOpen) {
            setSecondsRemaining(0);
            return;
        }

        // Initial calculation
        setSecondsRemaining(getSecondsRemaining(qrExpiresAt));

        // Update every second
        const interval = setInterval(() => {
            const remaining = getSecondsRemaining(qrExpiresAt);
            setSecondsRemaining(remaining);

            // Auto-refresh when expired
            if (remaining === 0 && qrSecret) {
                handleRefresh();
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [qrExpiresAt, qrSecret, isOpen]);

    const handleActivate = useCallback(async () => {
        setIsActivating(true);
        try {
            await sessionApi.activateQR(sessionId);
            toast.success("QR check-in activated");
        } catch (error) {
            toast.error("Failed to activate QR check-in");
            console.error("QR activation error:", error);
        } finally {
            setIsActivating(false);
        }
    }, [sessionId]);

    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        try {
            await sessionApi.refreshQR(sessionId);
            toast.success("QR code refreshed");
        } catch (error) {
            toast.error("Failed to refresh QR code");
            console.error("QR refresh error:", error);
        } finally {
            setIsRefreshing(false);
        }
    }, [sessionId]);

    // Build full URL for QR code
    const checkinUrl = qrSecret
        ? `${window.location.origin}${buildCheckinUrl(sessionId, qrSecret)}`
        : "";

    // Format countdown display
    const minutes = Math.floor(secondsRemaining / 60);
    const seconds = secondsRemaining % 60;
    const countdownDisplay = `${minutes}:${seconds.toString().padStart(2, "0")}`;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="border-border/40 bg-ivory whisper-shadow max-w-2xl rounded-[32px] p-10">
                <DialogHeader>
                    <DialogTitle className="font-serif text-2xl">QR Check-In</DialogTitle>
                    <DialogDescription className="leading-relaxed">
                        Students can scan this QR code to check in to the session.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 pt-4">
                    {!qrSecret ? (
                        // Not activated yet
                        <div className="flex flex-col items-center justify-center space-y-6 py-12">
                            <Text size="4" color="olive" className="text-center">
                                QR check-in is not active for this session.
                            </Text>
                            <Button
                                onClick={handleActivate}
                                disabled={isActivating}
                                size="lg"
                                className="h-12 px-8 font-serif text-base"
                            >
                                {isActivating ? "Activating..." : "Activate QR Check-In"}
                            </Button>
                        </div>
                    ) : (
                        // QR code active
                        <>
                            {/* QR Code Display */}
                            <div className="bg-background border-border/40 flex flex-col items-center justify-center space-y-4 rounded-2xl border p-8">
                                <QRCodeSVG
                                    value={checkinUrl}
                                    size={256}
                                    level="M"
                                    includeMargin
                                    className="rounded-lg"
                                />

                                {/* Countdown Timer */}
                                <div className="text-center">
                                    <Text
                                        size="1"
                                        weight="bold"
                                        color="stone"
                                        className="mb-1 tracking-widest uppercase"
                                    >
                                        Expires In
                                    </Text>
                                    <Heading
                                        size="3"
                                        className={
                                            secondsRemaining < 60
                                                ? "text-terracotta"
                                                : "text-near-black"
                                        }
                                    >
                                        {countdownDisplay}
                                    </Heading>
                                </div>
                            </div>

                            {/* Fallback URL */}
                            <div className="bg-background/50 border-border/30 space-y-2 rounded-xl border p-4">
                                <Text size="2" weight="bold" color="stone" className="uppercase">
                                    Manual Check-In URL
                                </Text>
                                <Text size="2" className="text-olive-gray font-mono break-all">
                                    {checkinUrl}
                                </Text>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-3">
                                <Button variant="outline" onClick={onClose}>
                                    Close
                                </Button>
                                <Button
                                    onClick={handleRefresh}
                                    disabled={isRefreshing}
                                    className="font-serif"
                                >
                                    {isRefreshing ? "Refreshing..." : "Refresh QR Code"}
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
