import {
    API_URL,
} from "@/services/api-client.service";

import type {
    LessonBlock,
} from "@/services/lessons.service";

import type {
    EvidenceContent,
} from "./types";

type AnyRecord =
    Record<string, unknown>;

/* =====================================================
   CONTENT -> OBJECT
===================================================== */

function toRecord(
    value: unknown,
): AnyRecord {
    if (
        value &&
        typeof value === "object" &&
        !Array.isArray(value)
    ) {
        return value as AnyRecord;
    }

    if (
        typeof value === "string"
    ) {
        try {
            const parsed =
                JSON.parse(value);

            if (
                parsed &&
                typeof parsed === "object" &&
                !Array.isArray(parsed)
            ) {
                return parsed as AnyRecord;
            }
        } catch {
            return {};
        }
    }

    return {};
}

/* =====================================================
   TEXTO
===================================================== */

function cleanText(
    value: unknown,
): string {
    if (
        typeof value !== "string" &&
        typeof value !== "number"
    ) {
        return "";
    }

    return String(value)
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function firstText(
    record: AnyRecord,
    keys: string[],
): string {
    for (
        const key of keys
    ) {
        const value =
            cleanText(
                record[key],
            );

        if (value) {
            return value;
        }
    }

    return "";
}

/* =====================================================
   CONTENIDO DE EVIDENCIA
===================================================== */

export function getEvidenceContent(
    block: LessonBlock,
): EvidenceContent {
    const content =
        toRecord(
            block.content,
        );

    const title =
        firstText(
            content,
            [
                "title",
                "name",
                "label",
            ],
        ) ||
        `Evidencia #${block.id}`;

    const description =
        firstText(
            content,
            [
                "description",
                "text",
                "subtitle",
            ],
        );

    const instructions =
        firstText(
            content,
            [
                "instructions",
                "instruction",
            ],
        );

    const maxSize =
        Number(
            content.max_size_mb ??
            content.maxSizeMb ??
            content.max_file_size ??
            10,
        );

    return {
        title,
        description,
        instructions,

        required:
            content.required !==
            false,

        maxSizeMb:
            Number.isFinite(
                maxSize,
            ) &&
                maxSize > 0
                ? maxSize
                : 10,
    };
}

/* =====================================================
   OBTENER FILE_URL DEL BLOQUE
===================================================== */

export function getEvidenceFilePath(
    block: LessonBlock,
): string {
    const content =
        toRecord(
            block.content,
        );

    return firstText(
        content,
        [
            "file_url",
            "url",
            "path",
            "file_path",
        ],
    );
}

/* =====================================================
   URL COMPLETA
===================================================== */

export function getEvidenceFileUrl(
    block: LessonBlock,
): string {
    const value =
        getEvidenceFilePath(
            block,
        );

    if (!value) {
        return "";
    }

    if (
        value.startsWith(
            "http://",
        ) ||
        value.startsWith(
            "https://",
        ) ||
        value.startsWith(
            "blob:",
        )
    ) {
        return value;
    }

    const origin =
        API_URL.replace(
            /\/+$/,
            "",
        );

    if (
        value.startsWith("/")
    ) {
        return `${origin}${value}`;
    }

    return `${origin}/${value}`;
}

/* =====================================================
   NOMBRE DEL ARCHIVO
===================================================== */

export function getEvidenceFilename(
    block: LessonBlock,
): string {
    const content =
        toRecord(
            block.content,
        );

    const explicit =
        firstText(
            content,
            [
                "filename",
                "file_name",
                "name_file",
            ],
        );

    if (explicit) {
        return explicit;
    }

    const path =
        getEvidenceFilePath(
            block,
        );

    if (!path) {
        return "";
    }

    const cleanPath =
        path.split("?")[0];

    return (
        cleanPath
            .split("/")
            .pop() ??
        ""
    );
}