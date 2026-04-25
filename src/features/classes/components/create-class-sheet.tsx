"use client";

import { useTranslations } from "next-intl";
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

export function CreateClassSheet() {
    const t = useTranslations("classes");
    const tCommon = useTranslations("common");
    const [open, setOpen] = useState(false);
    const createClass = useCreateClass();

    const formSchema = z.object({
        name: z.string().min(2, t("nameMin")).max(50, t("nameMax")),
        description: z.string().max(100, t("descMax")).optional(),
    });

    type FormData = z.infer<typeof formSchema>;

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
            toast.success(t("createSuccess"));
            setOpen(false);
            reset();
        } catch (error) {
            console.error(error);
            toast.error(t("createFailed"));
        }
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
                render={
                    <Button className="whisper-shadow h-11 rounded-xl px-6 text-sm font-medium">
                        <Plus className="mr-2 h-4 w-4" />
                        {t("create")}
                    </Button>
                }
            />
            <SheetContent side="right">
                {/* Decorative header band */}
                <div className="from-primary/10 to-primary/5 border-border/40 absolute inset-x-0 top-0 h-1.5 rounded-t-[inherit] bg-gradient-to-r" />

                <SheetHeader className="pb-4">
                    {/* Icon badge */}
                    <div className="bg-primary/10 border-primary/20 mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border">
                        <BookOpen className="text-primary h-5 w-5" />
                    </div>

                    <SheetTitle>{t("createTitle")}</SheetTitle>
                    <SheetDescription>{t("createDesc")}</SheetDescription>
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
                                className="text-muted-foreground ml-1 text-[11px] font-bold tracking-widest uppercase"
                            >
                                {t("className")}
                            </Label>
                            <Text
                                size="1"
                                color="stone"
                                className={nameValue.length > 45 ? "text-primary" : ""}
                            >
                                {nameValue.length}/50
                            </Text>
                        </div>
                        <Input
                            id="name"
                            placeholder={t("classNamePlaceholder")}
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
                                {t("visibleToStudents")}
                            </Text>
                        )}
                    </div>

                    {/* Description */}
                    <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                            <Label
                                htmlFor="description"
                                className="text-muted-foreground ml-1 text-[11px] font-bold tracking-widest uppercase"
                            >
                                {t("classDesc")}
                            </Label>
                            <Text
                                size="1"
                                color="stone"
                                className={descValue.length > 90 ? "text-primary" : ""}
                            >
                                {descValue.length}/100
                            </Text>
                        </div>
                        <Textarea
                            id="description"
                            placeholder={t("classDescPlaceholder")}
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
                                {t("helpIdentify")}
                            </Text>
                        )}
                    </div>

                    {/* Hint card */}
                    <div className="bg-background border-border/60 flex items-start gap-3 rounded-2xl border p-4">
                        <Sparkles className="text-primary/70 mt-0.5 h-4 w-4 shrink-0" />
                        <Text size="2" color="olive" className="leading-relaxed">
                            {t("createHint")}
                        </Text>
                    </div>
                </form>

                <SheetFooter className="border-border/40 border-t pt-6">
                    <SheetClose
                        render={
                            <Button
                                type="button"
                                variant="ghost"
                                className="text-muted-foreground hover:text-foreground w-full rounded-xl font-serif text-sm font-medium"
                            >
                                {tCommon("cancel")}
                            </Button>
                        }
                    />
                    <Button
                        type="submit"
                        size="lg"
                        disabled={createClass.isPending}
                        onClick={handleSubmit(onSubmit)}
                        className="whisper-shadow w-full rounded-2xl font-serif font-semibold"
                    >
                        {createClass.isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {t("creating")}
                            </>
                        ) : (
                            <>
                                <Plus className="mr-2 h-4 w-4" />
                                {t("create")}
                            </>
                        )}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
