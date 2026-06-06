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

type FileKind =
    | "pdf"
    | "image"
    | "video"
    | "audio"
    | "text"
    | "unknown";

function getFileExtension(
    fileNameOrUrl?: string | null,
): string {
    if (!fileNameOrUrl) return "";

    const cleanValue = fileNameOrUrl
        .split("?")[0]
        .split("#")[0];

    const parts = cleanValue.split(".");

    return parts.length > 1
        ? String(parts.pop()).toLowerCase()
        : "";
}

function getFileKind(
    fileNameOrUrl?: string | null,
): FileKind {
    const extension =
        getFileExtension(fileNameOrUrl);

    if (extension === "pdf") return "pdf";

    if (
        [
            "jpg",
            "jpeg",
            "png",
            "gif",
            "webp",
            "bmp",
            "svg",
        ].includes(extension)
    ) {
        return "image";
    }

    if (
        ["mp4", "webm", "ogg", "mov"].includes(
            extension,
        )
    ) {
        return "video";
    }

    if (
        ["mp3", "wav", "ogg", "m4a"].includes(
            extension,
        )
    ) {
        return "audio";
    }

    if (
        ["txt", "csv", "json"].includes(extension)
    ) {
        return "text";
    }

    return "unknown";
}

function formatDate(
    value?: string | null,
): string {
    if (!value) return "Sin fecha";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleString("es-EC", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function getFileName(
    row: ReviewStudentRow,
): string {
    if (row.fileName?.trim()) {
        return row.fileName;
    }

    if (row.fileUrl) {
        const cleanUrl =
            row.fileUrl.split("?")[0];

        const name = cleanUrl
            .split("/")
            .pop();

        if (name) {
            return decodeURIComponent(name);
        }
    }

    return "Archivo enviado";
}

function FileIcon({
    fileKind,
}: {
    fileKind: FileKind;
}) {
    if (fileKind === "image") {
        return (
            <ImageIcon className="h-4 w-4 sm:h-5 sm:w-5" />
        );
    }

    if (fileKind === "video") {
        return (
            <Video className="h-4 w-4 sm:h-5 sm:w-5" />
        );
    }

    if (fileKind === "audio") {
        return (
            <Music className="h-4 w-4 sm:h-5 sm:w-5" />
        );
    }

    return (
        <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
    );
}

function FilePreview({
    fileUrl,
    fileName,
}: {
    fileUrl: string;
    fileName: string;
}) {
    const fileKind =
        getFileKind(fileName || fileUrl);

    if (fileKind === "pdf") {
        return (
            <iframe
                src={`${fileUrl}#toolbar=1&navpanes=0&scrollbar=1`}
                title={fileName}
                className="h-[360px] w-full bg-white sm:h-[500px] lg:h-[640px] [@media(max-height:760px)]:h-[340px]"
            />
        );
    }

    if (fileKind === "image") {
        return (
            <div className="flex min-h-[220px] items-center justify-center bg-slate-100 p-3 sm:min-h-[360px] sm:p-4 lg:min-h-[520px] [@media(max-height:760px)]:min-h-[240px]">
                <div className="relative h-[280px] w-full max-w-[900px] sm:h-[460px] lg:h-[620px] [@media(max-height:760px)]:h-[300px]">
                    <Image
                        src={fileUrl}
                        alt={fileName}
                        fill
                        unoptimized
                        sizes="(max-width: 768px) 100vw, 900px"
                        className="rounded-xl object-contain sm:rounded-2xl"
                    />
                </div>
            </div>
        );
    }

    if (fileKind === "video") {
        return (
            <div className="flex min-h-[220px] items-center justify-center bg-slate-950 p-3 sm:min-h-[360px] sm:p-4 lg:min-h-[520px] [@media(max-height:760px)]:min-h-[240px]">
                <video
                    src={fileUrl}
                    controls
                    className="max-h-[300px] w-full rounded-xl sm:max-h-[460px] sm:rounded-2xl lg:max-h-[620px] [@media(max-height:760px)]:max-h-[320px]"
                />
            </div>
        );
    }

    if (fileKind === "audio") {
        return (
            <div className="flex min-h-[180px] items-center justify-center bg-slate-50 p-4 sm:min-h-[260px] sm:p-8 lg:min-h-[320px] [@media(max-height:760px)]:min-h-[180px]">
                <audio
                    src={fileUrl}
                    controls
                    className="w-full max-w-2xl"
                />
            </div>
        );
    }

    if (fileKind === "text") {
        return (
            <iframe
                src={fileUrl}
                title={fileName}
                className="h-[320px] w-full bg-white sm:h-[460px] lg:h-[560px] [@media(max-height:760px)]:h-[300px]"
            />
        );
    }

    return (
        <div className="flex min-h-[220px] flex-col items-center justify-center bg-slate-50 p-5 text-center sm:min-h-[300px] sm:p-8 lg:min-h-[360px] [@media(max-height:760px)]:min-h-[200px]">
            <FileText className="h-8 w-8 text-slate-400 sm:h-10 sm:w-10" />

            <p className="mt-3 text-xs font-black leading-5 text-slate-700 sm:text-sm">
                Este archivo no se puede
                previsualizar directamente.
            </p>

            <p className="mt-1 text-xs font-semibold leading-5 text-slate-500 sm:text-sm">
                Ábrelo o descárgalo para
                revisarlo.
            </p>
        </div>
    );
}

export function HomeworkReviewPanel({
    row,
}: HomeworkReviewPanelProps) {
    if (!row) {
        return (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center sm:rounded-2xl sm:p-8 [@media(max-height:760px)]:p-4">
                <FileText className="mx-auto h-8 w-8 text-slate-400 sm:h-9 sm:w-9" />

                <p className="mt-3 text-xs font-black leading-5 text-slate-700 sm:text-sm">
                    Selecciona un estudiante para
                    revisar la tarea.
                </p>
            </div>
        );
    }

    if (!row.fileUrl) {
        return (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center sm:rounded-2xl sm:p-8 [@media(max-height:760px)]:p-4">
                <FileText className="mx-auto h-8 w-8 text-slate-400 sm:h-9 sm:w-9" />

                <p className="mt-3 text-xs font-black leading-5 text-slate-700 sm:text-sm">
                    El estudiante aún no ha enviado
                    un archivo.
                </p>
            </div>
        );
    }

    const fileName = getFileName(row);

    const fileKind = getFileKind(
        fileName || row.fileUrl,
    );

    return (
        <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white sm:rounded-3xl">
            <div className="flex min-w-0 flex-col gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 sm:px-5 sm:py-4 lg:flex-row lg:items-center lg:justify-between [@media(max-height:760px)]:py-3">
                <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 sm:h-11 sm:w-11 sm:rounded-2xl">
                        <FileIcon
                            fileKind={fileKind}
                        />
                    </div>

                    <div className="min-w-0">
                        <h3
                            title={fileName}
                            className="break-all text-xs font-black leading-5 text-slate-950 [overflow-wrap:anywhere] sm:text-sm"
                        >
                            {fileName}
                        </h3>

                        <p className="mt-1 text-[10px] font-bold leading-4 text-slate-500 sm:text-xs">
                            Enviado:{" "}
                            {formatDate(
                                row.submittedAt,
                            )}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                    <a
                        href={row.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.97] sm:h-10 sm:gap-2 sm:rounded-2xl sm:px-4 sm:text-sm"
                    >
                        <ExternalLink className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        Abrir
                    </a>

                    <a
                        href={row.fileUrl}
                        download
                        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-[#172861] px-3 text-xs font-black !text-white shadow-sm transition hover:bg-[#0f1d48] active:scale-[0.97] sm:h-10 sm:gap-2 sm:rounded-2xl sm:px-4 sm:text-sm"
                    >
                        <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        Descargar
                    </a>
                </div>
            </div>

            <FilePreview
                fileUrl={row.fileUrl}
                fileName={fileName}
            />

            {row.comment ? (
                <div className="border-t border-slate-200 bg-slate-50 px-4 py-3 sm:px-5 sm:py-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500 sm:text-xs sm:tracking-[0.14em]">
                        Comentario
                    </p>

                    <p className="mt-2 whitespace-pre-wrap break-words text-xs font-semibold leading-5 text-slate-700 [overflow-wrap:anywhere] sm:text-sm sm:leading-6">
                        {row.comment}
                    </p>
                </div>
            ) : null}
        </div>
    );
}

export default HomeworkReviewPanel;
