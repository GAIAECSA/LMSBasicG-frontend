"use client";

import { FormEvent, useMemo, useState } from "react";
import {
    BookOpen,
    CheckCircle2,
    CircleHelp,
    Clipboard,
    Headphones,
    LifeBuoy,
    Mail,
    MessageCircle,
    Phone,
    Send,
    ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

type SupportFormState = {
    subject: string;
    category: string;
    message: string;
};

function getUserFullName(user: unknown) {
    if (!user || typeof user !== "object") return "Usuario";

    const value = user as {
        firstname?: string;
        lastname?: string;
        fullName?: string;
        name?: string;
        username?: string;
        email?: string;
    };

    const fullName = `${value.firstname ?? ""} ${value.lastname ?? ""}`.trim();

    return (
        value.fullName ||
        fullName ||
        value.name ||
        value.username ||
        value.email?.split("@")[0] ||
        "Usuario"
    );
}

function getUserEmail(user: unknown) {
    if (!user || typeof user !== "object") return "";

    const value = user as {
        email?: string;
    };

    return value.email ?? "";
}

export default function HelpPage() {
    const { user } = useAuth();

    const [form, setForm] = useState<SupportFormState>({
        subject: "",
        category: "Cuenta de usuario",
        message: "",
    });

    const [copied, setCopied] = useState(false);
    const [error, setError] = useState("");

    const userName = useMemo(() => getUserFullName(user), [user]);
    const userEmail = useMemo(() => getUserEmail(user), [user]);

    const supportMessage = useMemo(() => {
        return [
            `Usuario: ${userName}`,
            userEmail ? `Correo: ${userEmail}` : "",
            `Categoría: ${form.category}`,
            `Asunto: ${form.subject}`,
            "",
            "Detalle:",
            form.message,
        ]
            .filter(Boolean)
            .join("\n");
    }, [form.category, form.message, form.subject, userEmail, userName]);

    function handleChange(field: keyof SupportFormState, value: string) {
        setForm((current) => ({
            ...current,
            [field]: value,
        }));
    }

    async function handleCopy() {
        try {
            setError("");
            setCopied(false);

            if (!form.subject.trim() || !form.message.trim()) {
                setError("Completa el asunto y el detalle antes de copiar la solicitud.");
                return;
            }

            await navigator.clipboard.writeText(supportMessage);
            setCopied(true);
        } catch {
            setError("No se pudo copiar la solicitud.");
        }
    }

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setError("");
        setCopied(false);

        if (!form.subject.trim() || !form.message.trim()) {
            setError("Completa el asunto y el detalle para enviar la solicitud.");
            return;
        }

        const subject = encodeURIComponent(`[Soporte LMS] ${form.subject}`);
        const body = encodeURIComponent(supportMessage);

        window.location.href = `mailto:soporte@lmsbasicg.com?subject=${subject}&body=${body}`;
    }

    return (
        <section className="min-h-screen bg-[var(--background)] px-4 py-5 pt-16 text-[var(--foreground)] sm:px-5 md:px-8 md:pt-7 xl:px-10">
            <div className="mx-auto w-full max-w-[1600px] space-y-6">
                <div
                    className="overflow-hidden rounded-3xl text-white shadow-xl"
                    style={{ background: "var(--gradient-admin)" }}
                >
                    <div className="relative p-6 md:p-7">
                        <div className="absolute bottom-0 right-0 h-32 w-80 rounded-full bg-orange-400/25 blur-3xl" />

                        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
                            <div className="max-w-3xl">
                                <p className="text-xs font-black uppercase tracking-[0.35em] text-white/75">
                                    Centro de ayuda
                                </p>

                                <h1 className="mt-3 text-3xl font-black tracking-tight text-white">
                                    Ayuda y asistencia
                                </h1>

                                <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-white/80">
                                    Gestiona solicitudes de soporte, reporta problemas
                                    técnicos y encuentra información rápida sobre el uso de
                                    la plataforma.
                                </p>
                            </div>

                            <div className="grid w-full gap-3 sm:grid-cols-3 xl:w-auto">
                                <div className="rounded-2xl bg-white/15 px-4 py-3 shadow-sm backdrop-blur">
                                    <p className="text-xs font-black uppercase text-white/70">
                                        Cuenta
                                    </p>
                                    <p className="mt-1 text-sm font-black text-white">
                                        Usuario activo
                                    </p>
                                </div>

                                <div className="rounded-2xl bg-white/15 px-4 py-3 shadow-sm backdrop-blur">
                                    <p className="text-xs font-black uppercase text-white/70">
                                        Atención
                                    </p>
                                    <p className="mt-1 text-sm font-black text-white">
                                        Soporte LMS
                                    </p>
                                </div>

                                <div className="rounded-2xl bg-white/15 px-4 py-3 shadow-sm backdrop-blur">
                                    <p className="text-xs font-black uppercase text-white/70">
                                        Estado
                                    </p>
                                    <p className="mt-1 text-sm font-black text-white">
                                        Disponible
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid gap-5 lg:grid-cols-3">
                    <article
                        className="rounded-3xl border border-[var(--border)] p-5 shadow-sm"
                        style={{ background: "var(--gradient-card)" }}
                    >
                        <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--secondary)] text-[var(--secondary-foreground)]">
                                <Headphones className="h-6 w-6" />
                            </div>

                            <div>
                                <h2 className="text-base font-black text-[var(--foreground)]">
                                    Soporte técnico
                                </h2>
                                <p className="mt-2 text-sm font-semibold leading-6 text-[var(--muted-foreground)]">
                                    Reporta errores de acceso, cursos, certificados o
                                    fallos de funcionamiento.
                                </p>
                            </div>
                        </div>
                    </article>

                    <article
                        className="rounded-3xl border border-[var(--border)] p-5 shadow-sm"
                        style={{ background: "var(--gradient-card)" }}
                    >
                        <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--secondary)] text-[var(--secondary-foreground)]">
                                <BookOpen className="h-6 w-6" />
                            </div>

                            <div>
                                <h2 className="text-base font-black text-[var(--foreground)]">
                                    Ayuda académica
                                </h2>
                                <p className="mt-2 text-sm font-semibold leading-6 text-[var(--muted-foreground)]">
                                    Consulta dudas sobre cursos, actividades,
                                    calificaciones o acceso al aula.
                                </p>
                            </div>
                        </div>
                    </article>

                    <article
                        className="rounded-3xl border border-[var(--border)] p-5 shadow-sm"
                        style={{ background: "var(--gradient-card)" }}
                    >
                        <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--secondary)] text-[var(--secondary-foreground)]">
                                <ShieldCheck className="h-6 w-6" />
                            </div>

                            <div>
                                <h2 className="text-base font-black text-[var(--foreground)]">
                                    Cuenta y seguridad
                                </h2>
                                <p className="mt-2 text-sm font-semibold leading-6 text-[var(--muted-foreground)]">
                                    Solicita apoyo con datos personales, contraseña o
                                    problemas de sesión.
                                </p>
                            </div>
                        </div>
                    </article>
                </div>

                <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
                    <form
                        onSubmit={handleSubmit}
                        className="rounded-3xl border border-[var(--border)] p-5 shadow-sm md:p-6"
                        style={{ background: "var(--gradient-card)" }}
                    >
                        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--secondary)] text-[var(--secondary-foreground)]">
                                    <CircleHelp className="h-5 w-5" />
                                </div>

                                <div>
                                    <h2 className="text-lg font-black text-[var(--foreground)]">
                                        Solicitar asistencia
                                    </h2>
                                    <p className="text-sm font-semibold text-[var(--muted-foreground)]">
                                        Completa los datos para generar tu solicitud.
                                    </p>
                                </div>
                            </div>

                            <div className="w-fit rounded-2xl bg-[var(--muted)] px-4 py-2 text-xs font-black text-[var(--muted-foreground)]">
                                Usuario:{" "}
                                <span className="text-[var(--foreground)]">
                                    {userName}
                                </span>
                            </div>
                        </div>

                        {error && (
                            <div className="mb-5 rounded-2xl border border-[var(--danger)] bg-[var(--danger-soft)] px-4 py-3 text-sm font-bold text-[var(--danger)]">
                                {error}
                            </div>
                        )}

                        {copied && (
                            <div className="mb-5 flex items-center gap-2 rounded-2xl border border-[var(--success)] bg-[var(--success-soft)] px-4 py-3 text-sm font-bold text-[var(--success)]">
                                <CheckCircle2 className="h-4 w-4" />
                                Solicitud copiada correctamente.
                            </div>
                        )}

                        <div className="grid gap-5 md:grid-cols-2">
                            <div className="space-y-2">
                                <label className="text-sm font-black text-[var(--foreground)]">
                                    Categoría
                                </label>

                                <select
                                    value={form.category}
                                    onChange={(event) =>
                                        handleChange("category", event.target.value)
                                    }
                                    className="h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 text-sm font-semibold text-[var(--foreground)] outline-none transition focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--ring)]/30"
                                >
                                    <option>Cuenta de usuario</option>
                                    <option>Acceso a cursos</option>
                                    <option>Matrículas</option>
                                    <option>Certificados</option>
                                    <option>Calificaciones</option>
                                    <option>Problema técnico</option>
                                    <option>Otro</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-black text-[var(--foreground)]">
                                    Asunto
                                </label>

                                <input
                                    value={form.subject}
                                    onChange={(event) =>
                                        handleChange("subject", event.target.value)
                                    }
                                    className="h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 text-sm font-semibold text-[var(--foreground)] outline-none transition focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--ring)]/30"
                                    placeholder="Ejemplo: No puedo ver mi curso"
                                />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-black text-[var(--foreground)]">
                                    Detalle del problema
                                </label>

                                <textarea
                                    value={form.message}
                                    onChange={(event) =>
                                        handleChange("message", event.target.value)
                                    }
                                    className="min-h-32 w-full resize-none rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm font-semibold leading-6 text-[var(--foreground)] outline-none transition focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--ring)]/30"
                                    placeholder="Describe qué necesitas o cuál es el problema."
                                />
                            </div>
                        </div>

                        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                onClick={handleCopy}
                                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--card)] px-5 text-sm font-black text-[var(--foreground)] shadow-sm transition hover:bg-[var(--muted)]"
                            >
                                <Clipboard className="h-4 w-4" />
                                Copiar solicitud
                            </button>

                            <button
                                type="submit"
                                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-5 text-sm font-black text-[var(--primary-foreground)] shadow-sm transition hover:opacity-90"
                            >
                                <Send className="h-4 w-4" />
                                Enviar por correo
                            </button>
                        </div>
                    </form>

                    <aside className="space-y-5">
                        <div
                            className="rounded-3xl border border-[var(--border)] p-5 shadow-sm"
                            style={{ background: "var(--gradient-card)" }}
                        >
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--secondary)] text-[var(--secondary-foreground)]">
                                    <LifeBuoy className="h-5 w-5" />
                                </div>

                                <div>
                                    <h2 className="text-lg font-black text-[var(--foreground)]">
                                        Canales
                                    </h2>
                                    <p className="text-sm font-semibold text-[var(--muted-foreground)]">
                                        Medios de atención.
                                    </p>
                                </div>
                            </div>

                            <div className="mt-5 space-y-3">
                                <div className="flex items-center gap-3 rounded-2xl bg-[var(--muted)] p-4">
                                    <Mail className="h-5 w-5 shrink-0 text-[var(--primary)]" />
                                    <div className="min-w-0">
                                        <p className="text-sm font-black text-[var(--foreground)]">
                                            Correo
                                        </p>
                                        <p className="truncate text-sm font-semibold text-[var(--muted-foreground)]">
                                            soporte@lmsbasicg.com
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 rounded-2xl bg-[var(--muted)] p-4">
                                    <Phone className="h-5 w-5 shrink-0 text-[var(--primary)]" />
                                    <div>
                                        <p className="text-sm font-black text-[var(--foreground)]">
                                            Teléfono
                                        </p>
                                        <p className="text-sm font-semibold text-[var(--muted-foreground)]">
                                            098 000 0000
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 rounded-2xl bg-[var(--muted)] p-4">
                                    <MessageCircle className="h-5 w-5 shrink-0 text-[var(--primary)]" />
                                    <div>
                                        <p className="text-sm font-black text-[var(--foreground)]">
                                            Chat interno
                                        </p>
                                        <p className="text-sm font-semibold text-[var(--muted-foreground)]">
                                            Desde la plataforma.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div
                            className="rounded-3xl border border-[var(--border)] p-5 shadow-sm"
                            style={{ background: "var(--gradient-card)" }}
                        >
                            <h2 className="text-lg font-black text-[var(--foreground)]">
                                Preguntas rápidas
                            </h2>

                            <div className="mt-4 space-y-4">
                                <div className="rounded-2xl bg-[var(--muted)] p-4">
                                    <h3 className="text-sm font-black text-[var(--foreground)]">
                                        ¿No aparece mi curso?
                                    </h3>
                                    <p className="mt-1 text-sm font-semibold leading-6 text-[var(--muted-foreground)]">
                                        Verifica que tu matrícula esté aprobada.
                                    </p>
                                </div>

                                <div className="rounded-2xl bg-[var(--muted)] p-4">
                                    <h3 className="text-sm font-black text-[var(--foreground)]">
                                        ¿Cuándo sale mi certificado?
                                    </h3>
                                    <p className="mt-1 text-sm font-semibold leading-6 text-[var(--muted-foreground)]">
                                        Cuando completas los requisitos del curso.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </section>
    );
}