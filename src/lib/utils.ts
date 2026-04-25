import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

import type { ClassValue } from "clsx";

/**
 * Merge Tailwind classes safely, resolving conflicts intelligently.
 */
export function cn(...inputs: ClassValue[]): string {
    return twMerge(clsx(inputs));
}

/**
 * Generate a random 6-character join code for classes.
 * Format: "XX-XXXX" where X is alphanumeric uppercase.
 */
export function generateClassCode(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars
    const pick = () => chars[Math.floor(Math.random() * chars.length)];
    return `${pick()}${pick()}-${pick()}${pick()}${pick()}${pick()}`;
}

/**
 * Format a Firestore Timestamp or Date for display.
 */
export function formatDate(
    date: any,
    options: Intl.DateTimeFormatOptions = {
        month: "short",
        day: "numeric",
        year: "numeric",
    },
): string {
    if (
        !date ||
        typeof date === "function" ||
        (typeof date === "object" && !("toDate" in date) && !(date instanceof Date))
    ) {
        return "—";
    }
    const d = date instanceof Date ? date : date.toDate();
    return new Intl.DateTimeFormat("en-US", options).format(d);
}

/**
 * Format a Firestore Timestamp or Date as time: "09:00"
 */
export function formatTime(date: any): string {
    if (
        !date ||
        typeof date === "function" ||
        (typeof date === "object" && !("toDate" in date) && !(date instanceof Date))
    ) {
        return "—";
    }
    const d = date instanceof Date ? date : date.toDate();
    return new Intl.DateTimeFormat("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    }).format(d);
}

/**
 * Format a date as a session title: "Mon Apr 24"
 */
export function formatSessionTitle(date: Date): string {
    return new Intl.DateTimeFormat("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
    }).format(date);
}

/**
 * Get initials from a display name (max 2 chars).
 */
export function getInitials(name: string): string {
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

/**
 * Clamp a number between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

/**
 * Format a score as a percentage string.
 */
export function formatScore(score: number): string {
    return `${Math.round(score)}%`;
}

/**
 * Determine score color class based on value.
 */
export function scoreColorClass(score: number): string {
    if (score >= 80) return "text-success";
    if (score >= 60) return "text-warning";
    return "text-destructive";
}

/**
 * Chunk an array into batches of given size.
 * Used for Firestore batched writes (max 500 per batch).
 */
export function chunkArray<T>(arr: T[], size: number): T[][] {
    return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
        arr.slice(i * size, i * size + size),
    );
}

/**
 * Debounce a function call.
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
    fn: T,
    ms: number,
): (...args: Parameters<T>) => void {
    let timer: ReturnType<typeof setTimeout>;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), ms);
    };
}
