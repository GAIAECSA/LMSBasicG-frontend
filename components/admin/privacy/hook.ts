"use client";

import {
    type ChangeEvent,
    type FormEvent,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { notify } from "@/lib/notify";
import {
    createPrivacyPolicy,
    getActivePrivacyPolicy,
    getAllPrivacyPolicies,
    type PrivacyPolicy,
    type PrivacyPolicyPayload,
} from "@/services/privacy-policy.service";
import {
    ALLOWED_POLICY_FILE_EXTENSIONS,
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

type PoliciesLoadResult = {
    policies: PrivacyPolicy[];
    activePolicy: PrivacyPolicy | null;
};

function createLoadingToast(message: string) {
    const toastId = notify.loading(message);
    let dismissed = false;

    return () => {
        if (dismissed) return;

        notify.dismiss(toastId);
        dismissed = true;
    };
}

function isAllowedPolicyFile(file: File) {
    const normalizedName = String(file.name ?? "")
        .trim()
        .toLowerCase();

    const normalizedType = String(file.type ?? "")
        .trim()
        .toLowerCase();

    const hasAllowedExtension =
        ALLOWED_POLICY_FILE_EXTENSIONS.some((extension) =>
            normalizedName.endsWith(extension),
        );

    const hasAllowedMimeType =
        !normalizedType ||
        ALLOWED_POLICY_FILE_TYPES.includes(normalizedType);

    return hasAllowedExtension && hasAllowedMimeType;
}

export function usePrivacyAdminPanel() {
    const policiesRequestRef =
        useRef<Promise<PoliciesLoadResult> | null>(null);

    const refreshMutationRef = useRef(false);
    const createMutationRef = useRef(false);

    const [policies, setPolicies] =
        useState<PrivacyPolicy[]>([]);

    const [activePolicy, setActivePolicy] =
        useState<PrivacyPolicy | null>(null);

    const [selectedPolicy, setSelectedPolicy] =
        useState<PrivacyPolicy | null>(null);

    const [form, setForm] =
        useState<PolicyFormState>(EMPTY_POLICY_FORM);

    const [isModalOpen, setIsModalOpen] =
        useState(false);

    const [initialLoading, setInitialLoading] =
        useState(true);

    const [isRefreshing, setIsRefreshing] =
        useState(false);

    const [saving, setSaving] =
        useState(false);

    const [pageErrorMessage, setPageErrorMessage] =
        useState("");

    const [modalErrorMessage, setModalErrorMessage] =
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
                a.created_at ?? a.effective_date,
            ).getTime();

            const bDate = new Date(
                b.created_at ?? b.effective_date,
            ).getTime();

            return bDate - aDate;
        });
    }, [policies]);

    const summary = useMemo<PrivacySummary>(() => {
        return {
            total: policies.length,
            active: policies.filter(
                (policy) =>
                    policy.is_active && !policy.deleted,
            ).length,
            mandatory: policies.filter(
                (policy) =>
                    policy.mandatory && !policy.deleted,
            ).length,
        };
    }, [policies]);

    const applyPoliciesResponse = useCallback(
        ({
            policies: normalizedPolicies,
            activePolicy: activePolicyResponse,
        }: PoliciesLoadResult) => {
            setPolicies(normalizedPolicies);
            setActivePolicy(activePolicyResponse);

            setSelectedPolicy((current) => {
                if (!current) {
                    return (
                        activePolicyResponse ??
                        normalizedPolicies[0] ??
                        null
                    );
                }

                return (
                    normalizedPolicies.find(
                        (policy) => policy.id === current.id,
                    ) ??
                    activePolicyResponse ??
                    normalizedPolicies[0] ??
                    null
                );
            });
        },
        [],
    );

    const requestPolicies = useCallback(() => {
        if (policiesRequestRef.current) {
            return policiesRequestRef.current;
        }

        const request = Promise.all([
            getAllPrivacyPolicies(),
            getActivePrivacyPolicy().catch(() => null),
        ]).then(([policiesResponse, activePolicyResponse]) => ({
            policies: Array.isArray(policiesResponse)
                ? policiesResponse
                : [],
            activePolicy: activePolicyResponse,
        }));

        policiesRequestRef.current = request;

        const clearRequest = () => {
            if (policiesRequestRef.current === request) {
                policiesRequestRef.current = null;
            }
        };

        void request.then(clearRequest, clearRequest);

        return request;
    }, []);

    useEffect(() => {
        let isMounted = true;

        requestPolicies()
            .then((response) => {
                if (!isMounted) return;

                applyPoliciesResponse(response);
                setPageErrorMessage("");
            })
            .catch((error: unknown) => {
                if (!isMounted) return;

                setPolicies([]);
                setActivePolicy(null);
                setSelectedPolicy(null);
                setPageErrorMessage(
                    getErrorMessage(
                        error,
                        "No se pudieron cargar las políticas de privacidad.",
                    ),
                );
            })
            .finally(() => {
                if (!isMounted) return;

                setInitialLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, [applyPoliciesResponse, requestPolicies]);

    function resetForm() {
        setForm(EMPTY_POLICY_FORM);
        setModalErrorMessage("");
    }

    function closeModal() {
        if (createMutationRef.current) return;

        setIsModalOpen(false);
        resetForm();
    }

    function startCreate() {
        if (createMutationRef.current) {
            notify.warning("La política todavía se está guardando.");
            return;
        }

        setForm({
            ...EMPTY_POLICY_FORM,
            effective_date: getNowDateTimeLocal(),
        });

        setModalErrorMessage("");
        setIsModalOpen(true);
    }

    function handleFileChange(
        event: ChangeEvent<HTMLInputElement>,
    ) {
        const file = event.target.files?.[0] ?? null;

        event.target.value = "";

        if (!file) return;

        if (!isAllowedPolicyFile(file)) {
            const message =
                "Solo puedes subir archivos PDF, DOC, DOCX o TXT.";

            setModalErrorMessage(message);
            notify.warning(message);
            return;
        }

        setForm((current) => ({
            ...current,
            file,
        }));

        setModalErrorMessage("");
    }

    function removeSelectedFile() {
        if (createMutationRef.current) return;

        setForm((current) => ({
            ...current,
            file: null,
        }));

        setModalErrorMessage("");
    }

    function validateForm() {
        if (!form.title.trim()) {
            throw new Error("Ingresa el título de la política.");
        }

        if (!form.version.trim()) {
            throw new Error("Ingresa la versión.");
        }

        if (!form.effective_date) {
            throw new Error("Selecciona la fecha de vigencia.");
        }

        if (!form.file) {
            throw new Error("Selecciona el archivo de la política.");
        }

        if (!isAllowedPolicyFile(form.file)) {
            throw new Error(
                "Solo puedes subir archivos PDF, DOC, DOCX o TXT.",
            );
        }
    }

    async function handleRefreshPolicies() {
        if (refreshMutationRef.current) {
            notify.warning("La lista ya se está actualizando.");
            return;
        }

        if (createMutationRef.current) {
            notify.warning("Espera a que finalice el guardado actual.");
            return;
        }

        refreshMutationRef.current = true;
        setIsRefreshing(true);

        const dismissLoadingToast = createLoadingToast(
            "Actualizando políticas de privacidad...",
        );

        try {
            const response = await requestPolicies();

            applyPoliciesResponse(response);
            setPageErrorMessage("");
            notify.success("Lista de políticas actualizada correctamente.");
        } catch (error) {
            notify.error(
                getErrorMessage(
                    error,
                    "No se pudo actualizar la lista de políticas.",
                ),
            );
        } finally {
            dismissLoadingToast();
            refreshMutationRef.current = false;
            setIsRefreshing(false);
        }
    }

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        if (createMutationRef.current) {
            notify.warning("La política ya se está guardando.");
            return;
        }

        try {
            validateForm();
        } catch (error) {
            const message = getErrorMessage(error);

            setModalErrorMessage(message);
            notify.warning(message);
            return;
        }

        createMutationRef.current = true;
        setSaving(true);
        setModalErrorMessage("");

        const dismissLoadingToast = createLoadingToast(
            "Guardando política de privacidad...",
        );

        try {
            const payload: PrivacyPolicyPayload = {
                title: form.title.trim(),
                version: form.version.trim(),
                is_active: form.is_active,
                mandatory: form.mandatory,
                effective_date: toBackendDateTime(
                    form.effective_date,
                ),
                file: form.file,
            };

            const createdPolicy = await createPrivacyPolicy(payload);

            setSelectedPolicy(createdPolicy);
            setIsModalOpen(false);
            setForm(EMPTY_POLICY_FORM);
            setModalErrorMessage("");

            dismissLoadingToast();
            notify.success("Política creada correctamente.");

            try {
                const response = await requestPolicies();

                applyPoliciesResponse(response);
                setPageErrorMessage("");
            } catch {
                notify.warning(
                    "La política fue creada, pero no se pudo actualizar la lista automáticamente.",
                );
            }
        } catch (error) {
            dismissLoadingToast();

            const message = getErrorMessage(
                error,
                "No se pudo crear la política de privacidad.",
            );

            setModalErrorMessage(message);
            notify.error(message);
        } finally {
            dismissLoadingToast();
            createMutationRef.current = false;
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
        initialLoading,
        isRefreshing,
        saving,
        pageErrorMessage,
        modalErrorMessage,
        closeModal,
        startCreate,
        handleFileChange,
        removeSelectedFile,
        handleRefreshPolicies,
        handleSubmit,
    };
}

export type PrivacyAdminPanelState =
    ReturnType<typeof usePrivacyAdminPanel>;
