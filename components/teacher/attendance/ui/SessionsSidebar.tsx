import { CalendarDays, CheckCircle2, Clock3 } from "lucide-react";
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
}: SessionsSidebarProps) {
    return (
        <aside className="border-b border-slate-200 bg-slate-50 p-3 sm:p-4 2xl:border-b-0 2xl:border-r 2xl:p-4">
            <div className="flex items-center justify-between gap-3">
                <h2 className="text-xs font-black uppercase tracking-wide text-slate-700 sm:text-sm">
                    Sesiones
                </h2>

                <span className="inline-flex rounded-full bg-white px-2.5 py-1 text-[10px] font-black text-slate-500 ring-1 ring-slate-200 sm:text-xs">
                    {sessions.length}
                </span>
            </div>

            <div className="mt-3 grid grid-flow-col auto-cols-[minmax(190px,240px)] gap-2 overflow-x-auto pb-1 sm:mt-4 sm:auto-cols-[minmax(220px,260px)] 2xl:block 2xl:max-h-[calc(100vh-250px)] 2xl:space-y-2 2xl:overflow-y-auto 2xl:overflow-x-hidden 2xl:pr-1">
                {sessions.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-center sm:rounded-2xl sm:p-5">
                        <CalendarDays className="mx-auto h-7 w-7 text-slate-400 sm:h-8 sm:w-8" />

                        <p className="mt-2 text-xs font-bold leading-5 text-slate-600 sm:mt-3 sm:text-sm">
                            No hay sesiones registradas.
                        </p>
                    </div>
                ) : (
                    sessions.map((session) => {
                        const active =
                            String(session.id) === selectedSessionId;

                        return (
                            <button
                                key={session.id}
                                type="button"
                                onClick={() =>
                                    setSelectedSessionId(String(session.id))
                                }
                                className={`w-full min-w-0 rounded-xl border p-3 text-left transition active:scale-[0.99] sm:rounded-2xl sm:p-4 ${
                                    active
                                        ? "border-[#172861] bg-white shadow-sm ring-2 ring-blue-100 sm:ring-4"
                                        : "border-slate-200 bg-white hover:border-blue-200"
                                }`}
                            >
                                <div className="flex min-w-0 items-center justify-between gap-2">
                                    <span className="inline-flex min-w-0 items-center gap-2 text-xs font-black text-slate-950 sm:text-sm">
                                        <CalendarDays className="h-4 w-4 shrink-0 text-[#172861]" />

                                        <span className="truncate">
                                            {formatDate(session.day)}
                                        </span>
                                    </span>

                                    {active ? (
                                        <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
                                    ) : null}
                                </div>

                                <p className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-slate-500 sm:gap-2 sm:text-xs">
                                    <Clock3 className="h-3.5 w-3.5 shrink-0" />

                                    <span className="truncate">
                                        {formatTime(session.start_time)} -{" "}
                                        {formatTime(session.end_time)}
                                    </span>
                                </p>
                            </button>
                        );
                    })
                )}
            </div>
        </aside>
    );
}
