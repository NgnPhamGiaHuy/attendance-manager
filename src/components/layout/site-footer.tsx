"use client";

import { useTranslations } from "next-intl";

import { Logo } from "@/components/ui/logo";
import { Heading, Text } from "@/components/ui/typography";

export function SiteFooter() {
    const t = useTranslations("footer");

    return (
        <footer className="border-border/40 bg-card/50 border-t px-10 py-16 backdrop-blur-sm">
            <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-8 md:flex-row">
                <div className="flex flex-col gap-4">
                    <Logo />
                    <Text size="2" color="stone" className="max-w-xs leading-relaxed">
                        {t("tagline")}
                    </Text>
                </div>
                <div className="grid grid-cols-2 gap-12 sm:grid-cols-3">
                    <div className="flex flex-col gap-4">
                        <Text size="3" weight="bold" className="font-serif">
                            {t("product")}
                        </Text>
                        <ul className="flex flex-col gap-2">
                            <li className="text-muted-foreground hover:text-foreground cursor-pointer text-sm transition-colors">
                                {t("features")}
                            </li>
                            <li className="text-muted-foreground hover:text-foreground cursor-pointer text-sm transition-colors">
                                {t("security")}
                            </li>
                            <li className="text-muted-foreground hover:text-foreground cursor-pointer text-sm transition-colors">
                                {t("pricing")}
                            </li>
                        </ul>
                    </div>
                    <div className="flex flex-col gap-4">
                        <Text size="3" weight="bold" className="font-serif">
                            {t("company")}
                        </Text>
                        <ul className="flex flex-col gap-2">
                            <li className="text-muted-foreground hover:text-foreground cursor-pointer text-sm transition-colors">
                                {t("about")}
                            </li>
                            <li className="text-muted-foreground hover:text-foreground cursor-pointer text-sm transition-colors">
                                {t("blog")}
                            </li>
                            <li className="text-muted-foreground hover:text-foreground cursor-pointer text-sm transition-colors">
                                {t("careers")}
                            </li>
                        </ul>
                    </div>
                    <div className="flex flex-col gap-4">
                        <Text size="3" weight="bold" className="font-serif">
                            {t("legal")}
                        </Text>
                        <ul className="flex flex-col gap-2">
                            <li className="text-muted-foreground hover:text-foreground cursor-pointer text-sm transition-colors">
                                {t("privacy")}
                            </li>
                            <li className="text-muted-foreground hover:text-foreground cursor-pointer text-sm transition-colors">
                                {t("terms")}
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
            <div className="border-border/20 mx-auto mt-16 max-w-6xl border-t pt-8 text-center">
                <Text
                    size="1"
                    weight="bold"
                    color="stone"
                    className="tracking-widest uppercase opacity-60"
                >
                    &copy; {new Date().getFullYear()} Attendance Manager. {t("rights")}
                </Text>
            </div>
        </footer>
    );
}
