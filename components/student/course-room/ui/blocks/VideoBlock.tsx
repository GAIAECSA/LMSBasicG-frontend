import { PlayCircle } from "lucide-react";
import type { CourseRoomHook } from "../../hook";
import { getVideoPreview, getVideoUrlFromBlock } from "../../utils";
import { CompleteButton } from "./TextBlock";

type VideoBlockProps = {
    room: CourseRoomHook;
};

export function VideoBlock({ room }: VideoBlockProps) {
    if (!room.selectedBlock) return null;

    const videoPreview = getVideoPreview(
        getVideoUrlFromBlock(room.selectedBlock),
    );

    return (
        <div className="min-w-0 space-y-4">
            <div className="min-w-0 overflow-hidden rounded-[20px] border border-slate-200 bg-slate-950 shadow-sm sm:rounded-[24px]">
                {videoPreview?.type === "iframe" ? (
                    <iframe
                        src={videoPreview.url}
                        title={room.selectedTitle || "Video"}
                        className="aspect-video w-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                        allowFullScreen
                    />
                ) : videoPreview?.type === "video" ? (
                    <video
                        src={videoPreview.url}
                        title={room.selectedTitle || "Video"}
                        className="aspect-video w-full bg-black"
                        controls
                        controlsList="nodownload"
                    />
                ) : (
                    <div className="flex aspect-video min-h-[200px] flex-col items-center justify-center p-4 text-center text-xs font-bold text-white sm:min-h-[220px] sm:p-6 sm:text-sm">
                        <PlayCircle className="mb-3 h-9 w-9 shrink-0 text-white/70 sm:h-10 sm:w-10" />

                        <p className="break-words">
                            No se pudo generar la vista previa del video.
                        </p>

                        <p className="mt-2 max-w-xl break-words text-[11px] font-medium leading-5 text-white/60 sm:text-xs">
                            Verifica que el enlace sea de YouTube, Microsoft
                            Stream, SharePoint, OneDrive o un archivo de video
                            válido.
                        </p>
                    </div>
                )}
            </div>

            <CompleteButton
                blockId={room.selectedBlock.id}
                label="Marcar video como completado"
                completedBlocks={room.completedBlocks}
                progressSavingBlockId={room.progressSavingBlockId}
                onComplete={room.markBlockAsCompleted}
            />
        </div>
    );
}
