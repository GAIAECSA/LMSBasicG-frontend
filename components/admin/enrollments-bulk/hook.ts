"use client";

import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ChangeEvent,
    type FormEvent,
} from "react";

import {
    getAllCourses,
    type Course,
} from "@/services/courses.service";

import {
    createMassiveEnrollments,
    type MassiveEnrollmentResponse,
    type MassiveEnrollmentUserPayload,
} from "@/services/enrollments.service";

import {
    CSV_EXAMPLE,
    EMAIL_REGEX,
} from "./constants";

import type {
    BulkEnrollmentRow,
} from "./types";

import {
    createEmptyRow,
    downloadTextFile,
    getCourseName,
    getRepeatedValues,
    getResultCount,
    hasRowData,
    normalizeRow,
    parseBulkText,
} from "./utils";

export function useEnrollmentsAdminBulkPanel() {
    const fileInputRef =
        useRef<HTMLInputElement | null>(null);

    const [courses, setCourses] =
        useState<Course[]>([]);

    const [courseId, setCourseId] =
        useState("");

    const [courseSearch, setCourseSearch] =
        useState("");

    const [rows, setRows] = useState<
        BulkEnrollmentRow[]
    >([createEmptyRow()]);

    const [result, setResult] =
        useState<MassiveEnrollmentResponse | null>(
            null,
        );

    const [error, setError] =
        useState<string | null>(null);

    const [success, setSuccess] =
        useState<string | null>(null);

    const [
        isLoadingCourses,
        setIsLoadingCourses,
    ] = useState(true);

    const [
        isRefreshingCourses,
        setIsRefreshingCourses,
    ] = useState(false);

    const [
        isSubmitting,
        setIsSubmitting,
    ] = useState(false);

    const loadCourses = useCallback(
        async (showRefresh = false) => {
            try {
                if (showRefresh) {
                    setIsRefreshingCourses(true);
                    setError(null);
                    setSuccess(null);
                } else {
                    setIsLoadingCourses(true);
                }

                const data =
                    await getAllCourses();

                const courseList =
                    Array.isArray(data)
                        ? data
                        : [];

                setCourses(courseList);

                if (showRefresh) {
                    setSuccess(
                        "Cursos actualizados correctamente.",
                    );
                }
            } catch (requestError) {
                const message =
                    requestError instanceof Error
                        ? requestError.message
                        : "No se pudieron cargar los cursos.";

                setError(message);
            } finally {
                setIsLoadingCourses(false);
                setIsRefreshingCourses(false);
            }
        },
        [],
    );

    useEffect(() => {
        const timeoutId =
            window.setTimeout(() => {
                void loadCourses();
            }, 0);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [loadCourses]);

    useEffect(() => {
        if (!error && !success) return;

        const timeoutId =
            window.setTimeout(() => {
                setError(null);
                setSuccess(null);
            }, 3500);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [error, success]);

    const selectedCourseId =
        useMemo(() => {
            const numericValue =
                Number(courseId);

            return Number.isFinite(
                numericValue,
            )
                ? numericValue
                : 0;
        }, [courseId]);

    const selectedCourse =
        useMemo(() => {
            return (
                courses.find(
                    (course) =>
                        Number(course.id) ===
                        Number(
                            selectedCourseId,
                        ),
                ) ?? null
            );
        }, [courses, selectedCourseId]);

    const hasSelectedCourse =
        selectedCourseId > 0;

    const filteredCourses =
        useMemo(() => {
            const query = courseSearch
                .trim()
                .toLowerCase();

            if (!query) return courses;

            return courses.filter((course) =>
                getCourseName(course)
                    .toLowerCase()
                    .includes(query),
            );
        }, [courses, courseSearch]);

    const validation =
        useMemo(() => {
            const rowErrors: Record<
                string,
                string[]
            > = {};

            const generalErrors: string[] =
                [];

            const activeRows =
                rows.filter(hasRowData);

            const normalizedRows =
                activeRows.map(normalizeRow);

            if (
                !Number.isFinite(
                    selectedCourseId,
                ) ||
                selectedCourseId <= 0
            ) {
                generalErrors.push(
                    "Selecciona un curso para continuar.",
                );
            }

            if (activeRows.length === 0) {
                generalErrors.push(
                    "Agrega al menos un estudiante.",
                );
            }

            const repeatedUsernames =
                getRepeatedValues(
                    normalizedRows,
                    "username",
                );

            const repeatedEmails =
                getRepeatedValues(
                    normalizedRows,
                    "email",
                );

            const repeatedIdnumbers =
                getRepeatedValues(
                    normalizedRows,
                    "idnumber",
                );

            activeRows.forEach(
                (row, index) => {
                    const normalized =
                        normalizeRow(row);

                    const errors: string[] =
                        [];

                    const rowNumber =
                        index + 1;

                    if (!normalized.username) {
                        errors.push(
                            "Usuario requerido.",
                        );
                    }

                    if (!normalized.password) {
                        errors.push(
                            "Contraseña requerida.",
                        );
                    }

                    if (!normalized.firstname) {
                        errors.push(
                            "Nombres requeridos.",
                        );
                    }

                    if (!normalized.lastname) {
                        errors.push(
                            "Apellidos requeridos.",
                        );
                    }

                    if (!normalized.idnumber) {
                        errors.push(
                            "Cédula requerida.",
                        );
                    }

                    if (!normalized.email) {
                        errors.push(
                            "Correo requerido.",
                        );
                    }

                    if (
                        normalized.email &&
                        !EMAIL_REGEX.test(
                            normalized.email,
                        )
                    ) {
                        errors.push(
                            "Correo inválido.",
                        );
                    }

                    if (
                        normalized.password &&
                        normalized.password
                            .length < 6
                    ) {
                        errors.push(
                            "La contraseña debe tener mínimo 6 caracteres.",
                        );
                    }

                    if (
                        normalized.username &&
                        repeatedUsernames.has(
                            normalized.username.toUpperCase(),
                        )
                    ) {
                        errors.push(
                            "Usuario repetido en la lista.",
                        );
                    }

                    if (
                        normalized.email &&
                        repeatedEmails.has(
                            normalized.email,
                        )
                    ) {
                        errors.push(
                            "Correo repetido en la lista.",
                        );
                    }

                    if (
                        normalized.idnumber &&
                        repeatedIdnumbers.has(
                            normalized.idnumber.toUpperCase(),
                        )
                    ) {
                        errors.push(
                            "Cédula repetida en la lista.",
                        );
                    }

                    if (errors.length > 0) {
                        rowErrors[row.localId] =
                            errors.map(
                                (message) =>
                                    `Fila ${rowNumber}: ${message}`,
                            );
                    }
                },
            );

            return {
                activeRows,
                normalizedRows,
                rowErrors,
                generalErrors,
                canSubmit:
                    generalErrors.length === 0 &&
                    Object.keys(rowErrors)
                        .length === 0,
            };
        }, [rows, selectedCourseId]);

    const resultCount =
        getResultCount(result);

    function ensureCourseSelected(): boolean {
        if (hasSelectedCourse) {
            return true;
        }

        setError(
            "Primero debes seleccionar el curso donde se matricularán los estudiantes.",
        );

        setSuccess(null);
        setResult(null);

        return false;
    }

    function updateRow(
        localId: string,
        field:
            keyof MassiveEnrollmentUserPayload,
        value: string,
    ) {
        setRows((currentRows) =>
            currentRows.map((row) =>
                row.localId === localId
                    ? {
                          ...row,
                          [field]: value,
                      }
                    : row,
            ),
        );
    }

    function addRow() {
        if (!ensureCourseSelected()) return;

        setRows((currentRows) => [
            ...currentRows,
            createEmptyRow(),
        ]);
    }

    function handleImportCsvClick() {
        if (!ensureCourseSelected()) return;

        fileInputRef.current?.click();
    }

    function removeRow(localId: string) {
        setRows((currentRows) => {
            const nextRows =
                currentRows.filter(
                    (row) =>
                        row.localId !== localId,
                );

            return nextRows.length > 0
                ? nextRows
                : [createEmptyRow()];
        });
    }

    function clearRows() {
        setRows([createEmptyRow()]);
        setResult(null);
        setError(null);
        setSuccess(null);
    }

    function importRowsFromText(
        content: string,
    ) {
        const parsedRows =
            parseBulkText(content);

        if (parsedRows.length === 0) {
            setError(
                "No se encontraron estudiantes para importar.",
            );

            return;
        }

        setRows((currentRows) => {
            const currentHasData =
                currentRows.some(hasRowData);

            return currentHasData
                ? [
                      ...currentRows,
                      ...parsedRows,
                  ]
                : parsedRows;
        });

        setResult(null);
        setError(null);

        setSuccess(
            `${parsedRows.length} estudiante(s) agregado(s).`,
        );
    }

    async function handleFileChange(
        event: ChangeEvent<HTMLInputElement>,
    ) {
        const file =
            event.target.files?.[0];

        if (!file) return;

        if (!ensureCourseSelected()) {
            event.target.value = "";
            return;
        }

        try {
            const content =
                await file.text();

            importRowsFromText(content);
        } catch {
            setError(
                "No se pudo leer el archivo seleccionado.",
            );
        } finally {
            event.target.value = "";
        }
    }

    function handleDownloadTemplate() {
        downloadTextFile(
            "plantilla_matricula_masiva.csv",
            CSV_EXAMPLE,
        );
    }

    function handleCourseChange(
        value: string,
    ) {
        setCourseId(value);
        setError(null);
        setSuccess(null);
        setResult(null);
    }

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        setError(null);
        setSuccess(null);
        setResult(null);

        if (!ensureCourseSelected()) return;

        if (
            validation.activeRows.length === 0
        ) {
            setError(
                "Agrega o importa al menos un estudiante antes de continuar.",
            );

            return;
        }

        if (
            Object.keys(
                validation.rowErrors,
            ).length > 0
        ) {
            setError(
                "Revisa los datos marcados antes de ejecutar la matrícula masiva.",
            );

            return;
        }

        setIsSubmitting(true);

        try {
            const response =
                await createMassiveEnrollments(
                    {
                        course_id:
                            selectedCourseId,
                        users:
                            validation.normalizedRows,
                    },
                );

            const counts =
                getResultCount(response);

            setResult(response);

            if (
                counts.created === 0 &&
                counts.failed > 0
            ) {
                setError(
                    "No se pudo matricular ningún estudiante. Revisa el detalle de los registros fallidos.",
                );
            } else if (
                counts.failed > 0 ||
                counts.skipped > 0
            ) {
                setSuccess(
                    `Proceso finalizado: ${counts.created} creado(s), ${counts.skipped} omitido(s) y ${counts.failed} fallido(s).`,
                );
            } else {
                setSuccess(
                    "Todos los estudiantes fueron matriculados correctamente.",
                );
            }
        } catch (requestError) {
            const message =
                requestError instanceof Error
                    ? requestError.message
                    : "No se pudo completar la matrícula masiva.";

            setError(message);
        } finally {
            setIsSubmitting(false);
        }
    }

    return {
        fileInputRef,
        courses,
        courseId,
        courseSearch,
        rows,
        result,
        error,
        success,
        isLoadingCourses,
        isRefreshingCourses,
        isSubmitting,
        selectedCourseId,
        selectedCourse,
        hasSelectedCourse,
        filteredCourses,
        validation,
        resultCount,
        setCourseSearch,
        loadCourses,
        updateRow,
        addRow,
        handleImportCsvClick,
        removeRow,
        clearRows,
        handleFileChange,
        handleDownloadTemplate,
        handleCourseChange,
        handleSubmit,
    };
}

export type EnrollmentsAdminBulkPanelState =
    ReturnType<
        typeof useEnrollmentsAdminBulkPanel
    >;
