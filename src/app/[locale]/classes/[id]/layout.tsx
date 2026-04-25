import { Metadata } from "next";

import { AuthGuard } from "@/components/layout/app-shell";
import { ClassLayout } from "@/features/classes/components/class-layout";

export const metadata: Metadata = {
    title: "Class Details",
};

export default async function Layout(props: {
    children: React.ReactNode;
    params: Promise<{ id: string }>;
}) {
    const params = await props.params;

    return (
        <AuthGuard>
            <ClassLayout classId={params.id}>{props.children}</ClassLayout>
        </AuthGuard>
    );
}
