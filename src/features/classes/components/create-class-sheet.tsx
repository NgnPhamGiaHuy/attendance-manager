"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";
import { BookOpen, Loader2, Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Text } from "@/components/ui/typography";
import { useCreateClass } from "@/features/classes/hooks/useClasses";

const formSchema = z.object({
    name: z
        .string()
        .min(2, "Class name must be at least 2 characters")
        .max(50, "Class name must be less than 50 characters"),
    description: z.string().max(100, "Description must be less than 100 characters").optional(),
});

type FormData = z.infer<typeof formSchema>;

export function CreateClassSheet() {
    const [open, setOpen] = useState(false);
    const createClass = useCreateClass();

    const {
        register,
        handleSubmit,
        reset,
        watch,
        formState: { errors },
    } = useForm<FormData>({
        resolver: zodResolver(formSchema),
    });

    const nameValue = watch("name") ?? "";
    const descValue = watch("description") ?? "";

    const onSubmit = async (data: FormData) => {
        try {
            await createClass.mutateAsync(data);
            toast.success("Class created successfully!");
            setOpen(false);
            reset();
        } catch (error) {
            console.error(error);
            toast.error("Failed to create class. Please try again.");
        }
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
                render={
                    <Button className="whisper-shadow rounded-xl px-6">
                        <Plus className="mr-2 h-4 w-4" />
                        New Class
                    </Button>
                }
            />
            <SheetContent side="right">
                {/* Decorative header band */}
                <div className="from-terracotta/8 to-terracotta/3 border-border/40 absolute inset-x-0 top-0 h-1.5 rounded-t-[inherit] bg-gradient-to-r" />

                <SheetHeader className="pb-4">
                    {/* Icon badge */}
                    <div className="bg-terracotta/10 border-terracotta/20 mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border">
                        <BookOpen className="text-terracotta h-5 w-5" />
                    </div>

                    <SheetTitle>Create a New Class</SheetTitle>
                    <SheetDescription>
                        Give your class a name and an optional description. You can configure custom
                        statuses and grading rules from Settings later.
                    </SheetDescription>
                </SheetHeader>

                <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="flex-1 space-y-6 overflow-y-auto px-10 py-4"
                >
                    {/* Class Name */}
                    <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                            <Label
                                htmlFor="name"
                                className="text-stone-gray ml-1 text-[11px] font-bold tracking-widest uppercase"
                            >
                                Class Name
                            </Label>
                            <Text
                                size="1"
                                color="stone"
                                className={nameValue.length > 45 ? "text-terracotta" : ""}
                            >
                                {nameValue.length}/50
                            </Text>
                        </div>
                        <Input
                            id="name"
                            placeholder="e.g. CS101: Intro to Computer Science"
                            {...register("name")}
                            disabled={createClass.isPending}
                            autoFocus
                            className="h-12 text-base"
                        />
                        {errors.name ? (
                            <Text
                                size="1"
                                color="terracotta"
                                className="animate-fade-in ml-1 font-medium"
                            >
                                {errors.name.message}
                            </Text>
                        ) : (
                            <Text size="1" color="stone" className="ml-1">
                                This will be visible to all enrolled students.
                            </Text>
                        )}
                    </div>

                    {/* Description */}
                    <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                            <Label
                                htmlFor="description"
                                className="text-stone-gray ml-1 text-[11px] font-bold tracking-widest uppercase"
                            >
                                Description
                                <span className="text-stone-gray/60 ml-1.5 tracking-normal normal-case">
                                    (optional)
                                </span>
                            </Label>
                            <Text
                                size="1"
                                color="stone"
                                className={descValue.length > 90 ? "text-terracotta" : ""}
                            >
                                {descValue.length}/100
                            </Text>
                        </div>
                        <Textarea
                            id="description"
                            placeholder="e.g. Fall 2026, Section 2 — Mon/Wed 10–11:30am"
                            {...register("description")}
                            disabled={createClass.isPending}
                            rows={3}
                            className="resize-none"
                        />
                        {errors.description ? (
                            <Text
                                size="1"
                                color="terracotta"
                                className="animate-fade-in ml-1 font-medium"
                            >
                                {errors.description.message}
                            </Text>
                        ) : (
                            <Text size="1" color="stone" className="ml-1">
                                Helps students identify the right class.
                            </Text>
                        )}
                    </div>

                    {/* Hint card */}
                    <div className="bg-background border-border/60 flex items-start gap-3 rounded-2xl border p-4">
                        <Sparkles className="text-terracotta/70 mt-0.5 h-4 w-4 shrink-0" />
                        <Text size="2" color="olive" className="leading-relaxed">
                            After creating, you can set up custom attendance statuses, scoring
                            rules, and invite students from the class settings.
                        </Text>
                    </div>
                </form>

                <SheetFooter className="border-border/40 border-t pt-6">
                    <SheetClose
                        render={
                            <Button
                                type="button"
                                variant="ghost"
                                className="text-stone-gray hover:text-near-black rounded-xl px-6"
                            >
                                Cancel
                            </Button>
                        }
                    />
                    <Button
                        type="submit"
                        disabled={createClass.isPending || nameValue.trim().length < 2}
                        onClick={handleSubmit(onSubmit)}
                        className="whisper-shadow flex-1 rounded-xl text-base"
                    >
                        {createClass.isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creating…
                            </>
                        ) : (
                            <>
                                <Plus className="mr-2 h-4 w-4" />
                                Create Class
                            </>
                        )}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
