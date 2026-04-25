"use client";

import Link from "next/link";

import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Heading, Text } from "@/components/ui/typography";

export default function NotFound() {
    return (
        <div className="bg-background flex min-h-screen flex-col items-center justify-center px-4 text-center">
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="flex max-w-2xl flex-col items-center"
            >
                {/* Massive Typographic Header */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1, duration: 1 }}
                    className="mb-8"
                >
                    <span className="text-terracotta/20 pointer-events-none block font-serif text-[12rem] leading-none font-bold tracking-tighter italic select-none sm:text-[16rem]">
                        404
                    </span>
                </motion.div>

                <div className="space-y-6">
                    <Heading
                        size="9"
                        as="h1"
                        className="text-near-black text-center font-serif tracking-tight"
                    >
                        Lost in thought
                    </Heading>
                    <Text
                        size="5"
                        color="olive"
                        className="mx-auto max-w-md text-center text-lg leading-relaxed"
                    >
                        The page you're looking for has drifted beyond the horizon. Let's guide you
                        back to familiar grounds.
                    </Text>
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.8 }}
                    className="mt-16 flex w-full justify-center"
                >
                    <Button
                        asChild
                        variant="secondary"
                        className="whisper-shadow group h-14 rounded-2xl px-12 text-base font-semibold"
                    >
                        <Link href="/dashboard">
                            <ArrowLeft className="mr-2 h-5 w-5 transition-transform group-hover:-translate-x-1" />
                            Back to Dashboard
                        </Link>
                    </Button>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.3 }}
                    transition={{ delay: 0.8, duration: 1 }}
                    className="mt-24 space-y-4"
                >
                    <div className="bg-border/60 mx-auto h-px w-12" />
                    <Text
                        size="1"
                        color="stone"
                        className="block text-center font-medium tracking-[0.2em] uppercase"
                    >
                        Attendance Manager
                    </Text>
                </motion.div>
            </motion.div>

            {/* Subtle background grain */}
            <div
                className="pointer-events-none fixed inset-0 -z-10 opacity-[0.02]"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                }}
            />
        </div>
    );
}
