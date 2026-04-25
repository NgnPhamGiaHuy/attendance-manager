import * as React from "react";

import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

import type { VariantProps } from "class-variance-authority";

// ─── Heading ──────────────────────────────────────────────────────────────────

const headingVariants = cva("font-serif text-foreground tracking-tight", {
    variants: {
        size: {
            "1": "text-sm font-bold uppercase tracking-widest text-muted-foreground",
            "2": "text-base font-semibold",
            "3": "text-lg font-medium",
            "4": "text-xl font-medium",
            "5": "text-2xl font-medium",
            "6": "text-3xl font-medium",
            "7": "text-4xl font-medium",
            "8": "text-5xl font-medium leading-[1.1]",
            "9": "text-6xl font-medium leading-[1.05]",
        },
        weight: {
            light: "font-light",
            regular: "font-normal",
            medium: "font-medium",
            semibold: "font-semibold",
            bold: "font-bold",
        },
        align: {
            left: "text-left",
            center: "text-center",
            right: "text-right",
        },
        trim: {
            normal: "",
            both: "mt-[-0.2em] mb-[-0.2em]",
            top: "mt-[-0.2em]",
            bottom: "mb-[-0.2em]",
        },
    },
    defaultVariants: {
        size: "6",
        weight: "medium",
        align: "left",
        trim: "normal",
    },
});

export interface HeadingProps
    extends React.HTMLAttributes<HTMLHeadingElement>,
        VariantProps<typeof headingVariants> {
    asChild?: boolean;
    as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "div";
}

const Heading = React.forwardRef<any, HeadingProps>(
    ({ className, size, weight, align, trim, asChild = false, as: Tag = "h1", ...props }, ref) => {
        const Comp = asChild ? Slot : Tag;
        return (
            <Comp
                className={cn(headingVariants({ size, weight, align, trim, className }))}
                ref={ref}
                {...props}
            />
        );
    },
);
Heading.displayName = "Heading";

// ─── Text ─────────────────────────────────────────────────────────────────────

const textVariants = cva("font-sans text-foreground", {
    variants: {
        size: {
            "1": "text-[11px] leading-4",
            "2": "text-xs leading-4",
            "3": "text-sm leading-5",
            "4": "text-base leading-6",
            "5": "text-lg leading-7",
            "6": "text-xl leading-7",
            "7": "text-2xl leading-8",
            "8": "text-3xl leading-9",
            "9": "text-4xl leading-10",
        },
        weight: {
            light: "font-light",
            regular: "font-normal",
            medium: "font-medium",
            semibold: "font-semibold",
            bold: "font-bold",
        },
        color: {
            default: "text-foreground",
            olive: "text-muted-foreground",
            stone: "text-muted-foreground",
            terracotta: "text-primary",
            white: "text-white",
            muted: "text-muted-foreground",
            destructive: "text-destructive",
        },
        align: {
            left: "text-left",
            center: "text-center",
            right: "text-right",
        },
    },
    defaultVariants: {
        size: "3",
        weight: "regular",
        color: "default",
        align: "left",
    },
});

export interface TextProps
    extends Omit<React.HTMLAttributes<any>, "color">,
        VariantProps<typeof textVariants> {
    asChild?: boolean;
    as?: "span" | "div" | "p" | "label";
}

const Text = React.forwardRef<any, TextProps>(
    (
        { className, size, weight, color, align, asChild = false, as: Tag = "span", ...props },
        ref,
    ) => {
        const Comp = asChild ? Slot : Tag;
        return (
            <Comp
                className={cn(textVariants({ size, weight, color, align, className }))}
                ref={ref}
                {...props}
            />
        );
    },
);
Text.displayName = "Text";

export { Heading, Text };
