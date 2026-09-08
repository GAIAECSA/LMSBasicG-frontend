import type {
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

export function TeacherAttendanceDocument({
    state,
}: {
    state: FormState;
}) {

    return (
        <>
            <PrintHeader
                title="REGISTRO DE ASISTENCIA INSTRUCTOR"
            />

            <CourseHeader
                general={
                    state.general
                }
                teacherLabel="REPRESENTANTE LEGAL:"
                teacher={
                    state.general
                        .legalRepresentative
                }
                teacherCi={
                    state.general
                        .legalRepresentativeCi
                }
            />

            <table className="w-full border-collapse text-[9px]">

                <thead>
                    <tr>
                        <PrintTh
                            rowSpan={2}
                        >
                            INSTRUCTOR
                        </PrintTh>

                        <PrintTh
                            rowSpan={2}
                        >
                            Área académica /
                            <br />
                            Especialidad
                            <br />
                            (Anexo de Calificación)
                        </PrintTh>

                        <PrintTh
                            rowSpan={2}
                        >
                            Número de Cédula
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
                        (row) => (
                            <tr
                                key={
                                    row.id
                                }
                                className="h-[65px]"
                            >
                                <PrintTd>
                                    {
                                        row.name
                                    }
                                </PrintTd>

                                <PrintTd
                                    center
                                >
                                    {
                                        row.academicArea
                                    }
                                </PrintTd>

                                <PrintTd
                                    center
                                >
                                    {
                                        row.identification
                                    }
                                </PrintTd>

                                {Array.from({
                                    length:
                                        SIGNATURE_COLUMNS,
                                }).map(
                                    (
                                        _,
                                        index,
                                    ) => (
                                        <PrintTd
                                            key={
                                                index
                                            }
                                            className="min-w-[40px]"
                                        >
                                            &nbsp;
                                        </PrintTd>
                                    ),
                                )}
                            </tr>
                        ),
                    )}

                </tbody>
            </table>

            <BottomSignatures
                left="REPRESENTANTE LEGAL"
            />
        </>
    );
}