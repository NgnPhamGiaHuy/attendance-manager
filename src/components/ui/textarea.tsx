import * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
    return (
        <textarea
            data-slot="textarea"
            className={cn(
                "border-border/60 bg-card placeholder:text-muted-foreground/50 focus-visible:ring-primary/10 focus-visible:border-primary flex min-h-16 w-full rounded-xl border px-4 py-3 text-base transition-all focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
                className,
            )}
            {...props}
        />
    );
}

export { Textarea };
