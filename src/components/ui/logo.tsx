import Link from "next/link";

import { cn } from "@/lib/utils";

export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
    return (
        <Link
            href={href}
            className={cn("flex items-center gap-3 transition-opacity hover:opacity-80", className)}
        >
            <div className="bg-near-black flex h-9 w-9 items-center justify-center rounded-lg shadow-sm">
                <span className="text-ivory text-xs font-bold tracking-tighter uppercase">A</span>
            </div>
            <span className="text-near-black font-serif text-xl font-medium tracking-tight">
                Attendance
            </span>
        </Link>
    );
}
