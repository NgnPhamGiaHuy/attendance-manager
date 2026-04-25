"use client";

import { Bell, Moon, Shield, Volume2 } from "lucide-react";

import { PageContainer, PageHeader } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Text } from "@/components/ui/typography";

export function SettingsPage() {
    return (
        <PageContainer narrow>
            <PageHeader
                title="Settings"
                description="Manage your application preferences and behavior."
                className="mb-8"
            />

            <div className="space-y-12">
                {/* Appearance Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Appearance</CardTitle>
                        <CardDescription>
                            Customize how the application looks and feels.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="bg-background border-border/60 flex h-10 w-10 items-center justify-center rounded-xl border">
                                    <Moon className="text-stone-gray h-5 w-5" />
                                </div>
                                <div className="space-y-0.5">
                                    <Text size="3" weight="medium" className="block">
                                        Dark Mode
                                    </Text>
                                    <Text size="1" color="olive" className="block">
                                        Toggle dark theme for the application.
                                    </Text>
                                </div>
                            </div>
                            <Switch />
                        </div>
                    </CardContent>
                </Card>

                {/* Notifications Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Notifications</CardTitle>
                        <CardDescription>Control how and when you receive alerts.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="bg-background border-border/60 flex h-10 w-10 items-center justify-center rounded-xl border">
                                    <Bell className="text-stone-gray h-5 w-5" />
                                </div>
                                <div className="space-y-0.5">
                                    <Text size="3" weight="medium" className="block">
                                        Email Notifications
                                    </Text>
                                    <Text size="1" color="olive" className="block">
                                        Receive email updates about class changes.
                                    </Text>
                                </div>
                            </div>
                            <Switch defaultChecked />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="bg-background border-border/60 flex h-10 w-10 items-center justify-center rounded-xl border">
                                    <Volume2 className="text-stone-gray h-5 w-5" />
                                </div>
                                <div className="space-y-0.5">
                                    <Text size="3" weight="medium" className="block">
                                        Sound Effects
                                    </Text>
                                    <Text size="1" color="olive" className="block">
                                        Play sounds for success and error actions.
                                    </Text>
                                </div>
                            </div>
                            <Switch defaultChecked />
                        </div>
                    </CardContent>
                </Card>

                {/* Privacy Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Privacy & Security</CardTitle>
                        <CardDescription>Manage your privacy settings.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="bg-background border-border/60 flex h-10 w-10 items-center justify-center rounded-xl border">
                                    <Shield className="text-stone-gray h-5 w-5" />
                                </div>
                                <div className="space-y-0.5">
                                    <Text size="3" weight="medium" className="block">
                                        Show Profile to Classmates
                                    </Text>
                                    <Text size="1" color="olive" className="block">
                                        Allow other students to see your name and avatar.
                                    </Text>
                                </div>
                            </div>
                            <Switch defaultChecked />
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end pt-2">
                    <Button className="whisper-shadow rounded-xl">Save Preferences</Button>
                </div>
            </div>
        </PageContainer>
    );
}
