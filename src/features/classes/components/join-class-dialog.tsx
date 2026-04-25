"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Key, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Text } from "@/components/ui/typography";
import { useJoinClass } from "@/features/classes/hooks/useClasses";

export function JoinClassDialog() {
    const [open, setOpen] = useState(false);
    const [code, setCode] = useState("");
    const joinClass = useJoinClass();
    const router = useRouter();

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Strip everything except alphanumeric characters
        const cleanCode = code.replace(/[^A-Z0-9]/gi, "").toUpperCase();

        if (cleanCode.length !== 6) {
            toast.error("Class code must be exactly 6 characters.");
            return;
        }

        try {
            // Re-insert the hyphen matching our generated class code format "XX-XXXX"
            const formattedCode = `${cleanCode.slice(0, 2)}-${cleanCode.slice(2)}`;

            const classId = await joinClass.mutateAsync(formattedCode);
            toast.success("Successfully joined the class!");
            setOpen(false);
            setCode("");
            // Send the user directly to the new class
            router.push(`/classes/${classId}`);
        } catch (error: any) {
            console.error(error);
            toast.error(
                error.message || "Failed to join class. Please check the code and try again.",
            );
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger
                render={
                    <Button
                        variant="outline"
                        className="whisper-shadow border-border/60 hover:bg-ivory rounded-xl px-6"
                    >
                        <Key className="mr-2.5 h-4 w-4" />
                        Join Class
                    </Button>
                }
            />
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Join Class</DialogTitle>
                    <DialogDescription>
                        <Text size="4" color="olive" className="leading-relaxed">
                            Enter the 6-character class code provided by your instructor to join.
                        </Text>
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={onSubmit} className="space-y-8 py-2">
                    <div className="space-y-4">
                        <Label
                            htmlFor="code"
                            className="text-stone-gray ml-1 text-xs font-bold tracking-widest uppercase"
                        >
                            Class Code
                        </Label>
                        <Input
                            id="code"
                            placeholder="XX-XXXX"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            disabled={joinClass.isPending}
                            autoFocus
                            className="bg-background border-border/40 focus:border-terracotta focus:ring-terracotta/10 h-16 px-4 text-center font-serif text-3xl font-medium tracking-[0.2em] uppercase"
                            maxLength={7}
                        />
                    </div>

                    <DialogFooter>
                        <DialogClose
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
                            disabled={joinClass.isPending || code.length < 6}
                            className="rounded-xl px-8 font-serif text-lg"
                        >
                            {joinClass.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Join
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
