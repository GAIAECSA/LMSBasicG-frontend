"use client";

import {
    FileUp,
    Loader2,
    Save,
    X,
} from "lucide-react";

import type { ChangeEvent } from "react";
import { useState } from "react";

import type { LessonItemReviewState } from "../hook";
import type { ReviewStudentRow } from "../types";

type TeacherHomeworkUploadProps = {
    row: ReviewStudentRow;
    review: LessonItemReviewState;
};

export function TeacherHomeworkUpload({
    row,
    review,
}: TeacherHomeworkUploadProps) {
    const [file, setFile] = useState<File | null>(null);
    const [comment, setComment] = useState("");

    function handleFileChange(
        event: ChangeEvent<HTMLInputElement>,
    ) {
        const selectedFile =
            event.target.files?.[0] ?? null;

        setFile(selectedFile);
    }

    function clearFile() {
        setFile(null);
    }

    async function handleSave() {
        if (!file) {
            return;
        }

        await review.handleTeacherHomeworkUpload(
            file,
            comment,
        );

        setFile(null);
        setComment("");
    }

    return (
        <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-5">

            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 sm:rounded-2xl sm:p-4">

                <p className="text-xs font-black uppercase tracking-wide text-amber-700">
                    Acción docente
                </p>

                <p className="mt-1 text-xs font-semibold leading-5 text-amber-800 sm:text-sm">
                    El estudiante aún no tiene una entrega.
                    Puedes cargar un archivo complementario,
                    evidencia o corrección directamente desde
                    administración.
                </p>

            </div>


            <div className="space-y-4">

                <label className="block">

                    <span className="text-xs font-black text-slate-900 sm:text-sm">
                        Comentario / retroalimentación
                    </span>

                    <textarea
                        value={comment}
                        onChange={(event) =>
                            setComment(event.target.value)
                        }
                        rows={5}
                        placeholder="Escribe una observación para el estudiante..."
                        className="
                        mt-2
                        w-full
                        rounded-xl
                        border
                        border-slate-200
                        bg-slate-50
                        px-3
                        py-2.5
                        text-xs
                        font-semibold
                        leading-5
                        text-slate-700
                        outline-none
                        transition
                        focus:border-blue-500
                        focus:bg-white
                        focus:ring-4
                        focus:ring-blue-100
                        sm:rounded-2xl
                        sm:px-4
                        sm:py-3
                        sm:text-sm
                        "
                    />

                </label>


                <div>

                    <span className="text-xs font-black text-slate-900 sm:text-sm">
                        Archivo docente
                    </span>


                    <label
                        className="
                        mt-2
                        flex
                        cursor-pointer
                        flex-col
                        items-center
                        justify-center
                        rounded-xl
                        border-2
                        border-dashed
                        border-slate-200
                        bg-slate-50
                        px-4
                        py-6
                        text-center
                        transition
                        hover:border-blue-300
                        hover:bg-blue-50
                        sm:rounded-2xl
                        "
                    >

                        <FileUp className="h-8 w-8 text-blue-600" />

                        <span className="mt-3 text-xs font-black text-slate-800 sm:text-sm">
                            Subir archivo
                        </span>

                        <span className="mt-1 text-[11px] font-semibold text-slate-500 sm:text-xs">
                            PDF, Word, Excel, imagen o archivo permitido
                        </span>


                        <input
                            type="file"
                            onChange={handleFileChange}
                            className="hidden"
                            accept="
                            .pdf,
                            .doc,
                            .docx,
                            .xls,
                            .xlsx,
                            .ppt,
                            .pptx,
                            .png,
                            .jpg,
                            .jpeg,
                            .webp,
                            .zip,
                            .rar
                            "
                        />

                    </label>


                    {file ? (

                        <div
                            className="
                            mt-3
                            flex
                            items-center
                            justify-between
                            gap-3
                            rounded-xl
                            border
                            border-slate-200
                            bg-white
                            px-3
                            py-3
                            sm:rounded-2xl
                            sm:px-4
                            "
                        >

                            <div className="min-w-0">

                                <p className="truncate text-xs font-black text-slate-800 sm:text-sm">
                                    {file.name}
                                </p>


                                <p className="text-[11px] font-semibold text-slate-500">
                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                </p>

                            </div>


                            <button
                                type="button"
                                onClick={clearFile}
                                className="
                                flex
                                h-8
                                w-8
                                shrink-0
                                items-center
                                justify-center
                                rounded-lg
                                border
                                border-slate-200
                                text-slate-500
                                hover:bg-red-50
                                hover:text-red-600
                                "
                            >

                                <X className="h-4 w-4" />

                            </button>


                        </div>

                    ) : null}


                </div>


                <button
                    type="button"
                    disabled={
                        !file ||
                        review.uploadingHomework
                    }
                    onClick={() =>
                        void handleSave()
                    }
                    className="
                    inline-flex
                    min-h-11
                    w-full
                    items-center
                    justify-center
                    gap-2
                    rounded-xl
                    bg-[#172861]
                    px-5
                    text-xs
                    font-black
                    text-white
                    transition
                    hover:bg-[#0f1d48]
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                    sm:rounded-2xl
                    sm:text-sm
                    "
                >

                    {
                        review.uploadingHomework ? (

                            <Loader2 className="h-4 w-4 animate-spin" />

                        ) : (

                            <Save className="h-4 w-4" />

                        )
                    }


                    {
                        review.uploadingHomework
                            ? "Guardando..."
                            : "Guardar entrega"
                    }


                </button>


            </div>

        </div>
    );
}

export default TeacherHomeworkUpload;