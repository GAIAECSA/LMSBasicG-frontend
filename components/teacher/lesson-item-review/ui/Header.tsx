import {
    ClipboardCheck,
    Layers3,
    ListChecks,
    Users,
} from "lucide-react";
import type { LessonItemReviewState } from "../hook";
import { ITEM_TYPE_BADGES } from "../constants";

type HeaderProps = {
    review: LessonItemReviewState;
};

export function Header({ review }: HeaderProps) {
    const submittedCount = review.rows.filter(
        (row) => row.hasSubmission,
    ).length;

    const badge = ITEM_TYPE_BADGES[review.itemType];

    return (
        <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:rounded-[28px]">
            <div className="relative overflow-hidden bg-gradient-to-r from-slate-950 via-[#172861] to-[#3146a8] px-4 py-4 text-white sm:px-5 sm:py-5 md:px-6 lg:px-8 [@media(max-height:760px)]:py-4">
                <div className="absolute inset-y-0 right-0 w-[40%] bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.22),transparent_50%)]" />

                <div className="relative grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-center 2xl:grid-cols-[minmax(0,1fr)_300px]">
                    <div className="min-w-0">
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-blue-100 sm:px-3 sm:text-[11px] sm:tracking-[0.18em]">
                            <ClipboardCheck className="h-3.5 w-3.5 shrink-0" />
                            Revisión del ítem
                        </div>

                        <h1
                            title={review.title}
                            className="mt-3 break-words text-xl font-black leading-tight tracking-tight text-white [overflow-wrap:anywhere] sm:text-2xl md:text-3xl [@media(max-height:760px)]:text-xl"
                        >
                            {review.title}
                        </h1>

                        <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[10px] font-semibold text-slate-200 sm:gap-2 sm:text-xs">
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-2.5 py-1">
                                <ListChecks className="h-3.5 w-3.5 shrink-0" />
                                {review.itemTypeLabel}
                            </span>

                            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-2.5 py-1">
                                <Layers3 className="h-3.5 w-3.5 shrink-0" />
                                Lección #{review.block?.lesson_id}
                            </span>

                            <span className="inline-flex rounded-full border border-white/10 bg-white/10 px-2.5 py-1">
                                Orden #{review.block?.order}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:max-w-[300px] lg:max-w-none">
                        <div className="rounded-xl border border-white/10 bg-white/10 px-3 py-3 text-white backdrop-blur-sm sm:rounded-2xl sm:px-4 sm:py-4 [@media(max-height:760px)]:py-3">
                            <p className="text-[9px] font-black uppercase tracking-[0.12em] text-blue-100 sm:text-[10px]">
                                Estudiantes
                            </p>

                            <div className="mt-1.5 flex items-center gap-1.5 sm:mt-2 sm:gap-2">
                                <Users className="h-3.5 w-3.5 text-blue-100 sm:h-4 sm:w-4" />

                                <p className="text-xl font-black sm:text-2xl">
                                    {review.rows.length}
                                </p>
                            </div>
                        </div>

                        <div className="rounded-xl border border-white/10 bg-white/10 px-3 py-3 text-white backdrop-blur-sm sm:rounded-2xl sm:px-4 sm:py-4 [@media(max-height:760px)]:py-3">
                            <p className="text-[9px] font-black uppercase tracking-[0.12em] text-blue-100 sm:text-[10px]">
                                Entregas
                            </p>

                            <div className="mt-1.5 flex items-center gap-1.5 sm:mt-2 sm:gap-2">
                                <ListChecks className="h-3.5 w-3.5 text-blue-100 sm:h-4 sm:w-4" />

                                <p className="text-xl font-black sm:text-2xl">
                                    {submittedCount}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 px-4 py-3 sm:gap-3 sm:px-5 sm:py-4 md:px-6 lg:px-8 [@media(max-height:760px)]:py-3">
                <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em] ring-1 sm:px-3 sm:text-xs sm:tracking-[0.12em] ${badge.className}`}
                >
                    {badge.label}
                </span>

                <span className="text-xs font-semibold leading-5 text-slate-500 sm:text-sm">
                    Selecciona un estudiante para revisar su entrega o respuesta.
                </span>
            </div>
        </div>
    );
}

export default Header;
