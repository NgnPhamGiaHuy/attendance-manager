import { Metadata } from "next";

import { AppShell, AuthGuard } from "@/components/layout/app-shell";
import { ProfilePage } from "@/features/profile/components/profile-page";

export const metadata: Metadata = {
    title: "Profile",
};

export default function Page() {
    return (
        <AuthGuard>
            <AppShell title="Profile">
                <ProfilePage />
            </AppShell>
        </AuthGuard>
    );
}
