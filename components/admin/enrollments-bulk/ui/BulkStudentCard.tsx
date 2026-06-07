import {
    AlertCircle,
    Trash2,
} from "lucide-react";

import {
    BULK_FIELDS,
} from "../constants";

import type {
    EnrollmentsAdminBulkPanelState,
} from "../hook";

import type {
    BulkEnrollmentRow,
} from "../types";

type BulkStudentCardProps = {
    index: number;
    row: BulkEnrollmentRow;
    panel: EnrollmentsAdminBulkPanelState;
};

export function BulkStudentCard({
    index,
    row,
    panel,
}: BulkStudentCardProps) {
    const rowErrors =
        panel.validation.rowErrors[
            row.localId
        ] ?? [];

    const hasErrors =
        rowErrors.length > 0;

    return (
        <article
            className={`rounded-2xl border p-3 transition sm:rounded-3xl sm:p-4 ${
                hasErrors
                    ? "border-rose-200 bg-rose-50/60"
                    : "border-slate-200 bg-white"
            }`}
        >
            <div className="mb-3 flex items-center justify-between gap-3 sm:mb-4">
                <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-xs font-black text-blue-800 sm:h-10 sm:w-10 sm:rounded-2xl sm:text-sm">
                        {index + 1}
                    </div>

                    <div className="min-w-0">
                        <h3 className="truncate text-xs font-black text-slate-900 sm:text-sm">
                            Estudiante {index + 1}
                        </h3>

                        <p className="mt-0.5 text-[10px] font-semibold leading-4 text-slate-500 sm:text-xs">
                            Datos para crear usuario y
                            matrícula
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() =>
                        panel.removeRow(
                            row.localId,
                        )
                    }
                    disabled={panel.isSubmitting}
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-rose-100 bg-white text-rose-600 transition hover:bg-rose-50 active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-50 sm:h-10 sm:w-10 sm:rounded-2xl"
                    title="Eliminar estudiante"
                    aria-label="Eliminar estudiante"
                >
                    <Trash2 className="h-4 w-4" />
                </button>
            </div>

            <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4 xl:gap-3">
                {BULK_FIELDS.map((field) => (
                    <div
                        key={field.key}
                        className={
                            field.className ?? ""
                        }
                    >
                        <label className="mb-1.5 block text-[10px] font-black uppercase text-slate-500 sm:text-xs">
                            {field.label}

                            {field.required ? (
                                <span className="text-orange-500">
                                    {" "}
                                    *
                                </span>
                            ) : null}
                        </label>

                        <input
                            type={
                                field.key ===
                                "email"
                                    ? "email"
                                    : field.key ===
                                        "password"
                                      ? "password"
                                      : "text"
                            }
                            value={row[field.key]}
                            onChange={(event) =>
                                panel.updateRow(
                                    row.localId,
                                    field.key,
                                    event.target
                                        .value,
                                )
                            }
                            placeholder={
                                field.placeholder
                            }
                            disabled={
                                !panel.hasSelectedCourse ||
                                panel.isSubmitting
                            }
                            className="h-10 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 sm:h-11 sm:rounded-2xl sm:px-4 sm:text-sm [@media(max-height:760px)]:h-10"
                        />
                    </div>
                ))}
            </div>

            {hasErrors ? (
                <div className="mt-3 rounded-xl bg-white p-3 sm:mt-4 sm:rounded-2xl">
                    <div className="mb-1 flex items-center gap-2 text-[10px] font-black uppercase text-rose-700 sm:text-xs">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        Revisar estudiante
                    </div>

                    <ul className="space-y-1 text-[11px] font-bold leading-4 text-rose-600 sm:text-xs sm:leading-5">
                        {rowErrors.map(
                            (message) => (
                                <li
                                    key={message}
                                    className="break-words [overflow-wrap:anywhere]"
                                >
                                    • {message}
                                </li>
                            ),
                        )}
                    </ul>
                </div>
            ) : null}
        </article>
    );
}
