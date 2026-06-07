"use client";

import {
    type FormEvent,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import { useAuth } from "@/hooks/useAuth";
import { notify } from "@/lib/notify";

import {
    DEFAULT_SUPPORT_FORM,
    SUPPORT_EMAIL,
} from "./constants";
import type {
    SupportCategory,
    SupportFormState,
} from "./types";
import {
    buildSupportMessage,
    getUserEmail,
    getUserFullName,
} from "./utils";

function getErrorMessage(
    error: unknown,
    fallback: string,
) {
    if (
        error instanceof Error &&
        error.message.trim()
    ) {
        return error.message.trim();
    }

    if (
        typeof error === "string" &&
        error.trim()
    ) {
        return error.trim();
    }

    return fallback;
}

async function copyTextToClipboard(
    value: string,
) {
    if (
        typeof navigator !==
        "undefined" &&
        navigator.clipboard?.writeText
    ) {
        await navigator.clipboard.writeText(
            value,
        );

        return;
    }

    if (
        typeof document ===
        "undefined"
    ) {
        throw new Error(
            "El portapapeles no está disponible en este navegador.",
        );
    }

    const textarea =
        document.createElement(
            "textarea",
        );

    textarea.value =
        value;

    textarea.setAttribute(
        "readonly",
        "",
    );

    textarea.style.position =
        "fixed";

    textarea.style.top =
        "-1000px";

    textarea.style.left =
        "-1000px";

    document.body.appendChild(
        textarea,
    );

    textarea.select();

    const copied =
        document.execCommand(
            "copy",
        );

    document.body.removeChild(
        textarea,
    );

    if (!copied) {
        throw new Error(
            "No se pudo copiar la solicitud.",
        );
    }
}

export function useHelpPage() {
    const { user } =
        useAuth();

    const [
        form,
        setForm,
    ] =
        useState<SupportFormState>(
            DEFAULT_SUPPORT_FORM,
        );

    const [
        copied,
        setCopied,
    ] =
        useState(false);

    const [
        isCopying,
        setIsCopying,
    ] =
        useState(false);

    const [
        error,
        setError,
    ] =
        useState("");

    const copiedTimeoutRef =
        useRef<number | null>(
            null,
        );

    const userName =
        useMemo(
            () =>
                getUserFullName(
                    user,
                ),
            [user],
        );

    const userEmail =
        useMemo(
            () =>
                getUserEmail(
                    user,
                ),
            [user],
        );

    const supportMessage =
        useMemo(
            () =>
                buildSupportMessage(
                    {
                        form,
                        userName,
                        userEmail,
                    },
                ),
            [
                form,
                userEmail,
                userName,
            ],
        );

    useEffect(() => {
        return () => {
            if (
                copiedTimeoutRef.current !==
                null
            ) {
                window.clearTimeout(
                    copiedTimeoutRef.current,
                );
            }
        };
    }, []);

    function clearCopiedTimeout() {
        if (
            copiedTimeoutRef.current ===
            null
        ) {
            return;
        }

        window.clearTimeout(
            copiedTimeoutRef.current,
        );

        copiedTimeoutRef.current =
            null;
    }

    function scheduleCopiedReset() {
        clearCopiedTimeout();

        copiedTimeoutRef.current =
            window.setTimeout(
                () => {
                    setCopied(
                        false,
                    );

                    copiedTimeoutRef.current =
                        null;
                },
                3500,
            );
    }

    function clearFeedback() {
        clearCopiedTimeout();

        setError(
            "",
        );

        setCopied(
            false,
        );
    }

    function handleChange(
        field:
            keyof SupportFormState,
        value: string,
    ) {
        setForm(
            (current) => ({
                ...current,
                [field]:
                    value,
            }),
        );

        clearFeedback();
    }

    function handleCategoryChange(
        value: string,
    ) {
        handleChange(
            "category",
            value as SupportCategory,
        );
    }

    function getValidationError() {
        if (
            !form.subject.trim()
        ) {
            return "Ingresa el asunto de la solicitud.";
        }

        if (
            !form.message.trim()
        ) {
            return "Describe el problema o la ayuda que necesitas.";
        }

        return "";
    }

    function showValidationError(
        message: string,
    ) {
        setError(
            message,
        );

        notify.warning(
            "Completa los campos requeridos.",
            message,
        );
    }

    async function handleCopy() {
        if (
            isCopying
        ) {
            return;
        }

        clearFeedback();

        const validationError =
            getValidationError();

        if (
            validationError
        ) {
            showValidationError(
                validationError,
            );

            return;
        }

        try {
            setIsCopying(
                true,
            );

            await copyTextToClipboard(
                supportMessage,
            );

            setCopied(
                true,
            );

            scheduleCopiedReset();

            notify.success(
                "Solicitud copiada.",
                "El texto fue guardado en el portapapeles.",
            );
        } catch (
        currentError
        ) {
            const message =
                getErrorMessage(
                    currentError,
                    "No se pudo copiar la solicitud.",
                );

            setError(
                message,
            );

            notify.error(
                "No se pudo copiar la solicitud.",
                message,
            );
        } finally {
            setIsCopying(
                false,
            );
        }
    }

    function handleSubmit(
        event:
            FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        clearFeedback();

        const validationError =
            getValidationError();

        if (
            validationError
        ) {
            showValidationError(
                validationError,
            );

            return;
        }

        const subject =
            encodeURIComponent(
                `[Soporte LMS] ${form.subject.trim()}`,
            );

        const body =
            encodeURIComponent(
                supportMessage,
            );

        notify.success(
            "Solicitud preparada.",
            "Se abrirá tu aplicación de correo para completar el envío.",
        );

        window.location.href =
            `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
    }

    return {
        form,
        copied,
        isCopying,
        error,
        userName,
        handleChange,
        handleCategoryChange,
        handleCopy,
        handleSubmit,
    };
}

export type HelpPageState =
    ReturnType<
        typeof useHelpPage
    >;