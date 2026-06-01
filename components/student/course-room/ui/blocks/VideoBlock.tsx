import { PlayCircle } from "lucide-react";
import type { CourseRoomHook } from "../../hook";
import { getVideoPreview, getVideoUrlFromBlock } from "../../utils";
import { CompleteButton } from "./TextBlock";

type VideoBlockProps = { room: CourseRoomHook };

export function VideoBlock({ room }: VideoBlockProps) {
    if (!room.selectedBlock) return null;
    const videoPreview = getVideoPreview(getVideoUrlFromBlock(room.selectedBlock));
    return <div className="space-y-5"><div className="overflow-hidden rounded-[28px] border border-slate-200 bg-slate-950 shadow-sm">{videoPreview?.type === "iframe" ? <iframe src={videoPreview.url} title={room.selectedTitle || "Video"} className="aspect-video w-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowFullScreen /> : videoPreview?.type === "video" ? <video src={videoPreview.url} title={room.selectedTitle || "Video"} className="aspect-video w-full bg-black" controls controlsList="nodownload" /> : <div className="flex aspect-video flex-col items-center justify-center p-6 text-center text-sm font-bold text-white"><PlayCircle className="mb-3 h-10 w-10 text-white/70" /><p>No se pudo generar la vista previa del video.</p><p className="mt-2 max-w-xl text-xs font-medium leading-5 text-white/60">Verifica que el enlace sea de YouTube, Microsoft Stream, SharePoint, OneDrive o un archivo de video válido.</p></div>}</div><CompleteButton blockId={room.selectedBlock.id} label="Marcar video como completado" completedBlocks={room.completedBlocks} progressSavingBlockId={room.progressSavingBlockId} onComplete={room.markBlockAsCompleted} /></div>;
}
