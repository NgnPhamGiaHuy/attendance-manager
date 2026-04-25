"use client";

import { useTranslations } from "next-intl";
import { Suspense, useEffect } from "react";

import { Logo } from "@/components/ui/logo";
import { Heading, Text } from "@/components/ui/typography";
import { AuthForm } from "@/features/auth/components/auth-form";
import { useRouter } from "@/i18n/routing";
import { useAuth } from "@/providers/auth-provider";

export function LoginPage() {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();
    const t = useTranslations("auth");

    useEffect(() => {
        if (!isLoading && isAuthenticated) {
            router.replace("/dashboard");
        }
    }, [isLoading, isAuthenticated, router]);

    return (
        <div className="bg-background flex min-h-screen">
            <div className="flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-20">
                <Logo className="absolute top-10 left-10 scale-90" />

                <div className="w-full max-w-[380px] space-y-10">
                    <div className="space-y-4">
                        <Heading size="7" as="h1">
                            {t("welcomeBack")}
                        </Heading>
                        <Text size="4" color="olive" className="leading-relaxed" as="p">
                            {t("signInDesc")}
                        </Text>
                    </div>

                    <Suspense
                        fallback={
                            <div className="bg-ivory whisper-shadow h-[300px] w-full animate-pulse rounded-3xl" />
                        }
                    >
                        <AuthForm />
                    </Suspense>
                </div>
            </div>

            {/* Right side editorial area */}
            <div className="bg-near-black relative hidden items-center justify-center overflow-hidden p-20 lg:flex lg:flex-1">
                <div className="absolute inset-0 bg-[#30302e] opacity-20" />
                <div className="relative z-10 max-w-lg space-y-8">
                    <div className="space-y-6">
                        <Heading size="8" color="default" className="text-ivory leading-[1.1]">
                            &quot;{t("quote")}&quot;
                        </Heading>
                        <div className="bg-terracotta h-px w-12" />
                        <Text size="5" color="stone" className="leading-relaxed" as="p">
                            {t("quoteDesc")}
                        </Text>
                    </div>

                    <div className="pt-8">
                        <div className="flex items-center gap-4">
                            <span className="bg-stone-gray/30 h-px w-4" />
                            <Text
                                size="1"
                                weight="bold"
                                color="stone"
                                className="tracking-widest uppercase"
                            >
                                {t("trustedBy")}
                            </Text>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
