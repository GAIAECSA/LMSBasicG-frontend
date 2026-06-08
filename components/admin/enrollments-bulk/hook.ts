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

import { notify } from "@/lib/notify";

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
    EMAIL_REGEX,
} from "./constants";

import type {
    BulkEnrollmentRow,
} from "./types";

import {
    createEmptyRow,
    downloadExcelTemplate,
    getCourseName,
    getRepeatedValues,
    getResultCount,
    hasRowData,
    normalizeRow,
    parseBulkExcelFile,
} from "./utils";

function createLoadingToast(message: string) {
    const toastId = notify.loading(message);
    let dismissed = false;

    return () => {
        if (dismissed) return;

        notify.dismiss(toastId);
        dismissed = true;
    };
}

export function useEnrollmentsAdminBulkPanel() {
    const fileInputRef =
        useRef<HTMLInputElement | null>(null);

    /*
     * Se entrega al componente una función callback en lugar
     * de exponer directamente el ref. Esto evita el error:
     * "Cannot access refs during render".
     */
    const setFileInputElement =
        useCallback(
            (
                element:
                    | HTMLInputElement
                    | null,
            ) => {
                fileInputRef.current =
                    element;
            },
            [],
        );

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

    const [
        isLoadingCourses,
        setIsLoadingCourses,
    ] = useState(true);

    const [
        isRefreshingCourses,
        setIsRefreshingCourses,
    ] = useState(false);

    const [
        isReadingFile,
        setIsReadingFile,
    ] = useState(false);

    const [
        isSubmitting,
        setIsSubmitting,
    ] = useState(false);

    const coursesLoadingRef =
        useRef(false);

    const fileReadingRef =
        useRef(false);

    const submittingRef =
        useRef(false);

    const hasLoadedCoursesOnceRef =
        useRef(false);

    const loadCourses = useCallback(
        async (showRefresh = false) => {
            if (coursesLoadingRef.current) {
                if (showRefresh) {
                    notify.warning(
                        "La actualización de cursos ya está en proceso.",
                    );
                }

                return;
            }

            if (
                submittingRef.current &&
                showRefresh
            ) {
                notify.warning(
                    "Espera a que termine la matrícula masiva antes de actualizar los cursos.",
                );

                return;
            }

            coursesLoadingRef.current = true;

            const isInitialLoad =
                !hasLoadedCoursesOnceRef.current;

            const dismissLoadingToast =
                showRefresh
                    ? createLoadingToast(
                        "Actualizando cursos...",
                    )
                    : null;

            try {
                if (isInitialLoad) {
                    setIsLoadingCourses(true);
                }

                if (showRefresh) {
                    setIsRefreshingCourses(true);
                }

                setError(null);

                const data =
                    await getAllCourses();

                const courseList =
                    Array.isArray(data)
                        ? data
                        : [];

                setCourses(courseList);

                if (showRefresh) {
                    dismissLoadingToast?.();

                    notify.success(
                        "Cursos actualizados correctamente.",
                    );
                }
            } catch (requestError) {
                const message =
                    requestError instanceof Error
                        ? requestError.message
                        : "No se pudieron cargar los cursos.";

                setError(message);
                dismissLoadingToast?.();

                if (showRefresh) {
                    notify.error(message);
                }
            } finally {
                dismissLoadingToast?.();

                hasLoadedCoursesOnceRef.current =
                    true;

                coursesLoadingRef.current =
                    false;

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
            const query =
                courseSearch
                    .trim()
                    .toLowerCase();

            if (!query) return courses;

            return courses.filter(
                (course) =>
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

        notify.warning(
            "Primero debes seleccionar el curso donde se matricularán los estudiantes.",
        );

        setResult(null);

        return false;
    }

    function ensureFormEditable(): boolean {
        if (!submittingRef.current) {
            return true;
        }

        notify.warning(
            "Espera a que termine la matrícula masiva antes de modificar la lista.",
        );

        return false;
    }

    function updateRow(
        localId: string,
        field:
            keyof MassiveEnrollmentUserPayload,
        value: string,
    ) {
        if (!ensureFormEditable()) return;

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
        if (!ensureFormEditable()) return;
        if (!ensureCourseSelected()) return;

        setRows((currentRows) => [
            ...currentRows,
            createEmptyRow(),
        ]);
    }

    function handleImportExcelClick() {
        if (!ensureFormEditable()) return;
        if (!ensureCourseSelected()) return;

        if (fileReadingRef.current) {
            notify.warning(
                "Ya se está leyendo un archivo Excel.",
            );

            return;
        }

        fileInputRef.current?.click();
    }

    function removeRow(localId: string) {
        if (!ensureFormEditable()) return;

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
        if (!ensureFormEditable()) return;

        setRows([createEmptyRow()]);
        setResult(null);
    }

    function importRows(
        parsedRows: BulkEnrollmentRow[],
    ) {
        if (parsedRows.length === 0) {
            notify.warning(
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

        notify.success(
            `${parsedRows.length} estudiante(s) agregado(s) desde Excel.`,
        );
    }

    async function handleFileChange(
        event: ChangeEvent<HTMLInputElement>,
    ) {
        const file =
            event.target.files?.[0];

        if (!file) return;

        if (!ensureFormEditable()) {
            event.target.value = "";
            return;
        }

        if (!ensureCourseSelected()) {
            event.target.value = "";
            return;
        }

        const extension =
            file.name
                .split(".")
                .pop()
                ?.toLowerCase();

        if (
            extension !== "xlsx" &&
            extension !== "xls"
        ) {
            notify.warning(
                "Selecciona un archivo Excel válido con extensión .xlsx o .xls.",
            );

            event.target.value = "";

            return;
        }

        if (fileReadingRef.current) {
            notify.warning(
                "Ya se está leyendo un archivo Excel.",
            );

            event.target.value = "";

            return;
        }

        fileReadingRef.current = true;
        setIsReadingFile(true);

        const dismissLoadingToast =
            createLoadingToast(
                "Leyendo archivo Excel...",
            );

        try {
            const parsedRows =
                await parseBulkExcelFile(file);

            dismissLoadingToast();

            importRows(parsedRows);
        } catch {
            dismissLoadingToast();

            notify.error(
                "No se pudo leer el archivo Excel seleccionado.",
            );
        } finally {
            dismissLoadingToast();

            fileReadingRef.current =
                false;

            setIsReadingFile(false);

            event.target.value = "";
        }
    }

    function handleDownloadTemplate() {
        downloadExcelTemplate();

        notify.success(
            "Plantilla Excel descargada correctamente.",
        );
    }

    function handleCourseChange(
        value: string,
    ) {
        if (!ensureFormEditable()) return;

        setCourseId(value);
        setResult(null);
    }

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        if (submittingRef.current) {
            notify.warning(
                "La matrícula masiva ya está en proceso.",
            );

            return;
        }

        setResult(null);

        if (!ensureCourseSelected()) return;

        if (
            validation.activeRows.length === 0
        ) {
            notify.warning(
                "Agrega o importa al menos un estudiante antes de continuar.",
            );

            return;
        }

        if (
            Object.keys(
                validation.rowErrors,
            ).length > 0
        ) {
            notify.warning(
                "Revisa los datos marcados antes de ejecutar la matrícula masiva.",
            );

            return;
        }

        submittingRef.current = true;
        setIsSubmitting(true);

        const dismissLoadingToast =
            createLoadingToast(
                "Matriculando estudiantes...",
            );

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
            dismissLoadingToast();

            if (
                counts.created === 0 &&
                counts.failed > 0
            ) {
                notify.error(
                    "No se pudo matricular ningún estudiante. Revisa el detalle de los registros fallidos.",
                );
            } else if (
                counts.failed > 0 ||
                counts.skipped > 0
            ) {
                notify.warning(
                    `Proceso finalizado: ${counts.created} creado(s), ${counts.skipped} omitido(s) y ${counts.failed} fallido(s).`,
                );
            } else {
                notify.success(
                    "Todos los estudiantes fueron matriculados correctamente.",
                );
            }
        } catch (requestError) {
            const message =
                requestError instanceof Error
                    ? requestError.message
                    : "No se pudo completar la matrícula masiva.";

            dismissLoadingToast();
            notify.error(message);
        } finally {
            dismissLoadingToast();

            submittingRef.current =
                false;

            setIsSubmitting(false);
        }
    }

    return {
        setFileInputElement,
        courses,
        courseId,
        courseSearch,
        rows,
        result,
        error,
        isLoadingCourses,
        isRefreshingCourses,
        isReadingFile,
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
        handleImportExcelClick,
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