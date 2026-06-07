import {
    Plus,
} from "lucide-react";

import type {
    EnrollmentsAdminBulkPanelState,
} from "../hook";

import {
    BulkStudentCard,
} from "./BulkStudentCard";

type BulkStudentsPanelProps = {
    panel: EnrollmentsAdminBulkPanelState;
};

export function BulkStudentsPanel({
    panel,
}: BulkStudentsPanelProps) {
    return (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:rounded-[28px]">
            <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5 [@media(max-height:760px)]:p-4">
                <div className="min-w-0">
                    <h2 className="text-base font-black text-slate-900 sm:text-lg">
                        Estudiantes a matricular
                    </h2>

                    <p className="mt-1 text-xs font-medium leading-5 text-slate-500 sm:text-sm">
                        Completa los campos
                        obligatorios antes de ejecutar
                        la carga.
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:flex">
                    <button
                        type="button"
                        onClick={panel.addRow}
                        disabled={
                            !panel.hasSelectedCourse ||
                            panel.isSubmitting
                        }
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#172861] px-3 text-xs font-black text-white shadow-sm transition hover:bg-[#0B163F] active:scale-[0.97] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none sm:h-11 sm:rounded-2xl sm:px-4 sm:text-sm"
                    >
                        <Plus className="h-4 w-4 shrink-0" />
                        Agregar fila
                    </button>

                    <button
                        type="button"
                        onClick={panel.clearRows}
                        disabled={panel.isSubmitting}
                        className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 sm:h-11 sm:rounded-2xl sm:px-4 sm:text-sm"
                    >
                        Limpiar
                    </button>
                </div>
            </div>

            <div className="space-y-3 p-4 sm:space-y-4 sm:p-5 [@media(max-height:760px)]:space-y-3 [@media(max-height:760px)]:p-4">
                {panel.rows.map(
                    (row, index) => (
                        <BulkStudentCard
                            key={row.localId}
                            index={index}
                            row={row}
                            panel={panel}
                        />
                    ),
                )}
            </div>
        </section>
    );
}
