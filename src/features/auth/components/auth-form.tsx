"use client";

import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useRouter } from "@/i18n/routing";
import { useAuth } from "@/providers/auth-provider";

export function AuthForm() {
    const t = useTranslations("auth");
    const { signInWithGoogle, signInWithEmail } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectPath = searchParams.get("redirect") || "/dashboard";

    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);

    const handleGoogleSignIn = useCallback(async () => {
        setIsGoogleLoading(true);
        try {
            await signInWithGoogle();
            router.push(redirectPath);
        } catch (error) {
            console.error(error);
            toast.error(t("googleError"));
        } finally {
            setIsGoogleLoading(false);
        }
    }, [signInWithGoogle, router, redirectPath]);

    const handleEmailSignIn = useCallback(
        async (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const email = formData.get("email") as string;
            const password = formData.get("password") as string;

            if (!email || !password) {
                toast.error(t("missingFields"));
                return;
            }

            setIsLoading(true);
            try {
                await signInWithEmail(email, password);
                router.push(redirectPath);
            } catch (error) {
                console.error(error);
                toast.error(t("invalidCredentials"));
            } finally {
                setIsLoading(false);
            }
        },
        [signInWithEmail, router, redirectPath],
    );

    return (
        <div className="animate-fade-in flex w-full flex-col gap-8">
            <div className="flex flex-col gap-4">
                <Button
                    variant="secondary"
                    onClick={handleGoogleSignIn}
                    disabled={isGoogleLoading || isLoading}
                    className="bg-card border-border/60 hover:bg-background ring-shadow w-full rounded-xl border"
                >
                    {isGoogleLoading ? (
                        <Loader2 className="text-muted-foreground mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                        <path
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            fill="#4285F4"
                        />
                        <path
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            fill="#34A853"
                        />
                        <path
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                            fill="#FBBC05"
                        />
                        <path
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            fill="#EA4335"
                        />
                    </svg>
                    {t("continueWithGoogle")}
                </Button>

                <div className="relative my-2">
                    <div className="absolute inset-0 flex items-center">
                        <span className="border-border/60 w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                        <span className="bg-background text-muted-foreground px-4 text-[10px] font-medium tracking-widest uppercase">
                            {t("orUseEmail")}
                        </span>
                    </div>
                </div>

                <form onSubmit={handleEmailSignIn} className="flex flex-col gap-5">
                    <div className="grid gap-2">
                        <Label
                            htmlFor="email"
                            className="text-muted-foreground ml-1 text-xs font-semibold tracking-wider uppercase"
                        >
                            {t("emailAddress")}
                        </Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="name@university.edu"
                            required
                            disabled={isLoading || isGoogleLoading}
                            className="bg-card border-border/60 focus:bg-background h-12 rounded-xl transition-colors"
                        />
                    </div>
                    <div className="grid gap-2">
                        <div className="flex items-center">
                            <Label
                                htmlFor="password"
                                className="text-muted-foreground ml-1 text-xs font-semibold tracking-wider uppercase"
                            >
                                {t("password")}
                            </Label>
                        </div>
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            required
                            disabled={isLoading || isGoogleLoading}
                            className="bg-card border-border/60 focus:bg-background h-12 rounded-xl transition-colors"
                        />
                    </div>
                    <Button
                        type="submit"
                        disabled={isLoading || isGoogleLoading}
                        className="mt-2 h-12 w-full rounded-xl font-serif text-lg"
                    >
                        {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                        {t("signIn")}
                    </Button>
                </form>
            </div>
        </div>
    );
}
