import { ImageIcon } from "lucide-react";
import type { CourseRoomHook } from "../../hook";
import { getBlockDescription, getFileUrlFromBlock } from "../../utils";
import { CompleteButton } from "./TextBlock";

type ImageBlockProps = { room: CourseRoomHook };

export function ImageBlock({ room }: ImageBlockProps) {
    if (!room.selectedBlock) return null;
    const imageUrl = getFileUrlFromBlock(room.selectedBlock);
    const description = getBlockDescription(room.selectedBlock);
    return <div className="space-y-5">{description ? <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-800">{description}</div> : null}{imageUrl ? <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-slate-50 shadow-sm"><img src={imageUrl} alt={room.selectedTitle || "Imagen"} className="max-h-[620px] w-full object-contain" /></div> : <div className="rounded-[28px] border border-dashed border-slate-300 bg-slate-50 p-8 text-center"><ImageIcon className="mx-auto h-10 w-10 text-slate-400" /><h3 className="mt-3 text-lg font-black text-slate-950">Imagen no disponible</h3><p className="mt-2 text-sm text-slate-500">Este bloque todavía no tiene una imagen cargada.</p></div>}<CompleteButton blockId={room.selectedBlock.id} label="Marcar imagen como completada" completedBlocks={room.completedBlocks} progressSavingBlockId={room.progressSavingBlockId} onComplete={room.markBlockAsCompleted} /></div>;
}
