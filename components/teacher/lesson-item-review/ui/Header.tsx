import { ClipboardCheck, Layers3, ListChecks, Users } from "lucide-react";
import type { LessonItemReviewState } from "../hook";
import { ITEM_TYPE_BADGES } from "../constants";

type HeaderProps = {
    review: LessonItemReviewState;
};

export function Header({ review }: HeaderProps) {
    const submittedCount = review.rows.filter((row) => row.hasSubmission).length;
    const badge = ITEM_TYPE_BADGES[review.itemType];

    return (
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
            <div className="relative overflow-hidden bg-gradient-to-r from-slate-950 via-[#172861] to-[#3146a8] px-6 py-6 md:px-8">
                <div className="absolute inset-y-0 right-0 w-[40%] bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.22),transparent_50%)]" />

                <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-blue-100">
                            <ClipboardCheck className="h-3.5 w-3.5" />
                            Revisión del ítem
                        </div>

                        <h1 className="mt-3 text-2xl font-black tracking-tight text-white md:text-3xl">
                            {review.title}
                        </h1>

                        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-200">
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-3 py-1">
                                <ListChecks className="h-4 w-4" />
                                {review.itemTypeLabel}
                            </span>

                            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-3 py-1">
                                <Layers3 className="h-4 w-4" />
                                Lección #{review.block?.lesson_id}
                            </span>

                            <span className="inline-flex rounded-full border border-white/10 bg-white/10 px-3 py-1">
                                Orden #{review.block?.order}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:w-[320px]">
                        <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-4 text-white backdrop-blur-sm">
                            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-blue-100">
                                Estudiantes
                            </p>

                            <div className="mt-2 flex items-center gap-2">
                                <Users className="h-4 w-4 text-blue-100" />
                                <p className="text-2xl font-black">
                                    {review.rows.length}
                                </p>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-4 text-white backdrop-blur-sm">
                            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-blue-100">
                                Entregas
                            </p>

                            <div className="mt-2 flex items-center gap-2">
                                <ListChecks className="h-4 w-4 text-blue-100" />
                                <p className="text-2xl font-black">
                                    {submittedCount}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 px-6 py-4 md:px-8">
                <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.12em] ring-1 ${badge.className}`}
                >
                    {badge.label}
                </span>

                <span className="text-sm font-semibold text-slate-500">
                    Selecciona un estudiante para revisar su entrega o respuesta.
                </span>
            </div>
        </div>
    );
}

export default Header;