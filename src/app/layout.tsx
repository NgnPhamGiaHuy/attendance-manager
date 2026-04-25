import { Inter, JetBrains_Mono } from "next/font/google";

import { OfflineBanner } from "@/components/layout/offline-banner";
import { Providers } from "@/providers/providers";

import type { Metadata } from "next";

import "./globals.css";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
    display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
    subsets: ["latin"],
    variable: "--font-jetbrains",
    display: "swap",
});

export const metadata: Metadata = {
    title: {
        default: "Attendance Manager",
        template: "%s — Attendance Manager",
    },
    description:
        "Fast, real-time attendance tracking for educators. Mark attendance in seconds, view records instantly.",
    keywords: ["attendance", "classroom", "teacher", "education"],
    authors: [{ name: "Attendance Manager" }],
    openGraph: {
        type: "website",
        title: "Attendance Manager",
        description: "Fast, real-time attendance tracking for educators.",
    },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <html
            lang="en"
            className={`${inter.variable} ${jetbrainsMono.variable} h-full`}
            suppressHydrationWarning
        >
            <body className="flex min-h-full flex-col antialiased">
                <OfflineBanner />
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
