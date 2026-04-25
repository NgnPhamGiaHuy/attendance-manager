"use client";

import { useLocale, useTranslations } from "next-intl";

import { Bell, Languages, Moon, Shield, Volume2 } from "lucide-react";

import { PageContainer, PageHeader } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Text } from "@/components/ui/typography";
import { usePathname, useRouter } from "@/i18n/routing";

export function SettingsPage() {
    const t = useTranslations("settings");
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();

    const handleLocaleChange = (newLocale: string | null) => {
        if (!newLocale) return;
        router.replace(pathname, { locale: newLocale });
    };

    return (
        <PageContainer narrow>
            <PageHeader title={t("title")} description={t("description")} className="mb-8" />

            <div className="space-y-12">
                {/* Language Card */}
                <Card className="ring-border/40 rounded-[32px] border-none shadow-none ring-1">
                    <CardHeader className="px-8 pt-8">
                        <CardTitle>{t("language")}</CardTitle>
                        <CardDescription>{t("chooseLanguage")}</CardDescription>
                    </CardHeader>
                    <CardContent className="px-8 pb-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="bg-background ring-border/20 flex h-10 w-10 items-center justify-center rounded-xl ring-1">
                                    <Languages className="text-stone-gray h-5 w-5" />
                                </div>
                                <div className="space-y-0.5">
                                    <Text
                                        size="3"
                                        weight="medium"
                                        className="text-near-black block"
                                    >
                                        {locale === "vi" ? "Tiếng Việt" : "English"}
                                    </Text>
                                </div>
                            </div>

                            <Select defaultValue={locale} onValueChange={handleLocaleChange}>
                                <SelectTrigger className="bg-ivory ring-border/40 hover:ring-border/60 whisper-shadow h-11 w-[160px] rounded-xl border-none font-serif text-sm font-medium ring-1 transition-all">
                                    <SelectValue
                                        placeholder={locale === "vi" ? "Tiếng Việt" : "English"}
                                    />
                                </SelectTrigger>
                                <SelectContent
                                    align="end"
                                    className="bg-ivory border-border/20 rounded-xl shadow-xl"
                                >
                                    <SelectItem
                                        value="vi"
                                        className="focus:bg-background/80 cursor-pointer rounded-lg"
                                    >
                                        <div className="flex items-center gap-2 py-1 text-sm font-medium">
                                            🇻🇳 Tiếng Việt
                                        </div>
                                    </SelectItem>
                                    <SelectItem
                                        value="en"
                                        className="focus:bg-background/80 cursor-pointer rounded-lg"
                                    >
                                        <div className="flex items-center gap-2 py-1 text-sm font-medium">
                                            🇺🇸 English
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Appearance Card */}
                <Card className="ring-border/40 rounded-[32px] border-none shadow-none ring-1">
                    <CardHeader className="px-8 pt-8">
                        <CardTitle>{t("appearance")}</CardTitle>
                        <CardDescription>{t("appearanceDesc")}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8 px-8 pb-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="bg-background ring-border/20 flex h-10 w-10 items-center justify-center rounded-xl ring-1">
                                    <Moon className="text-stone-gray h-5 w-5" />
                                </div>
                                <div className="space-y-0.5">
                                    <Text size="3" weight="medium" className="block">
                                        {t("darkMode")}
                                    </Text>
                                    <Text size="1" color="stone" className="block">
                                        {t("darkModeDesc")}
                                    </Text>
                                </div>
                            </div>
                            <Switch />
                        </div>
                    </CardContent>
                </Card>

                {/* Notifications Card */}
                <Card className="ring-border/40 rounded-[32px] border-none shadow-none ring-1">
                    <CardHeader className="px-8 pt-8">
                        <CardTitle>{t("notifications")}</CardTitle>
                        <CardDescription>{t("notificationsDesc")}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8 px-8 pb-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="bg-background ring-border/20 flex h-10 w-10 items-center justify-center rounded-xl ring-1">
                                    <Bell className="text-stone-gray h-5 w-5" />
                                </div>
                                <div className="space-y-0.5">
                                    <Text size="3" weight="medium" className="block">
                                        {t("emailNotifications")}
                                    </Text>
                                    <Text size="1" color="stone" className="block">
                                        {t("emailNotificationsDesc")}
                                    </Text>
                                </div>
                            </div>
                            <Switch defaultChecked />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="bg-background ring-border/20 flex h-10 w-10 items-center justify-center rounded-xl ring-1">
                                    <Volume2 className="text-stone-gray h-5 w-5" />
                                </div>
                                <div className="space-y-0.5">
                                    <Text size="3" weight="medium" className="block">
                                        {t("soundEffects")}
                                    </Text>
                                    <Text size="1" color="stone" className="block">
                                        {t("soundEffectsDesc")}
                                    </Text>
                                </div>
                            </div>
                            <Switch defaultChecked />
                        </div>
                    </CardContent>
                </Card>

                {/* Privacy Card */}
                <Card className="ring-border/40 rounded-[32px] border-none shadow-none ring-1">
                    <CardHeader className="px-8 pt-8">
                        <CardTitle>{t("privacy")}</CardTitle>
                        <CardDescription>{t("privacyDesc")}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8 px-8 pb-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="bg-background ring-border/20 flex h-10 w-10 items-center justify-center rounded-xl ring-1">
                                    <Shield className="text-stone-gray h-5 w-5" />
                                </div>
                                <div className="space-y-0.5">
                                    <Text size="3" weight="medium" className="block">
                                        {t("showProfile")}
                                    </Text>
                                    <Text size="1" color="stone" className="block">
                                        {t("showProfileDesc")}
                                    </Text>
                                </div>
                            </div>
                            <Switch defaultChecked />
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end pt-2">
                    <Button className="whisper-shadow rounded-xl px-8 font-serif">
                        {t("savePreferences")}
                    </Button>
                </div>
            </div>
        </PageContainer>
    );
}
