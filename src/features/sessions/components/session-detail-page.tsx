"use client";

import { PageContainer, PageHeader } from "@/components/layout/app-shell";
import { useClass } from "@/features/classes/hooks/useClasses";
import { SessionPage } from "@/features/sessions/components/session-page";
import { formatDate } from "@/lib/utils";

interface SessionDetailPageProps {
    classId: string;
    sessionId: string;
}

export function SessionDetailPage({ classId, sessionId }: SessionDetailPageProps) {
    const { data: classData } = useClass(classId);

    return (
        <PageContainer>
            <div className="animate-fade-in mb-6">
                <PageHeader
                    title={`Attendance — ${classData.name}`}
                    description={`Session on ${formatDate(new Date())}`}
                />
            </div>
            <SessionPage sessionId={sessionId} classData={classData} />
        </PageContainer>
    );
}
