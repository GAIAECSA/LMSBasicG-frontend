"use client";

import Image from "next/image";
import Link from "next/link";
import {
    ArrowLeft,
    CalendarDays,
    CheckCircle2,
    CirclePlay,
    Clock3,
    Edit3,
    ExternalLink,
    Info,
    KeyRound,
    Loader2,
    Plus,
    Radio,
    RefreshCw,
    ShieldCheck,
    Trash2,
    Video,
    X,
    Zap,
} from "lucide-react";
import type {
    FormEvent,
} from "react";
import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    AthenaLoadingBackground,
} from "@/components/ui/AthenaLoadingBackground";
import {
    notify,
} from "@/lib/notify";
import {
    createZoomMeeting,
    deleteZoomMeeting,
    listZoomMeetingsByCourse,
    openZoomMeetingForStudent,
    openZoomMeetingForTeacher,
    updateZoomMeeting,
} from "@/services/zoom-meetings.service";
import type {
    CreateZoomMeetingPayload,
    ZoomMeeting,
} from "@/services/zoom-meetings.service";

const COURSE_TIMEZONE =
    "America/Guayaquil";

const ECUADOR_UTC_OFFSET =
    "-05:00";

const QUICK_DURATIONS = [
    30,
    45,
    60,
    90,
    120,
];

type ZoomAudience =
    | "teacher"
    | "student";

type ZoomCoursePanelProps = {
    courseId: number;
    audience: ZoomAudience;
};

type BusyAction =
    | {
        meetingId: number;
        type:
        | "start"
        | "join"
        | "delete";
    }
    | null;

type ZoomMeetingFormModalProps = {
    meeting: ZoomMeeting | null;
    submitting: boolean;
    onClose: () => void;
    onSubmit: (
        payload: Omit<
            CreateZoomMeetingPayload,
            "course_id"
        >,
    ) => Promise<void>;
};

type ZoomMeetingCardProps = {
    meeting: ZoomMeeting;
    audience: ZoomAudience;
    busyAction: BusyAction;
    onStart: (
        meeting: ZoomMeeting,
    ) => Promise<void>;
    onJoin: (
        meeting: ZoomMeeting,
    ) => void;
    onEdit: (
        meeting: ZoomMeeting,
    ) => void;
    onDelete: (
        meeting: ZoomMeeting,
    ) => Promise<void>;
};

function getErrorMessage(
    error: unknown,
): string {
    return error instanceof Error
        ? error.message
        : "Ocurrió un error inesperado.";
}

function getMeetingEndTimestamp(
    meeting: ZoomMeeting,
): number {
    const startTimestamp =
        Date.parse(
            meeting.start_time,
        );

    if (
        Number.isNaN(
            startTimestamp,
        )
    ) {
        return 0;
    }

    return (
        startTimestamp +
        meeting.duration *
        60 *
        1000
    );
}

function meetingIsFinished(
    meeting: ZoomMeeting,
): boolean {
    return (
        getMeetingEndTimestamp(
            meeting,
        ) <
        Date.now()
    );
}

function formatMeetingDate(
    value: string,
): string {
    const date =
        new Date(
            value,
        );

    if (
        Number.isNaN(
            date.getTime(),
        )
    ) {
        return "Fecha no disponible";
    }

    return new Intl.DateTimeFormat(
        "es-EC",
        {
            weekday:
                "short",
            day:
                "numeric",
            month:
                "short",
            year:
                "numeric",
            timeZone:
                COURSE_TIMEZONE,
        },
    ).format(
        date,
    );
}

function formatMeetingTime(
    value: string,
): string {
    const date =
        new Date(
            value,
        );

    if (
        Number.isNaN(
            date.getTime(),
        )
    ) {
        return "Hora no disponible";
    }

    return new Intl.DateTimeFormat(
        "es-EC",
        {
            hour:
                "2-digit",
            minute:
                "2-digit",
            timeZone:
                COURSE_TIMEZONE,
        },
    ).format(
        date,
    );
}

function toEcuadorInputValue(
    value?: string,
): string {
    const date =
        value
            ? new Date(
                value,
            )
            : new Date(
                Date.now() +
                60 *
                60 *
                1000,
            );

    if (
        Number.isNaN(
            date.getTime(),
        )
    ) {
        return "";
    }

    const parts =
        new Intl.DateTimeFormat(
            "en-CA",
            {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                hourCycle:
                    "h23",
                timeZone:
                    COURSE_TIMEZONE,
            },
        ).formatToParts(
            date,
        );

    const readPart = (
        type: Intl.DateTimeFormatPartTypes,
    ) =>
        parts.find(
            (
                part,
            ) =>
                part.type ===
                type,
        )?.value ?? "";

    return `${readPart("year")}-${readPart("month")}-${readPart("day")}T${readPart("hour")}:${readPart("minute")}`;
}

function toZoomIsoDate(
    value: string,
): string {
    const normalizedValue =
        value.trim();

    const validFormat =
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(
            normalizedValue,
        );

    if (!validFormat) {
        throw new Error(
            "Debes seleccionar una fecha y hora válidas.",
        );
    }

    const date =
        new Date(
            `${normalizedValue}:00${ECUADOR_UTC_OFFSET}`,
        );

    if (
        Number.isNaN(
            date.getTime(),
        )
    ) {
        throw new Error(
            "La fecha seleccionada no es válida.",
        );
    }

    return date.toISOString();
}

function getFormattedPreviewDate(
    value: string,
): string {
    try {
        return formatMeetingDate(
            toZoomIsoDate(
                value,
            ),
        );
    } catch {
        return "Selecciona una fecha";
    }
}

function getFormattedPreviewTime(
    value: string,
): string {
    try {
        return formatMeetingTime(
            toZoomIsoDate(
                value,
            ),
        );
    } catch {
        return "Selecciona una hora";
    }
}

function ZoomMeetingFormModal({
    meeting,
    submitting,
    onClose,
    onSubmit,
}: ZoomMeetingFormModalProps) {
    const [
        topic,
        setTopic,
    ] = useState(
        meeting?.topic ??
        "",
    );

    const [
        startTime,
        setStartTime,
    ] = useState(
        toEcuadorInputValue(
            meeting?.start_time,
        ),
    );

    const [
        duration,
        setDuration,
    ] = useState(
        String(
            meeting?.duration ??
            60,
        ),
    );

    const [
        password,
        setPassword,
    ] = useState(
        meeting?.password ??
        "",
    );

    const [
        error,
        setError,
    ] = useState<
        string | null
    >(null);

    const isEditing =
        Boolean(
            meeting,
        );

    const previewDuration =
        Number(
            duration,
        );

    const validPreviewDuration =
        Number.isInteger(
            previewDuration,
        ) &&
            previewDuration >
            0
            ? previewDuration
            : 0;

    useEffect(() => {
        const handleKeyDown = (
            event: KeyboardEvent,
        ) => {
            if (
                event.key ===
                "Escape" &&
                !submitting
            ) {
                onClose();
            }
        };

        window.addEventListener(
            "keydown",
            handleKeyDown,
        );

        return () => {
            window.removeEventListener(
                "keydown",
                handleKeyDown,
            );
        };
    }, [
        onClose,
        submitting,
    ]);

    const handleSubmit =
        async (
            event: FormEvent<HTMLFormElement>,
        ) => {
            event.preventDefault();

            if (submitting) {
                return;
            }

            setError(
                null,
            );

            try {
                const normalizedTopic =
                    topic.trim();

                const numericDuration =
                    Number(
                        duration,
                    );

                if (!normalizedTopic) {
                    throw new Error(
                        "Debes ingresar el tema de la clase.",
                    );
                }

                if (
                    !Number.isInteger(
                        numericDuration,
                    ) ||
                    numericDuration <=
                    0
                ) {
                    throw new Error(
                        "La duración debe ser un número entero mayor a cero.",
                    );
                }

                await onSubmit({
                    topic:
                        normalizedTopic,
                    start_time:
                        toZoomIsoDate(
                            startTime,
                        ),
                    duration:
                        numericDuration,
                    timezone:
                        COURSE_TIMEZONE,
                    password:
                        password.trim(),
                });
            } catch (
            submitError
            ) {
                setError(
                    getErrorMessage(
                        submitError,
                    ),
                );
            }
        };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-3 py-5 backdrop-blur-sm sm:px-5">
            <div className="max-h-[calc(100dvh-40px)] w-full max-w-5xl overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl">
                <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white/95 px-5 py-5 backdrop-blur sm:px-7">
                    <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white p-1 shadow-sm ring-1 ring-slate-200">
                            <Image
                                src="/images/zoom-icon.svg"
                                alt="Zoom"
                                width={44}
                                height={44}
                                className="h-full w-full object-contain"
                            />
                        </div>

                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#e9702c]">
                                Zoom · Clase virtual
                            </p>

                            <h2 className="mt-1 text-xl font-black text-slate-900 sm:text-2xl">
                                {isEditing
                                    ? "Editar reunión"
                                    : "Programar nueva reunión"}
                            </h2>

                            <p className="mt-1 text-sm leading-6 text-slate-600">
                                Complete los datos principales y confirme la vista previa antes de guardar.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={
                            onClose
                        }
                        disabled={
                            submitting
                        }
                        className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                        aria-label="Cerrar formulario"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </header>

                <form
                    onSubmit={
                        handleSubmit
                    }
                >
                    <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_340px]">
                        <div className="space-y-6 px-5 py-6 sm:px-7">
                            <section>
                                <div className="flex items-center gap-2">
                                    <Video className="h-5 w-5 text-[#172861]" />

                                    <h3 className="text-base font-black text-slate-900">
                                        Información de la clase
                                    </h3>
                                </div>

                                <p className="mt-1 text-sm leading-6 text-slate-600">
                                    Use un nombre que permita reconocer fácilmente el tema de la reunión.
                                </p>

                                <label className="mt-4 block">
                                    <span className="text-sm font-bold text-slate-700">
                                        Tema de la clase
                                    </span>

                                    <input
                                        type="text"
                                        value={
                                            topic
                                        }
                                        onChange={(
                                            event,
                                        ) =>
                                            setTopic(
                                                event
                                                    .target
                                                    .value,
                                            )
                                        }
                                        placeholder="Ejemplo: Introducción a costos"
                                        disabled={
                                            submitting
                                        }
                                        autoFocus
                                        className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#172861] focus:ring-4 focus:ring-[#172861]/10 disabled:cursor-not-allowed disabled:bg-slate-100"
                                    />
                                </label>
                            </section>

                            <section className="border-t border-slate-200 pt-6">
                                <div className="flex items-center gap-2">
                                    <CalendarDays className="h-5 w-5 text-[#172861]" />

                                    <h3 className="text-base font-black text-slate-900">
                                        Programación
                                    </h3>
                                </div>

                                <p className="mt-1 text-sm leading-6 text-slate-600">
                                    La zona horaria se establece automáticamente para Ecuador.
                                </p>

                                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                    <label className="block">
                                        <span className="text-sm font-bold text-slate-700">
                                            Fecha y hora de inicio
                                        </span>

                                        <input
                                            type="datetime-local"
                                            value={
                                                startTime
                                            }
                                            onChange={(
                                                event,
                                            ) =>
                                                setStartTime(
                                                    event
                                                        .target
                                                        .value,
                                                )
                                            }
                                            disabled={
                                                submitting
                                            }
                                            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-[#172861] focus:ring-4 focus:ring-[#172861]/10 disabled:cursor-not-allowed disabled:bg-slate-100"
                                        />
                                    </label>

                                    <label className="block">
                                        <span className="text-sm font-bold text-slate-700">
                                            Duración en minutos
                                        </span>

                                        <input
                                            type="number"
                                            min="1"
                                            step="1"
                                            value={
                                                duration
                                            }
                                            onChange={(
                                                event,
                                            ) =>
                                                setDuration(
                                                    event
                                                        .target
                                                        .value,
                                                )
                                            }
                                            disabled={
                                                submitting
                                            }
                                            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-[#172861] focus:ring-4 focus:ring-[#172861]/10 disabled:cursor-not-allowed disabled:bg-slate-100"
                                        />
                                    </label>
                                </div>

                                <div className="mt-4">
                                    <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                                        Duración rápida
                                    </p>

                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {QUICK_DURATIONS.map(
                                            (
                                                quickDuration,
                                            ) => (
                                                <button
                                                    key={
                                                        quickDuration
                                                    }
                                                    type="button"
                                                    onClick={() =>
                                                        setDuration(
                                                            String(
                                                                quickDuration,
                                                            ),
                                                        )
                                                    }
                                                    disabled={
                                                        submitting
                                                    }
                                                    className={`rounded-full border px-3 py-1.5 text-xs font-black transition ${duration ===
                                                        String(
                                                            quickDuration,
                                                        )
                                                        ? "border-[#172861] bg-[#172861] text-white"
                                                        : "border-slate-300 bg-white text-slate-600 hover:border-[#172861]/40 hover:bg-slate-50"
                                                        } disabled:cursor-not-allowed disabled:opacity-60`}
                                                >
                                                    {quickDuration} min
                                                </button>
                                            ),
                                        )}
                                    </div>
                                </div>
                            </section>

                            <section className="border-t border-slate-200 pt-6">
                                <div className="flex items-center gap-2">
                                    <KeyRound className="h-5 w-5 text-[#172861]" />

                                    <h3 className="text-base font-black text-slate-900">
                                        Seguridad
                                    </h3>
                                </div>

                                <p className="mt-1 text-sm leading-6 text-slate-600">
                                    La contraseña es obligatoria. Zoom generará automáticamente el enlace para sus estudiantes.
                                </p>

                                <label className="mt-4 block">
                                    <span className="text-sm font-bold text-slate-700">
                                        Contraseña de acceso
                                    </span>

                                    <input
                                        type="text"
                                        value={
                                            password
                                        }
                                        onChange={(
                                            event,
                                        ) =>
                                            setPassword(
                                                event
                                                    .target
                                                    .value,
                                            )
                                        }
                                        placeholder="Obligatoria para proteger el acceso a la reunión"
                                        required
                                        disabled={
                                            submitting
                                        }
                                        className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#172861] focus:ring-4 focus:ring-[#172861]/10 disabled:cursor-not-allowed disabled:bg-slate-100"
                                    />
                                </label>
                            </section>

                            {error ? (
                                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                                    {error}
                                </div>
                            ) : null}
                        </div>

                        <aside className="border-t border-slate-200 bg-slate-50 px-5 py-6 sm:px-7 lg:border-l lg:border-t-0">
                            <div className="lg:sticky lg:top-[108px]">
                                <p className="text-xs font-black uppercase tracking-[0.15em] text-slate-500">
                                    Vista previa
                                </p>

                                <article className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                                    <div className="bg-gradient-to-br from-[#172861] to-[#25408f] px-4 py-4 text-white">
                                        <div className="flex items-center gap-2">
                                            <Image
                                                src="/images/zoom-icon.svg"
                                                alt=""
                                                width={20}
                                                height={20}
                                                aria-hidden="true"
                                                className="h-5 w-5 rounded object-contain"
                                            />

                                            <span className="text-xs font-black uppercase tracking-wide text-white/80">
                                                Clase virtual
                                            </span>
                                        </div>

                                        <h4 className="mt-3 break-words text-lg font-black leading-snug">
                                            {topic.trim() ||
                                                "Tema de la clase"}
                                        </h4>
                                    </div>

                                    <div className="space-y-3 p-4 text-sm text-slate-600">
                                        <div className="flex items-start gap-2">
                                            <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-[#172861]" />

                                            <span className="capitalize">
                                                {getFormattedPreviewDate(
                                                    startTime,
                                                )}
                                            </span>
                                        </div>

                                        <div className="flex items-start gap-2">
                                            <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-[#172861]" />

                                            <span>
                                                {getFormattedPreviewTime(
                                                    startTime,
                                                )}
                                                {validPreviewDuration >
                                                    0
                                                    ? ` · ${validPreviewDuration} minutos`
                                                    : ""}
                                            </span>
                                        </div>

                                        <div className="flex items-start gap-2">
                                            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#172861]" />

                                            <span>
                                                Zona horaria: America/Guayaquil
                                            </span>
                                        </div>

                                        <div className="flex items-start gap-2">
                                            <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-[#172861]" />

                                            <span>
                                                {password.trim()
                                                    ? "Acceso protegido con contraseña"
                                                    : "Zoom puede generar una contraseña"}
                                            </span>
                                        </div>
                                    </div>
                                </article>

                                <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-4">
                                    <div className="flex gap-2">
                                        <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-700" />

                                        <p className="text-xs font-semibold leading-5 text-blue-800">
                                            Los estudiantes verán esta reunión dentro del curso y podrán ingresar mediante el enlace generado por Zoom.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </aside>
                    </div>

                    <footer className="sticky bottom-0 z-10 flex flex-col-reverse gap-3 border-t border-slate-200 bg-white/95 px-5 py-4 backdrop-blur sm:flex-row sm:justify-end sm:px-7">
                        <button
                            type="button"
                            onClick={
                                onClose
                            }
                            disabled={
                                submitting
                            }
                            className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            Cancelar
                        </button>

                        <button
                            type="submit"
                            disabled={
                                submitting
                            }
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#172861] px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-[#21377d] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {submitting ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <CheckCircle2 className="h-5 w-5" />
                            )}

                            {submitting
                                ? "Guardando reunión..."
                                : isEditing
                                    ? "Guardar cambios"
                                    : "Programar reunión"}
                        </button>
                    </footer>
                </form>
            </div>
        </div>
    );
}

function ZoomMeetingCard({
    meeting,
    audience,
    busyAction,
    onStart,
    onJoin,
    onEdit,
    onDelete,
}: ZoomMeetingCardProps) {
    const isTeacher =
        audience ===
        "teacher";

    const finished =
        meetingIsFinished(
            meeting,
        );

    const currentBusyType =
        busyAction?.meetingId ===
            meeting.id
            ? busyAction.type
            : null;

    return (
        <article className="group flex min-h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-[#172861]/25 hover:shadow-md">
            <div className="border-b border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">
                            Reunión #{meeting.id}
                        </p>

                        <h3 className="mt-1 line-clamp-2 text-base font-black text-[#172861]">
                            {meeting.topic}
                        </h3>
                    </div>

                    <span
                        className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-black ${finished
                            ? "bg-slate-200 text-slate-600"
                            : "bg-emerald-100 text-emerald-700"
                            }`}
                    >
                        <Radio className="h-3 w-3" />

                        {finished
                            ? "Finalizada"
                            : "Programada"}
                    </span>
                </div>
            </div>

            <div className="flex flex-1 flex-col p-4">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-[#e9702c]">
                    <Image
                        src="/images/zoom-icon.svg"
                        alt=""
                        width={18}
                        height={18}
                        aria-hidden="true"
                        className="h-[18px] w-[18px] rounded object-contain"
                    />

                    Clase en vivo
                </div>

                <div className="mt-4 space-y-2.5 text-sm text-slate-600">
                    <div className="flex items-start gap-2">
                        <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-[#172861]" />

                        <span className="capitalize">
                            {formatMeetingDate(
                                meeting.start_time,
                            )}
                        </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                        <span className="inline-flex items-center gap-2">
                            <Clock3 className="h-4 w-4 shrink-0 text-[#172861]" />

                            {formatMeetingTime(
                                meeting.start_time,
                            )}
                        </span>

                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                            {meeting.duration} minutos
                        </span>
                    </div>
                </div>

                <div className="mt-auto flex flex-wrap gap-2 pt-5">
                    {isTeacher &&
                        !finished ? (
                        <button
                            type="button"
                            onClick={() =>
                                void onStart(
                                    meeting,
                                )
                            }
                            disabled={
                                Boolean(
                                    busyAction,
                                )
                            }
                            className="inline-flex items-center gap-2 rounded-xl bg-[#172861] px-3 py-2.5 text-sm font-bold text-white transition hover:bg-[#21377d] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {currentBusyType ===
                                "start" ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <CirclePlay className="h-4 w-4" />
                            )}

                            Iniciar
                        </button>
                    ) : null}

                    {!isTeacher &&
                        !finished ? (
                        <button
                            type="button"
                            onClick={() =>
                                onJoin(
                                    meeting,
                                )
                            }
                            disabled={
                                Boolean(
                                    busyAction,
                                )
                            }
                            className="inline-flex items-center gap-2 rounded-xl bg-[#172861] px-3 py-2.5 text-sm font-bold text-white transition hover:bg-[#21377d] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {currentBusyType ===
                                "join" ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <ExternalLink className="h-4 w-4" />
                            )}

                            Unirme
                        </button>
                    ) : null}

                    {isTeacher ? (
                        <>
                            <button
                                type="button"
                                onClick={() =>
                                    onEdit(
                                        meeting,
                                    )
                                }
                                disabled={
                                    Boolean(
                                        busyAction,
                                    )
                                }
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <Edit3 className="h-4 w-4" />
                                Editar
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    void onDelete(
                                        meeting,
                                    )
                                }
                                disabled={
                                    Boolean(
                                        busyAction,
                                    )
                                }
                                className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {currentBusyType ===
                                    "delete" ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Trash2 className="h-4 w-4" />
                                )}

                                Eliminar
                            </button>
                        </>
                    ) : null}
                </div>
            </div>
        </article>
    );
}

export function ZoomCoursePanel({
    courseId,
    audience,
}: ZoomCoursePanelProps) {
    const [
        meetings,
        setMeetings,
    ] = useState<
        ZoomMeeting[]
    >([]);

    const [
        loading,
        setLoading,
    ] = useState(
        true,
    );

    const [
        refreshing,
        setRefreshing,
    ] = useState(
        false,
    );

    const [
        saving,
        setSaving,
    ] = useState(
        false,
    );

    const [
        modalOpen,
        setModalOpen,
    ] = useState(
        false,
    );

    const [
        editingMeeting,
        setEditingMeeting,
    ] = useState<ZoomMeeting | null>(
        null,
    );

    const [
        busyAction,
        setBusyAction,
    ] = useState<BusyAction>(
        null,
    );

    const [
        error,
        setError,
    ] = useState<string | null>(
        null,
    );

    const isTeacher =
        audience ===
        "teacher";

    const backHref =
        isTeacher
            ? `/teacher/courses/${courseId}`
            : `/student/courses/${courseId}?tab=summary`;

    const fetchMeetings =
        useCallback(
            async () => {
                const data =
                    await listZoomMeetingsByCourse(
                        courseId,
                    );

                return Array.isArray(
                    data,
                )
                    ? data
                    : [];
            },
            [
                courseId,
            ],
        );

    const reloadMeetings =
        useCallback(
            async (
                showToast =
                    true,
            ) => {
                setRefreshing(
                    true,
                );

                setError(
                    null,
                );

                const toastId =
                    showToast
                        ? notify.loading(
                            "Actualizando reuniones...",
                            "Estamos consultando las clases del curso.",
                        )
                        : null;

                try {
                    const data =
                        await fetchMeetings();

                    setMeetings(
                        data,
                    );

                    if (
                        toastId !==
                        null
                    ) {
                        notify.dismiss(
                            toastId,
                        );

                        notify.success(
                            "Reuniones actualizadas.",
                            "La información del curso se encuentra al día.",
                        );
                    }
                } catch (
                loadError
                ) {
                    const message =
                        getErrorMessage(
                            loadError,
                        );

                    setError(
                        message,
                    );

                    if (
                        toastId !==
                        null
                    ) {
                        notify.dismiss(
                            toastId,
                        );

                        notify.error(
                            "No fue posible actualizar las reuniones.",
                            message,
                        );
                    }
                } finally {
                    setRefreshing(
                        false,
                    );
                }
            },
            [
                fetchMeetings,
            ],
        );

    useEffect(() => {
        let cancelled =
            false;

        fetchMeetings()
            .then(
                (
                    data,
                ) => {
                    if (
                        cancelled
                    ) {
                        return;
                    }

                    setMeetings(
                        data,
                    );
                },
            )
            .catch(
                (
                    loadError,
                ) => {
                    if (
                        cancelled
                    ) {
                        return;
                    }

                    setError(
                        getErrorMessage(
                            loadError,
                        ),
                    );
                },
            )
            .finally(
                () => {
                    if (
                        cancelled
                    ) {
                        return;
                    }

                    setLoading(
                        false,
                    );
                },
            );

        return () => {
            cancelled =
                true;
        };
    }, [
        fetchMeetings,
    ]);

    const upcomingMeetings =
        useMemo(
            () =>
                meetings
                    .filter(
                        (
                            meeting,
                        ) =>
                            !meetingIsFinished(
                                meeting,
                            ),
                    )
                    .sort(
                        (
                            first,
                            second,
                        ) =>
                            Date.parse(
                                first.start_time,
                            ) -
                            Date.parse(
                                second.start_time,
                            ),
                    ),
            [
                meetings,
            ],
        );

    const previousMeetings =
        useMemo(
            () =>
                meetings
                    .filter(
                        (
                            meeting,
                        ) =>
                            meetingIsFinished(
                                meeting,
                            ),
                    )
                    .sort(
                        (
                            first,
                            second,
                        ) =>
                            Date.parse(
                                second.start_time,
                            ) -
                            Date.parse(
                                first.start_time,
                            ),
                    ),
            [
                meetings,
            ],
        );

    const handleOpenCreate =
        () => {
            setEditingMeeting(
                null,
            );

            setModalOpen(
                true,
            );
        };

    const handleOpenEdit =
        (
            meeting: ZoomMeeting,
        ) => {
            setEditingMeeting(
                meeting,
            );

            setModalOpen(
                true,
            );
        };

    const handleCloseModal =
        () => {
            if (saving) {
                return;
            }

            setModalOpen(
                false,
            );

            setEditingMeeting(
                null,
            );
        };

    const handleSave =
        async (
            payload: Omit<
                CreateZoomMeetingPayload,
                "course_id"
            >,
        ) => {
            setSaving(
                true,
            );

            setError(
                null,
            );

            const toastId =
                notify.loading(
                    editingMeeting
                        ? "Actualizando reunión..."
                        : "Programando reunión...",
                    "Estamos guardando la clase virtual en Zoom.",
                );

            try {
                if (
                    editingMeeting
                ) {
                    await updateZoomMeeting(
                        editingMeeting.id,
                        payload,
                    );
                } else {
                    await createZoomMeeting({
                        course_id:
                            courseId,
                        ...payload,
                    });
                }

                notify.dismiss(
                    toastId,
                );

                notify.success(
                    editingMeeting
                        ? "Reunión actualizada correctamente."
                        : "Reunión programada correctamente.",
                    "La clase virtual ya se encuentra disponible en el curso.",
                );

                setModalOpen(
                    false,
                );

                setEditingMeeting(
                    null,
                );

                await reloadMeetings(
                    false,
                );
            } catch (
            saveError
            ) {
                const message =
                    getErrorMessage(
                        saveError,
                    );

                setError(
                    message,
                );

                notify.dismiss(
                    toastId,
                );

                notify.error(
                    editingMeeting
                        ? "No fue posible actualizar la reunión."
                        : "No fue posible programar la reunión.",
                    message,
                );

                throw saveError;
            } finally {
                setSaving(
                    false,
                );
            }
        };

    const handleStart =
        async (
            meeting: ZoomMeeting,
        ) => {
            setError(
                null,
            );

            setBusyAction({
                meetingId:
                    meeting.id,
                type: "start",
            });

            const toastId =
                notify.loading(
                    "Preparando reunión...",
                    "Zoom se abrirá en una nueva pestaña.",
                );

            try {
                const opened =
                    await openZoomMeetingForTeacher(
                        meeting.id,
                    );

                if (!opened) {
                    throw new Error(
                        "El navegador bloqueó la pestaña de Zoom. Permite las ventanas emergentes e intenta nuevamente.",
                    );
                }

                notify.dismiss(
                    toastId,
                );

                notify.success(
                    "Reunión abierta correctamente.",
                    "Ya puede iniciar la clase desde Zoom.",
                );
            } catch (
            startError
            ) {
                const message =
                    getErrorMessage(
                        startError,
                    );

                setError(
                    message,
                );

                notify.dismiss(
                    toastId,
                );

                notify.error(
                    "No fue posible abrir Zoom.",
                    message,
                );
            } finally {
                setBusyAction(
                    null,
                );
            }
        };

    const handleJoin =
        (
            meeting: ZoomMeeting,
        ) => {
            setError(
                null,
            );

            setBusyAction({
                meetingId:
                    meeting.id,
                type: "join",
            });

            const toastId =
                notify.loading(
                    "Preparando acceso...",
                    "Zoom se abrirá en una nueva pestaña.",
                );

            try {
                const opened =
                    openZoomMeetingForStudent(
                        meeting.join_url,
                    );

                if (!opened) {
                    throw new Error(
                        "El navegador bloqueó la pestaña de Zoom. Permite las ventanas emergentes e intenta nuevamente.",
                    );
                }

                notify.dismiss(
                    toastId,
                );

                notify.success(
                    "Acceso preparado correctamente.",
                    "La reunión se abrió en una nueva pestaña.",
                );
            } catch (
            joinError
            ) {
                const message =
                    getErrorMessage(
                        joinError,
                    );

                setError(
                    message,
                );

                notify.dismiss(
                    toastId,
                );

                notify.error(
                    "No fue posible abrir Zoom.",
                    message,
                );
            } finally {
                setBusyAction(
                    null,
                );
            }
        };

    const handleDelete =
        async (
            meeting: ZoomMeeting,
        ) => {
            const confirmed =
                window.confirm(
                    `¿Deseas eliminar la reunión "${meeting.topic}"?`,
                );

            if (!confirmed) {
                return;
            }

            setError(
                null,
            );

            setBusyAction({
                meetingId:
                    meeting.id,
                type: "delete",
            });

            const toastId =
                notify.loading(
                    "Eliminando reunión...",
                    "Estamos retirando la clase virtual del curso.",
                );

            try {
                await deleteZoomMeeting(
                    meeting.id,
                );

                setMeetings(
                    (
                        currentMeetings,
                    ) =>
                        currentMeetings.filter(
                            (
                                currentMeeting,
                            ) =>
                                currentMeeting.id !==
                                meeting.id,
                        ),
                );

                notify.dismiss(
                    toastId,
                );

                notify.success(
                    "Reunión eliminada correctamente.",
                    "La clase ya no aparecerá para los estudiantes.",
                );
            } catch (
            deleteError
            ) {
                const message =
                    getErrorMessage(
                        deleteError,
                    );

                setError(
                    message,
                );

                notify.dismiss(
                    toastId,
                );

                notify.error(
                    "No fue posible eliminar la reunión.",
                    message,
                );
            } finally {
                setBusyAction(
                    null,
                );
            }
        };

    const renderMeetingsGrid =
        (
            items: ZoomMeeting[],
            emptyMessage: string,
        ) => {
            if (
                items.length ===
                0
            ) {
                return (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center">
                        <CalendarDays className="mx-auto h-9 w-9 text-slate-400" />

                        <p className="mt-3 text-sm font-black text-slate-700">
                            {emptyMessage}
                        </p>
                    </div>
                );
            }

            return (
                <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                    {items.map(
                        (
                            meeting,
                        ) => (
                            <ZoomMeetingCard
                                key={
                                    meeting.id
                                }
                                meeting={
                                    meeting
                                }
                                audience={
                                    audience
                                }
                                busyAction={
                                    busyAction
                                }
                                onStart={
                                    handleStart
                                }
                                onJoin={
                                    handleJoin
                                }
                                onEdit={
                                    handleOpenEdit
                                }
                                onDelete={
                                    handleDelete
                                }
                            />
                        ),
                    )}
                </div>
            );
        };

    if (
        loading
    ) {
        return (
            <AthenaLoadingBackground
                label="Cargando reuniones del curso..."
            />
        );
    }

    return (
        <>
            <section className="w-full px-3 py-5 sm:px-5 sm:py-6 lg:px-6 xl:px-8">
                <div className="mx-auto w-full max-w-[1680px] space-y-5">
                    <Link
                        href={
                            backHref
                        }
                        className="inline-flex items-center gap-2 text-sm font-bold text-[#172861] transition hover:opacity-75"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Volver al curso
                    </Link>

                    <header className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-[#172861]/5 shadow-sm">
                        <div className="flex flex-col gap-5 px-5 py-5 sm:px-7 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white p-1.5 shadow-sm ring-1 ring-slate-200">
                                    <Image
                                        src="/images/zoom-icon.svg"
                                        alt="Zoom"
                                        width={48}
                                        height={48}
                                        priority
                                        className="h-full w-full object-contain"
                                    />
                                </div>

                                <div>
                                    <p className="text-xs font-black uppercase tracking-[0.15em] text-[#e9702c]">
                                        Curso #{courseId}
                                    </p>

                                    <h1 className="mt-1 text-2xl font-black text-slate-900">
                                        Clases virtuales
                                    </h1>

                                    <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
                                        {isTeacher
                                            ? "Programe, inicie y administre las reuniones de este curso desde un solo lugar."
                                            : "Consulte sus próximas clases e ingrese a las reuniones habilitadas por el docente."}
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2 sm:flex-row">
                                <button
                                    type="button"
                                    onClick={() =>
                                        void reloadMeetings()
                                    }
                                    disabled={
                                        refreshing
                                    }
                                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    <RefreshCw
                                        className={`h-4 w-4 ${refreshing
                                            ? "animate-spin"
                                            : ""
                                            }`}
                                    />

                                    {refreshing
                                        ? "Actualizando..."
                                        : "Actualizar"}
                                </button>
                            </div>
                        </div>
                    </header>

                    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px] 2xl:grid-cols-[minmax(0,1fr)_400px]">
                        <main className="min-w-0 space-y-7">
                            {error ? (
                                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                                    {error}
                                </div>
                            ) : null}

                            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                                <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
                                    <div>
                                        <h2 className="flex items-center gap-2 text-xl font-black text-slate-900">
                                            <Radio className="h-5 w-5 text-[#e9702c]" />
                                            Próximas clases en vivo
                                        </h2>

                                        <p className="mt-1 text-sm leading-6 text-slate-600">
                                            Reuniones programadas y disponibles para este curso.
                                        </p>
                                    </div>

                                    <span className="inline-flex w-fit rounded-full bg-[#172861]/10 px-3 py-1.5 text-xs font-black text-[#172861]">
                                        {upcomingMeetings.length}{" "}
                                        {upcomingMeetings.length ===
                                            1
                                            ? "reunión"
                                            : "reuniones"}
                                    </span>
                                </div>

                                <div className="mt-5">
                                    {renderMeetingsGrid(
                                        upcomingMeetings,
                                        isTeacher
                                            ? "Todavía no ha programado ninguna clase virtual."
                                            : "El docente todavía no ha programado nuevas clases virtuales.",
                                    )}
                                </div>
                            </section>

                            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                                <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
                                    <div>
                                        <h2 className="flex items-center gap-2 text-xl font-black text-slate-900">
                                            <Clock3 className="h-5 w-5 text-[#172861]" />
                                            Historial de clases
                                        </h2>

                                        <p className="mt-1 text-sm leading-6 text-slate-600">
                                            Reuniones cuya hora de finalización ya pasó.
                                        </p>
                                    </div>

                                    <span className="inline-flex w-fit rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-600">
                                        {previousMeetings.length}{" "}
                                        {previousMeetings.length ===
                                            1
                                            ? "registro"
                                            : "registros"}
                                    </span>
                                </div>

                                <div className="mt-5">
                                    {renderMeetingsGrid(
                                        previousMeetings,
                                        "Todavía no existen clases anteriores para mostrar.",
                                    )}
                                </div>
                            </section>
                        </main>

                        <aside className="min-w-0 space-y-5 xl:sticky xl:top-5">
                            {isTeacher ? (
                                <section className="overflow-hidden rounded-3xl border border-[#172861]/20 bg-white shadow-sm">
                                    <div className="bg-gradient-to-br from-[#172861] to-[#25408f] px-5 py-5 text-white">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15">
                                                <Zap className="h-6 w-6" />
                                            </div>

                                            <div>
                                                <h2 className="text-lg font-black">
                                                    Crear una clase
                                                </h2>

                                                <p className="mt-0.5 text-sm leading-5 text-white/80">
                                                    Programe una reunión rápidamente.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-5">
                                        <p className="text-sm leading-6 text-slate-600">
                                            Defina el tema, la fecha, la duración y una contraseña. Zoom generará automáticamente el enlace para sus estudiantes.
                                        </p>

                                        <button
                                            type="button"
                                            onClick={
                                                handleOpenCreate
                                            }
                                            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#172861] px-4 py-3 text-sm font-black text-white transition hover:bg-[#21377d] active:scale-[0.98]"
                                        >
                                            <Plus className="h-5 w-5" />
                                            Programar nueva clase
                                        </button>
                                    </div>
                                </section>
                            ) : null}

                            <section
                                id="recordings"
                                className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
                            >
                                <div className="border-b border-slate-200 bg-gradient-to-br from-slate-50 to-orange-50 px-5 py-5">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#e9702c]/10 text-[#e9702c]">
                                            <CirclePlay className="h-6 w-6" />
                                        </div>

                                        <div>
                                            <h2 className="text-lg font-black text-slate-900">
                                                Clases grabadas
                                            </h2>

                                            <p className="mt-0.5 text-sm leading-5 text-slate-600">
                                                Sesiones disponibles próximamente.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-5">
                                    <div className="rounded-2xl border border-dashed border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 px-4 py-7 text-center">
                                        <CirclePlay className="mx-auto h-9 w-9 text-[#e9702c]" />

                                        <p className="mt-3 text-sm font-black text-amber-900">
                                            El apartado está preparado.
                                        </p>

                                        <p className="mt-1 text-sm leading-6 text-amber-800">
                                            Las grabaciones aparecerán aquí cuando el backend habilite la consulta de archivos procesados por Zoom.
                                        </p>
                                    </div>
                                </div>
                            </section>
                        </aside>
                    </div>
                </div>
            </section>

            {modalOpen ? (
                <ZoomMeetingFormModal
                    key={
                        editingMeeting
                            ? `edit-${editingMeeting.id}`
                            : "create"
                    }
                    meeting={
                        editingMeeting
                    }
                    submitting={
                        saving
                    }
                    onClose={
                        handleCloseModal
                    }
                    onSubmit={
                        handleSave
                    }
                />
            ) : null}
        </>
    );
}
