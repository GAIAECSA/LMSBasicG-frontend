"use client";

import Image from "next/image";
import DOMPurify from "dompurify";

import { ImageIcon } from "lucide-react";

import type { CourseRoomHook } from "../../hook";

import {
    getBlockDescription,
    getFileUrlFromBlock,
} from "../../utils";

import { CompleteButton } from "./TextBlock";

type ImageBlockProps = {
    room: CourseRoomHook;
};

export function ImageBlock({
    room,
}: ImageBlockProps) {
    if (!room.selectedBlock) {
        return null;
    }

    const imageUrl =
        getFileUrlFromBlock(
            room.selectedBlock,
        );

    /*
     * La descripción ahora puede contener HTML:
     *
     * <h2>Título</h2>
     * <p>Contenido...</p>
     * <ul>...</ul>
     */
    const description =
        getBlockDescription(
            room.selectedBlock,
        );

    /*
     * Sanitizamos antes de renderizar.
     */
    const safeDescription =
        description
            ? DOMPurify.sanitize(
                String(description),
                {
                    USE_PROFILES: {
                        html: true,
                    },
                },
            )
            : "";

    return (
        <div className="min-w-0 space-y-4">
            {/* =================================================
                DESCRIPCIÓN HTML
            ================================================= */}

            {safeDescription ? (
                <div className="min-w-0 overflow-hidden rounded-[20px] border border-blue-100 bg-blue-50 p-4 sm:rounded-[22px] sm:p-5">
                    <div
                        className="student-image-description"
                        dangerouslySetInnerHTML={{
                            __html:
                                safeDescription,
                        }}
                    />
                </div>
            ) : null}

            {/* =================================================
                IMAGEN
            ================================================= */}

            {imageUrl ? (
                <div className="relative min-h-[250px] min-w-0 overflow-hidden rounded-[20px] border border-slate-200 bg-slate-50 shadow-sm sm:min-h-[380px] sm:rounded-[24px] lg:min-h-[480px]">
                    <Image
                        src={imageUrl}
                        alt={
                            room.selectedTitle ||
                            "Imagen"
                        }
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
                        Este bloque todavía no
                        tiene una imagen cargada.
                    </p>
                </div>
            )}

            {/* =================================================
                COMPLETAR
            ================================================= */}

            <CompleteButton
                blockId={
                    room.selectedBlock.id
                }
                label="Marcar imagen como completada"
                completedBlocks={
                    room.completedBlocks
                }
                progressSavingBlockId={
                    room.progressSavingBlockId
                }
                onComplete={
                    room.markBlockAsCompleted
                }
            />

            {/* =================================================
                ESTILOS HTML
            ================================================= */}

            <style jsx global>{`
                .student-image-description {
                    width: 100%;
                    min-width: 0;

                    color: #1e3a5f;

                    font-size: 0.875rem;
                    line-height: 1.75;

                    overflow-wrap: anywhere;
                }

                .student-image-description
                    > *:first-child {
                    margin-top: 0;
                }

                .student-image-description
                    > *:last-child {
                    margin-bottom: 0;
                }

                /* ============================
                   PÁRRAFOS
                ============================ */

                .student-image-description p {
                    margin-top: 0.65rem;
                    margin-bottom: 0.65rem;

                    line-height: 1.75;
                }

                /* ============================
                   TÍTULOS
                ============================ */

                .student-image-description h1 {
                    margin-top: 1.5rem;
                    margin-bottom: 0.75rem;

                    font-size: 1.8rem;
                    line-height: 1.25;

                    font-weight: 900;

                    color: #0f172a;
                }

                .student-image-description h2 {
                    margin-top: 1.35rem;
                    margin-bottom: 0.7rem;

                    font-size: 1.5rem;
                    line-height: 1.3;

                    font-weight: 900;

                    color: #0f172a;
                }

                .student-image-description h3 {
                    margin-top: 1.15rem;
                    margin-bottom: 0.6rem;

                    font-size: 1.2rem;
                    line-height: 1.4;

                    font-weight: 800;

                    color: #0f172a;
                }

                .student-image-description h4 {
                    margin-top: 1rem;
                    margin-bottom: 0.5rem;

                    font-size: 1.05rem;

                    font-weight: 800;

                    color: #0f172a;
                }

                /* ============================
                   NEGRITA
                ============================ */

                .student-image-description
                    strong,
                .student-image-description b {
                    font-weight: 800;
                    color: #0f172a;
                }

                /* ============================
                   CURSIVA
                ============================ */

                .student-image-description em,
                .student-image-description i {
                    font-style: italic;
                }

                /* ============================
                   SUBRAYADO
                ============================ */

                .student-image-description u {
                    text-decoration: underline;
                    text-underline-offset: 3px;
                }

                /* ============================
                   LISTAS
                ============================ */

                .student-image-description ul {
                    margin-top: 0.85rem;
                    margin-bottom: 0.85rem;

                    padding-left: 1.75rem;

                    list-style-type: disc;
                    list-style-position: outside;
                }

                .student-image-description ol {
                    margin-top: 0.85rem;
                    margin-bottom: 0.85rem;

                    padding-left: 1.75rem;

                    list-style-type: decimal;
                    list-style-position: outside;
                }

                .student-image-description li {
                    margin-top: 0.3rem;
                    margin-bottom: 0.3rem;
                }

                /*
                 * TipTap puede generar:
                 *
                 * <li>
                 *   <p>Contenido</p>
                 * </li>
                 */
                .student-image-description
                    li
                    p {
                    margin-top: 0.1rem;
                    margin-bottom: 0.1rem;
                }

                /* ============================
                   CITA
                ============================ */

                .student-image-description
                    blockquote {
                    margin-top: 1rem;
                    margin-bottom: 1rem;

                    border-left: 4px solid
                        #2563eb;

                    border-radius:
                        0 0.65rem 0.65rem 0;

                    background: #eff6ff;

                    padding:
                        0.75rem 1rem;

                    color: #475569;

                    font-style: italic;
                }

                /* ============================
                   LINKS
                ============================ */

                .student-image-description a {
                    color: #1d4ed8;

                    font-weight: 700;

                    text-decoration: underline;

                    text-underline-offset: 3px;
                }

                .student-image-description
                    a:hover {
                    opacity: 0.8;
                }

                /* ============================
                   IMÁGENES DENTRO DE DESCRIPCIÓN
                ============================ */

                .student-image-description img {
                    display: block;

                    width: auto;
                    max-width: 100%;
                    height: auto;

                    margin-top: 1.25rem;
                    margin-right: auto;
                    margin-bottom: 1.25rem;
                    margin-left: auto;

                    border-radius: 0.75rem;

                    object-fit: contain;
                }

                /* ============================
                   CÓDIGO
                ============================ */

                .student-image-description code {
                    border-radius: 0.35rem;

                    background: #dbeafe;

                    padding:
                        0.15rem 0.35rem;

                    font-family:
                        ui-monospace,
                        SFMono-Regular,
                        Menlo,
                        Monaco,
                        Consolas,
                        monospace;

                    color: #172554;
                }

                .student-image-description pre {
                    margin-top: 1rem;
                    margin-bottom: 1rem;

                    max-width: 100%;
                    overflow-x: auto;

                    border-radius: 0.75rem;

                    background: #0f172a;

                    padding: 1rem;

                    color: #f8fafc;
                }

                .student-image-description
                    pre
                    code {
                    background: transparent;

                    padding: 0;

                    color: inherit;
                }

                /* ============================
                   TABLAS
                ============================ */

                .student-image-description table {
                    width: 100%;

                    margin-top: 1rem;
                    margin-bottom: 1rem;

                    border-collapse: collapse;
                }

                .student-image-description th,
                .student-image-description td {
                    border: 1px solid
                        #bfdbfe;

                    padding:
                        0.6rem 0.7rem;

                    text-align: left;
                    vertical-align: top;
                }

                .student-image-description th {
                    background: #dbeafe;

                    font-weight: 800;

                    color: #172554;
                }

                /* ============================
                   RESPONSIVE
                ============================ */

                @media (min-width: 640px) {
                    .student-image-description {
                        font-size: 0.95rem;
                    }
                }

                @media (max-width: 639px) {
                    .student-image-description h1 {
                        font-size: 1.5rem;
                    }

                    .student-image-description h2 {
                        font-size: 1.3rem;
                    }

                    .student-image-description h3 {
                        font-size: 1.1rem;
                    }
                }
            `}</style>
        </div>
    );
}

export default ImageBlock;