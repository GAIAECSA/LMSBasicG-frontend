import Link from "next/link";
import { ClipboardCheck } from "lucide-react";
import type { LessonBlock } from "@/services/lessons.service";
import type { LessonItemState } from "../hook";
import { ResponsesPanel } from "./ResponsesPanel";

type SidePanelProps = {
    item: LessonItemState;
    block: LessonBlock;
    reviewHref: string;
};

function getReviewDescription(itemType: LessonItemState["itemType"]) {
    if (itemType === "forum") {
        return "Revisa la participación de los estudiantes en el foro.";
    }

    if (itemType === "survey") {
        return "Revisa las respuestas enviadas por los estudiantes.";
    }

    if (itemType === "quiz") {
        return "Revisa los intentos y respuestas de los estudiantes.";
    }

    if (itemType === "homework") {
        return "Revisa las entregas enviadas por los estudiantes.";
    }

    return "Revisa la información registrada por los estudiantes.";
}

function getReviewButtonLabel(itemType: LessonItemState["itemType"]) {
    if (itemType === "forum") return "Ver participación";
    if (itemType === "survey") return "Ver respuestas";
    if (itemType === "homework") return "Ver entregas";
    if (itemType === "quiz") return "Ver revisión";

    return "Ver revisión";
}

export function SidePanel({ item, block, reviewHref }: SidePanelProps) {
    return (
        <aside className="space-y-4 lg:space-y-5 [@media(max-height:760px)]:space-y-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-[28px] sm:p-6 [@media(max-height:760px)]:p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700 sm:h-12 sm:w-12 sm:rounded-2xl">
                    <ClipboardCheck className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>

                <h2 className="mt-3 text-base font-black text-slate-950 sm:mt-4 sm:text-lg">
                    Revisión
                </h2>

                <p className="mt-2 text-xs font-medium leading-5 text-slate-500 sm:text-sm sm:leading-6">
                    {getReviewDescription(item.itemType)}
                </p>

                <Link
                    href={reviewHref}
                    className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#172861] px-4 text-xs font-black !text-white shadow-sm transition hover:bg-[#0f1d48] sm:mt-5 sm:h-11 sm:rounded-2xl sm:text-sm"
                >
                    <ClipboardCheck className="h-4 w-4" />
                    {getReviewButtonLabel(item.itemType)}
                </Link>
            </div>

            <ResponsesPanel item={item} block={block} />
        </aside>
    );
}

export default SidePanel;
