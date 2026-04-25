"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";

import { motion } from "framer-motion";
import { AlertTriangle, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Heading, Text } from "@/components/ui/typography";
import { Link } from "@/i18n/routing";

export default function ClassError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    const t = useTranslations("errors");
    const tCommon = useTranslations("common");
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
                        {isNotFound ? t("classNotFound") : t("somethingWentWrong")}
                    </Heading>
                    <Text size="5" color="olive" className="text-center leading-relaxed">
                        {isNotFound ? t("classNotFoundDesc") : t("somethingWentWrong")}
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
                            {tCommon("backToDashboard")}
                        </Link>
                    </Button>

                    {!isNotFound && (
                        <Button
                            onClick={reset}
                            className="h-14 rounded-2xl px-10 text-base font-semibold"
                        >
                            {tCommon("tryAgain")}
                        </Button>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
