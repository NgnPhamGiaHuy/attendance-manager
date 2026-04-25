import { Inter, JetBrains_Mono } from "next/font/google";

import { OfflineBanner } from "@/components/layout/offline-banner";
import { Providers } from "@/providers/providers";

import type { Metadata } from "next";

import "../globals.css";

import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { routing } from "@/i18n/routing";

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

export default async function RootLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;

    // Ensure that the incoming `locale` is valid
    if (!routing.locales.includes(locale as any)) {
        notFound();
    }

    setRequestLocale(locale);
    const messages = await getMessages();

    return (
        <html
            lang={locale}
            className={`${inter.variable} ${jetbrainsMono.variable} h-full`}
            suppressHydrationWarning
            data-scroll-behavior="smooth"
        >
            <body className="flex min-h-full flex-col antialiased" suppressHydrationWarning>
                <NextIntlClientProvider locale={locale} messages={messages}>
                    <OfflineBanner />
                    <Providers>{children}</Providers>
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
