import { Trash2, UploadCloud } from "lucide-react";
import type { LessonItemState } from "../hook";

type FileSectionProps = {
    item: LessonItemState;
};

export function FileSection({ item }: FileSectionProps) {
    if (item.itemType !== "image" && item.itemType !== "pdf") return null;

    return (
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-slate-950">
                {item.itemType === "image"
                    ? "Imagen de la lección"
                    : "PDF de la lección"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
                {item.itemType === "image"
                    ? "Selecciona una imagen PNG, JPG o WEBP."
                    : "Selecciona un archivo PDF."}
            </p>

            <div className="mt-5 space-y-2">
                <label className="block text-[13px] font-bold text-slate-700">
                    Descripción
                </label>

                <textarea
                    value={item.form.description}
                    onChange={(event) =>
                        item.setForm((current) => ({
                            ...current,
                            description: event.target.value,
                        }))
                    }
                    placeholder="Describe brevemente el material..."
                    className="min-h-[100px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
            </div>

            <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
                <label className="block cursor-pointer text-center">
                    <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-blue-700 shadow-sm">
                        <UploadCloud className="h-6 w-6" />
                    </span>

                    <span className="mt-3 block text-sm font-black text-slate-800">
                        {item.itemType === "image" ? "Subir imagen" : "Subir PDF"}
                    </span>

                    <span className="mt-1 block text-xs font-semibold text-slate-500">
                        {item.itemType === "image"
                            ? "Formatos permitidos: PNG, JPG, WEBP"
                            : "Formato permitido: PDF"}
                    </span>

                    <input
                        type="file"
                        accept={
                            item.itemType === "image"
                                ? "image/png,image/jpeg,image/webp"
                                : "application/pdf"
                        }
                        onChange={item.handleSelectedFile}
                        className="hidden"
                    />
                </label>
            </div>

            <div className="mt-5 space-y-3">
                {item.selectedFile ? (
                    <div className="flex items-center justify-between gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3">
                        <div className="min-w-0">
                            <p className="truncate text-sm font-black text-blue-950">
                                {item.selectedFile.name}
                            </p>

                            <p className="text-xs font-semibold text-blue-700">
                                Nuevo archivo seleccionado ·{" "}
                                {(item.selectedFile.size / 1024).toFixed(1)} KB
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => item.setSelectedFile(null)}
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-red-700 transition hover:bg-red-50"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                ) : null}

                {item.fullExistingFileUrl ? (
                    <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                        <div className="min-w-0">
                            <p className="truncate text-sm font-black text-slate-950">
                                Archivo actual
                            </p>

                            <p className="truncate text-xs font-semibold text-slate-500">
                                {item.existingFileUrl}
                            </p>
                        </div>

                        <a
                            href={item.fullExistingFileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-xl bg-blue-50 px-3 py-2 text-xs font-black text-blue-700 transition hover:bg-blue-100"
                        >
                            Ver
                        </a>
                    </div>
                ) : null}

                {!item.selectedFile && !item.fullExistingFileUrl ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-center text-sm text-slate-500">
                        Todavía no has seleccionado archivo.
                    </div>
                ) : null}
            </div>
        </div>
    );
}