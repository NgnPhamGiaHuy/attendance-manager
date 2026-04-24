"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import {
    GoogleAuthProvider,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut,
} from "firebase/auth";

import { auth } from "@/lib/firebase";

import type { User } from "firebase/auth";
import type { AppUser, UserRole } from "@/types";

// ─── Context types ────────────────────────────────────────────────────────────

interface AuthContextValue {
    user: AppUser | null;
    firebaseUser: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    role: UserRole | null;
    signInWithGoogle: () => Promise<void>;
    signInWithEmail: (email: string, password: string) => Promise<void>;
    signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
    const [appUser, setAppUser] = useState<AppUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
            if (fbUser) {
                setFirebaseUser(fbUser);
                try {
                    // Extract role from Custom Claims JWT
                    const idTokenResult = await fbUser.getIdTokenResult();
                    const role = (idTokenResult.claims.role as UserRole) ?? "teacher";

                    setAppUser({
                        uid: fbUser.uid,
                        email: fbUser.email ?? "",
                        displayName: fbUser.displayName ?? "Unknown",
                        photoURL: fbUser.photoURL,
                        role,
                        createdAt: null as unknown as import("firebase/firestore").Timestamp,
                    });
                } catch (error) {
                    console.error("Failed to fetch user claims:", error);
                    setAppUser(null);
                }
            } else {
                setFirebaseUser(null);
                setAppUser(null);
            }

            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const signInWithGoogle = useCallback(async () => {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: "select_account" });
        await signInWithPopup(auth, provider);
    }, []);

    const signInWithEmail = useCallback(async (email: string, password: string) => {
        await signInWithEmailAndPassword(auth, email, password);
    }, []);

    const signOutUser = useCallback(async () => {
        await signOut(auth);
    }, []);

    const value = useMemo<AuthContextValue>(
        () => ({
            user: appUser,
            firebaseUser,
            isLoading,
            isAuthenticated: !!appUser,
            role: appUser?.role ?? null,
            signInWithGoogle,
            signInWithEmail,
            signOutUser,
        }),
        [appUser, firebaseUser, isLoading, signInWithGoogle, signInWithEmail, signOutUser],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
    return ctx;
}
