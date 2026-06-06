import Link from "next/link";
import {
    Clock3,
    FileCheck2,
} from "lucide-react";
import type { Enrollment } from "@/services/enrollments.service";
import { STUDENT_LINKS } from "../constants";

type PendingEnrollmentsPanelProps = {
    enrollments: Enrollment[];
};

export function PendingEnrollmentsPanel({
    enrollments,
}: PendingEnrollmentsPanelProps) {
    return (
        <aside className="min-w-0 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:rounded-3xl sm:p-4">
            <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-700 sm:h-10 sm:w-10 sm:rounded-2xl">
                    <Clock3 className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>

                <div className="min-w-0">
                    <h2 className="text-sm font-black text-slate-950 sm:text-base">
                        Matrículas pendientes
                    </h2>

                    <p className="mt-0.5 text-[11px] font-semibold text-slate-500 sm:text-xs">
                        Solicitudes en revisión.
                    </p>
                </div>
            </div>

            {enrollments.length === 0 ? (
                <div className="mt-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-center sm:rounded-2xl">
                    <FileCheck2 className="mx-auto h-6 w-6 text-slate-400" />

                    <p className="mt-2 text-xs font-bold leading-5 text-slate-500">
                        No tienes matrículas pendientes.
                    </p>
                </div>
            ) : (
                <div className="mt-3 max-h-[330px] space-y-2 overflow-y-auto pr-1">
                    {enrollments.map(
                        (enrollment) => (
                            <article
                                key={
                                    enrollment.id
                                }
                                className="rounded-xl border border-orange-100 bg-orange-50/50 px-3 py-2.5 sm:rounded-2xl"
                            >
                                <p
                                    title={
                                        enrollment.course
                                            ?.name
                                    }
                                    className="truncate text-xs font-black text-slate-900"
                                >
                                    {enrollment.course
                                        ?.name ||
                                        "Curso"}
                                </p>

                                <p className="mt-1 text-[11px] font-semibold leading-4 text-orange-700">
                                    Esperando aprobación
                                </p>
                            </article>
                        ),
                    )}
                </div>
            )}

            <Link
                href={STUDENT_LINKS.catalog}
                className="mt-3 inline-flex h-9 w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-[#172861] transition hover:bg-blue-50 active:scale-[0.97]"
            >
                Explorar catálogo
            </Link>
        </aside>
    );
}

export default PendingEnrollmentsPanel;
