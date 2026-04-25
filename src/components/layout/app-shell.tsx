"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";

import { LogOut, Settings, User as UserIcon } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { Logo } from "@/components/ui/logo";
import { Heading, Text } from "@/components/ui/typography";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { cn, getInitials } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";

// ─── TopBar ───────────────────────────────────────────────────────────────────

interface TopBarProps {
    title?: string;
}

export function TopBar({ title }: TopBarProps) {
    const { user } = useAuth();
    const tAuth = useTranslations("auth");
    const tCommon = useTranslations("common");

    return (
        <header className="border-border/40 bg-background/95 sticky top-0 z-10 flex h-16 items-center border-b px-6 backdrop-blur-sm">
            <div className="flex flex-1 items-center gap-4">
                <Logo href="/dashboard" className="origin-left scale-90" />

                {title && (
                    <div className="flex items-center gap-4">
                        <div className="bg-border/40 h-6 w-px" />
                        <Heading
                            size="3"
                            as="h1"
                            className="text-olive-gray max-w-[200px] truncate sm:max-w-xs"
                        >
                            {title}
                        </Heading>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-2">
                <LanguageSwitcher />
                <div className="bg-border/40 mx-1 h-6 w-px" />
                {user && (
                    <DropdownMenu>
                        <DropdownMenuTrigger
                            render={(triggerProps) => (
                                <Button
                                    {...triggerProps}
                                    variant="ghost"
                                    size="icon"
                                    className={cn(
                                        "focus-visible:ring-terracotta/20 relative h-9 w-9 cursor-pointer rounded-full outline-none focus-visible:ring-2",
                                        triggerProps.className,
                                    )}
                                    aria-label={tAuth("account")}
                                >
                                    <Avatar className="ring-border/40 group-hover:whisper-shadow h-full w-full ring-1 transition-shadow">
                                        <AvatarImage
                                            src={user.photoURL ?? undefined}
                                            alt={user.displayName}
                                        />
                                        <AvatarFallback className="bg-ivory text-near-black text-[10px] font-bold tracking-wider uppercase">
                                            {getInitials(user.displayName)}
                                        </AvatarFallback>
                                    </Avatar>
                                </Button>
                            )}
                        />
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>{tAuth("account")}</DropdownMenuLabel>
                            <div className="px-3 py-2 pb-3">
                                <Text size="3" weight="semibold" className="block leading-none">
                                    {user.displayName}
                                </Text>
                                <Text size="2" color="olive" className="mt-1 block truncate">
                                    {user.email}
                                </Text>
                            </div>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                render={(itemProps) => (
                                    <Link
                                        {...itemProps}
                                        href="/profile"
                                        className={cn(
                                            "flex w-full items-center",
                                            itemProps.className,
                                        )}
                                    >
                                        <UserIcon className="mr-2.5 h-4 w-4" />
                                        {tCommon("profile")}
                                    </Link>
                                )}
                            />
                            <DropdownMenuItem
                                render={(itemProps) => (
                                    <Link
                                        {...itemProps}
                                        href="/settings"
                                        className={cn(
                                            "flex w-full items-center",
                                            itemProps.className,
                                        )}
                                    >
                                        <Settings className="mr-2.5 h-4 w-4" />
                                        {tCommon("settings")}
                                    </Link>
                                )}
                            />
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                variant="destructive"
                                render={(itemProps) => (
                                    <Link
                                        {...itemProps}
                                        href="/logout"
                                        className={cn(
                                            "flex w-full items-center",
                                            itemProps.className,
                                        )}
                                    >
                                        <LogOut className="mr-2.5 h-4 w-4" />
                                        {tAuth("signOut")}
                                    </Link>
                                )}
                            />
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>
        </header>
    );
}

// ─── AppShell ─────────────────────────────────────────────────────────────────

interface AppShellProps {
    children: React.ReactNode;
    title?: string;
    className?: string;
}

export function AppShell({ children, title, className }: AppShellProps) {
    return (
        <div className="bg-background text-near-black selection:bg-terracotta/20 flex min-h-screen flex-col">
            <TopBar title={title} />
            <main className={cn("flex flex-1 flex-col", className)}>{children}</main>
        </div>
    );
}

// ─── Page Container ───────────────────────────────────────────────────────────

interface PageContainerProps {
    children: React.ReactNode;
    className?: string;
    narrow?: boolean;
}

export function PageContainer({ children, className, narrow }: PageContainerProps) {
    return (
        <div
            className={cn(
                "mx-auto w-full px-4 py-8 sm:px-8 sm:py-12",
                narrow ? "max-w-3xl" : "max-w-6xl",
                className,
            )}
        >
            {children}
        </div>
    );
}

// ─── Page Header ──────────────────────────────────────────────────────────────

interface PageHeaderProps {
    title: string;
    description?: string;
    actions?: React.ReactNode;
    className?: string;
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
    return (
        <div
            className={cn(
                "border-border/20 flex flex-wrap items-end justify-between gap-8 border-b pb-10",
                className,
            )}
        >
            <div className="min-w-0 flex-1 space-y-3">
                <Heading size="8" as="h1">
                    {title}
                </Heading>
                {description && (
                    <Text size="5" color="olive" className="max-w-2xl leading-relaxed" as="p">
                        {description}
                    </Text>
                )}
            </div>
            {actions && <div className="flex shrink-0 items-center gap-4">{actions}</div>}
        </div>
    );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

export function AppShellSkeleton() {
    return (
        <div className="bg-background flex min-h-screen flex-col">
            <div className="border-border/40 bg-background/80 sticky top-0 z-10 h-16 border-b backdrop-blur-sm" />
            <div className="mx-auto w-full max-w-6xl px-8 py-12">
                <div className="bg-ivory ring-border/20 h-14 w-64 animate-pulse rounded-2xl ring-1" />
                <div className="bg-ivory/50 ring-border/20 mt-4 h-6 w-96 animate-pulse rounded-xl ring-1" />
                <div className="mt-12 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div
                            key={i}
                            className="bg-ivory ring-border/20 h-64 animate-pulse rounded-3xl ring-1"
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

// ─── Auth Guard ───────────────────────────────────────────────────────────────

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
        }
    }, [isLoading, isAuthenticated, router, pathname]);

    if (isLoading || !isAuthenticated) {
        return <AppShellSkeleton />;
    }

    return <>{children}</>;
}
