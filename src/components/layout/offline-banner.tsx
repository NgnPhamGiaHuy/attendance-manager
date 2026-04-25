"use client";

import { useEffect, useState } from "react";

import { WifiOff } from "lucide-react";

import { Text } from "@/components/ui/typography";

// ─── Offline Banner ───────────────────────────────────────────────────────────

/**
 * OfflineBanner component that displays a non-blocking banner when the user is offline.
 * Subscribes to browser online/offline events and shows a message at the top of the page.
 */
export function OfflineBanner() {
    const [isOffline, setIsOffline] = useState(false);

    useEffect(() => {
        // Set initial state
        setIsOffline(!navigator.onLine);

        // Event handlers
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);

        // Subscribe to online/offline events
        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        // Cleanup
        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    if (!isOffline) return null;

    return (
        <div className="animate-fade-in fixed top-0 right-0 left-0 z-50 flex items-center justify-center gap-3 bg-amber-500 px-4 py-3 text-white shadow-md">
            <WifiOff className="h-5 w-5" />
            <Text size="3" weight="medium" className="text-white">
                You&apos;re offline — changes will sync when connectivity is restored.
            </Text>
        </div>
    );
}
