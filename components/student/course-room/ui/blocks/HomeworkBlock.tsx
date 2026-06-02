import { FileUp, Loader2, Save, X } from "lucide-react";
import type { ChangeEvent } from "react";
import type { CourseRoomHook } from "../../hook";
import {
    getBlockDescription,
    getContentValue,
    getStudentResponseDate,
    getStudentResponseFileUrl,
} from "../../utils";

type HomeworkBlockProps = {
    room: CourseRoomHook;
};

export function HomeworkBlock({ room }: HomeworkBlockProps) {
    if (!room.selectedBlock) return null;

    const description = getBlockDescription(room.selectedBlock);

    const instructions =
        getContentValue(room.selectedContent, "instructions") ||
        getContentValue(room.selectedContent, "instrucciones") ||
        getContentValue(room.selectedContent, "body") ||
        getContentValue(room.selectedContent, "text");

    const existing = room.homeworkResponses[room.selectedBlock.id] ?? null;
    const evidenceUrl = getStudentResponseFileUrl(existing);

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] ?? null;
        room.setHomeworkFile(file);
    };

    const clearFile = () => {
        room.setHomeworkFile(null);
    };

    return (
        <div className="min-w-0 space-y-4 sm:space-y-5">
            {description || instructions ? (
                <div className="min-w-0 break-words whitespace-pre-wrap rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-800">
                    {description || instructions}
                </div>
            ) : null}

            {existing ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
                    <p className="font-black">Tarea enviada</p>

                    <p className="mt-1">
                        Última actualización: {getStudentResponseDate(existing)}
                    </p>

                    {existing.score !== undefined && existing.score !== null ? (
                        <p className="mt-1">
                            Calificación: {String(existing.score)}
                        </p>
                    ) : null}

                    {evidenceUrl ? (
                        <a
                            href={evidenceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 inline-flex font-black text-emerald-700 underline"
                        >
                            Ver archivo enviado
                        </a>
                    ) : null}
                </div>
            ) : null}

            <div className="min-w-0 rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm sm:rounded-[24px] sm:p-5">
                <label className="block">
                    <span className="text-sm font-black text-slate-900">
                        Respuesta de la tarea
                    </span>

                    <textarea
                        value={room.homeworkText}
                        onChange={(event) =>
                            room.setHomeworkText(event.target.value)
                        }
                        rows={7}
                        placeholder="Escribe tu respuesta o explicación..."
                        className="mt-3 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    />
                </label>

                <div className="mt-4">
                    <span className="text-sm font-black text-slate-900">
                        Archivo de evidencia
                    </span>

                    <label className="mt-3 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center transition hover:border-blue-300 hover:bg-blue-50">
                        <FileUp className="h-8 w-8 text-blue-600" />

                        <span className="mt-3 text-sm font-black text-slate-800">
                            Subir archivo
                        </span>

                        <span className="mt-1 text-xs font-semibold text-slate-500">
                            Selecciona un PDF, Word, imagen o archivo permitido
                        </span>

                        <input
                            type="file"
                            onChange={handleFileChange}
                            className="hidden"
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.webp,.zip,.rar"
                        />
                    </label>

                    {room.homeworkFile ? (
                        <div className="mt-3 flex min-w-0 flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                                <p className="truncate text-sm font-black text-slate-800">
                                    {room.homeworkFile.name}
                                </p>

                                <p className="text-xs font-semibold text-slate-500">
                                    {(
                                        room.homeworkFile.size /
                                        1024 /
                                        1024
                                    ).toFixed(2)}{" "}
                                    MB
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={clearFile}
                                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-red-50 hover:text-red-600"
                                aria-label="Quitar archivo"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    ) : null}
                </div>

                {room.studentResponseMessage ? (
                    <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-3 text-sm font-bold text-blue-700">
                        {room.studentResponseMessage}
                    </div>
                ) : null}

                <div className="mt-4">
                    <button
                        type="button"
                        onClick={() => void room.handleSubmitHomework()}
                        disabled={room.studentResponseSaving}
                        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-4 py-3 text-center text-sm font-bold text-[var(--primary-foreground)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-5"
                    >
                        {room.studentResponseSaving ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4" />
                        )}

                        {existing ? "Actualizar tarea" : "Enviar tarea"}
                    </button>
                </div>
            </div>
        </div>
    );
}