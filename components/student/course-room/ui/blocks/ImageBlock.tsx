import Image from "next/image";
import { ImageIcon } from "lucide-react";
import type { CourseRoomHook } from "../../hook";
import { getBlockDescription, getFileUrlFromBlock } from "../../utils";
import { CompleteButton } from "./TextBlock";

type ImageBlockProps = {
    room: CourseRoomHook;
};

export function ImageBlock({ room }: ImageBlockProps) {
    if (!room.selectedBlock) return null;

    const imageUrl = getFileUrlFromBlock(room.selectedBlock);
    const description = getBlockDescription(room.selectedBlock);

    return (
        <div className="min-w-0 space-y-4">
            {description ? (
                <div className="min-w-0 break-words whitespace-pre-wrap rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs leading-5 text-blue-800 sm:rounded-2xl sm:p-4 sm:text-sm sm:leading-6">
                    {description}
                </div>
            ) : null}

            {imageUrl ? (
                <div className="relative min-h-[250px] min-w-0 overflow-hidden rounded-[20px] border border-slate-200 bg-slate-50 shadow-sm sm:min-h-[380px] sm:rounded-[24px] lg:min-h-[480px]">
                    <Image
                        src={imageUrl}
                        alt={room.selectedTitle || "Imagen"}
                        fill
                        unoptimized
                        sizes="(max-width: 1024px) 100vw, 900px"
                        className="object-contain"
                    />
                </div>
            ) : (
                <div className="min-w-0 rounded-[20px] border border-dashed border-slate-300 bg-slate-50 p-5 text-center sm:rounded-[24px] sm:p-7">
                    <ImageIcon className="mx-auto h-9 w-9 text-slate-400 sm:h-10 sm:w-10" />

                    <h3 className="mt-3 break-words text-base font-black text-slate-950 sm:text-lg">
                        Imagen no disponible
                    </h3>

                    <p className="mt-2 break-words text-xs leading-5 text-slate-500 sm:text-sm">
                        Este bloque todavía no tiene una imagen cargada.
                    </p>
                </div>
            )}

            <CompleteButton
                blockId={room.selectedBlock.id}
                label="Marcar imagen como completada"
                completedBlocks={room.completedBlocks}
                progressSavingBlockId={room.progressSavingBlockId}
                onComplete={room.markBlockAsCompleted}
            />
        </div>
    );
}
