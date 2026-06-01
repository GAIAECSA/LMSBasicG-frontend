import { FileText } from "lucide-react";
import type { CourseRoomHook } from "../../hook";
import { getBlockDescription, getFileUrlFromBlock, getProtectedPdfViewerUrl } from "../../utils";
import { CompleteButton } from "./TextBlock";

type PdfBlockProps = { room: CourseRoomHook };

export function PdfBlock({ room }: PdfBlockProps) {
    if (!room.selectedBlock) return null;
    const pdfUrl = getFileUrlFromBlock(room.selectedBlock);
    const description = getBlockDescription(room.selectedBlock);
    return <div className="space-y-5">{description ? <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-800">{description}</div> : null}{pdfUrl ? <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-slate-100 shadow-sm"><iframe src={getProtectedPdfViewerUrl(pdfUrl)} title={room.selectedTitle || "Documento PDF"} className="h-[720px] w-full bg-white" /></div> : <div className="rounded-[28px] border border-dashed border-slate-300 bg-slate-50 p-8 text-center"><FileText className="mx-auto h-10 w-10 text-slate-400" /><h3 className="mt-3 text-lg font-black text-slate-950">PDF no disponible</h3><p className="mt-2 text-sm text-slate-500">Este bloque todavía no tiene un PDF cargado.</p></div>}<CompleteButton blockId={room.selectedBlock.id} label="Marcar PDF como completado" completedBlocks={room.completedBlocks} progressSavingBlockId={room.progressSavingBlockId} onComplete={room.markBlockAsCompleted} /></div>;
}
