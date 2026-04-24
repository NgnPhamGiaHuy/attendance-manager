"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { Loader2 } from "lucide-react";

import { Heading, Text } from "@/components/ui/typography";
import { useAuth } from "@/providers/auth-provider";

export default function LogoutPage() {
    const { signOutUser } = useAuth();
    const router = useRouter();

    useEffect(() => {
        const performLogout = async () => {
            try {
                await signOutUser();
                // Brief delay for better UX transition
                setTimeout(() => {
                    router.push("/login");
                }, 800);
            } catch (error) {
                console.error("Logout error:", error);
                router.push("/login");
            }
        };

        performLogout();
    }, [signOutUser, router]);

    return (
        <div className="bg-background text-near-black flex min-h-screen flex-col items-center justify-center">
            <div className="animate-fade-in flex flex-col items-center gap-8">
                <div className="bg-ivory ring-border/40 whisper-shadow flex h-20 w-20 items-center justify-center rounded-3xl ring-1">
                    <Loader2 className="text-terracotta h-10 w-10 animate-spin" />
                </div>
                <div className="space-y-3 text-center">
                    <Heading size="6" as="h1">
                        Signing out
                    </Heading>
                    <Text size="4" color="olive" className="leading-relaxed" as="p">
                        Cleaning up your session. Just a moment.
                    </Text>
                </div>
            </div>
        </div>
    );
}
