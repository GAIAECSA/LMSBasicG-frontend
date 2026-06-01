"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
    BadgeCheck,
    Building2,
    CreditCard,
    Loader2,
    Mail,
    Phone,
    Save,
    UserRound,
} from "lucide-react";
import type { AuthUser } from "@/types/auth";
import {
    getCurrentUserService,
    updateCurrentUserService,
    type UpdateCurrentUserPayload,
} from "@/services/auth.service";

type ProfileAuthUser = AuthUser & {
    departament?: string | null;
};

type ProfileFormState = {
    username: string;
    idnumber: string;
    firstname: string;
    lastname: string;
    email: string;
    phone_number: string;
    departament: string;
    password: string;
};

function getRoleLabel(user: ProfileAuthUser | null) {
    if (!user) return "Usuario";

    if (user.role === "admin") return "Administrador";
    if (user.role === "teacher") return "Docente";
    if (user.role === "student") return "Estudiante";

    return "Usuario";
}

function getInitials(firstname: string, lastname: string, username: string) {
    const first = firstname.trim().charAt(0);
    const last = lastname.trim().charAt(0);
    const initials = `${first}${last}`.trim();

    if (initials) return initials.toUpperCase();

    return username.trim().slice(0, 2).toUpperCase() || "US";
}

export function UserProfileForm() {
    const [user, setUser] = useState<ProfileAuthUser | null>(null);

    const [form, setForm] = useState<ProfileFormState>({
        username: "",
        idnumber: "",
        firstname: "",
        lastname: "",
        email: "",
        phone_number: "",
        departament: "",
        password: "",
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const fullName = useMemo(() => {
        const name = `${form.firstname} ${form.lastname}`.trim();
        return name || form.username || "Usuario";
    }, [form.firstname, form.lastname, form.username]);

    const initials = useMemo(() => {
        return getInitials(form.firstname, form.lastname, form.username);
    }, [form.firstname, form.lastname, form.username]);

    useEffect(() => {
        async function loadUser() {
            try {
                setLoading(true);
                setError("");
                setMessage("");

                const currentUser = (await getCurrentUserService()) as ProfileAuthUser;

                setUser(currentUser);

                setForm({
                    username: currentUser.username ?? "",
                    idnumber: currentUser.idnumber ?? "",
                    firstname: currentUser.firstname ?? "",
                    lastname: currentUser.lastname ?? "",
                    email: currentUser.email ?? "",
                    phone_number: currentUser.phone_number ?? "",
                    departament: currentUser.departament ?? "",
                    password: "",
                });
            } catch (requestError) {
                console.error(requestError);
                setError("No se pudo cargar la información del usuario.");
            } finally {
                setLoading(false);
            }
        }

        loadUser();
    }, []);

    function handleChange(field: keyof ProfileFormState, value: string) {
        setForm((current) => ({
            ...current,
            [field]: value,
        }));
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!user?.id) {
            setError("No se encontró el usuario logeado.");
            return;
        }

        try {
            setSaving(true);
            setError("");
            setMessage("");

            const payload: UpdateCurrentUserPayload = {
                firstname: form.firstname.trim(),
                lastname: form.lastname.trim(),
                email: form.email.trim(),
                phone_number: form.phone_number.trim() || null,
                departament: form.departament.trim() || null,
            };

            if (form.password.trim()) {
                payload.password = form.password.trim();
            }

            const updatedUser = (await updateCurrentUserService(
                user.id,
                payload,
            )) as ProfileAuthUser;

            setUser(updatedUser);

            setForm({
                username: updatedUser.username ?? "",
                idnumber: updatedUser.idnumber ?? "",
                firstname: updatedUser.firstname ?? "",
                lastname: updatedUser.lastname ?? "",
                email: updatedUser.email ?? "",
                phone_number: updatedUser.phone_number ?? "",
                departament: updatedUser.departament ?? "",
                password: "",
            });

            setMessage("Información actualizada correctamente.");
        } catch (requestError) {
            console.error(requestError);
            setError(
                requestError instanceof Error
                    ? requestError.message
                    : "No se pudo actualizar la información.",
            );
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center p-6">
                <div className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] px-5 py-4 text-sm font-bold text-[var(--muted-foreground)] shadow-sm">
                    <Loader2 className="h-5 w-5 animate-spin text-[var(--primary)]" />
                    Cargando información del usuario...
                </div>
            </div>
        );
    }

    return (
        <section className="w-full space-y-6 p-4 sm:p-6 lg:p-8">
            <div
                className="overflow-hidden rounded-3xl text-[var(--primary-foreground)] shadow-xl"
                style={{ background: "var(--gradient-admin)" }}
            >
                <div className="relative p-6 sm:p-8">
                    <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-white/10 blur-3xl" />

                    <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white text-2xl font-black text-[var(--primary)] shadow-lg">
                                {initials}
                            </div>

                            <div>
                                <p className="text-sm font-bold text-white/75">
                                    Configuración de cuenta
                                </p>

                                <h1 className="mt-1 text-2xl font-black sm:text-3xl">
                                    Mi perfil
                                </h1>

                                <p className="mt-2 text-sm font-medium text-white/80">
                                    Actualiza tus datos personales de la plataforma.
                                </p>
                            </div>
                        </div>

                        <div className="inline-flex w-fit items-center gap-2 rounded-2xl bg-white/15 px-4 py-3 text-sm font-black text-white shadow-sm">
                            <BadgeCheck className="h-4 w-4" />
                            {getRoleLabel(user)}
                        </div>
                    </div>
                </div>
            </div>

            <form
                onSubmit={handleSubmit}
                className="rounded-3xl border border-[var(--border)] p-5 shadow-sm sm:p-7"
                style={{ background: "var(--gradient-card)" }}
            >
                <div className="mb-7 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--secondary)] text-[var(--secondary-foreground)]">
                        <UserRound className="h-5 w-5" />
                    </div>

                    <div>
                        <h2 className="text-lg font-black text-[var(--foreground)]">
                            Información personal
                        </h2>

                        <p className="text-sm font-semibold text-[var(--muted-foreground)]">
                            Usuario logeado: {fullName}
                        </p>
                    </div>
                </div>

                {message && (
                    <div className="mb-5 rounded-2xl border border-[var(--success)] bg-[var(--success-soft)] px-4 py-3 text-sm font-bold text-[var(--success)]">
                        {message}
                    </div>
                )}

                {error && (
                    <div className="mb-5 rounded-2xl border border-[var(--danger)] bg-[var(--danger-soft)] px-4 py-3 text-sm font-bold text-[var(--danger)]">
                        {error}
                    </div>
                )}

                <div className="grid gap-5 md:grid-cols-2">
                    <div className="space-y-2">
                        <label className="text-sm font-black text-[var(--foreground)]">
                            Usuario
                        </label>

                        <input
                            value={form.username}
                            readOnly
                            disabled
                            className="h-12 w-full cursor-not-allowed rounded-2xl border border-[var(--border)] bg-[var(--muted)] px-4 text-sm font-semibold text-[var(--muted-foreground)] outline-none"
                            placeholder="Nombre de usuario"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-black text-[var(--foreground)]">
                            Cédula / identificación
                        </label>

                        <div className="relative">
                            <CreditCard className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />

                            <input
                                value={form.idnumber}
                                readOnly
                                disabled
                                className="h-12 w-full cursor-not-allowed rounded-2xl border border-[var(--border)] bg-[var(--muted)] pl-11 pr-4 text-sm font-semibold text-[var(--muted-foreground)] outline-none"
                                placeholder="Identificación no disponible"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-black text-[var(--foreground)]">
                            Nombres
                        </label>

                        <input
                            value={form.firstname}
                            onChange={(event) =>
                                handleChange("firstname", event.target.value)
                            }
                            className="h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 text-sm font-semibold text-[var(--foreground)] outline-none transition focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--ring)]/30"
                            placeholder="Ingrese sus nombres"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-black text-[var(--foreground)]">
                            Apellidos
                        </label>

                        <input
                            value={form.lastname}
                            onChange={(event) =>
                                handleChange("lastname", event.target.value)
                            }
                            className="h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 text-sm font-semibold text-[var(--foreground)] outline-none transition focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--ring)]/30"
                            placeholder="Ingrese sus apellidos"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-black text-[var(--foreground)]">
                            Correo electrónico
                        </label>

                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />

                            <input
                                type="email"
                                value={form.email}
                                onChange={(event) =>
                                    handleChange("email", event.target.value)
                                }
                                className="h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--card)] pl-11 pr-4 text-sm font-semibold text-[var(--foreground)] outline-none transition focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--ring)]/30"
                                placeholder="correo@ejemplo.com"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-black text-[var(--foreground)]">
                            Teléfono
                        </label>

                        <div className="relative">
                            <Phone className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />

                            <input
                                value={form.phone_number}
                                onChange={(event) =>
                                    handleChange("phone_number", event.target.value)
                                }
                                className="h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--card)] pl-11 pr-4 text-sm font-semibold text-[var(--foreground)] outline-none transition focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--ring)]/30"
                                placeholder="Ingrese su teléfono"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-black text-[var(--foreground)]">
                            Nueva contraseña
                        </label>

                        <input
                            type="password"
                            value={form.password}
                            onChange={(event) =>
                                handleChange("password", event.target.value)
                            }
                            className="h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 text-sm font-semibold text-[var(--foreground)] outline-none transition focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--ring)]/30"
                            placeholder="Dejar vacío para no cambiar"
                        />

                        <p className="text-xs font-semibold text-[var(--muted-foreground)]">
                            Solo se actualizará la contraseña cuando escribas una nueva.
                        </p>
                    </div>
                </div>

                <div className="mt-8 flex justify-end">
                    <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-6 text-sm font-black text-[var(--primary-foreground)] shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {saving ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4" />
                        )}

                        {saving ? "Guardando..." : "Guardar cambios"}
                    </button>
                </div>
            </form>
        </section>
    );
}