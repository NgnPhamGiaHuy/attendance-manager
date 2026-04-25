import * as React from "react";

import { Input as InputPrimitive } from "@base-ui/react/input";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
    return (
        <InputPrimitive
            type={type}
            data-slot="input"
            className={cn(
                "border-border/60 bg-card placeholder:text-muted-foreground/50 focus-visible:ring-primary/10 focus-visible:border-primary flex h-12 w-full rounded-xl border px-4 py-2 text-base transition-all focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
                className,
            )}
            {...props}
        />
    );
}

export { Input };
