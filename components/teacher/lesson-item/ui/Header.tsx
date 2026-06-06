import Link from "next/link";
import { ClipboardCheck } from "lucide-react";
import type { LessonBlock } from "@/services/lessons.service";
import type { FormState, LessonItemType } from "../types";
import { ItemIcon } from "./ItemIcon";

type HeaderProps = {
    block: LessonBlock;
    form: FormState;
    itemType: LessonItemType;
    itemTypeLabel: string;
    reviewHref?: string;
};

function getActionLabel(itemType: LessonItemType) {
    if (itemType === "homework") return "Calificar tarea";
    if (itemType === "quiz") return "Revisar evaluación";
    if (itemType === "survey") return "Ver respuestas";
    if (itemType === "forum") return "Ver participación";

    return "";
}

function isReviewable(itemType: LessonItemType) {
    return ["homework", "quiz", "survey", "forum"].includes(itemType);
}

export function Header({
    block,
    form,
    itemType,
    itemTypeLabel,
    reviewHref,
}: HeaderProps) {
    const reviewable = isReviewable(itemType);

    return (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:rounded-[28px]">
            <div className="relative overflow-hidden bg-gradient-to-r from-slate-950 via-[#172861] to-blue-900 px-4 py-5 text-white sm:px-6 sm:py-6 md:px-8 md:py-7 [@media(max-height:760px)]:py-4">
                <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(255,132,40,0.35),transparent_45%)]" />

                <div className="relative grid min-w-0 gap-4 md:grid-cols-[minmax(0,1fr)_minmax(220px,320px)] md:items-center md:gap-6">
                    <div className="min-w-0">
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-blue-100 sm:px-3 sm:text-xs sm:tracking-[0.18em]">
                            <ItemIcon
                                type={itemType}
                                className="h-3.5 w-3.5 shrink-0"
                            />

                            {itemTypeLabel}
                        </div>

                        <h1 className="mt-3 truncate text-2xl font-black tracking-tight text-white md:text-3xl [@media(max-height:760px)]:text-2xl">
                            {form.title || `Bloque ${block.id}`}
                        </h1>

                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white backdrop-blur-sm sm:rounded-2xl sm:px-5 sm:py-4 [@media(max-height:760px)]:py-3">
                            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-100 sm:text-xs">
                                Tipo
                            </p>

                            <p className="mt-1 text-sm font-black">
                                {itemTypeLabel}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Header;
