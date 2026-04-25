import { Metadata } from "next";

import { AppShell, AuthGuard } from "@/components/layout/app-shell";
import { SettingsPage } from "@/features/settings/components/settings-page";

export const metadata: Metadata = {
    title: "Settings",
};

export default function Page() {
    return (
        <AuthGuard>
            <AppShell title="Settings">
                <SettingsPage />
            </AppShell>
        </AuthGuard>
    );
}
