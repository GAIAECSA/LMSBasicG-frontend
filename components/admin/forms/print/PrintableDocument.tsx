import type {
    FormDocumentType,
    FormState,
} from "../types";

import {
    AttendancePercentageDocument,
} from "./documents/AttendancePercentageDocument";

import {
    DiagnosticGradesDocument,
} from "./documents/DiagnosticGradesDocument";

import {
    FinalGradesDocument,
} from "./documents/FinalGradesDocument";

import {
    ParticipantDocument,
} from "./documents/ParticipantDocument";

import {
    StudentAttendanceDocument,
} from "./documents/StudentAttendanceDocument";

import {
    TeacherAttendanceDocument,
} from "./documents/TeacherAttendanceDocument";

interface PrintableDocumentProps {
    type: FormDocumentType;
    state: FormState;
}

export function PrintableDocument({
    type,
    state,
}: PrintableDocumentProps) {
    return (
        <div
            id="gaia-print-document"
            className="
                overflow-hidden
                rounded-xl
                border-2
                border-black
                bg-white
                text-black
                shadow-sm
            "
        >
            {/* REGISTRO DE INSCRIPCIÓN */}
            {type ===
                "registration-payments" && (
                    <ParticipantDocument
                        state={state}
                        title="REGISTRO DE INSCRIPCIÓN CON PAGOS"
                        payment
                        signatureTitle="FIRMAS DE INSCRIPCIÓN"
                        leftSignature="REPRESENTANTE LEGAL"
                    />
                )}

            {/* ENTREGA DE CERTIFICADOS */}
            {type ===
                "certificate-delivery" && (
                    <ParticipantDocument
                        state={state}
                        title="ACTA DE ENTREGA DE CERTIFICADOS"
                        signatureTitle="FIRMAS DE RECEPCIÓN"
                        leftSignature="INSTRUCTOR"
                    />
                )}

            {/* ASISTENCIA ESTUDIANTES */}
            {type ===
                "student-attendance" && (
                    <StudentAttendanceDocument
                        state={state}
                    />
                )}

            {/* ASISTENCIA INSTRUCTOR */}
            {type ===
                "teacher-attendance" && (
                    <TeacherAttendanceDocument
                        state={state}
                    />
                )}

            {/* NOTAS DIAGNÓSTICAS */}
            {type ===
                "diagnostic-grades" && (
                    <DiagnosticGradesDocument
                        state={state}
                    />
                )}

            {/* NOTAS FINALES */}
            {type ===
                "final-grades" && (
                    <FinalGradesDocument
                        state={state}
                    />
                )}

            {/* PORCENTAJE ASISTENCIA */}
            {type ===
                "attendance-percentage" && (
                    <AttendancePercentageDocument
                        state={state}
                    />
                )}
        </div>
    );
}

export default PrintableDocument;