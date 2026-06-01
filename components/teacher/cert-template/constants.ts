import type {
    CertificateFieldType,
    CertificateQrConfig,
    CertificateTextAlign,
} from "@/services/certificates.service";
import type { CertificateTextCase } from "./types";

export const fieldTypeOptions: {
    value: CertificateFieldType;
    label: string;
}[] = [
        { value: "student_name", label: "Nombre del estudiante" },
        { value: "course_name", label: "Nombre del curso" },
        { value: "completion_date", label: "Fecha de finalización" },
        { value: "instructor_name", label: "Nombre del instructor" },
        { value: "certificate_code", label: "Código del certificado" },
        { value: "final_grade", label: "Promedio final" },
        { value: "signature_instructor", label: "Firma del instructor" },
        { value: "signature_director", label: "Firma del director" },
        { value: "custom", label: "Texto personalizado" },
    ];

export const alignOptions: {
    value: CertificateTextAlign;
    label: string;
}[] = [
        { value: "left", label: "Izquierda" },
        { value: "center", label: "Centro" },
        { value: "right", label: "Derecha" },
    ];

export const fontFamilyOptions = [
    { value: "helvetica", label: "Helvetica" },
    { value: "Arial", label: "Arial" },
    { value: "Roboto", label: "Roboto" },
    { value: "Georgia", label: "Georgia" },
    { value: "Times New Roman", label: "Times New Roman" },
    { value: "Courier New", label: "Courier New" },
    { value: "Verdana", label: "Verdana" },
    { value: "Montserrat", label: "Montserrat" },
];

export const textCaseOptions: {
    value: CertificateTextCase;
    label: string;
}[] = [
        { value: "none", label: "Como está escrito" },
        { value: "uppercase", label: "MAYÚSCULAS" },
        { value: "lowercase", label: "minúsculas" },
        { value: "sentence", label: "Tipo oración" },
    ];

export const DEFAULT_QR_CONFIG: CertificateQrConfig = {
    enabled: true,
    x: 86,
    y: 84,
    size: 10,
};

export const QR_CELLS: [number, number][] = [
    [0, 0],
    [1, 0],
    [2, 0],
    [4, 0],
    [5, 0],
    [6, 0],
    [0, 1],
    [2, 1],
    [4, 1],
    [6, 1],
    [0, 2],
    [1, 2],
    [2, 2],
    [3, 2],
    [4, 2],
    [5, 2],
    [6, 2],
    [2, 3],
    [4, 3],
    [0, 4],
    [1, 4],
    [2, 4],
    [4, 4],
    [6, 4],
    [0, 5],
    [2, 5],
    [3, 5],
    [5, 5],
    [0, 6],
    [1, 6],
    [2, 6],
    [4, 6],
    [5, 6],
    [6, 6],
];