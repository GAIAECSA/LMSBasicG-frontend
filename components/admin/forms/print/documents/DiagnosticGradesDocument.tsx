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

export function DiagnosticGradesDocument({
    state,
}: {
    state: FormState;
}) {

    const average =
        calculateAverage(
            state.rows,
            "grade",
        );

    return (
        <>
            <PrintHeader
                title="REGISTRO DE CALIFICACIONES DE EVALUACIONES DIAGNÓSTICAS A ESTUDIANTES"
            />

            <table className="w-full border-collapse text-[10px]">

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
                            FECHA DE
                            <br />
                            EVALUACIÓN
                        </PrintTh>

                        <PrintTh>
                            NOTA
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
                                className="h-[26px]"
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
                                        row.grade
                                    }
                                </PrintTd>
                            </tr>
                        ),
                    )}

                    {/* PROMEDIO */}
                    <tr>
                        <td
                            colSpan={4}
                            className="border border-black px-3 py-3 text-center font-black"
                        >
                            PROMEDIO GENERAL DEL CURSO
                        </td>

                        <td className="border border-black bg-emerald-500 px-3 py-3 text-center font-black">
                            {average}
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