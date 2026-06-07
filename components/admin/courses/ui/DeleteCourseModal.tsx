"use client";

import {
    AlertTriangle,
    Loader2,
    Trash2,
    X,
} from "lucide-react";

import type {
    Course,
} from "@/services/courses.service";
import {
    getCourseName,
} from "../utils";

type DeleteCourseModalProps = {
    course:
        Course |
        null;
    isDeleting:
        boolean;
    onClose:
        () => void;
    onConfirm:
        () => void;
};

export function DeleteCourseModal({
    course,
    isDeleting,
    onClose,
    onConfirm,
}: DeleteCourseModalProps) {
    if (
        !course
    ) {
        return null;
    }

    const courseName =
        getCourseName(
            course,
        ) ||
        `Curso #${course.id}`;

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-course-title"
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-[2px]"
            onClick={
                onClose
            }
        >
            <div
                className="w-full max-w-md overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-2xl"
                onClick={(
                    event,
                ) =>
                    event.stopPropagation()
                }
            >
                <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
                    <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                            <AlertTriangle className="h-5 w-5" />
                        </div>

                        <div className="min-w-0">
                            <h2
                                id="delete-course-title"
                                className="text-base font-black text-slate-950 sm:text-lg"
                            >
                                Eliminar curso
                            </h2>

                            <p className="mt-1 text-xs font-semibold leading-5 text-slate-500 sm:text-sm">
                                Esta acción no se puede deshacer.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={
                            onClose
                        }
                        disabled={
                            isDeleting
                        }
                        aria-label="Cerrar confirmación"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="px-5 py-5 sm:px-6">
                    <p className="text-sm font-semibold leading-6 text-slate-600">
                        ¿Seguro que deseas eliminar el curso{" "}
                        <span className="font-black text-slate-950">
                            {courseName}
                        </span>
                        ?
                    </p>

                    <p className="mt-2 text-xs font-semibold leading-5 text-red-600 sm:text-sm">
                        Se eliminará el curso y podría afectar el acceso a su contenido.
                    </p>

                    <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            onClick={
                                onClose
                            }
                            disabled={
                                isDeleting
                            }
                            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-700 transition hover:bg-slate-50 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 sm:h-11 sm:px-5 sm:text-sm"
                        >
                            Cancelar
                        </button>

                        <button
                            type="button"
                            onClick={
                                onConfirm
                            }
                            disabled={
                                isDeleting
                            }
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-xs font-black text-white transition hover:bg-red-700 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 sm:h-11 sm:px-5 sm:text-sm"
                        >
                            {isDeleting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Trash2 className="h-4 w-4" />
                            )}

                            {isDeleting
                                ? "Eliminando..."
                                : "Eliminar curso"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default DeleteCourseModal;
