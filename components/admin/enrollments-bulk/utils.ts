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

function detectDelimiter(
    line: string,
): "," | ";" | "\t" {
    const commaCount =
        (line.match(/,/g) ?? []).length;

    const semicolonCount =
        (line.match(/;/g) ?? []).length;

    const tabCount =
        (line.match(/\t/g) ?? []).length;

    if (
        tabCount >= commaCount &&
        tabCount >= semicolonCount &&
        tabCount > 0
    ) {
        return "\t";
    }

    if (semicolonCount > commaCount) {
        return ";";
    }

    return ",";
}

function parseDelimitedLine(
    line: string,
    delimiter: "," | ";" | "\t",
): string[] {
    const values: string[] = [];
    let current = "";
    let insideQuotes = false;

    for (
        let index = 0;
        index < line.length;
        index += 1
    ) {
        const char = line[index];
        const nextChar = line[index + 1];

        if (
            char === '"' &&
            nextChar === '"'
        ) {
            current += '"';
            index += 1;
            continue;
        }

        if (char === '"') {
            insideQuotes = !insideQuotes;
            continue;
        }

        if (
            char === delimiter &&
            !insideQuotes
        ) {
            values.push(current.trim());
            current = "";
            continue;
        }

        current += char;
    }

    values.push(current.trim());

    return values;
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

export function parseBulkText(
    text: string,
): BulkEnrollmentRow[] {
    const cleanText = text
        .replace(/^\uFEFF/, "")
        .trim();

    if (!cleanText) return [];

    const lines = cleanText
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

    if (lines.length === 0) return [];

    const delimiter =
        detectDelimiter(lines[0]);

    const firstValues =
        parseDelimitedLine(
            lines[0],
            delimiter,
        );

    const startIndex =
        isHeaderRow(firstValues) ? 1 : 0;

    return lines
        .slice(startIndex)
        .map((line) => {
            const values =
                parseDelimitedLine(
                    line,
                    delimiter,
                );

            return {
                localId: createLocalId(),
                username: values[0] ?? "",
                password: values[1] ?? "",
                firstname: values[2] ?? "",
                lastname: values[3] ?? "",
                idnumber: values[4] ?? "",
                email: values[5] ?? "",
                phone_number: values[6] ?? "",
                departament: values[7] ?? "",
            };
        });
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

export function downloadTextFile(
    filename: string,
    content: string,
): void {
    const blob = new Blob([content], {
        type: "text/csv;charset=utf-8;",
    });

    const url =
        URL.createObjectURL(blob);

    const link =
        document.createElement("a");

    link.href = url;
    link.download = filename;
    link.click();

    URL.revokeObjectURL(url);
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
