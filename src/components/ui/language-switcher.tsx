"use client";

import { useLocale, useTranslations } from "next-intl";

import { Languages } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePathname, useRouter } from "@/i18n/routing";
import { cn } from "@/lib/utils";

interface LanguageSwitcherProps {
    className?: string;
    variant?: "ghost" | "outline" | "default";
}

export function LanguageSwitcher({ className, variant = "ghost" }: LanguageSwitcherProps) {
    const t = useTranslations("settings");
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();

    const handleLocaleChange = (newLocale: string) => {
        router.replace(pathname, { locale: newLocale });
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                render={(triggerProps) => (
                    <Button
                        {...triggerProps}
                        variant={variant}
                        size="icon"
                        className={cn("h-9 w-9 rounded-xl", className)}
                        aria-label={t("language")}
                    >
                        <Languages className="text-muted-foreground h-5 w-5" />
                    </Button>
                )}
            />
            <DropdownMenuContent align="end" className="w-40 rounded-xl">
                <DropdownMenuItem
                    className={cn(
                        "flex cursor-pointer items-center gap-2 rounded-lg",
                        locale === "vi" && "bg-card font-medium",
                    )}
                    onClick={() => handleLocaleChange("vi")}
                >
                    <span className="text-lg">🇻🇳</span>
                    <span>Tiếng Việt</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                    className={cn(
                        "flex cursor-pointer items-center gap-2 rounded-lg",
                        locale === "en" && "bg-card font-medium",
                    )}
                    onClick={() => handleLocaleChange("en")}
                >
                    <span className="text-lg">🇺🇸</span>
                    <span>English</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                    className={cn(
                        "flex cursor-pointer items-center gap-2 rounded-lg",
                        locale === "ja" && "bg-card font-medium",
                    )}
                    onClick={() => handleLocaleChange("ja")}
                >
                    <span className="text-lg">🇯🇵</span>
                    <span>日本語</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
