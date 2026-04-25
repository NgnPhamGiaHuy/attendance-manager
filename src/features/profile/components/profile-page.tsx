"use client";

import { User } from "lucide-react";

import { PageContainer, PageHeader } from "@/components/layout/app-shell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Text } from "@/components/ui/typography";
import { getInitials } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";

export function ProfilePage() {
    const { user } = useAuth();

    if (!user) return null;

    return (
        <PageContainer narrow>
            <PageHeader
                title="Your Profile"
                description="Manage your personal information and preferences."
                className="mb-8"
            />

            <div className="space-y-12">
                {/* Personal Information Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Personal Information</CardTitle>
                        <CardDescription>
                            Your basic profile details visible to others in your classes.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-10">
                        <div className="flex items-center gap-6">
                            <Avatar className="ring-border/40 h-20 w-20 ring-1">
                                <AvatarImage
                                    src={user.photoURL ?? undefined}
                                    alt={user.displayName}
                                    className="object-cover"
                                />
                                <AvatarFallback className="bg-ivory text-near-black text-lg font-bold tracking-wider uppercase">
                                    {getInitials(user.displayName)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="space-y-1">
                                <Button variant="outline" size="sm" className="rounded-xl px-4">
                                    Change Avatar
                                </Button>
                                <Text size="1" color="stone" className="block">
                                    Recommended size: 256x256px
                                </Text>
                            </div>
                        </div>

                        <div className="grid gap-10 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label
                                    htmlFor="fullName"
                                    className="text-stone-gray ml-1 text-[11px] font-bold tracking-widest uppercase"
                                >
                                    Full Name
                                </Label>
                                <Input
                                    id="fullName"
                                    defaultValue={user.displayName}
                                    placeholder="Enter your name"
                                    className="h-12"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label
                                    htmlFor="email"
                                    className="text-stone-gray ml-1 text-[11px] font-bold tracking-widest uppercase"
                                >
                                    Email Address
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    defaultValue={user.email}
                                    disabled
                                    className="bg-background/50 h-12"
                                />
                                <Text size="1" color="olive" className="ml-1">
                                    Email is managed by your authentication provider.
                                </Text>
                            </div>
                        </div>

                        <div className="border-border/40 flex justify-end border-t pt-4">
                            <Button className="whisper-shadow rounded-xl">Save Changes</Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Account Details Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Account Details</CardTitle>
                        <CardDescription>
                            System information related to your account.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-10">
                        <div className="grid gap-10 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label className="text-stone-gray ml-1 text-[11px] font-bold tracking-widest uppercase">
                                    Role
                                </Label>
                                <div className="border-border/60 bg-ivory text-near-black flex h-12 w-full items-center rounded-xl border px-4 py-2 text-base capitalize">
                                    {user.role}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-stone-gray ml-1 text-[11px] font-bold tracking-widest uppercase">
                                    Account ID
                                </Label>
                                <div className="border-border/60 bg-ivory text-stone-gray flex h-12 w-full items-center rounded-xl border px-4 py-2 font-mono text-base text-sm">
                                    {user.uid}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </PageContainer>
    );
}
