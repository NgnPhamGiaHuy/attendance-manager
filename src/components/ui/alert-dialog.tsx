"use client";

import * as React from "react";

import { AlertDialog as AlertDialogPrimitive } from "@base-ui/react/alert-dialog";

import { Button } from "@/components/ui/button";
import { Heading, Text } from "@/components/ui/typography";
import { cn } from "@/lib/utils";

function AlertDialog({ ...props }: AlertDialogPrimitive.Root.Props) {
    return <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} />;
}

function AlertDialogTrigger({ ...props }: AlertDialogPrimitive.Trigger.Props) {
    return <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />;
}

function AlertDialogPortal({ ...props }: AlertDialogPrimitive.Portal.Props) {
    return <AlertDialogPrimitive.Portal data-slot="alert-dialog-portal" {...props} />;
}

function AlertDialogOverlay({ className, ...props }: AlertDialogPrimitive.Backdrop.Props) {
    return (
        <AlertDialogPrimitive.Backdrop
            data-slot="alert-dialog-overlay"
            className={cn(
                "data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 bg-near-black/20 fixed inset-0 isolate z-[300] backdrop-blur-[2px] transition-opacity duration-200",
                className,
            )}
            {...props}
        />
    );
}

function AlertDialogContent({
    className,
    size = "default",
    ...props
}: AlertDialogPrimitive.Popup.Props & {
    size?: "default" | "sm";
}) {
    return (
        <AlertDialogPortal>
            <AlertDialogOverlay />
            <AlertDialogPrimitive.Popup
                data-slot="alert-dialog-content"
                data-size={size}
                className={cn(
                    "bg-ivory text-near-black whisper-shadow ring-border/40 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 fixed top-1/2 left-1/2 z-[301] grid w-full -translate-x-1/2 -translate-y-1/2 gap-8 rounded-[32px] p-10 ring-1 duration-200 outline-none data-[size=default]:max-w-md data-[size=sm]:max-w-sm",
                    className,
                )}
                {...props}
            />
        </AlertDialogPortal>
    );
}

function AlertDialogHeader({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="alert-dialog-header"
            className={cn("flex flex-col gap-3", className)}
            {...props}
        />
    );
}

function AlertDialogFooter({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="alert-dialog-footer"
            className={cn("flex flex-col-reverse gap-4 pt-6 sm:flex-row sm:justify-end", className)}
            {...props}
        />
    );
}

function AlertDialogMedia({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="alert-dialog-media"
            className={cn(
                "bg-ivory ring-border/20 mb-2 inline-flex size-12 items-center justify-center rounded-2xl ring-1 *:[svg:not([class*='size-'])]:size-6",
                className,
            )}
            {...props}
        />
    );
}

function AlertDialogTitle({ className, ...props }: AlertDialogPrimitive.Title.Props) {
    return (
        <AlertDialogPrimitive.Title
            render={
                <Heading
                    data-slot="alert-dialog-title"
                    size="6"
                    className={cn("leading-tight", className)}
                />
            }
            {...props}
        />
    );
}

function AlertDialogDescription({ className, ...props }: AlertDialogPrimitive.Description.Props) {
    return (
        <AlertDialogPrimitive.Description
            render={
                <Text
                    data-slot="alert-dialog-description"
                    size="4"
                    color="olive"
                    className={cn("leading-relaxed", className)}
                />
            }
            {...props}
        />
    );
}

function AlertDialogAction({ className, ...props }: React.ComponentProps<typeof Button>) {
    return (
        <Button
            data-slot="alert-dialog-action"
            className={cn("rounded-xl px-8", className)}
            {...props}
        />
    );
}

function AlertDialogCancel({
    className,
    variant = "ghost",
    size = "default",
    ...props
}: AlertDialogPrimitive.Close.Props &
    Pick<React.ComponentProps<typeof Button>, "variant" | "size">) {
    return (
        <AlertDialogPrimitive.Close
            data-slot="alert-dialog-cancel"
            className={cn("rounded-xl px-6", className)}
            render={<Button variant={variant} size={size} />}
            {...props}
        />
    );
}

export {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogMedia,
    AlertDialogOverlay,
    AlertDialogPortal,
    AlertDialogTitle,
    AlertDialogTrigger,
};
