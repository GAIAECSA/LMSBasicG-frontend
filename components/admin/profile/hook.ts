"use client";

import {
    type FormEvent,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import {
    getCurrentUserService,
    updateCurrentUserService,
    type UpdateCurrentUserPayload,
} from "@/services/auth.service";
import { notify } from "@/lib/notify";

import { EMPTY_PROFILE_FORM } from "./constants";
import type {
    ProfileAuthUser,
    ProfileFormState,
} from "./types";
import {
    getInitials,
    getProfileErrorMessage,
    mapUserToProfileForm,
} from "./utils";

function isValidEmail(
    value: string,
) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        value.trim(),
    );
}

export function useUserProfileForm() {
    const [
        user,
        setUser,
    ] =
        useState<ProfileAuthUser | null>(
            null,
        );

    const [
        form,
        setForm,
    ] =
        useState<ProfileFormState>(
            EMPTY_PROFILE_FORM,
        );

    const [
        loading,
        setLoading,
    ] =
        useState(true);

    const [
        saving,
        setSaving,
    ] =
        useState(false);

    const [
        error,
        setError,
    ] =
        useState("");

    const savingRef =
        useRef(false);

    const fullName =
        useMemo(() => {
            const name =
                `${form.firstname} ${form.lastname}`.trim();

            return (
                name ||
                form.username ||
                "Usuario"
            );
        }, [
            form.firstname,
            form.lastname,
            form.username,
        ]);

    const initials =
        useMemo(() => {
            return getInitials(
                form.firstname,
                form.lastname,
                form.username,
            );
        }, [
            form.firstname,
            form.lastname,
            form.username,
        ]);

    useEffect(() => {
        let isMounted =
            true;

        async function loadUser() {
            try {
                setLoading(
                    true,
                );

                setError(
                    "",
                );

                const currentUser =
                    (await getCurrentUserService()) as ProfileAuthUser;

                if (
                    !isMounted
                ) {
                    return;
                }

                setUser(
                    currentUser,
                );

                setForm(
                    mapUserToProfileForm(
                        currentUser,
                    ),
                );
            } catch (
            requestError
            ) {
                console.error(
                    "Error al cargar el perfil:",
                    requestError,
                );

                if (
                    !isMounted
                ) {
                    return;
                }

                setError(
                    getProfileErrorMessage(
                        requestError,
                        "No se pudo cargar la información del usuario.",
                    ),
                );
            } finally {
                if (
                    isMounted
                ) {
                    setLoading(
                        false,
                    );
                }
            }
        }

        void loadUser();

        return () => {
            isMounted =
                false;
        };
    }, []);

    function handleChange(
        field:
            keyof ProfileFormState,
        value: string,
    ) {
        setForm(
            (
                current,
            ) => ({
                ...current,
                [field]:
                    value,
            }),
        );

        setError(
            "",
        );
    }

    function showValidationError(
        message: string,
    ) {
        setError(
            message,
        );

        notify.warning(
            "Revisa los campos requeridos.",
            message,
        );
    }

    function validateForm() {
        if (
            !form.firstname.trim()
        ) {
            showValidationError(
                "Ingresa tus nombres antes de guardar los cambios.",
            );

            return false;
        }

        if (
            !form.lastname.trim()
        ) {
            showValidationError(
                "Ingresa tus apellidos antes de guardar los cambios.",
            );

            return false;
        }

        if (
            !form.email.trim()
        ) {
            showValidationError(
                "Ingresa tu correo electrónico antes de guardar los cambios.",
            );

            return false;
        }

        if (
            !isValidEmail(
                form.email,
            )
        ) {
            showValidationError(
                "Ingresa un correo electrónico válido.",
            );

            return false;
        }

        if (
            form.password.trim() &&
            form.password.trim()
                .length < 6
        ) {
            showValidationError(
                "La nueva contraseña debe tener al menos 6 caracteres.",
            );

            return false;
        }

        return true;
    }

    async function handleSubmit(
        event:
            FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        if (
            savingRef.current ||
            saving
        ) {
            return;
        }

        if (
            !user?.id
        ) {
            const message =
                "No se encontró el usuario autenticado.";

            setError(
                message,
            );

            notify.error(
                "No se pudieron guardar los cambios.",
                message,
            );

            return;
        }

        setError(
            "",
        );

        if (
            !validateForm()
        ) {
            return;
        }

        savingRef.current =
            true;

        setSaving(
            true,
        );

        const toastId =
            notify.loading(
                "Guardando cambios...",
                "Estamos actualizando la información de tu perfil.",
            );

        try {
            const payload:
                UpdateCurrentUserPayload = {
                firstname:
                    form.firstname.trim(),
                lastname:
                    form.lastname.trim(),
                email:
                    form.email.trim(),
                phone_number:
                    form.phone_number.trim() ||
                    null,
                departament:
                    form.departament.trim() ||
                    null,
            };

            if (
                form.password.trim()
            ) {
                payload.password =
                    form.password.trim();
            }

            const updatedUser =
                (await updateCurrentUserService(
                    user.id,
                    payload,
                )) as ProfileAuthUser;

            setUser(
                updatedUser,
            );

            setForm(
                mapUserToProfileForm(
                    updatedUser,
                ),
            );

            notify.dismiss(
                toastId,
            );

            notify.success(
                "Perfil actualizado.",
                "Tus datos personales se guardaron correctamente.",
            );
        } catch (
        requestError
        ) {
            console.error(
                "Error al actualizar el perfil:",
                requestError,
            );

            const message =
                getProfileErrorMessage(
                    requestError,
                    "No se pudo actualizar la información.",
                );

            setError(
                message,
            );

            notify.dismiss(
                toastId,
            );

            notify.error(
                "No se pudieron guardar los cambios.",
                message,
            );
        } finally {
            savingRef.current =
                false;

            setSaving(
                false,
            );
        }
    }

    return {
        user,
        form,
        loading,
        saving,
        error,
        fullName,
        initials,
        handleChange,
        handleSubmit,
    };
}

export type UserProfileFormState =
    ReturnType<
        typeof useUserProfileForm
    >;