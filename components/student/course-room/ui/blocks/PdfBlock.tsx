import { FileText } from "lucide-react";
import type { CourseRoomHook } from "../../hook";
import {
    getBlockDescription,
    getFileUrlFromBlock,
    getProtectedPdfViewerUrl,
} from "../../utils";
import { CompleteButton } from "./TextBlock";

type PdfBlockProps = {
    room: CourseRoomHook;
};

export function PdfBlock({ room }: PdfBlockProps) {
    if (!room.selectedBlock) return null;

    const pdfUrl = getFileUrlFromBlock(room.selectedBlock);
    const description = getBlockDescription(room.selectedBlock);

    return (
        <div className="min-w-0 space-y-4 sm:space-y-5">
            {description ? (
                <div className="min-w-0 break-words whitespace-pre-wrap rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-800">
                    {description}
                </div>
            ) : null}

            {pdfUrl ? (
                <div className="min-w-0 overflow-hidden rounded-[22px] border border-slate-200 bg-slate-100 shadow-sm sm:rounded-[28px]">
                    <iframe
                        src={getProtectedPdfViewerUrl(pdfUrl)}
                        title={room.selectedTitle || "Documento PDF"}
                        className="h-[460px] w-full bg-white sm:h-[620px] lg:h-[720px]"
                    />
                </div>
            ) : (
                <div className="min-w-0 rounded-[22px] border border-dashed border-slate-300 bg-slate-50 p-5 text-center sm:rounded-[28px] sm:p-8">
                    <FileText className="mx-auto h-10 w-10 text-slate-400" />

                    <h3 className="mt-3 break-words text-lg font-black text-slate-950">
                        PDF no disponible
                    </h3>

                    <p className="mt-2 break-words text-sm text-slate-500">
                        Este bloque todavía no tiene un PDF cargado.
                    </p>
                </div>
            )}

            <CompleteButton
                blockId={room.selectedBlock.id}
                label="Marcar PDF como completado"
                completedBlocks={room.completedBlocks}
                progressSavingBlockId={room.progressSavingBlockId}
                onComplete={room.markBlockAsCompleted}
            />
        </div>
    );
}
