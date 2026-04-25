"use client";

import { ThemeProvider } from "next-themes";
import { useState } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/providers/auth-provider";

export function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 1000 * 60 * 2, // 2 minutes
                        retry: 1,
                        refetchOnWindowFocus: false,
                    },
                    mutations: {
                        retry: 0,
                    },
                },
            }),
    );

    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
                <AuthProvider>
                    <TooltipProvider>{children}</TooltipProvider>
                    <Toaster
                        position="bottom-right"
                        richColors
                        closeButton
                        toastOptions={{
                            duration: 4000,
                            classNames: {
                                toast: "font-sans text-sm",
                            },
                        }}
                    />
                </AuthProvider>
            </ThemeProvider>
            {process.env.NODE_ENV === "development" && <ReactQueryDevtools initialIsOpen={false} />}
        </QueryClientProvider>
    );
}
