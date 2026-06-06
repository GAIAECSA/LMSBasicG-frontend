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
        <div className="min-w-0 space-y-4">
            {description ? (
                <div className="min-w-0 break-words whitespace-pre-wrap rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs leading-5 text-blue-800 sm:rounded-2xl sm:p-4 sm:text-sm sm:leading-6">
                    {description}
                </div>
            ) : null}

            {pdfUrl ? (
                <div className="min-w-0 overflow-hidden rounded-[20px] border border-slate-200 bg-slate-100 shadow-sm sm:rounded-[24px]">
                    <iframe
                        src={getProtectedPdfViewerUrl(pdfUrl)}
                        title={room.selectedTitle || "Documento PDF"}
                        className="h-[420px] w-full bg-white sm:h-[560px] lg:h-[620px] 2xl:h-[720px]"
                    />
                </div>
            ) : (
                <div className="min-w-0 rounded-[20px] border border-dashed border-slate-300 bg-slate-50 p-5 text-center sm:rounded-[24px] sm:p-7">
                    <FileText className="mx-auto h-9 w-9 text-slate-400 sm:h-10 sm:w-10" />

                    <h3 className="mt-3 break-words text-base font-black text-slate-950 sm:text-lg">
                        PDF no disponible
                    </h3>

                    <p className="mt-2 break-words text-xs leading-5 text-slate-500 sm:text-sm">
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
