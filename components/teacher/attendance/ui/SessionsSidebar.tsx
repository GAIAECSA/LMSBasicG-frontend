import { CalendarDays, CheckCircle2, Clock3, Plus } from "lucide-react";
import type { CourseAttendance } from "@/services/attendance.service";
import { formatDate, formatTime } from "../utils";

type SessionsSidebarProps = {
    sessions: CourseAttendance[];
    selectedSessionId: string;
    setSelectedSessionId: (value: string) => void;
    onCreate: () => void;
};

export function SessionsSidebar({
    sessions,
    selectedSessionId,
    setSelectedSessionId,
    onCreate,
}: SessionsSidebarProps) {
    return (
        <aside className="border-b border-slate-200 bg-slate-50 p-5 xl:border-b-0 xl:border-r">
            <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-black uppercase tracking-wide text-slate-700">
                    Sesiones
                </h2>
{/* 
                <button
                    type="button"
                    onClick={onCreate}
                    className="inline-flex h-9 items-center justify-center rounded-xl bg-[#172861] px-3 text-xs font-black text-white transition hover:bg-[#0B163F]"
                >
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    Nueva
                </button> */}
            </div>

            <div className="mt-4 space-y-3">
                {sessions.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-center">
                        <CalendarDays className="mx-auto h-8 w-8 text-slate-400" />

                        <p className="mt-3 text-sm font-bold text-slate-600">
                            No hay sesiones registradas.
                        </p>
                    </div>
                ) : (
                    sessions.map((session) => {
                        const active = String(session.id) === selectedSessionId;

                        return (
                            <button
                                key={session.id}
                                type="button"
                                onClick={() =>
                                    setSelectedSessionId(String(session.id))
                                }
                                className={`w-full rounded-2xl border p-4 text-left transition ${active
                                        ? "border-[#172861] bg-white shadow-sm ring-4 ring-blue-100"
                                        : "border-slate-200 bg-white hover:border-blue-200"
                                    }`}
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <span className="inline-flex items-center gap-2 text-sm font-black text-slate-950">
                                        <CalendarDays className="h-4 w-4 text-[#172861]" />
                                        {formatDate(session.day)}
                                    </span>

                                    {active ? (
                                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                                    ) : null}
                                </div>

                                <p className="mt-2 flex items-center gap-2 text-xs font-bold text-slate-500">
                                    <Clock3 className="h-3.5 w-3.5" />
                                    {formatTime(session.start_time)} -{" "}
                                    {formatTime(session.end_time)}
                                </p>
                            </button>
                        );
                    })
                )}
            </div>
        </aside>
    );
}