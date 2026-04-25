import * as React from "react";

import { Heading, Text } from "@/components/ui/typography";
import { cn } from "@/lib/utils";

function Card({
    className,
    size = "default",
    ...props
}: React.ComponentProps<"div"> & { size?: "default" | "sm" }) {
    return (
        <div
            data-slot="card"
            data-size={size}
            className={cn(
                "group/card bg-card text-foreground ring-border/60 whisper-shadow flex flex-col overflow-hidden rounded-2xl ring-1",
                className,
            )}
            {...props}
        />
    );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="card-header"
            className={cn(
                "group/card-header @container/card-header grid auto-rows-min items-start gap-2 rounded-t-xl p-10 pb-6 group-data-[size=sm]/card:p-6 group-data-[size=sm]/card:pb-4 has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-6",
                className,
            )}
            {...props}
        />
    );
}

function CardTitle({ className, ...props }: React.ComponentProps<typeof Heading>) {
    return (
        <Heading
            as="h3"
            size="5"
            data-slot="card-title"
            className={cn("group-data-[size=sm]/card:text-base", className)}
            {...props}
        />
    );
}

function CardDescription({ className, ...props }: React.ComponentProps<typeof Text>) {
    return (
        <Text
            as="p"
            size="3"
            color="olive"
            data-slot="card-description"
            className={cn("leading-relaxed", className)}
            {...props}
        />
    );
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="card-action"
            className={cn(
                "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
                className,
            )}
            {...props}
        />
    );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="card-content"
            className={cn(
                "p-10 pt-0 group-data-[size=sm]/card:p-6 group-data-[size=sm]/card:pt-0",
                className,
            )}
            {...props}
        />
    );
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="card-footer"
            className={cn("mt-auto flex items-center p-6 pt-0", className)}
            {...props}
        />
    );
}

export { Card, CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardContent };
