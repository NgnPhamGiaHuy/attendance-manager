"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { Loader2 } from "lucide-react";

import { CheckinPage } from "@/features/checkin/components/checkin-page";

// ─── Search Params Wrapper ────────────────────────────────────────────────────

function CheckinPageContent() {
    const searchParams = useSearchParams();
    const sessionId = searchParams.get("session");
    const token = searchParams.get("token");

    // Validate required params
    if (!sessionId || !token) {
        return (
            <div className="bg-background flex min-h-screen items-center justify-center p-6">
                <div className="bg-ivory whisper-shadow border-border/40 w-full max-w-md space-y-6 rounded-[32px] border p-10 text-center">
                    <h1 className="font-serif text-2xl font-bold">Invalid Check-In Link</h1>
                    <p className="text-olive-gray">
                        This check-in link is missing required information. Please scan the QR code
                        again or ask your teacher for a new link.
                    </p>
                </div>
            </div>
        );
    }

    return <CheckinPage sessionId={sessionId} token={token} />;
}

// ─── Page Component ───────────────────────────────────────────────────────────

export default function CheckinRoute() {
    return (
        <Suspense
            fallback={
                <div className="bg-background flex min-h-screen items-center justify-center">
                    <Loader2 className="text-terracotta h-16 w-16 animate-spin" />
                </div>
            }
        >
            <CheckinPageContent />
        </Suspense>
    );
}
