"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus } from "lucide-react";
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
import { Heading, Text } from "@/components/ui/typography";
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
        formState: { errors },
    } = useForm<FormData>({
        resolver: zodResolver(formSchema),
    });

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
                <SheetHeader>
                    <SheetTitle>
                        <Heading size="6">Create Class</Heading>
                    </SheetTitle>
                    <SheetDescription>
                        <Text size="4" color="olive" className="leading-relaxed">
                            Set up a new space to track attendance. You can configure custom
                            statuses and grading rules later.
                        </Text>
                    </SheetDescription>
                </SheetHeader>

                <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="flex-1 space-y-8 overflow-y-auto px-10 py-6"
                >
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <Label
                                htmlFor="name"
                                className="text-stone-gray ml-1 text-xs font-bold tracking-widest uppercase"
                            >
                                Class Name
                            </Label>
                            <Input
                                id="name"
                                placeholder="e.g. CS101: Intro to Computer Science"
                                {...register("name")}
                                disabled={createClass.isPending}
                                autoFocus
                            />
                            {errors.name && (
                                <Text
                                    size="1"
                                    color="terracotta"
                                    className="animate-fade-in ml-1 font-medium"
                                >
                                    {errors.name.message}
                                </Text>
                            )}
                        </div>
                        <div className="space-y-3">
                            <Label
                                htmlFor="description"
                                className="text-stone-gray ml-1 text-xs font-bold tracking-widest uppercase"
                            >
                                Description (Optional)
                            </Label>
                            <Input
                                id="description"
                                placeholder="e.g. Fall 2026, Section 2"
                                {...register("description")}
                                disabled={createClass.isPending}
                            />
                            {errors.description && (
                                <Text
                                    size="1"
                                    color="terracotta"
                                    className="animate-fade-in ml-1 font-medium"
                                >
                                    {errors.description.message}
                                </Text>
                            )}
                        </div>
                    </div>
                </form>

                <SheetFooter>
                    <SheetClose
                        render={
                            <Button
                                type="button"
                                variant="ghost"
                                className="text-stone-gray rounded-xl px-6 font-serif"
                            >
                                Cancel
                            </Button>
                        }
                    />
                    <Button
                        type="submit"
                        disabled={createClass.isPending}
                        onClick={handleSubmit(onSubmit)}
                        className="rounded-xl px-8 font-serif text-lg"
                    >
                        {createClass.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create Class
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
