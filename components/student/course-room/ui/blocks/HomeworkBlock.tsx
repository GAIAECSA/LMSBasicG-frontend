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
        <div className="min-w-0 space-y-4">
            {description || instructions ? (
                <div className="min-w-0 break-words whitespace-pre-wrap rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs leading-5 text-blue-800 sm:rounded-2xl sm:p-4 sm:text-sm sm:leading-6">
                    {description || instructions}
                </div>
            ) : null}

            {existing ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold leading-5 text-emerald-800 sm:rounded-2xl sm:p-4 sm:text-sm">
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

            <div className="min-w-0 rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm sm:rounded-[22px]">
                <label className="block">
                    <span className="text-xs font-black text-slate-900 sm:text-sm">
                        Respuesta de la tarea
                    </span>

                    <textarea
                        value={room.homeworkText}
                        onChange={(event) =>
                            room.setHomeworkText(event.target.value)
                        }
                        rows={6}
                        placeholder="Escribe tu respuesta o explicación..."
                        className="mt-2.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs leading-5 text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm sm:leading-6"
                    />
                </label>

                <div className="mt-3">
                    <span className="text-xs font-black text-slate-900 sm:text-sm">
                        Archivo de evidencia
                    </span>

                    <label className="mt-2.5 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-center transition hover:border-blue-300 hover:bg-blue-50 sm:rounded-2xl sm:py-6">
                        <FileUp className="h-7 w-7 text-blue-600 sm:h-8 sm:w-8" />

                        <span className="mt-2.5 text-xs font-black text-slate-800 sm:text-sm">
                            Subir archivo
                        </span>

                        <span className="mt-1 text-[11px] font-semibold leading-4 text-slate-500 sm:text-xs">
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
                        <div className="mt-3 flex min-w-0 flex-col gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:rounded-2xl sm:px-4 sm:py-3">
                            <div className="min-w-0">
                                <p className="truncate text-xs font-black text-slate-800 sm:text-sm">
                                    {room.homeworkFile.name}
                                </p>

                                <p className="text-[11px] font-semibold text-slate-500 sm:text-xs">
                                    {(room.homeworkFile.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={clearFile}
                                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-red-50 hover:text-red-600 sm:h-9 sm:w-9 sm:rounded-xl"
                                aria-label="Quitar archivo"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    ) : null}
                </div>

                {room.studentResponseMessage ? (
                    <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs font-bold leading-5 text-blue-700 sm:rounded-2xl sm:text-sm">
                        {room.studentResponseMessage}
                    </div>
                ) : null}

                <div className="mt-3">
                    <button
                        type="button"
                        onClick={() => void room.handleSubmitHomework()}
                        disabled={room.studentResponseSaving}
                        className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2.5 text-center text-xs font-bold text-[var(--primary-foreground)] transition hover:opacity-95 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:rounded-2xl sm:px-5 sm:text-sm"
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
