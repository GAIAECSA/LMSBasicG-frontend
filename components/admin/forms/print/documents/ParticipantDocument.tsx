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

interface ParticipantDocumentProps {
    state: FormState;

    title: string;

    payment?: boolean;

    signatureTitle: string;

    leftSignature: string;
}

export function ParticipantDocument({
    state,
    title,
    payment = false,
    signatureTitle,
    leftSignature,
}: ParticipantDocumentProps) {

    return (
        <>
            {/* ENCABEZADO */}
            <PrintHeader
                title={title}
            />

            {/* DATOS CURSO */}
            <CourseHeader
                general={
                    state.general
                }
            />

            {/* TABLA */}
            <table className="w-full border-collapse text-[10px]">

                <thead>
                    <tr>
                        <PrintTh>
                            #
                        </PrintTh>

                        <PrintTh>
                            Nombre del Participante
                        </PrintTh>

                        <PrintTh>
                            Profesión
                        </PrintTh>

                        <PrintTh>
                            Lugar de Trabajo/Estudio
                        </PrintTh>

                        <PrintTh>
                            E-mail
                        </PrintTh>

                        {payment && (
                            <PrintTh>
                                Valor/Pago Inscripción
                            </PrintTh>
                        )}

                        <PrintTh>
                            Número de Cédula
                        </PrintTh>

                        <PrintTh>
                            {signatureTitle}
                        </PrintTh>
                    </tr>
                </thead>

                <tbody>

                    {/* REGISTROS */}
                    {state.rows.map(
                        (
                            row,
                            index,
                        ) => (
                            <tr
                                key={row.id}
                                className="h-[48px]"
                            >
                                <PrintTd
                                    center
                                >
                                    {index +
                                        1}
                                </PrintTd>

                                <PrintTd>
                                    {
                                        row.name
                                    }
                                </PrintTd>

                                <PrintTd>
                                    {
                                        row.profession
                                    }
                                </PrintTd>

                                <PrintTd>
                                    {
                                        row.workplace
                                    }
                                </PrintTd>

                                <PrintTd>
                                    {
                                        row.email
                                    }
                                </PrintTd>

                                {payment && (
                                    <PrintTd
                                        center
                                    >
                                        {
                                            row.payment
                                        }
                                    </PrintTd>
                                )}

                                <PrintTd
                                    center
                                >
                                    {
                                        row.identification
                                    }
                                </PrintTd>

                                {/* VACÍO PARA FIRMA MANUAL */}
                                <PrintTd>
                                    &nbsp;
                                </PrintTd>
                            </tr>
                        ),
                    )}
                </tbody>
            </table>

            {/* FIRMAS */}
            <BottomSignatures
                left={
                    leftSignature
                }
            />
        </>
    );
}