import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";

export function SiteHeader() {
    return (
        <header className="absolute top-0 z-50 flex w-full items-center justify-between px-10 py-8">
            <Logo />
            <div className="flex items-center gap-4">
                <Button
                    asChild
                    variant="ghost"
                    className="text-stone-gray hover:text-near-black font-medium"
                >
                    <Link href="/login">Sign In</Link>
                </Button>
                <Button asChild variant="default" className="rounded-xl px-8 shadow-sm">
                    <Link href="/login">Get Started</Link>
                </Button>
            </div>
        </header>
    );
}
