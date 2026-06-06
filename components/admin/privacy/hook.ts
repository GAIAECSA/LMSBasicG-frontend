"use client";

import {
    type ChangeEvent,
    type FormEvent,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";
import {
    createPrivacyPolicy,
    getActivePrivacyPolicy,
    getAllPrivacyPolicies,
    type PrivacyPolicy,
    type PrivacyPolicyPayload,
} from "@/services/privacy-policy.service";
import {
    ALLOWED_POLICY_FILE_TYPES,
    EMPTY_POLICY_FORM,
} from "./constants";
import type {
    PolicyFormState,
    PrivacySummary,
} from "./types";
import {
    getErrorMessage,
    getNowDateTimeLocal,
    toBackendDateTime,
} from "./utils";

export function usePrivacyAdminPanel() {
    const [policies, setPolicies] =
        useState<PrivacyPolicy[]>([]);

    const [activePolicy, setActivePolicy] =
        useState<PrivacyPolicy | null>(null);

    const [selectedPolicy, setSelectedPolicy] =
        useState<PrivacyPolicy | null>(null);

    const [form, setForm] =
        useState<PolicyFormState>(
            EMPTY_POLICY_FORM,
        );

    const [isModalOpen, setIsModalOpen] =
        useState(false);

    const [loading, setLoading] =
        useState(true);

    const [saving, setSaving] =
        useState(false);

    const [notice, setNotice] =
        useState("");

    const [error, setError] =
        useState("");

    const sortedPolicies = useMemo(() => {
        return [...policies].sort((a, b) => {
            if (a.deleted !== b.deleted) {
                return a.deleted ? 1 : -1;
            }

            if (a.is_active !== b.is_active) {
                return a.is_active ? -1 : 1;
            }

            const aDate = new Date(
                a.created_at ??
                    a.effective_date,
            ).getTime();

            const bDate = new Date(
                b.created_at ??
                    b.effective_date,
            ).getTime();

            return bDate - aDate;
        });
    }, [policies]);

    const summary = useMemo<PrivacySummary>(() => {
        return {
            total: policies.length,
            active: policies.filter(
                (policy) =>
                    policy.is_active &&
                    !policy.deleted,
            ).length,
            mandatory: policies.filter(
                (policy) =>
                    policy.mandatory &&
                    !policy.deleted,
            ).length,
        };
    }, [policies]);

    const loadPolicies =
        useCallback(async () => {
            try {
                setLoading(true);
                setError("");

                const [
                    policiesResponse,
                    activePolicyResponse,
                ] = await Promise.all([
                    getAllPrivacyPolicies(),
                    getActivePrivacyPolicy().catch(
                        () => null,
                    ),
                ]);

                const normalizedPolicies =
                    Array.isArray(
                        policiesResponse,
                    )
                        ? policiesResponse
                        : [];

                setPolicies(
                    normalizedPolicies,
                );

                setActivePolicy(
                    activePolicyResponse,
                );

                setSelectedPolicy(
                    (current) => {
                        if (!current) {
                            return (
                                activePolicyResponse ??
                                normalizedPolicies[0] ??
                                null
                            );
                        }

                        return (
                            normalizedPolicies.find(
                                (policy) =>
                                    policy.id ===
                                    current.id,
                            ) ??
                            activePolicyResponse ??
                            normalizedPolicies[0] ??
                            null
                        );
                    },
                );
            } catch (currentError) {
                setPolicies([]);
                setActivePolicy(null);
                setSelectedPolicy(null);

                setError(
                    getErrorMessage(
                        currentError,
                    ),
                );
            } finally {
                setLoading(false);
            }
        }, []);

    useEffect(() => {
        const timeoutId =
            window.setTimeout(() => {
                void loadPolicies();
            }, 0);

        return () => {
            window.clearTimeout(
                timeoutId,
            );
        };
    }, [loadPolicies]);

    function resetForm() {
        setForm(EMPTY_POLICY_FORM);
        setError("");
    }

    function closeModal() {
        if (saving) return;

        setIsModalOpen(false);
        resetForm();
    }

    function startCreate() {
        setForm({
            ...EMPTY_POLICY_FORM,
            effective_date:
                getNowDateTimeLocal(),
        });

        setError("");
        setNotice("");
        setIsModalOpen(true);
    }

    function handleFileChange(
        event: ChangeEvent<HTMLInputElement>,
    ) {
        const file =
            event.target.files?.[0] ??
            null;

        if (!file) return;

        if (
            !ALLOWED_POLICY_FILE_TYPES.includes(
                file.type,
            )
        ) {
            setError(
                "Solo puedes subir archivos PDF, DOC, DOCX o TXT.",
            );

            event.target.value = "";

            return;
        }

        setForm((current) => ({
            ...current,
            file,
        }));

        setError("");
        event.target.value = "";
    }

    function removeSelectedFile() {
        setForm((current) => ({
            ...current,
            file: null,
        }));
    }

    function validateForm() {
        if (!form.title.trim()) {
            throw new Error(
                "Ingresa el título de la política.",
            );
        }

        if (!form.version.trim()) {
            throw new Error(
                "Ingresa la versión.",
            );
        }

        if (!form.effective_date) {
            throw new Error(
                "Selecciona la fecha de vigencia.",
            );
        }

        if (!form.file) {
            throw new Error(
                "Selecciona el archivo de la política.",
            );
        }
    }

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        try {
            setSaving(true);
            setError("");
            setNotice("");

            validateForm();

            const payload:
                PrivacyPolicyPayload = {
                title:
                    form.title.trim(),
                version:
                    form.version.trim(),
                is_active:
                    form.is_active,
                mandatory:
                    form.mandatory,
                effective_date:
                    toBackendDateTime(
                        form.effective_date,
                    ),
                file: form.file,
            };

            const createdPolicy =
                await createPrivacyPolicy(
                    payload,
                );

            setNotice(
                "Política creada correctamente.",
            );

            setSelectedPolicy(
                createdPolicy,
            );

            setIsModalOpen(false);
            setForm(EMPTY_POLICY_FORM);

            await loadPolicies();
        } catch (currentError) {
            setError(
                getErrorMessage(
                    currentError,
                ),
            );
        } finally {
            setSaving(false);
        }
    }

    return {
        policies,
        activePolicy,
        selectedPolicy,
        sortedPolicies,
        summary,
        form,
        setForm,
        isModalOpen,
        loading,
        saving,
        notice,
        error,
        loadPolicies,
        closeModal,
        startCreate,
        handleFileChange,
        removeSelectedFile,
        handleSubmit,
    };
}

export type PrivacyAdminPanelState =
    ReturnType<
        typeof usePrivacyAdminPanel
    >;
