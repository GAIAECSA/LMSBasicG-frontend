"use client";

import {
    type FormEvent,
    useMemo,
    useState,
} from "react";
import { useAuth } from "@/hooks/useAuth";
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

export function useHelpPage() {
    const { user } = useAuth();

    const [form, setForm] =
        useState<SupportFormState>(
            DEFAULT_SUPPORT_FORM,
        );

    const [copied, setCopied] =
        useState(false);

    const [error, setError] =
        useState("");

    const userName = useMemo(
        () => getUserFullName(user),
        [user],
    );

    const userEmail = useMemo(
        () => getUserEmail(user),
        [user],
    );

    const supportMessage = useMemo(
        () =>
            buildSupportMessage({
                form,
                userName,
                userEmail,
            }),
        [form, userEmail, userName],
    );

    function handleChange(
        field: keyof SupportFormState,
        value: string,
    ) {
        setForm((current) => ({
            ...current,
            [field]: value,
        }));

        setError("");
        setCopied(false);
    }

    function handleCategoryChange(
        value: string,
    ) {
        handleChange(
            "category",
            value as SupportCategory,
        );
    }

    function validateForm() {
        if (
            !form.subject.trim() ||
            !form.message.trim()
        ) {
            throw new Error(
                "Completa el asunto y el detalle antes de continuar.",
            );
        }
    }

    async function handleCopy() {
        try {
            setError("");
            setCopied(false);

            validateForm();

            await navigator.clipboard.writeText(
                supportMessage,
            );

            setCopied(true);
        } catch (currentError) {
            setError(
                currentError instanceof Error
                    ? currentError.message
                    : "No se pudo copiar la solicitud.",
            );
        }
    }

    function handleSubmit(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        try {
            setError("");
            setCopied(false);

            validateForm();

            const subject =
                encodeURIComponent(
                    `[Soporte LMS] ${form.subject}`,
                );

            const body =
                encodeURIComponent(
                    supportMessage,
                );

            window.location.href =
                `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
        } catch (currentError) {
            setError(
                currentError instanceof Error
                    ? currentError.message
                    : "No se pudo preparar la solicitud.",
            );
        }
    }

    return {
        form,
        copied,
        error,
        userName,
        handleChange,
        handleCategoryChange,
        handleCopy,
        handleSubmit,
    };
}

export type HelpPageState =
    ReturnType<typeof useHelpPage>;
