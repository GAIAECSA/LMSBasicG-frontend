import {
    Download,
    ExternalLink,
    FileText,
    ImageIcon,
    Music,
    Video,
} from "lucide-react";
import type { ReviewStudentRow } from "../types";
import Image from "next/image";

type HomeworkReviewPanelProps = {
    row: ReviewStudentRow | null;
};

type FileKind = "pdf" | "image" | "video" | "audio" | "text" | "unknown";

function getFileExtension(fileNameOrUrl?: string | null): string {
    if (!fileNameOrUrl) return "";

    const cleanValue = fileNameOrUrl.split("?")[0].split("#")[0];
    const parts = cleanValue.split(".");

    return parts.length > 1 ? String(parts.pop()).toLowerCase() : "";
}

function getFileKind(fileNameOrUrl?: string | null): FileKind {
    const extension = getFileExtension(fileNameOrUrl);

    if (extension === "pdf") return "pdf";

    if (["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"].includes(extension)) {
        return "image";
    }

    if (["mp4", "webm", "ogg", "mov"].includes(extension)) {
        return "video";
    }

    if (["mp3", "wav", "ogg", "m4a"].includes(extension)) {
        return "audio";
    }

    if (["txt", "csv", "json"].includes(extension)) {
        return "text";
    }

    return "unknown";
}

function formatDate(value?: string | null): string {
    if (!value) return "Sin fecha";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleString("es-EC", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function getFileName(row: ReviewStudentRow): string {
    if (row.fileName?.trim()) return row.fileName;

    if (row.fileUrl) {
        const cleanUrl = row.fileUrl.split("?")[0];
        const name = cleanUrl.split("/").pop();

        if (name) return decodeURIComponent(name);
    }

    return "Archivo enviado";
}

function FileIcon({ fileKind }: { fileKind: FileKind }) {
    if (fileKind === "image") return <ImageIcon className="h-5 w-5" />;
    if (fileKind === "video") return <Video className="h-5 w-5" />;
    if (fileKind === "audio") return <Music className="h-5 w-5" />;

    return <FileText className="h-5 w-5" />;
}

function FilePreview({
    fileUrl,
    fileName,
}: {
    fileUrl: string;
    fileName: string;
}) {
    const fileKind = getFileKind(fileName || fileUrl);

    if (fileKind === "pdf") {
        return (
            <iframe
                src={`${fileUrl}#toolbar=1&navpanes=0&scrollbar=1`}
                title={fileName}
                className="h-[640px] w-full bg-white"
            />
        );
    }

    if (fileKind === "image") {
        return (
            <div className="flex min-h-[520px] items-center justify-center bg-slate-100 p-4">
                <div className="relative h-[620px] w-full max-w-[900px]">
                    <Image
                        src={fileUrl}
                        alt={fileName}
                        fill
                        unoptimized
                        sizes="(max-width: 768px) 100vw, 900px"
                        className="rounded-2xl object-contain"
                    />
                </div>
            </div>
        );
    }

    if (fileKind === "video") {
        return (
            <div className="flex min-h-[520px] items-center justify-center bg-slate-950 p-4">
                <video
                    src={fileUrl}
                    controls
                    className="max-h-[620px] w-full rounded-2xl"
                />
            </div>
        );
    }

    if (fileKind === "audio") {
        return (
            <div className="flex min-h-[320px] items-center justify-center bg-slate-50 p-8">
                <audio src={fileUrl} controls className="w-full max-w-2xl" />
            </div>
        );
    }

    if (fileKind === "text") {
        return (
            <iframe
                src={fileUrl}
                title={fileName}
                className="h-[560px] w-full bg-white"
            />
        );
    }

    return (
        <div className="flex min-h-[360px] flex-col items-center justify-center bg-slate-50 p-8 text-center">
            <FileText className="h-10 w-10 text-slate-400" />

            <p className="mt-3 text-sm font-black text-slate-700">
                Este archivo no se puede previsualizar directamente.
            </p>

            <p className="mt-1 text-sm font-semibold text-slate-500">
                Ábrelo o descárgalo para revisarlo.
            </p>
        </div>
    );
}

export function HomeworkReviewPanel({ row }: HomeworkReviewPanelProps) {
    if (!row) {
        return (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                <FileText className="mx-auto h-9 w-9 text-slate-400" />

                <p className="mt-3 text-sm font-black text-slate-700">
                    Selecciona un estudiante para revisar la tarea.
                </p>
            </div>
        );
    }

    if (!row.fileUrl) {
        return (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                <FileText className="mx-auto h-9 w-9 text-slate-400" />

                <p className="mt-3 text-sm font-black text-slate-700">
                    El estudiante aún no ha enviado un archivo.
                </p>
            </div>
        );
    }

    const fileName = getFileName(row);
    const fileKind = getFileKind(fileName || row.fileUrl);

    return (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
            <div className="flex flex-col gap-4 border-b border-slate-200 bg-slate-50 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                        <FileIcon fileKind={fileKind} />
                    </div>

                    <div className="min-w-0">
                        <h3 className="truncate text-sm font-black text-slate-950">
                            {fileName}
                        </h3>

                        <p className="mt-1 text-xs font-bold text-slate-500">
                            Enviado: {formatDate(row.submittedAt)}
                        </p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <a
                        href={row.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
                    >
                        <ExternalLink className="h-4 w-4" />
                        Abrir
                    </a>

                    <a
                        href={row.fileUrl}
                        download
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-[#172861] px-4 text-sm font-black !text-white shadow-sm transition hover:bg-[#0f1d48]"
                    >
                        <Download className="h-4 w-4" />
                        Descargar
                    </a>
                </div>
            </div>

            <FilePreview fileUrl={row.fileUrl} fileName={fileName} />

            {row.comment ? (
                <div className="border-t border-slate-200 bg-slate-50 px-5 py-4">
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                        Comentario
                    </p>

                    <p className="mt-2 whitespace-pre-wrap text-sm font-semibold leading-6 text-slate-700">
                        {row.comment}
                    </p>
                </div>
            ) : null}
        </div>
    );
}

export default HomeworkReviewPanel;