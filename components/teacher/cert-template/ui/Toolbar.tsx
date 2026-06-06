import Link from "next/link";
import type { ChangeEvent } from "react";
import { ArrowLeft, Download, ImagePlus, Save } from "lucide-react";
import type { Course } from "@/services/courses.service";

type ToolbarProps = {
    backHref: string;
    backLabel: string;
    isAdminRoute: boolean;
    routeCourseId: number;
    numericCourseId: number;
    courseOptions: Course[];
    hasBackgroundImage: boolean;
    isSavingTemplate: boolean;
    isGenerating: boolean;
    onSelectCourse: (value: string) => void;
    onBackgroundUpload: (event: ChangeEvent<HTMLInputElement>) => void;
    onSaveTemplate: () => void;
    onGeneratePdf: () => void;
};

export function Toolbar({
    backHref,
    backLabel,
    isAdminRoute,
    routeCourseId,
    numericCourseId,
    courseOptions,
    hasBackgroundImage,
    isSavingTemplate,
    isGenerating,
    onSelectCourse,
    onBackgroundUpload,
    onSaveTemplate,
    onGeneratePdf,
}: ToolbarProps) {
    return (
        <div className="grid min-w-0 gap-3 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
            <div className="grid min-w-0 gap-2 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center">
                <Link
                    href={backHref}
                    className="inline-flex h-10 w-fit max-w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.97] sm:rounded-2xl sm:px-4 sm:text-sm"
                >
                    <ArrowLeft className="h-4 w-4 shrink-0" />

                    <span className="truncate">
                        {backLabel}
                    </span>
                </Link>

                {isAdminRoute && routeCourseId <= 0 ? (
                    <select
                        value={numericCourseId || ""}
                        onChange={(event) =>
                            onSelectCourse(event.target.value)
                        }
                        className="h-10 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:max-w-sm sm:rounded-2xl sm:px-4 sm:text-sm"
                    >
                        <option value="">Selecciona un curso</option>

                        {courseOptions.map((courseItem) => (
                            <option key={courseItem.id} value={courseItem.id}>
                                {courseItem.name}
                            </option>
                        ))}
                    </select>
                ) : null}
            </div>

            <div className="grid grid-cols-1 gap-2 xs:grid-cols-3 xl:flex xl:shrink-0">
                <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-white px-3 text-xs font-bold text-[#172861] shadow-sm transition hover:bg-blue-50 active:scale-[0.97] sm:gap-2 sm:rounded-2xl sm:px-4 sm:text-sm">
                    <ImagePlus className="h-4 w-4 shrink-0" />

                    <span className="truncate">
                        {hasBackgroundImage ? "Cambiar fondo" : "Subir fondo"}
                    </span>

                    <input
                        type="file"
                        accept="image/*"
                        onChange={onBackgroundUpload}
                        className="hidden"
                    />
                </label>

                <button
                    type="button"
                    onClick={onSaveTemplate}
                    disabled={!hasBackgroundImage || isSavingTemplate}
                    title={
                        hasBackgroundImage
                            ? "Guardar plantilla"
                            : "Primero sube una imagen de fondo"
                    }
                    className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 sm:gap-2 sm:rounded-2xl sm:px-4 sm:text-sm"
                >
                    <Save className="h-4 w-4 shrink-0" />

                    <span className="truncate">
                        {isSavingTemplate ? "Guardando..." : "Guardar"}
                    </span>
                </button>

                <button
                    type="button"
                    onClick={onGeneratePdf}
                    disabled={!hasBackgroundImage || isGenerating}
                    title={
                        hasBackgroundImage
                            ? "Generar PDF"
                            : "Primero sube una imagen de fondo"
                    }
                    className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[#172861] px-3 text-xs font-bold text-white shadow-sm transition hover:bg-[#0B163F] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 sm:gap-2 sm:rounded-2xl sm:px-4 sm:text-sm"
                >
                    <Download className="h-4 w-4 shrink-0" />

                    <span className="truncate">
                        {isGenerating ? "Generando..." : "Generar PDF"}
                    </span>
                </button>
            </div>
        </div>
    );
}
