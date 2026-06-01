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
    isSavingTemplate,
    isGenerating,
    onSelectCourse,
    onBackgroundUpload,
    onSaveTemplate,
    onGeneratePdf,
}: ToolbarProps) {
    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link
                href={backHref}
                className="inline-flex w-fit items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
                <ArrowLeft className="h-4 w-4" />
                {backLabel}
            </Link>

            <div className="flex flex-col gap-2 sm:flex-row">
                {isAdminRoute && routeCourseId <= 0 ? (
                    <select
                        value={numericCourseId || ""}
                        onChange={(event) =>
                            onSelectCourse(event.target.value)
                        }
                        className="h-11 min-w-[260px] rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    >
                        <option value="">Selecciona un curso</option>
                        {courseOptions.map((courseItem) => (
                            <option key={courseItem.id} value={courseItem.id}>
                                {courseItem.name}
                            </option>
                        ))}
                    </select>
                ) : null}

                <label className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-white px-4 text-sm font-bold text-[#172861] shadow-sm transition hover:bg-blue-50">
                    <ImagePlus className="h-4 w-4" />
                    Subir fondo
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
                    disabled={isSavingTemplate}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    <Save className="h-4 w-4" />
                    {isSavingTemplate ? "Guardando..." : "Guardar"}
                </button>

                <button
                    type="button"
                    onClick={onGeneratePdf}
                    disabled={isGenerating}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#172861] px-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#0B163F] disabled:cursor-not-allowed disabled:opacity-60"
                >
                    <Download className="h-4 w-4" />
                    {isGenerating ? "Generando..." : "Generar PDF"}
                </button>
            </div>
        </div>
    );
}