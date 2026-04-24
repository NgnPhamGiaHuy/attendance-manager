import { Metadata } from "next";

import { AppShell, AuthGuard } from "@/components/layout/app-shell";
import { DashboardPage } from "@/features/classes/components/dashboard-page";

export const metadata: Metadata = {
    title: "Dashboard",
};

export default function Page() {
    return (
        <AuthGuard>
            <AppShell title="Dashboard">
                <DashboardPage />
            </AppShell>
        </AuthGuard>
    );
}
