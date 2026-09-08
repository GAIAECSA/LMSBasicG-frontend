import type {
    FormState,
} from "../../types";

import {
    calculateAverage,
    formatDate,
} from "../../utils";

import {
    BottomSignatures,
} from "../BottomSignatures";

import {
    PrintHeader,
} from "../PrintHeader";

import {
    PrintTd,
    PrintTh,
} from "../PrintCells";

export function FinalGradesDocument({
    state,
}: {
    state: FormState;
}) {

    const theoryAverage =
        calculateAverage(
            state.rows,
            "theoryGrade",
        );

    const practicalAverage =
        calculateAverage(
            state.rows,
            "practicalGrade",
        );

    return (
        <>
            <PrintHeader
                title="REGISTRO DE CALIFICACIONES DE EVALUACIONES FINALES A ESTUDIANTES"
            />

            <table className="w-full border-collapse text-[9px]">

                <thead>
                    <tr>
                        <PrintTh>
                            NOMBRE
                        </PrintTh>

                        <PrintTh>
                            NÚMERO DE
                            <br />
                            CÉDULA
                        </PrintTh>

                        <PrintTh>
                            CÓDIGO DE
                            <br />
                            CURSO
                        </PrintTh>

                        <PrintTh>
                            FECHA
                            <br />
                            EVALUACIÓN
                        </PrintTh>

                        <PrintTh>
                            NOTA TEÓRICA
                            <br />
                            (SOBRE 10)
                        </PrintTh>

                        <PrintTh>
                            TEÓRICA
                        </PrintTh>

                        <PrintTh>
                            NOTA PRÁCTICA
                            <br />
                            (SOBRE 10)
                        </PrintTh>

                        <PrintTh>
                            PRÁCTICA
                        </PrintTh>
                    </tr>
                </thead>

                <tbody>

                    {state.rows.map(
                        (row) => (
                            <tr
                                key={
                                    row.id
                                }
                                className="h-[27px]"
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
                                        row.identification
                                    }
                                </PrintTd>

                                <PrintTd
                                    center
                                >
                                    {
                                        row.courseCode
                                    }
                                </PrintTd>

                                <PrintTd
                                    center
                                >
                                    {formatDate(
                                        row.evaluationDate,
                                    )}
                                </PrintTd>

                                <PrintTd
                                    center
                                >
                                    {
                                        row.theoryGrade
                                    }
                                </PrintTd>

                                <ResultCell
                                    value={
                                        row.theoryResult
                                    }
                                />

                                <PrintTd
                                    center
                                >
                                    {
                                        row.practicalGrade
                                    }
                                </PrintTd>

                                <ResultCell
                                    value={
                                        row.practicalResult
                                    }
                                />
                            </tr>
                        ),
                    )}

                    {/* PROMEDIOS */}
                    <tr>
                        <td
                            colSpan={4}
                            className="border border-black px-3 py-3 text-center font-black"
                        >
                            PROMEDIO GENERAL
                        </td>

                        <td
                            colSpan={2}
                            className="border border-black bg-emerald-500 px-3 py-3 text-center font-black"
                        >
                            {theoryAverage}
                        </td>

                        <td
                            colSpan={2}
                            className="border border-black bg-emerald-500 px-3 py-3 text-center font-black"
                        >
                            {practicalAverage}
                        </td>
                    </tr>
                </tbody>
            </table>

            <BottomSignatures
                left="INSTRUCTOR"
            />
        </>
    );
}

function ResultCell({
    value,
}: {
    value: string;
}) {
    return (
        <td
            className={`
                border
                border-black
                px-2
                py-1
                text-center
                font-bold
                ${value === "SI"
                    ? "bg-emerald-500"
                    : value ===
                        "NO"
                        ? "bg-red-500"
                        : ""
                }
            `}
        >
            {value}
        </td>
    );
}