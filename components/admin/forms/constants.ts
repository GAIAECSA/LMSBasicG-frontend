import type {
    FormConfig,
    FormDocumentType,
    GeneralFieldConfig,
    RowFieldConfig,
} from "./types";

/* =========================================================
 * CAMPOS GENERALES DE CURSO
 * ========================================================= */

export const COURSE_GENERAL_FIELDS: GeneralFieldConfig[] = [
    {
        key: "course",
        label: "Curso",
    },
    {
        key: "code",
        label: "Código",
    },
    {
        key: "instructor",
        label: "Instructor",
    },
    {
        key: "instructorCi",
        label: "Cédula instructor",
    },
    {
        key: "startDate",
        label: "Fecha inicio",
        type: "date",
    },
    {
        key: "endDate",
        label: "Fecha final",
        type: "date",
    },
];

/* =========================================================
 * CAMPOS GENERALES DE PARTICIPANTES
 *
 * IMPORTANTE:
 * La cédula está primero para que el flujo sea:
 *
 * 1. Buscar cédula
 * 2. Encontrar persona
 * 3. Autocompletar nombre/profesión/etc.
 * ========================================================= */

export const PARTICIPANT_FIELDS: RowFieldConfig[] = [
    {
        key: "identification",
        label: "Buscar cédula",
    },
    {
        key: "name",
        label: "Nombre",
    },
    {
        key: "profession",
        label: "Profesión",
    },
    {
        key: "workplace",
        label: "Trabajo / Estudio",
    },
    {
        key: "email",
        label: "E-mail",
        type: "email",
    },
];

/* =========================================================
 * CONFIGURACIÓN DE LOS 7 FORMULARIOS
 * ========================================================= */

export const FORM_CONFIG: Record<
    FormDocumentType,
    FormConfig
> = {
    /* =====================================================
     * 1. REGISTRO DE INSCRIPCIÓN CON PAGOS
     * ===================================================== */

    "registration-payments": {
        title:
            "REGISTRO DE INSCRIPCIÓN CON PAGOS",

        description:
            "Completa la información del curso y participantes.",

        storageKey:
            "gaia-registration-payments",

        generalFields:
            COURSE_GENERAL_FIELDS,

        rowFields: [
            ...PARTICIPANT_FIELDS,

            {
                key: "payment",
                label: "Pago inscripción",
                type: "number",
                min: 0,
                step: 0.01,
            },
        ],

        addButtonLabel:
            "Agregar participante",
    },

    /* =====================================================
     * 2. ACTA DE ENTREGA DE CERTIFICADOS
     * ===================================================== */

    "certificate-delivery": {
        title:
            "ACTA DE ENTREGA DE CERTIFICADOS",

        description:
            "Completa la información para generar el acta.",

        storageKey:
            "gaia-certificate-delivery",

        generalFields:
            COURSE_GENERAL_FIELDS,

        rowFields:
            PARTICIPANT_FIELDS,

        addButtonLabel:
            "Agregar participante",
    },

    /* =====================================================
     * 3. ASISTENCIA DE ESTUDIANTES
     * ===================================================== */

    "student-attendance": {
        title:
            "REGISTRO DE ASISTENCIAS DE PARTICIPANTES",

        description:
            "Registra los estudiantes y genera la hoja de asistencia.",

        storageKey:
            "gaia-student-attendance",

        generalFields: [
            ...COURSE_GENERAL_FIELDS,

            {
                key: "dailyHours",
                label:
                    "Horas de trabajo diarias",
                type: "number",
            },
        ],

        rowFields:
            PARTICIPANT_FIELDS,

        addButtonLabel:
            "Agregar participante",
    },

    /* =====================================================
     * 4. ASISTENCIA DEL INSTRUCTOR
     * ===================================================== */

    "teacher-attendance": {
        title:
            "REGISTRO DE ASISTENCIA INSTRUCTOR",

        description:
            "Registra la información correspondiente al instructor.",

        storageKey:
            "gaia-teacher-attendance",

        generalFields: [
            {
                key: "course",
                label: "Curso",
            },
            {
                key: "code",
                label: "Código",
            },
            {
                key: "legalRepresentative",
                label:
                    "Representante legal",
            },
            {
                key: "legalRepresentativeCi",
                label:
                    "Cédula representante legal",
            },
            {
                key: "startDate",
                label:
                    "Fecha inicial",
                type: "date",
            },
            {
                key: "endDate",
                label:
                    "Fecha final",
                type: "date",
            },
            {
                key: "dailyHours",
                label:
                    "Horas de trabajo diarias",
                type: "number",
            },
        ],

        rowFields: [
            {
                key: "identification",
                label: "Buscar cédula",
            },
            {
                key: "name",
                label: "Instructor",
            },
            {
                key: "academicArea",
                label:
                    "Área académica / Especialidad",
            },
        ],

        addButtonLabel:
            "Agregar instructor",
    },

    /* =====================================================
     * 5. NOTAS DIAGNÓSTICAS
     * ===================================================== */

    "diagnostic-grades": {
        title:
            "REGISTRO DE CALIFICACIONES DE EVALUACIONES DIAGNÓSTICAS A ESTUDIANTES",

        description:
            "Registra las calificaciones diagnósticas.",

        storageKey:
            "gaia-diagnostic-grades",

        generalFields: [],

        rowFields: [
            {
                key: "identification",
                label: "Buscar cédula",
            },
            {
                key: "name",
                label: "Nombre",
            },
            {
                key: "courseCode",
                label: "Código de curso",
            },
            {
                key: "evaluationDate",
                label:
                    "Fecha evaluación",
                type: "date",
            },
            {
                key: "grade",
                label: "Nota",
                type: "number",
                min: 0,
                max: 10,
                step: 0.01,
            },
        ],

        addButtonLabel:
            "Agregar estudiante",
    },

    /* =====================================================
     * 6. NOTAS FINALES
     * ===================================================== */

    "final-grades": {
        title:
            "REGISTRO DE CALIFICACIONES DE EVALUACIONES FINALES A ESTUDIANTES",

        description:
            "Registra las evaluaciones teóricas y prácticas.",

        storageKey:
            "gaia-final-grades",

        generalFields: [],

        rowFields: [
            {
                key: "identification",
                label: "Buscar cédula",
            },
            {
                key: "name",
                label: "Nombre",
            },
            {
                key: "courseCode",
                label:
                    "Código de curso",
            },
            {
                key: "evaluationDate",
                label:
                    "Fecha evaluación",
                type: "date",
            },
            {
                key: "theoryGrade",
                label:
                    "Nota teórica",
                type: "number",
                min: 0,
                max: 10,
                step: 0.01,
            },
            {
                key: "theoryResult",
                label: "Teórica",
                type: "select",
                options: [
                    "",
                    "SI",
                    "NO",
                ],
            },
            {
                key: "practicalGrade",
                label:
                    "Nota práctica",
                type: "number",
                min: 0,
                max: 10,
                step: 0.01,
            },
            {
                key: "practicalResult",
                label: "Práctica",
                type: "select",
                options: [
                    "",
                    "SI",
                    "NO",
                ],
            },
        ],

        addButtonLabel:
            "Agregar estudiante",
    },

    /* =====================================================
     * 7. PORCENTAJE DE ASISTENCIA
     * ===================================================== */

    "attendance-percentage": {
        title:
            "REGISTRO DE ASISTENCIA",

        description:
            "Registra el porcentaje de asistencia de los estudiantes.",

        storageKey:
            "gaia-attendance-percentage",

        generalFields: [
            {
                key: "course",
                label: "Curso",
            },
            {
                key: "code",
                label: "Código",
            },
            {
                key: "instructor",
                label: "Instructor",
            },
            {
                key: "instructorCi",
                label:
                    "Cédula instructor",
            },
            {
                key: "date",
                label: "Fecha",
                type: "date",
            },
        ],

        rowFields: [
            ...PARTICIPANT_FIELDS,

            {
                key: "attendanceMarks",
                label:
                    "Conteo de firmas",
                type: "attendance",
            },

            {
                key: "attendanceStatus",
                label:
                    "Ponderación",
                type: "select",
                options: [
                    "",
                    "Asiste-Aprueba",
                    "No asiste-No aprueba",
                ],
            },
        ],

        addButtonLabel:
            "Agregar estudiante",
    },
};