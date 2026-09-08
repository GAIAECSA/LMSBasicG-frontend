import type {
    FormDocumentType,
    FormRow,
    FormState,
} from "./types";

export function createEmptyRow(
    id: string,
): FormRow {
    return {
        id,

        name: "",
        profession: "",
        workplace: "",
        email: "",
        identification: "",

        payment: "",

        academicArea: "",

        courseCode: "",
        evaluationDate: "",

        grade: "",

        theoryGrade: "",
        theoryResult: "",

        practicalGrade: "",
        practicalResult: "",

        attendanceMarks:
            Array(8).fill(false),

        attendanceStatus: "",
    };
}

export function createInitialState(
    type: FormDocumentType,
): FormState {
    const general = {
        course:
            "Curso de Excel Avanzado",

        code:
            "GAIA-EX-001",

        instructor:
            "Ing. Pedro Ramírez",

        instructorCi:
            "1800000000",

        legalRepresentative:
            "Lcdo. Juan Andrade",

        legalRepresentativeCi:
            "1800000004",

        startDate:
            "2026-08-10",

        endDate:
            "2026-08-14",

        date:
            "2026-08-14",

        dailyHours: "8",
    };

    if (
        type ===
        "teacher-attendance"
    ) {
        return {
            general,
            rows: [
                {
                    ...createEmptyRow(
                        "1",
                    ),

                    name:
                        "Ing. Pedro Ramírez",

                    academicArea:
                        "Tecnologías de la Información",

                    identification:
                        "1800000000",
                },
            ],
        };
    }

    if (
        type ===
        "diagnostic-grades"
    ) {
        return {
            general,
            rows: [
                {
                    ...createEmptyRow(
                        "1",
                    ),
                    name:
                        "Juan Pérez",
                    identification:
                        "1800000001",
                    courseCode:
                        "GAIA-EX-001",
                    evaluationDate:
                        "2026-08-10",
                    grade: "8.5",
                },
            ],
        };
    }

    if (
        type ===
        "final-grades"
    ) {
        return {
            general,
            rows: [
                {
                    ...createEmptyRow(
                        "1",
                    ),

                    name:
                        "Juan Pérez",

                    identification:
                        "1800000001",

                    courseCode:
                        "GAIA-EX-001",

                    evaluationDate:
                        "2026-08-14",

                    theoryGrade:
                        "9",

                    theoryResult:
                        "SI",

                    practicalGrade:
                        "10",

                    practicalResult:
                        "SI",
                },
            ],
        };
    }

    return {
        general,

        rows: [
            {
                ...createEmptyRow(
                    "1",
                ),

                name:
                    "Juan Pérez",

                profession:
                    "Ingeniero",

                workplace:
                    "Empresa ABC",

                email:
                    "juan@email.com",

                identification:
                    "1800000001",

                payment:
                    "80.00",
            },

            {
                ...createEmptyRow(
                    "2",
                ),

                name:
                    "María López",

                profession:
                    "Contadora",

                workplace:
                    "Empresa XYZ",

                email:
                    "maria@email.com",

                identification:
                    "1800000002",

                payment:
                    "80.00",
            },
        ],
    };
}

export function formatDate(
    value: string,
) {
    if (!value) return "";

    const [
        year,
        month,
        day,
    ] = value.split("-");

    if (
        !year ||
        !month ||
        !day
    ) {
        return value;
    }

    return `${day}/${month}/${year}`;
}

export function calculateAverage(
    rows: FormRow[],
    field:
        | "grade"
        | "theoryGrade"
        | "practicalGrade",
) {
    const values =
        rows
            .map((row) =>
                Number(
                    row[field],
                ),
            )
            .filter(
                (value) =>
                    Number.isFinite(
                        value,
                    ),
            );

    if (
        values.length === 0
    ) {
        return "";
    }

    const total =
        values.reduce(
            (
                accumulator,
                value,
            ) =>
                accumulator +
                value,
            0,
        );

    return (
        total /
        values.length
    ).toFixed(2);
}