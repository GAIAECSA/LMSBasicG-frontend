"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { LoginResponse } from "@/types/auth";
import {
    AUTH_CHANGE_EVENT,
    AUTH_STORAGE_KEY,
    clearAuthSession,
    saveAuthSession,
} from "@/lib/auth";

let cachedRawSession: string | null = null;
let cachedParsedSession: LoginResponse | null = null;

function readAuthSnapshot(): LoginResponse | null {
    if (typeof window === "undefined") {
        return null;
    }

    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);

    if (raw === cachedRawSession) {
        return cachedParsedSession;
    }

    cachedRawSession = raw;

    if (!raw) {
        cachedParsedSession = null;
        return null;
    }

    try {
        cachedParsedSession = JSON.parse(raw) as LoginResponse;
        return cachedParsedSession;
    } catch {
        window.localStorage.removeItem(AUTH_STORAGE_KEY);
        cachedRawSession = null;
        cachedParsedSession = null;
        return null;
    }
}

function getServerSnapshot(): LoginResponse | null {
    return null;
}

function subscribe(callback: () => void) {
    if (typeof window === "undefined") {
        return () => {};
    }

    const handleStorage = (event: StorageEvent) => {
        if (event.key === AUTH_STORAGE_KEY) {
            callback();
        }
    };

    const handleAuthChange = () => {
        callback();
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener(AUTH_CHANGE_EVENT, handleAuthChange);

    return () => {
        window.removeEventListener("storage", handleStorage);
        window.removeEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
    };
}

export function useAuth() {
    const session = useSyncExternalStore(
        subscribe,
        readAuthSnapshot,
        getServerSnapshot
    );

    const signIn = useCallback((nextSession: LoginResponse) => {
        saveAuthSession(nextSession);
    }, []);

    const signOut = useCallback(() => {
        clearAuthSession();
    }, []);

    const refresh = useCallback(() => {
        if (typeof window === "undefined") return;
        window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
    }, []);

    const user = session?.user ?? null;
    const accessToken = session?.accessToken ?? null;
    const refreshToken = session?.refreshToken ?? null;
    const tokenType = session?.tokenType ?? null;
    const isAuthenticated = Boolean(accessToken && user);

    return {
        user,
        token: accessToken,
        accessToken,
        refreshToken,
        tokenType,
        session,
        loading: false,
        isAuthenticated,
        signIn,
        signOut,
        refresh,
    };
}