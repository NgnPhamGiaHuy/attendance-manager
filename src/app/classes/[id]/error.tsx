"use client";

import Link from "next/link";
import { useEffect } from "react";

import { AlertTriangle, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Heading, Text } from "@/components/ui/typography";

export default function ClassError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("[ClassError]", error);
    }, [error]);

    const isNotFound =
        error.message?.toLowerCase().includes("not found") ||
        error.message?.toLowerCase().includes("does not exist");

    return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-8 px-4 text-center">
            <div className="bg-terracotta/10 border-terracotta/20 flex h-16 w-16 items-center justify-center rounded-3xl border">
                <AlertTriangle className="text-terracotta h-7 w-7" />
            </div>

            <div className="space-y-3">
                <Heading size="6" as="h1">
                    {isNotFound ? "Class not found" : "Something went wrong"}
                </Heading>
                <Text size="4" color="olive" className="max-w-sm leading-relaxed" as="p">
                    {isNotFound
                        ? "This class doesn't exist or you don't have access to it."
                        : "An unexpected error occurred while loading this class."}
                </Text>
            </div>

            <div className="flex items-center gap-3">
                <Button asChild variant="secondary" className="rounded-xl px-6">
                    <Link href="/dashboard">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Dashboard
                    </Link>
                </Button>
                {!isNotFound && (
                    <Button onClick={reset} className="rounded-xl px-6">
                        Try again
                    </Button>
                )}
            </div>
        </div>
    );
}
