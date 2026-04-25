"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * ThemeToggle component allowing lightweight toggles between themes.
 */
export function ThemeToggle() {
    const { resolvedTheme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full opacity-0"
                aria-hidden="true"
            />
        );
    }

    return (
        <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground focus-visible:ring-focus relative h-9 w-9 cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            title={resolvedTheme === "dark" ? "Light Mode" : "Dark Mode"}
            aria-label={resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
            {resolvedTheme === "dark" ? (
                <Sun className="h-[1.1rem] w-[1.1rem] transition-all" />
            ) : (
                <Moon className="h-[1.1rem] w-[1.1rem] transition-all" />
            )}
            <span className="sr-only">Toggle theme</span>
        </Button>
    );
}
