import type {
    FormRow,
    FormState,
} from "../../types";

import {
    BottomSignatures,
} from "../BottomSignatures";

import {
    CourseHeader,
} from "../CourseHeader";

import {
    PrintHeader,
} from "../PrintHeader";

import {
    PrintTd,
    PrintTh,
} from "../PrintCells";

const ATTENDANCE_COLUMNS = 8;

export function AttendancePercentageDocument({
    state,
}: {
    state: FormState;
}) {

    return (
        <>
            <PrintHeader
                title="REGISTRO DE ASISTENCIA"
            />

            <CourseHeader
                general={
                    state.general
                }
                singleDate
            />

            <table className="w-full border-collapse text-[7px]">

                <thead>
                    <tr>
                        <PrintTh
                            rowSpan={2}
                        >
                            #
                        </PrintTh>

                        <PrintTh
                            rowSpan={2}
                        >
                            Nombre del Participante
                        </PrintTh>

                        <PrintTh
                            rowSpan={2}
                        >
                            Profesión
                        </PrintTh>

                        <PrintTh
                            rowSpan={2}
                        >
                            Lugar de Trabajo/
                            <br />
                            Estudio
                        </PrintTh>

                        <PrintTh
                            rowSpan={2}
                        >
                            E-mail
                        </PrintTh>

                        <PrintTh
                            rowSpan={2}
                        >
                            Número de
                            <br />
                            Cédula
                        </PrintTh>

                        <PrintTh
                            colSpan={
                                ATTENDANCE_COLUMNS
                            }
                        >
                            CONTEO DE FIRMAS
                        </PrintTh>

                        <PrintTh
                            rowSpan={2}
                        >
                            VALORACIÓN
                        </PrintTh>

                        <PrintTh
                            rowSpan={2}
                        >
                            PORCENTAJE
                        </PrintTh>

                        <PrintTh
                            rowSpan={2}
                        >
                            PONDERACIÓN
                        </PrintTh>
                    </tr>

                    <tr>
                        {Array.from({
                            length:
                                ATTENDANCE_COLUMNS,
                        }).map(
                            (
                                _,
                                index,
                            ) => (
                                <PrintTh
                                    key={
                                        index
                                    }
                                    className="w-[32px]"
                                >
                                    {index +
                                        1}
                                </PrintTh>
                            ),
                        )}
                    </tr>
                </thead>

                <tbody>

                    {state.rows.map(
                        (
                            row,
                            index,
                        ) => (
                            <AttendancePercentageRow
                                key={
                                    row.id
                                }
                                number={
                                    index +
                                    1
                                }
                                row={
                                    row
                                }
                            />
                        ),
                    )}

                </tbody>
            </table>

            <BottomSignatures
                left="INSTRUCTOR"
            />
        </>
    );
}

function AttendancePercentageRow({
    number,
    row,
}: {
    number: number;
    row?: FormRow;
}) {
    const marks =
        row?.attendanceMarks ??
        Array(
            ATTENDANCE_COLUMNS,
        ).fill(false);

    const count =
        marks.filter(Boolean)
            .length;

    const percentage =
        row
            ? Math.round(
                (count /
                    ATTENDANCE_COLUMNS) *
                100,
            )
            : 0;

    /*
     * Si el usuario ya seleccionó una ponderación,
     * usamos esa.
     *
     * Si no seleccionó nada, calculamos una visualmente.
     */
    const automaticStatus =
        percentage === 100
            ? "Asiste-Aprueba"
            : "No asiste-No aprueba";

    const status = row
        ? row.attendanceStatus ||
        automaticStatus
        : "";

    return (
        <tr className="h-[22px]">

            <PrintTd center>
                {number}
            </PrintTd>

            <PrintTd>
                {row?.name ?? ""}
            </PrintTd>

            <PrintTd>
                {row?.profession ??
                    ""}
            </PrintTd>

            <PrintTd>
                {row?.workplace ??
                    ""}
            </PrintTd>

            <PrintTd>
                {row?.email ?? ""}
            </PrintTd>

            <PrintTd center>
                {row?.identification ??
                    ""}
            </PrintTd>

            {/* 8 FIRMAS */}
            {marks.map(
                (
                    checked,
                    index,
                ) => (
                    <PrintTd
                        key={
                            index
                        }
                        center
                        className="px-1"
                    >
                        {checked
                            ? "X"
                            : ""}
                    </PrintTd>
                ),
            )}

            {/* VALORACIÓN */}
            <PrintTd center>
                {row ? count : ""}
            </PrintTd>

            {/* PORCENTAJE */}
            <PrintTd center>
                {row
                    ? `${percentage}%`
                    : ""}
            </PrintTd>

            {/* PONDERACIÓN */}
            <td
                className={`
                    border
                    border-black
                    px-1
                    py-1
                    text-center
                    text-[7px]
                    font-bold

                    ${status ===
                        "Asiste-Aprueba"
                        ? "bg-emerald-500"
                        : status
                            ? "bg-red-500"
                            : ""
                    }
                `}
            >
                {status}
            </td>
        </tr>
    );
}