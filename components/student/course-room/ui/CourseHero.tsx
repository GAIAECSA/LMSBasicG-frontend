import type { ReactNode } from "react";
import {
    Award,
    BookOpen,
    CalendarDays,
    Clock3,
    PlayCircle,
} from "lucide-react";

import type { CourseRoomHook } from "../hook";

type CourseHeroProps = {
    room: CourseRoomHook;
};

export function CourseHero({ room }: CourseHeroProps) {
    return (
        <div className="overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
            <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)_330px] xl:items-center">
                <div className="h-[165px] overflow-hidden rounded-[22px] bg-[var(--muted)]">
                    {room.heroImageUrl ? (
                        <img
                            src={room.heroImageUrl}
                            alt={room.courseName || "Curso"}
                            className="h-full w-full object-cover object-center"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center [background:var(--gradient-soft)] text-[var(--primary)]">
                            <BookOpen className="h-16 w-16" />
                        </div>
                    )}
                </div>

                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                        <h1 className="min-w-0 break-words text-2xl font-black tracking-tight text-[var(--foreground)] md:text-3xl">
                            {room.courseName || "Aula del curso"}
                        </h1>

                        <span className="shrink-0 rounded-full bg-[var(--success-soft)] px-3 py-1 text-xs font-black uppercase text-[var(--success)]">
                            Matrícula activa
                        </span>
                    </div>

                    <p className="mt-3 max-w-3xl break-words whitespace-pre-wrap text-sm font-semibold leading-7 text-[var(--muted-foreground)]">
                        {room.courseDescription}
                    </p>

                    <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <Info
                            icon={
                                <BookOpen className="h-6 w-6 text-[var(--primary)]" />
                            }
                            label="Nivel"
                            value={room.courseLevel}
                        />

                        <Info
                            icon={
                                <Clock3 className="h-6 w-6 text-[var(--primary)]" />
                            }
                            label="Recursos"
                            value={`${room.totalBlocks} contenidos`}
                        />

                        <Info
                            icon={
                                <CalendarDays className="h-6 w-6 text-[var(--primary)]" />
                            }
                            label="Duración"
                            value={room.courseDuration}
                        />

                        <div className="min-w-0">
                            <p className="text-xs font-bold text-[var(--muted-foreground)]">
                                Progreso general
                            </p>

                            <div className="mt-1 flex items-center gap-3">
                                <p className="shrink-0 text-sm font-black">
                                    {room.progress}% completado
                                </p>

                                <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-[var(--muted)]">
                                    <div
                                        className="h-2 rounded-full bg-[var(--primary)] transition-all"
                                        style={{
                                            width: `${room.progress}%`,
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="min-w-0 space-y-3">
                    <Action
                        onClick={() => room.setActiveTab("content")}
                        icon={<PlayCircle className="h-4 w-4" />}
                        label="Continuar aprendiendo"
                        primary
                    />

                    <Action
                        onClick={() => room.setActiveTab("content")}
                        icon={<BookOpen className="h-4 w-4" />}
                        label="Ir al contenido"
                    />

                    <Action
                        onClick={() => room.setActiveTab("certificate")}
                        icon={<Award className="h-4 w-4" />}
                        label="Ver certificado"
                    />
                </div>
            </div>
        </div>
    );
}

function Info({
    icon,
    label,
    value,
}: {
    icon: ReactNode;
    label: string;
    value: string;
}) {
    return (
        <div className="flex min-w-0 items-start gap-3">
            <div className="shrink-0">{icon}</div>

            <div className="min-w-0">
                <p className="text-xs font-bold text-[var(--muted-foreground)]">
                    {label}
                </p>

                <p className="break-words text-sm font-black text-[var(--foreground)]">
                    {value}
                </p>
            </div>
        </div>
    );
}

function Action({
    icon,
    label,
    onClick,
    primary = false,
}: {
    icon: ReactNode;
    label: string;
    onClick: () => void;
    primary?: boolean;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl px-5 text-sm font-black shadow-sm transition ${primary
                    ? "bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-95"
                    : "border border-[var(--border)] bg-[var(--card)] text-[var(--primary)] hover:bg-[var(--secondary)]"
                }`}
        >
            <span className="shrink-0">{icon}</span>

            <span className="truncate">{label}</span>
        </button>
    );
}