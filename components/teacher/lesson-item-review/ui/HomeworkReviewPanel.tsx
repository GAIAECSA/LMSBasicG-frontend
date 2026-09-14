"use client";

import {
    Download,
    ExternalLink,
    FileText,
    ImageIcon,
    Music,
    Video,
} from "lucide-react";

import Image from "next/image";

import type { LessonItemReviewState } from "../hook";
import type { ReviewStudentRow } from "../types";

import { TeacherHomeworkUpload } from "./TeacherHomeworkUpload";


type HomeworkReviewPanelProps = {
    row: ReviewStudentRow | null;
    review: LessonItemReviewState;
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

    const cleanValue =
        fileNameOrUrl
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


    if (extension === "pdf") {
        return "pdf";
    }


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
        [
            "mp4",
            "webm",
            "ogg",
            "mov",
        ].includes(extension)
    ) {
        return "video";
    }


    if (
        [
            "mp3",
            "wav",
            "ogg",
            "m4a",
        ].includes(extension)
    ) {
        return "audio";
    }


    if (
        [
            "txt",
            "csv",
            "json",
        ].includes(extension)
    ) {
        return "text";
    }


    return "unknown";
}



function formatDate(
    value?: string | null,
): string {

    if (!value) {
        return "Sin fecha";
    }


    const date = new Date(value);


    if (Number.isNaN(date.getTime())) {
        return value;
    }


    return date.toLocaleString(
        "es-EC",
        {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        },
    );
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


        const name =
            cleanUrl.split("/").pop();


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
                className="
                h-[360px]
                w-full
                bg-white
                sm:h-[500px]
                lg:h-[640px]
                "
            />

        );

    }



    if (fileKind === "image") {

        return (

            <div className="
                flex
                min-h-[220px]
                items-center
                justify-center
                bg-slate-100
                p-3
            ">

                <div className="
                    relative
                    h-[280px]
                    w-full
                    max-w-[900px]
                ">

                    <Image
                        src={fileUrl}
                        alt={fileName}
                        fill
                        unoptimized
                        sizes="100vw"
                        className="rounded-xl object-contain"
                    />

                </div>

            </div>

        );

    }



    if (fileKind === "video") {

        return (

            <video
                src={fileUrl}
                controls
                className="max-h-[620px] w-full"
            />

        );

    }



    if (fileKind === "audio") {

        return (

            <div className="p-6">

                <audio
                    src={fileUrl}
                    controls
                    className="w-full"
                />

            </div>

        );

    }



    return (

        <div className="
            flex
            min-h-[220px]
            flex-col
            items-center
            justify-center
            bg-slate-50
            p-5
            text-center
        ">

            <FileText className="h-8 w-8 text-slate-400" />

            <p className="mt-3 text-sm font-bold text-slate-700">
                Este archivo no se puede previsualizar.
            </p>

        </div>

    );

}



export function HomeworkReviewPanel({
    row,
    review,
}: HomeworkReviewPanelProps) {


    if (!row) {

        return (

            <div className="
                rounded-xl
                border
                border-dashed
                border-slate-300
                bg-slate-50
                p-5
                text-center
            ">

                <FileText className="mx-auto h-8 w-8 text-slate-400" />

                <p className="mt-3 text-sm font-black text-slate-700">
                    Selecciona un estudiante para revisar la tarea.
                </p>

            </div>

        );

    }



    if (!row.fileUrl) {

        return (

            <TeacherHomeworkUpload
                row={row}
                review={review}
            />

        );

    }



    const fileName =
        getFileName(row);


    const fileKind =
        getFileKind(
            fileName || row.fileUrl,
        );



    return (

        <div className="
            min-w-0
            overflow-hidden
            rounded-2xl
            border
            border-slate-200
            bg-white
        ">


            <div className="
                flex
                flex-col
                gap-3
                border-b
                border-slate-200
                bg-slate-50
                px-4
                py-3
                lg:flex-row
                lg:items-center
                lg:justify-between
            ">


                <div className="
                    flex
                    items-center
                    gap-3
                ">

                    <div className="
                        flex
                        h-10
                        w-10
                        items-center
                        justify-center
                        rounded-xl
                        bg-blue-50
                        text-blue-700
                    ">

                        <FileIcon
                            fileKind={fileKind}
                        />

                    </div>


                    <div>

                        <h3 className="text-sm font-black text-slate-950">
                            {fileName}
                        </h3>


                        <p className="text-xs text-slate-500">
                            Enviado:
                            {" "}
                            {formatDate(row.submittedAt)}
                        </p>

                    </div>


                </div>



                <div className="flex gap-2">


                    <a
                        href={row.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="
                        inline-flex
                        items-center
                        gap-2
                        rounded-xl
                        border
                        px-3
                        py-2
                        text-xs
                        font-black
                        "
                    >

                        <ExternalLink className="h-4 w-4" />

                        Abrir

                    </a>


                    <a
                        href={row.fileUrl}
                        download
                        className="
                        inline-flex
                        items-center
                        gap-2
                        rounded-xl
                        bg-[#172861]
                        px-3
                        py-2
                        text-xs
                        font-black
                        text-white
                        "
                    >

                        <Download className="h-4 w-4" />

                        Descargar

                    </a>


                </div>


            </div>



            <FilePreview
                fileUrl={row.fileUrl}
                fileName={fileName}
            />



            {
                row.comment ? (

                    <div className="
                        border-t
                        bg-slate-50
                        px-4
                        py-3
                    ">

                        <p className="text-xs font-black uppercase text-slate-500">
                            Comentario
                        </p>


                        <p className="
                            mt-2
                            whitespace-pre-wrap
                            text-sm
                            font-semibold
                            text-slate-700
                        ">
                            {row.comment}
                        </p>

                    </div>

                ) : null
            }


        </div>

    );

}



export default HomeworkReviewPanel;