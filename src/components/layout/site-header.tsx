"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Link } from "@/i18n/routing";

export function SiteHeader() {
    const t = useTranslations("landing");

    return (
        <header className="absolute top-0 z-50 flex w-full items-center justify-between px-10 py-8">
            <Logo />
            <div className="flex items-center gap-4">
                <ThemeToggle />
                <LanguageSwitcher />
                <Button
                    asChild
                    variant="ghost"
                    className="text-muted-foreground hover:text-foreground font-medium"
                >
                    <Link href="/login">{t("signIn")}</Link>
                </Button>
                <Button asChild variant="default" className="rounded-xl px-8 shadow-sm">
                    <Link href="/login">{t("getStarted")}</Link>
                </Button>
            </div>
        </header>
    );
}
