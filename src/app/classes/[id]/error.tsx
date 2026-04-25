"use client";

import Link from "next/link";
import { useEffect } from "react";

import { motion } from "framer-motion";
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
        <div className="bg-background flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="flex max-w-md flex-col items-center"
            >
                <div className="space-y-6">
                    <Heading
                        size="9"
                        as="h1"
                        className="text-near-black text-center font-serif tracking-tight"
                    >
                        {isNotFound ? "Class not found" : "Something went wrong"}
                    </Heading>
                    <Text size="5" color="olive" className="text-center leading-relaxed">
                        {isNotFound
                            ? "This class doesn't exist or you don't have access to it. It might have been archived or moved."
                            : "An unexpected error occurred while loading this class. We've been notified and are looking into it."}
                    </Text>
                </div>

                <div className="mt-16 flex w-full flex-col items-center justify-center gap-6 sm:flex-row">
                    <Button
                        asChild
                        variant="secondary"
                        className="whisper-shadow group h-14 rounded-2xl px-10 text-base font-semibold"
                    >
                        <Link href="/dashboard">
                            <ArrowLeft className="mr-2 h-5 w-5 transition-transform group-hover:-translate-x-1" />
                            Back to Dashboard
                        </Link>
                    </Button>

                    {!isNotFound && (
                        <Button
                            onClick={reset}
                            className="h-14 rounded-2xl px-10 text-base font-semibold"
                        >
                            Try again
                        </Button>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
