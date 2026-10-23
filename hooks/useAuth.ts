
"use client";

import {
    useCallback,
    useSyncExternalStore,
} from "react";

import type { LoginResponse } from "@/types/auth";

import {
    AUTH_CHANGE_EVENT,
    AUTH_STORAGE_KEY,
    clearAuthSession,
    saveAuthSession,
} from "@/lib/auth";

/* ============================================
   CACHE DE AUTENTICACIÓN
============================================ */

let cachedRawSession: string | null = null;
let cachedParsedSession: LoginResponse | null = null;

/* ============================================
   LEER SESIÓN DEL NAVEGADOR
============================================ */

function readAuthSnapshot(): LoginResponse | null {
    if (typeof window === "undefined") {
        return null;
    }

    const raw = window.localStorage.getItem(
        AUTH_STORAGE_KEY
    );

    if (raw === cachedRawSession) {
        return cachedParsedSession;
    }

    cachedRawSession = raw;

    if (!raw) {
        cachedParsedSession = null;
        return null;
    }

    try {
        const parsed = JSON.parse(raw) as LoginResponse;

        if (
            !parsed ||
            typeof parsed.accessToken !== "string" ||
            !parsed.accessToken.trim() ||
            !parsed.user
        ) {
            cachedParsedSession = null;
            return null;
        }

        cachedParsedSession = parsed;
        return cachedParsedSession;
    } catch {
        window.localStorage.removeItem(
            AUTH_STORAGE_KEY
        );

        cachedRawSession = null;
        cachedParsedSession = null;

        return null;
    }
}

/* ============================================
   SNAPSHOT DEL SERVIDOR
============================================ */

function getServerSnapshot(): LoginResponse | null {
    return null;
}

/* ============================================
   SUSCRIPCIÓN A CAMBIOS DE SESIÓN
============================================ */

function subscribeAuth(callback: () => void) {
    if (typeof window === "undefined") {
        return () => { };
    }

    const handleStorage = (event: StorageEvent) => {
        if (
            event.key === AUTH_STORAGE_KEY ||
            event.key === null
        ) {
            callback();
        }
    };

    const handleAuthChange = () => {
        callback();
    };

    window.addEventListener(
        "storage",
        handleStorage
    );

    window.addEventListener(
        AUTH_CHANGE_EVENT,
        handleAuthChange
    );

    return () => {
        window.removeEventListener(
            "storage",
            handleStorage
        );

        window.removeEventListener(
            AUTH_CHANGE_EVENT,
            handleAuthChange
        );
    };
}

/* ============================================
   DETECTAR HIDRATACIÓN SIN useEffect
============================================ */

function subscribeHydration() {
    return () => { };
}

function getClientHydrationSnapshot() {
    return true;
}

function getServerHydrationSnapshot() {
    return false;
}

/* ============================================
   HOOK PRINCIPAL DE AUTENTICACIÓN
============================================ */

export function useAuth() {

    // Durante SSR e hidratación inicial será false.
    // Después de hidratar en el navegador será true.
    const hydrated = useSyncExternalStore(
        subscribeHydration,
        getClientHydrationSnapshot,
        getServerHydrationSnapshot
    );

    const session = useSyncExternalStore(
        subscribeAuth,
        readAuthSnapshot,
        getServerSnapshot
    );

    /* INICIAR SESIÓN */

    const signIn = useCallback(
        (nextSession: LoginResponse) => {
            saveAuthSession(nextSession);
        },
        []
    );

    /* CERRAR SESIÓN */

    const signOut = useCallback(() => {
        clearAuthSession();
    }, []);

    /* ACTUALIZAR SESIÓN */

    const refresh = useCallback(() => {
        if (typeof window === "undefined") {
            return;
        }

        window.dispatchEvent(
            new Event(AUTH_CHANGE_EVENT)
        );
    }, []);

    /* DATOS DEL USUARIO */

    const user = session?.user ?? null;

    const accessToken =
        session?.accessToken ?? null;

    const refreshToken =
        session?.refreshToken ?? null;

    const tokenType =
        session?.tokenType ?? null;

    /* ESTADO DE AUTENTICACIÓN */

    const loading = !hydrated;

    const isAuthenticated = Boolean(
        hydrated &&
        accessToken &&
        user
    );

    return {
        user,
        token: accessToken,
        accessToken,
        refreshToken,
        tokenType,
        session,
        loading,
        isAuthenticated,
        signIn,
        signOut,
        refresh,
    };
}
