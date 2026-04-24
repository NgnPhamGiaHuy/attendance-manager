"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { ArrowRight, CheckCircle2, QrCode, Zap } from "lucide-react";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-chip";
import { Heading, Text } from "@/components/ui/typography";
import { useAuth } from "@/providers/auth-provider";

export function LandingPage() {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && isAuthenticated) {
            router.replace("/dashboard");
        }
    }, [isLoading, isAuthenticated, router]);

    return (
        <div className="bg-background text-near-black relative flex min-h-screen flex-col items-center overflow-x-hidden">
            {/* Soft Editorial Accents */}
            <div className="bg-terracotta absolute top-0 right-0 left-0 h-1.5" />

            {/* Navigation */}
            <SiteHeader />

            {/* Hero Section */}
            <header className="z-10 mt-44 flex flex-col items-center px-4 text-center sm:px-6 lg:px-20">
                <Heading
                    size="1"
                    className="border-terracotta/20 bg-terracotta/5 mb-8 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 uppercase"
                >
                    <Zap className="fill-terracotta h-3.5 w-3.5" />
                    Built for modern classrooms
                </Heading>
                <Heading size="9" as="h1" className="max-w-5xl">
                    Attendance, designed <br /> for humans.
                </Heading>
                <Text
                    size="6"
                    color="olive"
                    className="mt-10 max-w-2xl leading-relaxed md:text-2xl"
                    as="p"
                >
                    The only attendance platform that understands teaching.{" "}
                    <br className="hidden md:block" />
                    Focus on your students, not the paperwork.
                </Text>
                <div className="mt-14 flex flex-wrap justify-center gap-6">
                    <Button
                        asChild
                        size="lg"
                        className="whisper-shadow h-14 rounded-2xl px-12 font-serif text-lg"
                    >
                        <Link href="/login">
                            Start your first class
                            <ArrowRight className="ml-3 h-5 w-5 transition-transform group-hover:translate-x-1" />
                        </Link>
                    </Button>
                    <Button
                        asChild
                        size="lg"
                        variant="secondary"
                        className="border-border/60 h-14 rounded-2xl border px-12 font-serif text-lg"
                    >
                        <Link href="/demo">View the demo</Link>
                    </Button>
                </div>
            </header>

            {/* Core Philosophy / Features Section */}
            <section className="z-10 mt-32 grid w-full max-w-6xl grid-cols-1 gap-12 px-10 md:grid-cols-3">
                <div className="flex flex-col gap-4">
                    <div className="bg-ivory border-border/40 whisper-shadow flex h-12 w-12 items-center justify-center rounded-2xl border">
                        <CheckCircle2 className="text-terracotta h-6 w-6" />
                    </div>
                    <Heading size="4" as="h3">
                        Exception-based Reporting
                    </Heading>
                    <Text color="olive" className="leading-relaxed">
                        Don&apos;t waste time marking everyone &quot;Present&quot;. We assume they
                        are here—you only tap when they aren&apos;t.
                    </Text>
                </div>
                <div className="flex flex-col gap-4">
                    <div className="bg-ivory border-border/40 whisper-shadow flex h-12 w-12 items-center justify-center rounded-2xl border">
                        <Zap className="text-terracotta h-6 w-6" />
                    </div>
                    <Heading size="4" as="h3">
                        Real-time State Sync
                    </Heading>
                    <Text color="olive" className="leading-relaxed">
                        Collaborative marking for large lecture halls. See updates from co-teachers
                        and TAs across devices instantly.
                    </Text>
                </div>
                <div className="flex flex-col gap-4">
                    <div className="bg-ivory border-border/40 whisper-shadow flex h-12 w-12 items-center justify-center rounded-2xl border">
                        <QrCode className="text-terracotta h-6 w-6" />
                    </div>
                    <Heading size="4" as="h3">
                        Secure QR Check-in
                    </Heading>
                    <Text color="olive" className="leading-relaxed">
                        Prevent proxy attendance with time-rotating, cryptographically secure QR
                        codes. Students self-verify with ease.
                    </Text>
                </div>
            </section>

            {/* Product Mockup */}
            <div className="z-10 mt-32 mb-20 flex w-full max-w-6xl justify-center px-6">
                <div className="bg-ivory ring-border/40 whisper-shadow relative h-[500px] w-full overflow-hidden rounded-[40px] p-0 ring-1">
                    {/* Mockup UI header */}
                    <div className="border-border/30 bg-ivory/50 flex items-center justify-between border-b px-10 py-8 backdrop-blur-sm">
                        <div className="flex flex-col gap-1">
                            <Text
                                size="1"
                                weight="bold"
                                color="stone"
                                className="tracking-widest uppercase"
                            >
                                Active Session
                            </Text>
                            <Heading size="5">Advanced Data Structures · Lecture 12</Heading>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="bg-background border-border/40 flex h-11 items-center rounded-xl border px-5 font-serif text-sm font-medium">
                                Mark All Present
                            </div>
                            <Button
                                size="lg"
                                className="bg-terracotta h-11 rounded-xl font-serif shadow-sm"
                            >
                                Finish Session
                            </Button>
                        </div>
                    </div>

                    {/* Mockup UI rows */}
                    <div className="divide-border/20 flex flex-col divide-y px-10 pt-4">
                        {[
                            {
                                name: "Julianne Moore",
                                status: "Present",
                                color: "#16a34a",
                                initials: "JM",
                            },
                            {
                                name: "Robert De Niro",
                                status: "Late",
                                color: "#d97706",
                                initials: "RD",
                            },
                            {
                                name: "Meryl Streep",
                                status: "Present",
                                color: "#16a34a",
                                initials: "MS",
                            },
                            {
                                name: "Denzel Washington",
                                status: "Absent",
                                color: "#dc2626",
                                initials: "DW",
                            },
                        ].map((student, i) => (
                            <div key={i} className="flex items-center justify-between py-5">
                                <div className="flex items-center gap-5">
                                    <div className="bg-near-black/5 text-near-black flex h-12 w-12 items-center justify-center rounded-2xl font-serif text-sm font-medium">
                                        {student.initials}
                                    </div>
                                    <Text size="5" weight="medium">
                                        {student.name}
                                    </Text>
                                </div>
                                <div className="flex items-center gap-3">
                                    <StatusBadge
                                        label="P"
                                        acronym="P"
                                        color="#16a34a"
                                        className={
                                            student.status !== "Present"
                                                ? "opacity-30 grayscale"
                                                : ""
                                        }
                                    />
                                    <StatusBadge
                                        label="L"
                                        acronym="L"
                                        color="#d97706"
                                        className={
                                            student.status !== "Late" ? "opacity-30 grayscale" : ""
                                        }
                                    />
                                    <StatusBadge
                                        label="A"
                                        acronym="A"
                                        color="#dc2626"
                                        className={
                                            student.status !== "Absent"
                                                ? "opacity-30 grayscale"
                                                : ""
                                        }
                                    />
                                    <StatusBadge
                                        label="E"
                                        acronym="E"
                                        color="#7c3aed"
                                        className="opacity-30 grayscale"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Soft fade out */}
                    <div className="from-ivory absolute right-0 bottom-0 left-0 h-48 bg-gradient-to-t to-transparent"></div>
                </div>
            </div>

            <div className="mt-32 w-full">
                <SiteFooter />
            </div>
        </div>
    );
}
