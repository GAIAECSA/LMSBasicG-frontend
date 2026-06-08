"use client";

import {
    useState,
} from "react";

import {
    CalendarDays,
    CheckCircle2,
    ChevronDown,
    ChevronRight,
    ChevronUp,
    Clock3,
} from "lucide-react";

import type {
    CourseAttendance,
} from "@/services/attendance.service";

import {
    formatDate,
    formatTime,
} from "../utils";

type SessionsSidebarProps = {
    sessions: CourseAttendance[];
    selectedSessionId: string;
    isDisabled: boolean;
    setSelectedSessionId: (value: string) => void;
};

export function SessionsSidebar({
    sessions,
    selectedSessionId,
    isDisabled,
    setSelectedSessionId,
}: SessionsSidebarProps) {
    const [isListOpen, setIsListOpen] =
        useState(false);

    const selectedSession =
        sessions.find(
            (session) =>
                String(session.id) ===
                selectedSessionId,
        ) ?? null;

    const availableSessions =
        sessions.filter(
            (session) =>
                String(session.id) !==
                selectedSessionId,
        );

    function handleSelectSession(
        sessionId: string,
    ) {
        setSelectedSessionId(sessionId);
        setIsListOpen(false);
    }

    return (
        <aside className="min-w-0 border-b border-slate-200 bg-slate-50 p-3 sm:p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                    <h2 className="text-xs font-black uppercase tracking-wide text-slate-700 sm:text-sm">
                        Sesión seleccionada
                    </h2>

                    <p className="mt-1 text-[10px] font-semibold leading-4 text-slate-500 sm:text-xs">
                        Consulta la sesión activa o despliega
                        la lista para seleccionar otra.
                    </p>
                </div>

                <div className="flex flex-col gap-2 xs:flex-row xs:items-center">
                    <span className="inline-flex h-9 shrink-0 items-center justify-center rounded-xl bg-white px-3 text-[10px] font-black text-slate-500 ring-1 ring-slate-200 sm:h-10 sm:text-xs">
                        {sessions.length}{" "}
                        {sessions.length === 1
                            ? "sesión"
                            : "sesiones"}
                    </span>

                    {sessions.length > 0 ? (
                        <button
                            type="button"
                            aria-expanded={
                                isListOpen
                            }
                            aria-controls="attendance-sessions-list"
                            disabled={
                                isDisabled
                            }
                            onClick={() =>
                                setIsListOpen(
                                    (current) =>
                                        !current,
                                )
                            }
                            className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-[10px] font-black text-[#172861] shadow-sm transition hover:border-blue-300 hover:bg-blue-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:h-10 sm:px-4 sm:text-xs"
                        >
                            {isListOpen
                                ? "Ocultar sesiones"
                                : selectedSession
                                    ? "Cambiar sesión"
                                    : "Elegir sesión"}

                            {isListOpen ? (
                                <ChevronUp className="h-4 w-4 shrink-0" />
                            ) : (
                                <ChevronDown className="h-4 w-4 shrink-0" />
                            )}
                        </button>
                    ) : null}
                </div>
            </div>

            {sessions.length === 0 ? (
                <div className="mt-3 rounded-xl border border-dashed border-slate-300 bg-white p-4 text-center sm:mt-4 sm:rounded-2xl sm:p-5">
                    <CalendarDays className="mx-auto h-7 w-7 text-slate-400 sm:h-8 sm:w-8" />

                    <p className="mt-2 text-xs font-bold leading-5 text-slate-600 sm:mt-3 sm:text-sm">
                        No hay sesiones registradas.
                    </p>
                </div>
            ) : selectedSession ? (
                <div className="mt-3 flex min-w-0 items-center justify-between gap-3 rounded-xl border border-[#172861] bg-white px-3 py-3 shadow-sm ring-2 ring-blue-100 sm:mt-4 sm:rounded-2xl sm:px-4">
                    <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#172861] text-white sm:h-11 sm:w-11">
                            <CalendarDays className="h-4 w-4 sm:h-5 sm:w-5" />
                        </div>

                        <div className="min-w-0">
                            <p className="truncate text-xs font-black text-slate-950 sm:text-sm">
                                {formatDate(
                                    selectedSession.day,
                                )}
                            </p>

                            <p className="mt-1 flex min-w-0 items-center gap-1.5 text-[10px] font-bold text-slate-500 sm:text-xs">
                                <Clock3 className="h-3.5 w-3.5 shrink-0" />

                                <span className="truncate">
                                    {formatTime(
                                        selectedSession.start_time,
                                    )}{" "}
                                    -{" "}
                                    {formatTime(
                                        selectedSession.end_time,
                                    )}
                                </span>
                            </p>
                        </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                        <span className="hidden rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-700 sm:inline-flex">
                            Activa
                        </span>

                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                    </div>
                </div>
            ) : (
                <div className="mt-3 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-4 text-center sm:mt-4 sm:rounded-2xl">
                    <p className="text-xs font-bold text-slate-600 sm:text-sm">
                        Selecciona una sesión para consultar
                        la asistencia.
                    </p>
                </div>
            )}

            {isListOpen ? (
                <div
                    id="attendance-sessions-list"
                    className="mt-3 rounded-xl border border-slate-200 bg-white p-2 shadow-sm sm:rounded-2xl sm:p-3"
                >
                    <p className="px-1 pb-2 text-[10px] font-black uppercase tracking-wide text-slate-500 sm:text-xs">
                        Sesiones disponibles
                    </p>

                    <div className="max-h-[260px] overflow-y-auto pr-1 sm:max-h-[300px]">
                        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                            {availableSessions.length ===
                                0 ? (
                                <p className="rounded-xl bg-slate-50 px-3 py-3 text-center text-xs font-bold text-slate-500 md:col-span-2 xl:col-span-3">
                                    No existen otras sesiones
                                    disponibles.
                                </p>
                            ) : (
                                availableSessions.map(
                                    (session) => (
                                        <button
                                            key={
                                                session.id
                                            }
                                            type="button"
                                            disabled={
                                                isDisabled
                                            }
                                            onClick={() =>
                                                handleSelectSession(
                                                    String(
                                                        session.id,
                                                    ),
                                                )
                                            }
                                            className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left transition hover:border-blue-300 hover:bg-blue-50 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 sm:px-4 sm:py-3"
                                        >
                                            <div className="flex min-w-0 items-center gap-3">
                                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#172861]">
                                                    <CalendarDays className="h-4 w-4" />
                                                </div>

                                                <div className="min-w-0">
                                                    <p className="truncate text-xs font-black text-slate-950 sm:text-sm">
                                                        {formatDate(
                                                            session.day,
                                                        )}
                                                    </p>

                                                    <p className="mt-1 flex min-w-0 items-center gap-1.5 text-[10px] font-bold text-slate-500 sm:text-xs">
                                                        <Clock3 className="h-3.5 w-3.5 shrink-0" />

                                                        <span className="truncate">
                                                            {formatTime(
                                                                session.start_time,
                                                            )}{" "}
                                                            -{" "}
                                                            {formatTime(
                                                                session.end_time,
                                                            )}
                                                        </span>
                                                    </p>
                                                </div>
                                            </div>

                                            <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                                        </button>
                                    ),
                                )
                            )}
                        </div>
                    </div>
                </div>
            ) : null}
        </aside>
    );
}

export default SessionsSidebar;
