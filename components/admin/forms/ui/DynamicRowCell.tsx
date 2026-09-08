import type {
    FormRow,
    RowFieldConfig,
} from "../types";

import {
    Check,
    Search,
    X,
} from "lucide-react";

type IdentificationStatus =
    | "idle"
    | "found"
    | "not-found";

interface DynamicRowCellProps {
    field: RowFieldConfig;

    row: FormRow;

    identificationStatus?: IdentificationStatus;

    onChange: (
        value:
            | string
            | boolean[],
    ) => void;

    onIdentificationChange: (
        value: string,
    ) => void;

    onSearchIdentification: () => void;

    onToggleAttendance: (
        index: number,
    ) => void;
}

export function DynamicRowCell({
    field,
    row,
    identificationStatus = "idle",
    onChange,
    onIdentificationChange,
    onSearchIdentification,
    onToggleAttendance,
}: DynamicRowCellProps) {
    /*
     * =====================================================
     * CAMPO ESPECIAL: CONTEO DE ASISTENCIAS
     * =====================================================
     */
    if (
        field.type ===
        "attendance"
    ) {
        const count =
            row.attendanceMarks.filter(
                Boolean,
            ).length;

        const total =
            row.attendanceMarks.length;

        const percentage =
            total > 0
                ? Math.round(
                    (count /
                        total) *
                    100,
                )
                : 0;

        return (
            <td className="p-2">
                <div className="min-w-[300px]">

                    <div className="flex flex-wrap gap-1">
                        {row.attendanceMarks.map(
                            (
                                checked,
                                index,
                            ) => (
                                <button
                                    type="button"
                                    key={
                                        index
                                    }
                                    onClick={() =>
                                        onToggleAttendance(
                                            index,
                                        )
                                    }
                                    className={`
                                        flex
                                        h-8
                                        w-8
                                        items-center
                                        justify-center
                                        rounded-md
                                        border
                                        text-xs
                                        font-bold
                                        transition

                                        ${checked
                                            ? "border-blue-600 bg-blue-600 text-white"
                                            : "border-slate-300 bg-white text-slate-600 hover:border-blue-400 hover:bg-blue-50"
                                        }
                                    `}
                                    title={`Asistencia ${index +
                                        1
                                        }`}
                                >
                                    {index +
                                        1}
                                </button>
                            ),
                        )}
                    </div>

                    <div className="mt-1.5 flex items-center gap-2 text-xs text-slate-500">
                        <span>
                            {count}/
                            {total}
                        </span>

                        <span>
                            ·
                        </span>

                        <span>
                            {
                                percentage
                            }
                            %
                        </span>
                    </div>

                </div>
            </td>
        );
    }

    /*
     * =====================================================
     * CAMPO ESPECIAL: CÉDULA CON BÚSQUEDA
     * =====================================================
     */
    if (
        field.key ===
        "identification"
    ) {
        return (
            <td className="p-2">
                <div className="min-w-[210px]">

                    <div className="relative">
                        <input
                            type="text"
                            inputMode="numeric"
                            autoComplete="off"
                            maxLength={
                                10
                            }
                            value={
                                row.identification
                            }
                            onChange={(
                                event,
                            ) =>
                                onIdentificationChange(
                                    event
                                        .target
                                        .value,
                                )
                            }
                            onKeyDown={(
                                event,
                            ) => {
                                if (
                                    event.key ===
                                    "Enter"
                                ) {
                                    event.preventDefault();

                                    onSearchIdentification();
                                }
                            }}
                            placeholder="Ingrese cédula"
                            className={`
                                w-full
                                rounded-lg
                                border
                                py-2
                                pl-3
                                pr-10
                                text-sm
                                outline-none
                                transition

                                ${identificationStatus ===
                                    "found"
                                    ? "border-emerald-400 bg-emerald-50"
                                    : identificationStatus ===
                                        "not-found"
                                        ? "border-red-300 bg-red-50"
                                        : "border-slate-200 bg-white"
                                }

                                focus:border-blue-500
                                focus:ring-2
                                focus:ring-blue-100
                            `}
                        />

                        <button
                            type="button"
                            onClick={
                                onSearchIdentification
                            }
                            className="
                                absolute
                                right-1
                                top-1/2
                                flex
                                h-8
                                w-8
                                -translate-y-1/2
                                items-center
                                justify-center
                                rounded-md
                                text-slate-500
                                transition
                                hover:bg-slate-100
                                hover:text-blue-600
                            "
                            title="Buscar por cédula"
                            aria-label="Buscar por cédula"
                        >
                            <Search
                                size={
                                    16
                                }
                            />
                        </button>
                    </div>

                    {/* PERSONA ENCONTRADA */}
                    {identificationStatus ===
                        "found" && (
                            <div className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                                <Check
                                    size={
                                        13
                                    }
                                />

                                Persona encontrada
                            </div>
                        )}

                    {/* PERSONA NO ENCONTRADA */}
                    {identificationStatus ===
                        "not-found" && (
                            <div className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-red-500">
                                <X
                                    size={
                                        13
                                    }
                                />

                                No encontrada
                            </div>
                        )}

                </div>
            </td>
        );
    }

    /*
     * =====================================================
     * VALOR NORMAL DEL CAMPO
     * =====================================================
     */
    const rawValue =
        row[field.key];

    const value =
        typeof rawValue ===
            "string"
            ? rawValue
            : "";

    /*
     * =====================================================
     * SELECT
     * =====================================================
     */
    if (
        field.type ===
        "select"
    ) {
        return (
            <td className="p-2">
                <select
                    value={
                        value
                    }
                    onChange={(
                        event,
                    ) =>
                        onChange(
                            event
                                .target
                                .value,
                        )
                    }
                    className="
                        min-w-[150px]
                        rounded-lg
                        border
                        border-slate-200
                        bg-white
                        px-2.5
                        py-2
                        text-sm
                        outline-none
                        transition
                        focus:border-blue-500
                        focus:ring-2
                        focus:ring-blue-100
                    "
                >
                    {field.options?.map(
                        (
                            option,
                        ) => (
                            <option
                                key={
                                    option
                                }
                                value={
                                    option
                                }
                            >
                                {option ||
                                    "Seleccionar"}
                            </option>
                        ),
                    )}
                </select>
            </td>
        );
    }

    /*
     * =====================================================
     * INPUT NORMAL
     * =====================================================
     */
    return (
        <td className="p-2">
            <input
                type={
                    field.type ??
                    "text"
                }
                min={
                    field.min
                }
                max={
                    field.max
                }
                step={
                    field.step
                }
                value={
                    value
                }
                onChange={(
                    event,
                ) =>
                    onChange(
                        event
                            .target
                            .value,
                    )
                }
                className="
                    min-w-[145px]
                    rounded-lg
                    border
                    border-slate-200
                    bg-white
                    px-2.5
                    py-2
                    text-sm
                    outline-none
                    transition
                    focus:border-blue-500
                    focus:ring-2
                    focus:ring-blue-100
                "
            />
        </td>
    );
}