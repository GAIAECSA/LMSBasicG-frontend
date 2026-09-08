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

const SIGNATURE_COLUMNS = 8;

export function StudentAttendanceDocument({
    state,
}: {
    state: FormState;
}) {

    return (
        <>
            <PrintHeader
                title="REGISTRO DE ASISTENCIAS DE PARTICIPANTES"
            />

            <CourseHeader
                general={
                    state.general
                }
            />

            <table className="w-full border-collapse text-[8px]">

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
                                SIGNATURE_COLUMNS
                            }
                        >
                            FIRMAS DIARIAS
                            {" "}
                            (
                            {
                                state
                                    .general
                                    .dailyHours
                            }
                            {" "}
                            HORAS DE TRABAJO DIARIAS)
                        </PrintTh>
                    </tr>

                    <tr>
                        {Array.from({
                            length:
                                SIGNATURE_COLUMNS,
                        }).map(
                            (
                                _,
                                index,
                            ) => (
                                <PrintTh
                                    key={
                                        index
                                    }
                                    className="w-[45px]"
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
                            <StudentAttendanceRow
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

function StudentAttendanceRow({
    number,
    row,
}: {
    number: number;
    row?: FormRow;
}) {
    return (
        <tr className="h-[48px]">

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

            {/* ESPACIOS VACÍOS PARA FIRMAS */}
            {Array.from({
                length:
                    SIGNATURE_COLUMNS,
            }).map(
                (_, index) => (
                    <PrintTd
                        key={
                            index
                        }
                        center
                        className="min-w-[40px]"
                    >
                        &nbsp;
                    </PrintTd>
                ),
            )}
        </tr>
    );
}