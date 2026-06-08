import type {
    Course,
} from "@/services/courses.service";

import type {
    MassiveEnrollmentResponse,
    MassiveEnrollmentUserPayload,
} from "@/services/enrollments.service";

import type {
    BulkEnrollmentRow,
} from "./types";

import * as XLSX from "xlsx";

import {
    EXCEL_EXAMPLE_ROWS,
    EXCEL_HEADERS,
} from "./constants";

export function createLocalId(): string {
    if (
        typeof crypto !== "undefined" &&
        "randomUUID" in crypto
    ) {
        return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random()
        .toString(16)
        .slice(2)}`;
}

export function createEmptyRow(): BulkEnrollmentRow {
    return {
        localId: createLocalId(),
        username: "",
        password: "",
        firstname: "",
        lastname: "",
        idnumber: "",
        email: "",
        phone_number: "",
        departament: "",
    };
}

export function getCourseName(
    course: Course,
): string {
    const item = course as Course & {
        name?: string;
        title?: string;
    };

    return (
        item.name ||
        item.title ||
        `Curso #${course.id}`
    );
}

export function normalizeText(
    value: string,
): string {
    return String(value ?? "").trim();
}

export function normalizeEmail(
    value: string,
): string {
    return String(value ?? "")
        .trim()
        .toLowerCase();
}

export function hasRowData(
    row: BulkEnrollmentRow,
): boolean {
    return (
        normalizeText(row.username).length > 0 ||
        normalizeText(row.password).length > 0 ||
        normalizeText(row.firstname).length > 0 ||
        normalizeText(row.lastname).length > 0 ||
        normalizeText(row.idnumber).length > 0 ||
        normalizeText(row.email).length > 0 ||
        normalizeText(row.phone_number).length > 0 ||
        normalizeText(row.departament).length > 0
    );
}

export function normalizeRow(
    row: BulkEnrollmentRow,
): MassiveEnrollmentUserPayload {
    return {
        username: normalizeText(row.username),
        password: normalizeText(row.password),
        firstname: normalizeText(row.firstname),
        lastname: normalizeText(row.lastname),
        idnumber: normalizeText(row.idnumber),
        email: normalizeEmail(row.email),
        phone_number: normalizeText(
            row.phone_number,
        ),
        departament:
            normalizeText(row.departament) ||
            "General",
    };
}

function isHeaderRow(
    values: string[],
): boolean {
    const normalized = values.map((value) =>
        value.trim().toLowerCase(),
    );

    return (
        normalized.includes("username") ||
        normalized.includes("firstname") ||
        normalized.includes("lastname") ||
        normalized.includes("idnumber") ||
        normalized.includes("email")
    );
}

export function getRepeatedValues(
    rows: MassiveEnrollmentUserPayload[],
    key: keyof MassiveEnrollmentUserPayload,
): Set<string> {
    const counter =
        new Map<string, number>();

    rows.forEach((row) => {
        const value =
            key === "email"
                ? normalizeEmail(row[key])
                : normalizeText(
                    row[key],
                ).toUpperCase();

        if (!value) return;

        counter.set(
            value,
            (counter.get(value) ?? 0) + 1,
        );
    });

    return new Set(
        Array.from(counter.entries())
            .filter(([, count]) => count > 1)
            .map(([value]) => value),
    );
}

function normalizeExcelCell(
    value: unknown,
): string {
    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value).trim();
}

function isExcelHeaderRow(
    values: string[],
): boolean {
    const normalized = values.map(
        (value) =>
            value.trim().toLowerCase(),
    );

    return (
        normalized.includes("username") ||
        normalized.includes("firstname") ||
        normalized.includes("lastname") ||
        normalized.includes("idnumber") ||
        normalized.includes("email")
    );
}

function hasExcelRowData(
    values: string[],
): boolean {
    return values.some(
        (value) =>
            normalizeExcelCell(value).length >
            0,
    );
}

export async function parseBulkExcelFile(
    file: File,
): Promise<BulkEnrollmentRow[]> {
    const buffer =
        await file.arrayBuffer();

    const workbook = XLSX.read(buffer, {
        type: "array",
    });

    const firstSheetName =
        workbook.SheetNames[0];

    if (!firstSheetName) {
        return [];
    }

    const worksheet =
        workbook.Sheets[firstSheetName];

    if (!worksheet) {
        return [];
    }

    const excelRows =
        XLSX.utils.sheet_to_json(
            worksheet,
            {
                header: 1,
                defval: "",
                raw: false,
            },
        ) as unknown[][];

    if (excelRows.length === 0) {
        return [];
    }

    const normalizedRows =
        excelRows.map((row) =>
            row.map(normalizeExcelCell),
        );

    const firstRow =
        normalizedRows[0] ?? [];

    const startIndex =
        isExcelHeaderRow(firstRow)
            ? 1
            : 0;

    return normalizedRows
        .slice(startIndex)
        .filter(hasExcelRowData)
        .map((values) => ({
            localId: createLocalId(),
            username: values[0] ?? "",
            password: values[1] ?? "",
            firstname: values[2] ?? "",
            lastname: values[3] ?? "",
            idnumber: values[4] ?? "",
            email: values[5] ?? "",
            phone_number:
                values[6] ?? "",
            departament:
                values[7] ?? "",
        }));
}

export function downloadExcelTemplate(): void {
    const worksheet =
        XLSX.utils.aoa_to_sheet([
            [...EXCEL_HEADERS],
            ...EXCEL_EXAMPLE_ROWS,
        ]);

    worksheet["!cols"] = [
        { wch: 18 },
        { wch: 16 },
        { wch: 22 },
        { wch: 22 },
        { wch: 16 },
        { wch: 30 },
        { wch: 16 },
        { wch: 22 },
    ];

    const workbook =
        XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        "Estudiantes",
    );

    XLSX.writeFile(
        workbook,
        "plantilla_matricula_masiva.xlsx",
        {
            compression: true,
        },
    );
}

export function renderUnknownValue(
    value: unknown,
): string {
    if (typeof value === "string") {
        return value;
    }

    if (typeof value === "number") {
        return String(value);
    }

    if (typeof value === "boolean") {
        return value ? "Sí" : "No";
    }

    if (
        value === null ||
        value === undefined
    ) {
        return "-";
    }

    try {
        return JSON.stringify(value);
    } catch {
        return "-";
    }
}

export function getResultCount(
    response:
        | MassiveEnrollmentResponse
        | null,
) {
    return {
        created:
            response?.created.length ?? 0,
        skipped:
            response?.skipped.length ?? 0,
        failed:
            response?.failed.length ?? 0,
    };
}
