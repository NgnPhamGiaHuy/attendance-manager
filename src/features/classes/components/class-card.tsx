"use client";

import Link from "next/link";

import { Calendar, MoreVertical, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Heading, Text } from "@/components/ui/typography";

import type { Class } from "@/types";

interface ClassCardProps {
    classItem: Class;
}

export function ClassCard({ classItem }: ClassCardProps) {
    return (
        <Card className="hover:ring-terracotta/20 bg-ivory border-border/30 whisper-shadow group relative flex flex-col overflow-hidden rounded-[32px] transition-all duration-300 hover:ring-2">
            <CardHeader className="p-8 pb-2">
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1 space-y-2">
                        <Heading size="5" asChild>
                            <Link
                                href={`/classes/${classItem.id}`}
                                className="text-near-black hover:text-terracotta block truncate transition-colors"
                            >
                                {classItem.name}
                            </Link>
                        </Heading>
                        {classItem.description && (
                            <Text
                                size="3"
                                color="olive"
                                className="line-clamp-2 h-10 leading-relaxed"
                                as="p"
                            >
                                {classItem.description}
                            </Text>
                        )}
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger
                            render={
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="-mr-2 h-9 w-9 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                                >
                                    <MoreVertical className="text-stone-gray h-4.5 w-4.5" />
                                    <span className="sr-only">Menu</span>
                                </Button>
                            }
                        />
                        <DropdownMenuContent
                            align="end"
                            className="animate-scale-in whisper-shadow border-border/40 rounded-xl p-1"
                        >
                            <DropdownMenuItem
                                render={<Link href={`/classes/${classItem.id}/settings`} />}
                            >
                                Settings
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive focus:text-destructive">
                                Archive Class
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardHeader>
            <CardContent className="flex-1 px-8 py-6">
                <div className="flex gap-8">
                    <div className="flex items-center gap-2" title="Enrolled Members">
                        <Users className="text-stone-gray h-4 w-4" />
                        <Text
                            size="1"
                            weight="bold"
                            color="olive"
                            className="tracking-widest uppercase"
                        >
                            {classItem.memberCount} members
                        </Text>
                    </div>
                    <div className="flex items-center gap-2" title="Total Sessions">
                        <Calendar className="text-stone-gray h-4 w-4" />
                        <Text
                            size="1"
                            weight="bold"
                            color="olive"
                            className="tracking-widest uppercase"
                        >
                            {classItem.sessionCount} sessions
                        </Text>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="mt-auto p-8 pt-0">
                <Button
                    asChild
                    variant="secondary"
                    className="border-border/60 h-11 w-full rounded-2xl border font-serif text-sm font-medium"
                >
                    <Link href={`/classes/${classItem.id}`}>View Class</Link>
                </Button>
            </CardFooter>
        </Card>
    );
}
