import { getTranslations } from "next-intl/server";

import { AppShell, AuthGuard } from "@/components/layout/app-shell";
import { DashboardPage } from "@/features/classes/components/dashboard-page";

export async function generateMetadata(props: { params: Promise<{ locale: string }> }) {
    const { locale } = await props.params;
    const t = await getTranslations({ locale, namespace: "common" });
    return {
        title: t("dashboard"),
    };
}

export default async function Page(props: { params: Promise<{ locale: string }> }) {
    const { locale } = await props.params;
    const t = await getTranslations({ locale, namespace: "common" });

    return (
        <AuthGuard>
            <AppShell title={t("dashboard")}>
                <DashboardPage />
            </AppShell>
        </AuthGuard>
    );
}
