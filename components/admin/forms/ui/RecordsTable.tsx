import {
    Plus,
    Trash2,
} from "lucide-react";

import type {
    FormDocumentState,
} from "../hook";

import {
    DynamicRowCell,
} from "./DynamicRowCell";

export function RecordsTable({
    form,
}: {
    form: FormDocumentState;
}) {
    return (
        <div className="no-print overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">

            {/* CABECERA */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 p-5">

                <div>
                    <h2 className="text-xl font-black">
                        {form.type ===
                            "teacher-attendance"
                            ? "Instructor"
                            : "Registros"}
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        Completa la información que aparecerá en el documento.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={
                        form.addRow
                    }
                    className="
                        flex
                        items-center
                        gap-2
                        rounded-xl
                        bg-blue-600
                        px-4
                        py-2.5
                        text-sm
                        font-bold
                        text-white
                        transition
                        hover:bg-blue-700
                    "
                >
                    <Plus
                        size={17}
                    />

                    {
                        form.config
                            .addButtonLabel
                    }
                </button>
            </div>

            {/* TABLA */}
            <div className="overflow-x-auto">
                <table className="w-full min-w-[1000px]">

                    {/* CABECERA TABLA */}
                    <thead className="bg-slate-50">
                        <tr className="text-left text-xs font-bold uppercase text-slate-500">

                            <th className="p-3">
                                #
                            </th>

                            {form.config.rowFields.map(
                                (field) => (
                                    <th
                                        key={
                                            field.key
                                        }
                                        className="p-3"
                                    >
                                        {
                                            field.label
                                        }
                                    </th>
                                ),
                            )}

                            <th className="p-3 text-center">
                                Acción
                            </th>
                        </tr>
                    </thead>

                    {/* CUERPO */}
                    <tbody>
                        {form.formState.rows.map(
                            (
                                row,
                                index,
                            ) => (
                                <tr
                                    key={
                                        row.id
                                    }
                                    className="border-t border-slate-100 align-top"
                                >
                                    {/* NÚMERO */}
                                    <td className="p-3 text-sm font-bold">
                                        {index +
                                            1}
                                    </td>

                                    {/* CAMPOS DINÁMICOS */}
                                    {form.config.rowFields.map(
                                        (
                                            field,
                                        ) => (
                                            <DynamicRowCell
                                                key={
                                                    field.key
                                                }

                                                field={
                                                    field
                                                }

                                                row={
                                                    row
                                                }

                                                /*
                                                 * ESTADO DE LA BÚSQUEDA
                                                 * DE CÉDULA.
                                                 */
                                                identificationStatus={
                                                    form
                                                        .identificationStatus[
                                                    row
                                                        .id
                                                    ] ??
                                                    "idle"
                                                }

                                                /*
                                                 * CAMPOS NORMALES.
                                                 */
                                                onChange={(
                                                    value,
                                                ) =>
                                                    form.updateRow(
                                                        row.id,
                                                        field.key,
                                                        value,
                                                    )
                                                }

                                                /*
                                                 * CAMPO CÉDULA.
                                                 *
                                                 * Se utiliza una función
                                                 * especial para buscar y
                                                 * autocompletar los datos.
                                                 */
                                                onIdentificationChange={(
                                                    value,
                                                ) =>
                                                    form.updateIdentification(
                                                        row.id,
                                                        value,
                                                    )
                                                }

                                                /*
                                                 * BOTÓN DE LUPA.
                                                 */
                                                onSearchIdentification={() =>
                                                    form.searchIdentification(
                                                        row.id,
                                                    )
                                                }

                                                /*
                                                 * ASISTENCIAS.
                                                 */
                                                onToggleAttendance={(
                                                    position,
                                                ) =>
                                                    form.toggleAttendance(
                                                        row.id,
                                                        position,
                                                    )
                                                }
                                            />
                                        ),
                                    )}

                                    {/* ELIMINAR */}
                                    <td className="p-3 text-center">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                form.deleteRow(
                                                    row.id,
                                                )
                                            }
                                            className="
                                                inline-flex
                                                h-9
                                                w-9
                                                items-center
                                                justify-center
                                                rounded-lg
                                                text-red-500
                                                transition
                                                hover:bg-red-50
                                                hover:text-red-600
                                            "
                                            title="Eliminar registro"
                                            aria-label={`Eliminar registro ${index +
                                                1
                                                }`}
                                        >
                                            <Trash2
                                                size={
                                                    17
                                                }
                                            />
                                        </button>
                                    </td>
                                </tr>
                            ),
                        )}
                    </tbody>
                </table>
            </div>

            {/* SIN REGISTROS */}
            {form.formState.rows.length ===
                0 && (
                    <div className="border-t border-slate-200 px-5 py-10 text-center">

                        <p className="text-sm font-semibold text-slate-700">
                            No existen registros.
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                            Presiona &quot;
                            {
                                form.config
                                    .addButtonLabel
                            }
                            &quot; para agregar uno.
                        </p>

                        <button
                            type="button"
                            onClick={
                                form.addRow
                            }
                            className="
                            mt-4
                            inline-flex
                            items-center
                            gap-2
                            rounded-xl
                            bg-blue-600
                            px-4
                            py-2.5
                            text-sm
                            font-bold
                            text-white
                            transition
                            hover:bg-blue-700
                        "
                        >
                            <Plus
                                size={17}
                            />

                            {
                                form.config
                                    .addButtonLabel
                            }
                        </button>
                    </div>
                )}
        </div>
    );
}