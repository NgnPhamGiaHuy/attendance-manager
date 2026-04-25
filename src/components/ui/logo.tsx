import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
    return (
        <Link
            href={href}
            className={cn("flex items-center gap-3 transition-opacity hover:opacity-80", className)}
        >
            <div className="bg-primary ring-primary/10 flex h-9 w-9 items-center justify-center rounded-xl shadow-sm ring-1">
                <span className="text-primary-foreground font-serif text-base font-bold tracking-tighter uppercase">
                    A
                </span>
            </div>
            <span className="text-foreground font-serif text-xl font-medium tracking-tight">
                Attendance
            </span>
        </Link>
    );
}
