"use client";

import {
    type FormEvent,
    useEffect,
    useMemo,
    useState,
} from "react";
import {
    getCurrentUserService,
    updateCurrentUserService,
    type UpdateCurrentUserPayload,
} from "@/services/auth.service";
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

export function useUserProfileForm() {
    const [user, setUser] =
        useState<ProfileAuthUser | null>(
            null,
        );

    const [form, setForm] =
        useState<ProfileFormState>(
            EMPTY_PROFILE_FORM,
        );

    const [loading, setLoading] =
        useState(true);

    const [saving, setSaving] =
        useState(false);

    const [message, setMessage] =
        useState("");

    const [error, setError] =
        useState("");

    const fullName = useMemo(() => {
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

    const initials = useMemo(() => {
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
        let isMounted = true;

        async function loadUser() {
            try {
                const currentUser =
                    (await getCurrentUserService()) as ProfileAuthUser;

                if (!isMounted) return;

                setUser(currentUser);
                setForm(
                    mapUserToProfileForm(
                        currentUser,
                    ),
                );
            } catch (requestError) {
                console.error(
                    requestError,
                );

                if (!isMounted) return;

                setError(
                    "No se pudo cargar la información del usuario.",
                );
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        }

        void loadUser();

        return () => {
            isMounted = false;
        };
    }, []);

    function handleChange(
        field: keyof ProfileFormState,
        value: string,
    ) {
        setForm((current) => ({
            ...current,
            [field]: value,
        }));

        setMessage("");
        setError("");
    }

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        if (!user?.id) {
            setError(
                "No se encontró el usuario logeado.",
            );

            return;
        }

        try {
            setSaving(true);
            setError("");
            setMessage("");

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

            if (form.password.trim()) {
                payload.password =
                    form.password.trim();
            }

            const updatedUser =
                (await updateCurrentUserService(
                    user.id,
                    payload,
                )) as ProfileAuthUser;

            setUser(updatedUser);
            setForm(
                mapUserToProfileForm(
                    updatedUser,
                ),
            );

            setMessage(
                "Información actualizada correctamente.",
            );
        } catch (requestError) {
            console.error(
                requestError,
            );

            setError(
                getProfileErrorMessage(
                    requestError,
                    "No se pudo actualizar la información.",
                ),
            );
        } finally {
            setSaving(false);
        }
    }

    return {
        user,
        form,
        loading,
        saving,
        message,
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
