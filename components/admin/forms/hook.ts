"use client";

import {
    useState,
} from "react";

import {
    FORM_CONFIG,
} from "./constants";

import type {
    FormDocumentType,
    FormState,
    GeneralFieldKey,
    RowFieldKey,
} from "./types";

import {
    createEmptyRow,
    createInitialState,
} from "./utils";

import {
    PEOPLE_DIRECTORY,
    type PersonDirectoryItem,
} from "./data/people";

export function useFormDocument(
    type: FormDocumentType,
) {
    const config =
        FORM_CONFIG[type];

    const [
        formState,
        setFormState,
    ] = useState<FormState>(() =>
        createInitialState(type),
    );

    const [
        identificationStatus,
        setIdentificationStatus,
    ] = useState<
        Record<
            string,
            "idle" | "found" | "not-found"
        >
    >({});

    const [
        message,
        setMessage,
    ] = useState("");

    const [
        isPreviewOpen,
        setIsPreviewOpen,
    ] = useState(false);

    function showMessage(
        text: string,
    ) {
        setMessage(text);

        window.setTimeout(() => {
            setMessage("");
        }, 2500);
    }

    function updateGeneral(
        key: GeneralFieldKey,
        value: string,
    ) {
        setFormState(
            (previous) => ({
                ...previous,

                general: {
                    ...previous.general,
                    [key]: value,
                },
            }),
        );
    }

    function findPersonByIdentification(
        identification: string,
    ) {
        const normalizedIdentification =
            identification
                .replace(/\D/g, "")
                .trim();

        return PEOPLE_DIRECTORY.find(
            (person) =>
                person.identification ===
                normalizedIdentification,
        );
    }

    function fillPersonData(
        rowId: string,
        person: PersonDirectoryItem,
    ) {
        setFormState((previous) => ({
            ...previous,

            rows: previous.rows.map(
                (row) =>
                    row.id === rowId
                        ? {
                            ...row,

                            identification:
                                person.identification,

                            name:
                                person.name,

                            profession:
                                person.profession,

                            workplace:
                                person.workplace,

                            email:
                                person.email,
                        }
                        : row,
            ),
        }));

        setIdentificationStatus(
            (previous) => ({
                ...previous,
                [rowId]: "found",
            }),
        );
    }

    function updateIdentification(
        rowId: string,
        value: string,
    ) {
        /*
         * Dejamos únicamente números.
         */
        const identification =
            value.replace(/\D/g, "");

        /*
         * Primero actualizamos lo escrito.
         */
        setFormState((previous) => ({
            ...previous,

            rows: previous.rows.map(
                (row) =>
                    row.id === rowId
                        ? {
                            ...row,
                            identification,
                        }
                        : row,
            ),
        }));

        /*
         * Mientras no tenga 10 números,
         * todavía no buscamos coincidencia exacta.
         */
        if (identification.length < 10) {
            setIdentificationStatus(
                (previous) => ({
                    ...previous,
                    [rowId]: "idle",
                }),
            );

            return;
        }

        /*
         * Evitamos más de 10 números.
         */
        if (identification.length > 10) {
            return;
        }

        const person =
            findPersonByIdentification(
                identification,
            );

        if (!person) {
            setIdentificationStatus(
                (previous) => ({
                    ...previous,
                    [rowId]:
                        "not-found",
                }),
            );

            return;
        }

        /*
         * Si existe:
         * completa automáticamente los datos.
         */
        fillPersonData(
            rowId,
            person,
        );
    }

    function searchIdentification(
        rowId: string,
    ) {
        const row =
            formState.rows.find(
                (item) =>
                    item.id === rowId,
            );

        if (!row) {
            return;
        }

        const person =
            findPersonByIdentification(
                row.identification,
            );

        if (!person) {
            setIdentificationStatus(
                (previous) => ({
                    ...previous,
                    [rowId]:
                        "not-found",
                }),
            );

            showMessage(
                "No se encontró una persona con esa cédula.",
            );

            return;
        }

        fillPersonData(
            rowId,
            person,
        );

        showMessage(
            `Se encontraron los datos de ${person.name}.`,
        );
    }

    function updateRow(
        id: string,
        key: RowFieldKey,
        value:
            | string
            | boolean[],
    ) {
        setFormState(
            (previous) => ({
                ...previous,

                rows:
                    previous.rows.map(
                        (row) =>
                            row.id === id
                                ? {
                                    ...row,
                                    [key]:
                                        value,
                                }
                                : row,
                    ),
            }),
        );
    }

    function toggleAttendance(
        id: string,
        index: number,
    ) {
        setFormState(
            (previous) => ({
                ...previous,

                rows:
                    previous.rows.map(
                        (row) => {
                            if (
                                row.id !==
                                id
                            ) {
                                return row;
                            }

                            const marks = [
                                ...row.attendanceMarks,
                            ];

                            marks[index] =
                                !marks[index];

                            return {
                                ...row,
                                attendanceMarks:
                                    marks,
                            };
                        },
                    ),
            }),
        );
    }

    function addRow() {
        const id =
            typeof crypto !==
                "undefined" &&
                "randomUUID" in crypto
                ? crypto.randomUUID()
                : String(
                    Date.now(),
                );

        setFormState(
            (previous) => ({
                ...previous,

                rows: [
                    ...previous.rows,
                    createEmptyRow(
                        id,
                    ),
                ],
            }),
        );
    }

    function deleteRow(
        id: string,
    ) {
        setFormState(
            (previous) => ({
                ...previous,

                rows:
                    previous.rows.filter(
                        (row) =>
                            row.id !==
                            id,
                    ),
            }),
        );
    }

    function handleSave() {
        localStorage.setItem(
            config.storageKey,
            JSON.stringify(
                formState,
            ),
        );

        showMessage(
            "Formulario guardado correctamente.",
        );
    }

    function handleLoad() {
        const saved =
            localStorage.getItem(
                config.storageKey,
            );

        if (!saved) {
            showMessage(
                "No existe información guardada.",
            );

            return;
        }

        try {
            setFormState(
                JSON.parse(
                    saved,
                ) as FormState,
            );

            showMessage(
                "Formulario cargado correctamente.",
            );
        } catch {
            showMessage(
                "No se pudo recuperar el formulario.",
            );
        }
    }

    function handleReset() {
        localStorage.removeItem(
            config.storageKey,
        );

        setFormState(
            createInitialState(type),
        );

        showMessage(
            "Formulario reiniciado.",
        );
    }

    function openPreview() {
        setIsPreviewOpen(true);
    }

    function closePreview() {
        setIsPreviewOpen(false);
    }

    function handlePrint() {
        window.print();
    }

    return {
        type,
        config,

        formState,
        message,
        isPreviewOpen,

        identificationStatus,

        updateGeneral,
        updateRow,
        updateIdentification,
        searchIdentification,

        toggleAttendance,

        addRow,
        deleteRow,

        handleSave,
        handleLoad,
        handleReset,

        openPreview,
        closePreview,

        handlePrint,
    };
}

export type FormDocumentState =
    ReturnType<
        typeof useFormDocument
    >;