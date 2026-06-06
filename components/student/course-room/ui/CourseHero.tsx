import Image from "next/image";
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
    isMdtCourse?: boolean;
};

export function CourseHero({
    room,
    isMdtCourse = false,
}: CourseHeroProps) {
    const safeProgress = Math.min(100, Math.max(0, room.progress));

    return (
        <div className="overflow-hidden rounded-[22px] border border-[var(--border)] bg-[var(--card)] p-3 shadow-sm sm:rounded-[26px] sm:p-4 lg:p-5 [@media(max-height:760px)]:p-3.5">
            <div className="grid min-w-0 gap-4 lg:grid-cols-[230px_minmax(0,1fr)] lg:items-center xl:grid-cols-[250px_minmax(0,1fr)_215px] 2xl:grid-cols-[300px_minmax(0,1fr)_240px]">
                <div className="relative h-[138px] overflow-hidden rounded-[16px] bg-[var(--muted)] sm:h-[160px] sm:rounded-[20px] lg:h-[150px] 2xl:h-[170px]">
                    {room.heroImageUrl ? (
                        <Image
                            src={room.heroImageUrl}
                            alt={room.courseName || "Curso"}
                            fill
                            unoptimized
                            sizes="(max-width: 1024px) 100vw, 300px"
                            className="object-cover object-center"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center [background:var(--gradient-soft)] text-[var(--primary)]">
                            <BookOpen className="h-12 w-12 sm:h-14 sm:w-14" />
                        </div>
                    )}
                </div>

                <div className="min-w-0">
                    <div className="flex min-w-0 flex-col items-start gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                        <h1 className="min-w-0 break-words text-xl font-black tracking-tight text-[var(--foreground)] sm:text-2xl lg:text-[26px]">
                            {room.courseName || "Aula del curso"}
                        </h1>

                        <span className="shrink-0 rounded-full bg-[var(--success-soft)] px-2.5 py-1 text-[9px] font-black uppercase tracking-wide text-[var(--success)] sm:text-[10px]">
                            Matrícula activa
                        </span>
                    </div>

                    <p className="mt-2 line-clamp-3 max-w-3xl break-words whitespace-pre-wrap text-xs font-semibold leading-5 text-[var(--muted-foreground)] sm:text-sm sm:leading-6 xl:line-clamp-2">
                        {room.courseDescription}
                    </p>

                    <div className="mt-3 grid min-w-0 grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
                        <Info
                            icon={<BookOpen className="h-4 w-4 text-[var(--primary)] sm:h-5 sm:w-5" />}
                            label="Nivel"
                            value={room.courseLevel}
                        />

                        <Info
                            icon={<Clock3 className="h-4 w-4 text-[var(--primary)] sm:h-5 sm:w-5" />}
                            label="Recursos"
                            value={`${room.totalBlocks} contenidos`}
                        />

                        <Info
                            icon={<CalendarDays className="h-4 w-4 text-[var(--primary)] sm:h-5 sm:w-5" />}
                            label="Duración"
                            value={room.courseDuration}
                        />

                        <div className="min-w-0 rounded-xl bg-[var(--muted)]/60 p-2.5">
                            <p className="text-[10px] font-bold text-[var(--muted-foreground)] sm:text-xs">
                                Progreso general
                            </p>

                            <div className="mt-1 flex min-w-0 items-center gap-2">
                                <p className="shrink-0 text-xs font-black sm:text-sm">
                                    {safeProgress}%
                                </p>

                                <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-[var(--muted)]">
                                    <div
                                        className="h-full rounded-full bg-[var(--primary)] transition-all"
                                        style={{ width: `${safeProgress}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid min-w-0 gap-2 sm:grid-cols-3 lg:col-span-2 xl:col-span-1 xl:grid-cols-1">
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
                        onClick={() =>
                            room.setActiveTab(
                                isMdtCourse ? "mdtcertificate" : "certificate",
                            )
                        }
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
        <div className="flex min-w-0 items-start gap-2 rounded-xl bg-[var(--muted)]/60 p-2.5">
            <div className="shrink-0">{icon}</div>

            <div className="min-w-0">
                <p className="text-[10px] font-bold text-[var(--muted-foreground)] sm:text-xs">
                    {label}
                </p>

                <p className="break-words text-xs font-black leading-4 text-[var(--foreground)] sm:text-sm">
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
            className={`inline-flex min-h-10 w-full min-w-0 items-center justify-center gap-2 rounded-xl px-3 py-2 text-center text-xs font-black shadow-sm transition hover:-translate-y-0.5 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--secondary)] sm:rounded-2xl sm:text-sm ${
                primary
                    ? "bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-95"
                    : "border border-[var(--border)] bg-[var(--card)] text-[var(--primary)] hover:bg-[var(--secondary)]"
            }`}
        >
            <span className="shrink-0">{icon}</span>
            <span className="min-w-0 break-words">{label}</span>
        </button>
    );
}
