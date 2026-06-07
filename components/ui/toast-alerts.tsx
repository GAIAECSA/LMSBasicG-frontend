"use client";

import {
    useEffect,
    useRef,
} from "react";

import { notify } from "@/lib/notify";

type ToastAlertsProps = {
    success?: string | null;
    error?: string | null;
    warning?: string | null;
    info?: string | null;
};

export function ToastAlerts({
    success,
    error,
    warning,
    info,
}: ToastAlertsProps) {
    const previousMessages =
        useRef<ToastAlertsProps>({});

    useEffect(() => {
        if (
            success &&
            success !==
            previousMessages.current
                .success
        ) {
            notify.success(success);
        }

        if (
            error &&
            error !==
            previousMessages.current.error
        ) {
            notify.error(error);
        }

        if (
            warning &&
            warning !==
            previousMessages.current
                .warning
        ) {
            notify.warning(warning);
        }

        if (
            info &&
            info !==
            previousMessages.current.info
        ) {
            notify.info(info);
        }

        previousMessages.current = {
            success,
            error,
            warning,
            info,
        };
    }, [
        success,
        error,
        warning,
        info,
    ]);

    return null;
}