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
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
            <div className="relative overflow-hidden bg-gradient-to-r from-slate-950 via-[#172861] to-blue-900 px-6 py-7 md:px-8">
                <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(255,132,40,0.35),transparent_45%)]" />

                <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0">
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-blue-100">
                            <ItemIcon
                                type={itemType}
                                className="h-3.5 w-3.5"
                            />

                            {itemTypeLabel}
                        </div>

                        <h1 className="mt-3 text-2xl font-black tracking-tight text-white md:text-3xl">
                            {form.title || `Bloque ${block.id}`}
                        </h1>

                        {reviewable && reviewHref ? (
                            <div className="mt-5">
                                <Link
                                    href={reviewHref}
                                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-black text-[#172861] shadow-sm transition hover:bg-blue-50"
                                >
                                    <ClipboardCheck className="h-4 w-4 text-[#172861]" />

                                    <span className="text-[#172861]">
                                        {getActionLabel(itemType)}
                                    </span>
                                </Link>
                            </div>
                        ) : null}
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:w-[320px]">
                        <div className="rounded-2xl border border-white/10 bg-white/10 px-5 py-4 text-white backdrop-blur-sm">
                            <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-100">
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