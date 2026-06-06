"use client";

import { GraduationCap } from "lucide-react";
import { StudentNotificationsBell } from "@/components/student/notifications/StudentNotificationsBell";
import type { StudentCatalogState } from "../hook";

type CatalogHeaderProps = {
    catalog: StudentCatalogState;
};

export function CatalogHeader({
    catalog,
}: CatalogHeaderProps) {
    return (
        <header className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
                <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl lg:text-[34px]">
                    Catálogo de cursos
                </h1>

                <p className="mt-1.5 max-w-3xl text-sm font-semibold leading-6 text-slate-500">
                    Explora los cursos disponibles, revisa sus precios,
                    descuentos y accede al aula para continuar tu aprendizaje.
                </p>
            </div>

            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                <span className="inline-flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 text-xs font-black text-slate-950 shadow-sm sm:px-4 sm:text-sm">
                    <GraduationCap className="h-4 w-4 shrink-0 text-[#00469B]" />
                    <span className="hidden xs:inline">Rol:</span>
                    Estudiante
                </span>

                <StudentNotificationsBell />

                <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#00469B] text-xs font-black text-white shadow-sm sm:h-11 sm:w-11 sm:text-sm"
                    aria-label={`Estudiante ${catalog.studentInitials}`}
                    title={catalog.studentName}
                >
                    {catalog.studentInitials}
                </div>
            </div>
        </header>
    );
}

export default CatalogHeader;
