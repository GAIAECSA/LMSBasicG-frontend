import {
    BookOpen,
} from "lucide-react";

import type {
    EnrollmentsAdminBulkPanelState,
} from "../hook";

import {
    getCourseName,
} from "../utils";

type BulkHeroProps = {
    panel: EnrollmentsAdminBulkPanelState;
};

const statItems = [
    {
        key: "total",
        label: "Total",
    },
    {
        key: "valid",
        label: "Válidos",
    },
    {
        key: "alerts",
        label: "Alertas",
    },
    {
        key: "courses",
        label: "Cursos",
    },
] as const;

export function BulkHero({
    panel,
}: BulkHeroProps) {
    const values = {
        total:
            panel.validation.activeRows
                .length,
        valid:
            panel.validation.canSubmit
                ? panel.validation.activeRows
                    .length
                : 0,
        alerts:
            Object.keys(
                panel.validation.rowErrors,
            ).length +
            panel.validation.generalErrors
                .length,
        courses: panel.courses.length,
    };

    return (
        <section className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#07111F] via-[#172861] via-[70%] to-[#F97316] p-4 text-white shadow-lg sm:rounded-3xl sm:p-5 lg:p-6 [@media(max-height:760px)]:p-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0">
                    <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-blue-100 sm:text-xs sm:tracking-[0.25em] lg:text-sm">
                        Administración
                    </p>

                    <h1 className="mt-2 text-xl font-black text-white sm:text-2xl lg:text-3xl [@media(max-height:760px)]:text-xl">
                        Matriculación masiva
                    </h1>

                    <p className="mt-2 max-w-3xl text-xs font-medium leading-5 text-blue-50 sm:text-sm sm:leading-6">
                        Selecciona un curso,
                        importa estudiantes mediante
                        archivo Excel y ejecuta la
                        matrícula automática desde un
                        solo módulo.
                    </p>

                    {panel.selectedCourse ? (
                        <div className="mt-3 inline-flex max-w-full items-center gap-2 rounded-xl bg-white/15 px-3 py-2 text-xs font-black text-white ring-1 ring-white/15 sm:mt-4 sm:rounded-2xl sm:px-4 sm:text-sm">
                            <BookOpen className="h-4 w-4 shrink-0 text-orange-300" />

                            <span
                                title={getCourseName(
                                    panel.selectedCourse,
                                )}
                                className="truncate"
                            >
                                {getCourseName(
                                    panel.selectedCourse,
                                )}
                            </span>
                        </div>
                    ) : null}
                </div>

                <div className="grid w-full grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4 xl:w-auto xl:min-w-[520px]">
                    {statItems.map((item) => (
                        <div
                            key={item.key}
                            className="rounded-xl bg-white/15 px-3 py-3 text-white shadow-sm ring-1 ring-white/10 backdrop-blur sm:rounded-2xl sm:px-4 sm:py-4 [@media(max-height:760px)]:py-3"
                        >
                            <p className="text-[10px] font-black uppercase text-blue-100 sm:text-xs">
                                {item.label}
                            </p>

                            <p className="mt-1 text-2xl font-black sm:mt-2 sm:text-3xl [@media(max-height:760px)]:text-2xl">
                                {values[item.key]}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
