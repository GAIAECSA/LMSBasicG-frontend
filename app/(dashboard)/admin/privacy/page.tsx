"use client";

import {
    type ChangeEvent,
    type FormEvent,
    type ReactNode,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    AlertCircle,
    CalendarDays,
    CheckCircle2,
    Eye,
    FileCheck2,
    FileText,
    Loader2,
    Plus,
    RefreshCw,
    ShieldCheck,
    ShieldQuestion,
    Trash2,
    UploadCloud,
    X,
} from "lucide-react";

import { API_URL } from "@/services/api-client.service";

import {
    createPrivacyPolicy,
    getActivePrivacyPolicy,
    getAllPrivacyPolicies,
    type PrivacyPolicy,
    type PrivacyPolicyPayload,
} from "@/services/privacy-policy.service";

type PolicyFormState = {
    title: string;
    version: string;
    is_active: boolean;
    mandatory: boolean;
    effective_date: string;
    file: File | null;
};

const emptyForm: PolicyFormState = {
    title: "",
    version: "",
    is_active: true,
    mandatory: true,
    effective_date: "",
    file: null,
};

function getErrorMessage(error: unknown) {
    if (error instanceof Error) return error.message;

    return "Ocurrió un error inesperado.";
}

function normalizeResourceUrl(url?: string | null) {
    if (!url) return "";

    if (
        url.startsWith("http://") ||
        url.startsWith("https://") ||
        url.startsWith("data:")
    ) {
        return url;
    }

    if (url.startsWith("/")) {
        return `${API_URL}${url}`;
    }

    return `${API_URL}/${url}`;
}

function formatDate(value?: string | null) {
    if (!value) return "Sin fecha";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat("es-EC", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(date);
}

function getNowDateTimeLocal() {
    const now = new Date();
    const timezoneOffset = now.getTimezoneOffset() * 60000;
    const localDate = new Date(now.getTime() - timezoneOffset);

    return localDate.toISOString().slice(0, 16);
}

function toBackendDateTime(value: string) {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return value;

    return date.toISOString();
}

function getPolicyStatusLabel(policy: PrivacyPolicy) {
    if (policy.deleted) return "Eliminada";
    if (policy.is_active) return "Activa";

    return "Inactiva";
}

function getPolicyStatusClass(policy: PrivacyPolicy) {
    if (policy.deleted) {
        return "border-red-200 bg-red-50 text-red-700";
    }

    if (policy.is_active) {
        return "border-emerald-200 bg-emerald-50 text-emerald-700";
    }

    return "border-slate-200 bg-slate-100 text-slate-600";
}

export default function AdminPrivacyPoliciesPage() {
    const [policies, setPolicies] = useState<PrivacyPolicy[]>([]);
    const [activePolicy, setActivePolicy] =
        useState<PrivacyPolicy | null>(null);

    const [selectedPolicy, setSelectedPolicy] =
        useState<PrivacyPolicy | null>(null);

    const [form, setForm] =
        useState<PolicyFormState>(emptyForm);

    const [isModalOpen, setIsModalOpen] =
        useState(false);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [notice, setNotice] = useState("");
    const [error, setError] = useState("");

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

    const activePolicyFileUrl =
        normalizeResourceUrl(
            activePolicy?.file_url,
        );

    const selectedPolicyFileUrl =
        normalizeResourceUrl(
            selectedPolicy?.file_url,
        );

    const activeCount = useMemo(() => {
        return policies.filter(
            (policy) =>
                policy.is_active &&
                !policy.deleted,
        ).length;
    }, [policies]);

    const mandatoryCount = useMemo(() => {
        return policies.filter(
            (policy) =>
                policy.mandatory &&
                !policy.deleted,
        ).length;
    }, [policies]);

    const loadPolicies = useCallback(async () => {
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

            setPolicies(normalizedPolicies);

            setActivePolicy(
                activePolicyResponse,
            );

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
                        (policy) =>
                            policy.id ===
                            current.id,
                    ) ??
                    activePolicyResponse ??
                    normalizedPolicies[0] ??
                    null
                );
            });
        } catch (err) {
            setPolicies([]);
            setActivePolicy(null);
            setSelectedPolicy(null);

            setError(
                getErrorMessage(err),
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void loadPolicies();
        }, 0);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [loadPolicies]);

    function resetForm() {
        setForm(emptyForm);
        setError("");
    }

    function closeModal() {
        if (saving) return;

        setIsModalOpen(false);

        resetForm();
    }

    function startCreate() {
        setForm({
            ...emptyForm,
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
            event.target.files?.[0] ?? null;

        if (!file) return;

        const allowedTypes = [
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "text/plain",
        ];

        if (
            !allowedTypes.includes(file.type)
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

            const payload: PrivacyPolicyPayload =
            {
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

            setForm(emptyForm);

            await loadPolicies();
        } catch (err) {
            setError(
                getErrorMessage(err),
            );
        } finally {
            setSaving(false);
        }
    }


    return (
        <section className="space-y-6 p-6">
            <div className="overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-[#07111F] via-[#172861] via-70% to-[#F97316] p-6 text-white shadow-[0_20px_60px_rgba(15,23,42,0.35)]">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-100">
                            Administración
                        </p>

                        <h1 className="mt-3 text-3xl font-black md:text-4xl">
                            Políticas de privacidad
                        </h1>

                        <p className="mt-3 max-w-3xl text-sm font-semibold leading-7 text-blue-50">
                            Gestiona las políticas de privacidad
                            del sistema.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <button
                            type="button"
                            onClick={startCreate}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-black text-[#172861] shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-50"
                        >
                            <Plus className="h-4 w-4" />
                            Nueva política
                        </button>

                        <button
                            type="button"
                            onClick={() => void loadPolicies()}
                            disabled={loading}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-white/15 px-5 text-sm font-black text-white ring-1 ring-white/20 backdrop-blur-sm transition hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <RefreshCw
                                className={`h-4 w-4 ${loading
                                    ? "animate-spin"
                                    : ""
                                    }`}
                            />

                            Actualizar
                        </button>
                    </div>
                </div>
            </div>

            {notice ? (
                <div className="flex items-start gap-3 rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-700 shadow-sm">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />

                    <span>{notice}</span>
                </div>
            ) : null}

            {error ? (
                <div className="flex items-start gap-3 rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700 shadow-sm">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

                    <span>{error}</span>
                </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-3">
                <SummaryCard
                    icon={<FileText className="h-5 w-5" />}
                    title="Políticas"
                    value={policies.length}
                    helper="Registros creados"
                />

                <SummaryCard
                    icon={<ShieldCheck className="h-5 w-5" />}
                    title="Activas"
                    value={activeCount}
                    helper="Políticas activas"
                />

                <SummaryCard
                    icon={<FileCheck2 className="h-5 w-5" />}
                    title="Obligatorias"
                    value={mandatoryCount}
                    helper="Requieren aceptación"
                />
            </div>

            <div className="rounded-[30px] border border-[var(--border)] bg-white shadow-sm">
                <div className="border-b border-slate-200 px-6 py-5">
                    <h2 className="text-xl font-black text-slate-950">
                        Políticas registradas
                    </h2>

                    <p className="mt-1 text-sm font-semibold text-slate-500">
                        Historial de políticas de privacidad.
                    </p>
                </div>

                {loading ? (
                    <div className="flex min-h-[250px] items-center justify-center">
                        <Loader2 className="h-10 w-10 animate-spin text-[#172861]" />
                    </div>
                ) : sortedPolicies.length === 0 ? (
                    <div className="p-10 text-center">
                        <FileText className="mx-auto h-10 w-10 text-slate-400" />

                        <h3 className="mt-4 text-lg font-black text-slate-900">
                            No existen políticas
                        </h3>

                        <p className="mt-2 text-sm text-slate-500">
                            Crea la primera política para comenzar.
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {sortedPolicies.map((policy) => {
                            const fileUrl =
                                normalizeResourceUrl(
                                    policy.file_url,
                                );

                            return (
                                <article
                                    key={policy.id}
                                    className="p-5 hover:bg-slate-50"
                                >
                                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                        <div className="flex min-w-0 items-start gap-4">
                                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#172861]">
                                                <FileText className="h-5 w-5" />
                                            </div>

                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h3 className="truncate text-sm font-black text-slate-950">
                                                        {
                                                            policy.title
                                                        }
                                                    </h3>

                                                    <span
                                                        className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-black ${getPolicyStatusClass(
                                                            policy,
                                                        )}`}
                                                    >
                                                        {getPolicyStatusLabel(
                                                            policy,
                                                        )}
                                                    </span>
                                                </div>

                                                <p className="mt-2 text-xs font-semibold text-slate-500">
                                                    Versión{" "}
                                                    {
                                                        policy.version
                                                    }{" "}
                                                    ·{" "}
                                                    {formatDate(
                                                        policy.effective_date,
                                                    )}
                                                </p>
                                            </div>
                                        </div>

                                        {fileUrl ? (
                                            <a
                                                href={fileUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-700 transition hover:bg-slate-50"
                                            >
                                                <Eye className="h-4 w-4" />

                                                Ver archivo
                                            </a>
                                        ) : null}
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* MODAL */}
            {isModalOpen ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
                    <div className="max-h-[92vh] w-full max-w-2xl overflow-hidden rounded-[32px] bg-white shadow-2xl">
                        <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-slate-50 px-6 py-5">
                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#172861]">
                                    Nueva política
                                </p>

                                <h2 className="mt-2 text-2xl font-black text-slate-950">
                                    Agregar nueva política
                                </h2>

                                <p className="mt-2 text-sm font-semibold text-slate-500">
                                    Completa la
                                    información
                                    para registrar
                                    una nueva
                                    política.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={
                                    closeModal
                                }
                                disabled={
                                    saving
                                }
                                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-slate-500 ring-1 ring-slate-200 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form
                            onSubmit={
                                handleSubmit
                            }
                            className="max-h-[calc(92vh-96px)] overflow-y-auto p-6"
                        >
                            {error ? (
                                <div className="mb-5 flex items-start gap-3 rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

                                    <span>
                                        {error}
                                    </span>
                                </div>
                            ) : null}

                            {/* FORM */}

                            <div className="grid gap-4 md:grid-cols-2">
                                <label className="block">
                                    <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                                        Título
                                    </span>

                                    <input
                                        value={
                                            form.title
                                        }
                                        onChange={(
                                            event,
                                        ) =>
                                            setForm(
                                                (
                                                    current,
                                                ) => ({
                                                    ...current,
                                                    title:
                                                        event
                                                            .target
                                                            .value,
                                                }),
                                            )
                                        }
                                        className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4"
                                    />
                                </label>

                                <label className="block">
                                    <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                                        Versión
                                    </span>

                                    <input
                                        value={
                                            form.version
                                        }
                                        onChange={(
                                            event,
                                        ) =>
                                            setForm(
                                                (
                                                    current,
                                                ) => ({
                                                    ...current,
                                                    version:
                                                        event
                                                            .target
                                                            .value,
                                                }),
                                            )
                                        }
                                        className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4"
                                    />
                                </label>

                                <label className="block md:col-span-2">
                                    <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                                        Fecha de
                                        vigencia
                                    </span>

                                    <div className="relative mt-2">
                                        <CalendarDays className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                                        <input
                                            type="datetime-local"
                                            value={
                                                form.effective_date
                                            }
                                            onChange={(
                                                event,
                                            ) =>
                                                setForm(
                                                    (
                                                        current,
                                                    ) => ({
                                                        ...current,
                                                        effective_date:
                                                            event
                                                                .target
                                                                .value,
                                                    }),
                                                )
                                            }
                                            className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4"
                                        />
                                    </div>
                                </label>
                            </div>

                            <div className="mt-5 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-5">
                                <label className="block cursor-pointer text-center">
                                    <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-3xl bg-white text-[#172861] shadow-sm">
                                        <UploadCloud className="h-5 w-5" />
                                    </span>

                                    <span className="mt-4 block truncate text-sm font-black text-slate-800">
                                        {form.file
                                            ? form
                                                .file
                                                .name
                                            : "Seleccionar archivo"}
                                    </span>

                                    <span className="mt-1 block text-xs font-semibold text-slate-500">
                                        PDF, DOC,
                                        DOCX o TXT
                                    </span>

                                    <input
                                        type="file"
                                        accept=".pdf,.doc,.docx,.txt"
                                        onChange={
                                            handleFileChange
                                        }
                                        className="hidden"
                                    />
                                </label>
                            </div>

                            {form.file ? (
                                <div className="mt-5 flex items-center justify-between gap-3 rounded-3xl border border-blue-200 bg-blue-50 px-5 py-4">
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-black text-blue-950">
                                            {
                                                form
                                                    .file
                                                    .name
                                            }
                                        </p>

                                        <p className="text-xs font-semibold text-blue-700">
                                            {(
                                                form
                                                    .file
                                                    .size /
                                                1024
                                            ).toFixed(
                                                1,
                                            )}{" "}
                                            KB
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setForm(
                                                (
                                                    current,
                                                ) => ({
                                                    ...current,
                                                    file: null,
                                                }),
                                            )
                                        }
                                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-red-600"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            ) : null}

                            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={
                                        closeModal
                                    }
                                    disabled={
                                        saving
                                    }
                                    className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700"
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="submit"
                                    disabled={
                                        saving
                                    }
                                    className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(180deg,#4176ea_0%,#2f63d8_100%)] px-5 text-sm font-black text-white"
                                >
                                    {saving ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Plus className="h-4 w-4" />
                                    )}

                                    {saving
                                        ? "Guardando..."
                                        : "Crear política"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}
        </section>
    );

}

function SummaryCard({
    icon,
    title,
    value,
    helper,
}: {
    icon: ReactNode;
    title: string;
    value: number;
    helper: string;
}) {
    return (
        <div className="rounded-[28px] border border-[var(--border)] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl bg-blue-50 text-[#172861]">
                    {icon}
                </div>

                <div>
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                        {title}
                    </p>

                    <p className="mt-1 text-3xl font-black text-slate-950">
                        {value}
                    </p>

                    <p className="text-xs font-semibold text-slate-500">
                        {helper}
                    </p>
                </div>
            </div>
        </div>
    );
}