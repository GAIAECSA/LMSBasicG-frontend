"use client";

import {
    type ChangeEvent,
    type FormEvent,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";
import { usePathname } from "next/navigation";
import {
    deleteLessonBlock,
    getLessonBlocksByLesson,
    getLessonsByModule,
    type Lesson,
    type LessonBlock,
} from "@/services/lessons.service";
import {
    getModulesByCourse,
    type CourseModule,
} from "@/services/modules.service";
import {
    createHomeworkResponse,
    updateHomeworkResponse,
} from "@/services/homework-response.service";
import {
    DEFAULT_ACCEPTED_FILE_TYPES,
    REQUIRED_FILE_BLOCK_TYPE_ID,
} from "./constants";
import type {
    DeleteModalState,
    EnrollmentRecord,
    FormModalState,
    MdtRequiredFilesPageProps,
    RequiredFileFormState,
    RequiredFileSubmission,
    ReviewFormState,
    StudentFileUploadState,
    VerificationRow,
    VerifyModalState,
} from "./types";
import {
    createRequiredFileBlock,
    getBlockAcceptedTypes,
    getBlockDescription,
    getBlockMaxFileSize,
    getBlockTitle,
    getCourseEnrollmentsForVerification,
    getDefaultLessonBlocksByCourseAndBlockType,
    getEmptyFormState,
    getEmptyUploadForm,
    getEnrollmentId,
    getEnrollmentStudentId,
    getLessonName,
    getNextOrder,
    getRequiredFileSubmissionsByBlock,
    getReviewInitialForm,
    getStatusLabel,
    getSubmissionEnrollmentId,
    getSubmissionFileName,
    getSubmissionFileUrl,
    getSubmissionForEnrollment,
    getSubmissionId,
    getSubmissionStatus,
    getStudentEmail,
    getStudentName,
    getUploadRowKey,
    isRequiredFileBlock,
    mapReviewStatusToHomeworkStatus,
    mergeBlocks,
    normalizeSearch,
    readNumber,
    sortByOrder,
    updateRequiredFileBlock,
    updateRequiredFileSubmissionReview,
} from "./utils";

export function useMdtRequiredFiles(
    params: MdtRequiredFilesPageProps["params"],
) {
    const pathname = usePathname();
    const isAdminRoute = pathname.startsWith("/admin");

    const [courseId, setCourseId] = useState(0);

    const [modules, setModules] = useState<CourseModule[]>([]);
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [blocks, setBlocks] = useState<LessonBlock[]>([]);

    const [searchTerm, setSearchTerm] = useState("");
    const [verificationSearch, setVerificationSearch] = useState("");

    const [formModal, setFormModal] =
        useState<FormModalState | null>(null);

    const [deleteModal, setDeleteModal] =
        useState<DeleteModalState | null>(null);

    const [verifyModal, setVerifyModal] =
        useState<VerifyModalState | null>(null);

    const [formState, setFormState] =
        useState<RequiredFileFormState>(
            getEmptyFormState(),
        );

    const [enrollments, setEnrollments] = useState<
        EnrollmentRecord[]
    >([]);

    const [submissions, setSubmissions] = useState<
        RequiredFileSubmission[]
    >([]);

    const [reviewForms, setReviewForms] = useState<
        Record<string, ReviewFormState>
    >({});

    const [uploadForms, setUploadForms] = useState<
        Record<string, StudentFileUploadState>
    >({});

    const [isLoading, setIsLoading] = useState(true);

    const [
        isLoadingVerifications,
        setIsLoadingVerifications,
    ] = useState(false);

    const [isSaving, setIsSaving] = useState(false);
    const [savingReviewId, setSavingReviewId] = useState(0);
    const [savingUploadKey, setSavingUploadKey] = useState("");

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        let isMounted = true;

        void Promise.resolve(params).then((value) => {
            if (!isMounted) return;

            setCourseId(readNumber(value.courseId, 0));
        });

        return () => {
            isMounted = false;
        };
    }, [params]);

    const requiredBlocks = useMemo(
        () => blocks.filter(isRequiredFileBlock),
        [blocks],
    );

    const filteredBlocks = useMemo(() => {
        const query = normalizeSearch(searchTerm);

        if (!query) return requiredBlocks;

        return requiredBlocks.filter((block) => {
            const title = normalizeSearch(getBlockTitle(block));
            const description = normalizeSearch(
                getBlockDescription(block),
            );

            const lessonName = normalizeSearch(
                getLessonName(lessons, block.lesson_id),
            );

            const acceptedTypes = normalizeSearch(
                getBlockAcceptedTypes(block),
            );

            return (
                title.includes(query) ||
                description.includes(query) ||
                lessonName.includes(query) ||
                acceptedTypes.includes(query)
            );
        });
    }, [lessons, requiredBlocks, searchTerm]);

    const verificationRows = useMemo<VerificationRow[]>(() => {
        if (!verifyModal) return [];

        const rows = enrollments.map((enrollment) => ({
            enrollment,
            submission: getSubmissionForEnrollment(
                enrollment,
                submissions,
            ),
        }));

        const query = normalizeSearch(verificationSearch);

        if (!query) return rows;

        return rows.filter((row) => {
            const studentName = normalizeSearch(
                getStudentName(row.enrollment),
            );

            const studentEmail = normalizeSearch(
                getStudentEmail(row.enrollment),
            );

            const status = normalizeSearch(
                getStatusLabel(
                    getSubmissionStatus(row.submission),
                ),
            );

            const fileName = normalizeSearch(
                getSubmissionFileName(row.submission),
            );

            return (
                studentName.includes(query) ||
                studentEmail.includes(query) ||
                status.includes(query) ||
                fileName.includes(query)
            );
        });
    }, [
        enrollments,
        submissions,
        verificationSearch,
        verifyModal,
    ]);

    const verificationSummary = useMemo(() => {
        const allRows = enrollments.map((enrollment) => ({
            enrollment,
            submission: getSubmissionForEnrollment(
                enrollment,
                submissions,
            ),
        }));

        const submitted = allRows.filter((row) =>
            Boolean(getSubmissionFileUrl(row.submission)),
        ).length;

        const approved = allRows.filter(
            (row) =>
                getSubmissionStatus(row.submission) ===
                "approved",
        ).length;

        const observed = allRows.filter((row) =>
            ["observed", "rejected"].includes(
                getSubmissionStatus(row.submission),
            ),
        ).length;

        return {
            total: allRows.length,
            submitted,
            pending: Math.max(
                allRows.length - submitted,
                0,
            ),
            approved,
            observed,
        };
    }, [enrollments, submissions]);

    const firstLessonId = lessons[0]
        ? String(lessons[0].id)
        : "";

    const selectedLessonName = useMemo(() => {
        const lessonId = Number(formState.lessonId);

        if (!lessonId) return "Sin lección seleccionada";

        return getLessonName(lessons, lessonId);
    }, [formState.lessonId, lessons]);

    const hasCurrentLessonInOptions = useMemo(() => {
        if (!formState.lessonId) return true;

        return lessons.some(
            (lesson) =>
                Number(lesson.id) ===
                Number(formState.lessonId),
        );
    }, [formState.lessonId, lessons]);

    const loadData = useCallback(
        async (clearFeedback = true) => {
            if (!courseId) {
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);

                if (clearFeedback) {
                    setError("");
                    setMessage("");
                }

                const defaultBlocks =
                    await getDefaultLessonBlocksByCourseAndBlockType(
                        courseId,
                        REQUIRED_FILE_BLOCK_TYPE_ID,
                    );

                let moduleItems: CourseModule[] = [];
                let lessonItems: Lesson[] = [];
                let lessonBlockItems: LessonBlock[] = [];

                try {
                    moduleItems =
                        await getModulesByCourse(courseId);

                    const sortedModuleItems =
                        sortByOrder(moduleItems);

                    lessonItems = (
                        await Promise.all(
                            sortedModuleItems.map(
                                (moduleItem) =>
                                    getLessonsByModule(
                                        Number(
                                            moduleItem.id,
                                        ),
                                    ),
                            ),
                        )
                    ).flat();

                    const sortedLessonItems =
                        sortByOrder(lessonItems);

                    lessonBlockItems = (
                        await Promise.all(
                            sortedLessonItems.map(
                                (lessonItem) =>
                                    getLessonBlocksByLesson(
                                        Number(
                                            lessonItem.id,
                                        ),
                                    ),
                            ),
                        )
                    ).flat();

                    moduleItems = sortedModuleItems;
                    lessonItems = sortedLessonItems;
                } catch {
                    moduleItems = [];
                    lessonItems = [];
                    lessonBlockItems = [];
                }

                const mergedBlocks = mergeBlocks([
                    ...defaultBlocks,
                    ...lessonBlockItems,
                ]);

                setModules(sortByOrder(moduleItems));
                setLessons(sortByOrder(lessonItems));
                setBlocks(mergedBlocks);

                setFormState((current) => {
                    if (
                        current.lessonId &&
                        lessonItems.some(
                            (lesson) =>
                                Number(lesson.id) ===
                                Number(current.lessonId),
                        )
                    ) {
                        return current;
                    }

                    const firstLesson =
                        lessonItems[0];

                    return {
                        ...current,
                        lessonId: firstLesson
                            ? String(firstLesson.id)
                            : "",
                    };
                });
            } catch (currentError) {
                setError(
                    currentError instanceof Error
                        ? currentError.message
                        : "No se pudo cargar la información de archivos MDT.",
                );

                setModules([]);
                setLessons([]);
                setBlocks([]);
            } finally {
                setIsLoading(false);
            }
        },
        [courseId],
    );

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void loadData(true);
        }, 0);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [loadData]);

    useEffect(() => {
        if (!formModal && !deleteModal && !verifyModal) {
            return;
        }

        function closeWithEscape(event: KeyboardEvent) {
            if (
                event.key !== "Escape" ||
                isSaving ||
                savingReviewId ||
                savingUploadKey
            ) {
                return;
            }

            setFormModal(null);
            setDeleteModal(null);
            setVerifyModal(null);
        }

        document.addEventListener(
            "keydown",
            closeWithEscape,
        );

        return () => {
            document.removeEventListener(
                "keydown",
                closeWithEscape,
            );
        };
    }, [
        deleteModal,
        formModal,
        isSaving,
        savingReviewId,
        savingUploadKey,
        verifyModal,
    ]);

    function openCreateModal() {
        setError("");
        setMessage("");

        setFormState(
            getEmptyFormState(
                formState.lessonId ||
                    firstLessonId,
            ),
        );

        setFormModal({
            mode: "create",
        });
    }

    function openEditModal(block: LessonBlock) {
        setError("");
        setMessage("");

        setFormState({
            lessonId: String(block.lesson_id || ""),
            title: getBlockTitle(block),
            description: getBlockDescription(block),
            acceptedFileTypes:
                getBlockAcceptedTypes(block) ||
                DEFAULT_ACCEPTED_FILE_TYPES,
            maxFileSizeMb:
                getBlockMaxFileSize(block) || "10",
            file: null,
        });

        setFormModal({
            mode: "edit",
            block,
        });
    }

    function closeFormModal() {
        if (isSaving) return;

        setFormModal(null);

        setFormState(
            getEmptyFormState(firstLessonId),
        );
    }

    function openDeleteModal(block: LessonBlock) {
        setError("");
        setMessage("");

        setDeleteModal({
            block,
        });
    }

    function closeDeleteModal() {
        if (isSaving) return;

        setDeleteModal(null);
    }

    async function loadVerificationData(block: LessonBlock) {
        const blockId = readNumber(block.id, 0);

        if (!courseId || !blockId) {
            setError(
                "No se pudo identificar el curso o el archivo requerido.",
            );

            return;
        }

        try {
            setIsLoadingVerifications(true);
            setError("");

            const [
                enrollmentItems,
                submissionItems,
            ] = await Promise.all([
                getCourseEnrollmentsForVerification(
                    courseId,
                ),
                getRequiredFileSubmissionsByBlock(
                    blockId,
                ),
            ]);

            setEnrollments(enrollmentItems);
            setSubmissions(submissionItems);

            const nextForms: Record<
                string,
                ReviewFormState
            > = {};

            for (const submission of submissionItems) {
                const submissionId =
                    getSubmissionId(submission);

                if (!submissionId) continue;

                nextForms[String(submissionId)] =
                    getReviewInitialForm(
                        submission,
                    );
            }

            setReviewForms(nextForms);
            setUploadForms({});
        } catch (currentError) {
            setEnrollments([]);
            setSubmissions([]);
            setReviewForms({});
            setUploadForms({});

            setError(
                currentError instanceof Error
                    ? currentError.message
                    : "No se pudieron cargar los documentos enviados por los estudiantes.",
            );
        } finally {
            setIsLoadingVerifications(false);
        }
    }

    function openVerifyModal(block: LessonBlock) {
        setError("");
        setMessage("");
        setVerificationSearch("");

        setVerifyModal({
            block,
        });

        setEnrollments([]);
        setSubmissions([]);
        setReviewForms({});
        setUploadForms({});
        setSavingUploadKey("");

        void loadVerificationData(block);
    }

    function closeVerifyModal() {
        if (
            isLoadingVerifications ||
            savingReviewId ||
            savingUploadKey
        ) {
            return;
        }

        setVerifyModal(null);
        setVerificationSearch("");
        setEnrollments([]);
        setSubmissions([]);
        setReviewForms({});
        setUploadForms({});
        setSavingUploadKey("");
    }

    function updateReviewForm(
        submission: RequiredFileSubmission,
        updates: Partial<ReviewFormState>,
    ) {
        const submissionId =
            getSubmissionId(submission);

        if (!submissionId) return;

        setReviewForms((current) => ({
            ...current,
            [String(submissionId)]: {
                ...getReviewInitialForm(
                    submission,
                ),
                ...current[String(submissionId)],
                ...updates,
            },
        }));
    }

    function updateUploadForm(
        row: VerificationRow,
        updates: Partial<StudentFileUploadState>,
    ) {
        const rowKey = getUploadRowKey(row);

        setUploadForms((current) => ({
            ...current,
            [rowKey]: {
                ...getEmptyUploadForm(),
                ...current[rowKey],
                ...updates,
            },
        }));
    }

    function clearUploadForm(row: VerificationRow) {
        const rowKey = getUploadRowKey(row);

        setUploadForms((current) => {
            const next = {
                ...current,
            };

            delete next[rowKey];

            return next;
        });
    }

    async function handleUploadStudentFile(
        row: VerificationRow,
    ) {
        const rowKey = getUploadRowKey(row);

        const uploadForm =
            uploadForms[rowKey] ??
            getEmptyUploadForm();

        const selectedFile = uploadForm.file;

        const enrollmentId = getEnrollmentId(
            row.enrollment,
        );

        const blockId = readNumber(
            verifyModal?.block.id,
            0,
        );

        const submissionId = getSubmissionId(
            row.submission,
        );

        if (!selectedFile) {
            setError(
                "Selecciona el archivo que deseas subir o actualizar.",
            );

            return;
        }

        if (!enrollmentId) {
            setError(
                "No se encontró la matrícula del estudiante.",
            );

            return;
        }

        if (!blockId) {
            setError(
                "No se encontró el archivo obligatorio seleccionado.",
            );

            return;
        }

        try {
            setSavingUploadKey(rowKey);
            setError("");
            setMessage("");

            if (
                submissionId &&
                row.submission
            ) {
                const currentForm =
                    reviewForms[
                        String(submissionId)
                    ] ??
                    getReviewInitialForm(
                        row.submission,
                    );

                const updated =
                    await updateHomeworkResponse(
                        submissionId,
                        {
                            file: selectedFile,
                            comment:
                                uploadForm.comment.trim() ||
                                currentForm.feedback.trim(),
                            status:
                                mapReviewStatusToHomeworkStatus(
                                    currentForm.status,
                                ),
                        },
                    );

                const updatedSubmission =
                    updated as unknown as RequiredFileSubmission;

                setSubmissions((current) =>
                    current.map((item) =>
                        getSubmissionId(item) ===
                        submissionId
                            ? {
                                  ...item,
                                  ...updatedSubmission,
                              }
                            : item,
                    ),
                );

                setMessage(
                    "Archivo del estudiante actualizado correctamente.",
                );
            } else {
                const created =
                    await createHomeworkResponse({
                        enrollment_id:
                            enrollmentId,
                        lesson_block_id: blockId,
                        comment:
                            uploadForm.comment.trim(),
                        file: selectedFile,
                    });

                const createdSubmission =
                    created as unknown as RequiredFileSubmission;

                const createdSubmissionId =
                    getSubmissionId(
                        createdSubmission,
                    );

                setSubmissions((current) => {
                    const withoutDuplicates =
                        current.filter((item) => {
                            const sameEnrollment =
                                getSubmissionEnrollmentId(
                                    item,
                                ) ===
                                enrollmentId;

                            const sameBlock =
                                readNumber(
                                    item.lesson_block_id,
                                    0,
                                ) ===
                                    blockId ||
                                readNumber(
                                    item.lessonBlockId,
                                    0,
                                ) ===
                                    blockId;

                            return !(
                                sameEnrollment &&
                                sameBlock
                            );
                        });

                    return [
                        ...withoutDuplicates,
                        createdSubmission,
                    ];
                });

                if (createdSubmissionId) {
                    setReviewForms((current) => ({
                        ...current,
                        [String(
                            createdSubmissionId,
                        )]:
                            getReviewInitialForm(
                                createdSubmission,
                            ),
                    }));
                }

                setMessage(
                    "Archivo faltante subido correctamente.",
                );
            }

            clearUploadForm(row);
        } catch (currentError) {
            setError(
                currentError instanceof Error
                    ? currentError.message
                    : "No se pudo subir o actualizar el archivo del estudiante.",
            );
        } finally {
            setSavingUploadKey("");
        }
    }

    async function handleSaveReview(
        submission: RequiredFileSubmission | null,
    ) {
        if (!submission) {
            setError(
                "El estudiante todavía no ha subido este documento.",
            );

            return;
        }

        const submissionId =
            getSubmissionId(submission);

        if (!submissionId) {
            setError(
                "No se encontró el identificador de la entrega.",
            );

            return;
        }

        const currentForm =
            reviewForms[
                String(submissionId)
            ] ??
            getReviewInitialForm(submission);

        if (
            currentForm.score.trim() &&
            Number.isNaN(
                Number(currentForm.score.trim()),
            )
        ) {
            setError(
                "La calificación debe ser un número válido.",
            );

            return;
        }

        try {
            setSavingReviewId(submissionId);
            setError("");
            setMessage("");

            const updatedSubmission =
                await updateRequiredFileSubmissionReview(
                    submission,
                    currentForm,
                );

            setSubmissions((current) =>
                current.map((item) =>
                    getSubmissionId(item) ===
                    submissionId
                        ? {
                              ...item,
                              ...updatedSubmission,
                              status:
                                  currentForm.status,
                              review_status:
                                  currentForm.status,
                              teacher_status:
                                  currentForm.status,
                              feedback:
                                  currentForm.feedback,
                              teacher_feedback:
                                  currentForm.feedback,
                              observations:
                                  currentForm.feedback,
                              score:
                                  currentForm.score,
                          }
                        : item,
                ),
            );

            setMessage(
                "Documento del estudiante actualizado correctamente.",
            );
        } catch (currentError) {
            setError(
                currentError instanceof Error
                    ? currentError.message
                    : "No se pudo actualizar la revisión del documento.",
            );
        } finally {
            setSavingReviewId(0);
        }
    }

    function handleFileChange(
        event: ChangeEvent<HTMLInputElement>,
    ) {
        const file =
            event.target.files?.[0] ?? null;

        setFormState((current) => ({
            ...current,
            file,
        }));

        event.target.value = "";
    }

    function clearCapturedFile() {
        setFormState((current) => ({
            ...current,
            file: null,
        }));
    }

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        if (!formModal) return;

        const cleanTitle =
            formState.title.trim();

        const cleanDescription =
            formState.description.trim();

        const cleanAcceptedTypes =
            formState.acceptedFileTypes.trim();

        const cleanMaxFileSize =
            formState.maxFileSizeMb.trim();

        const lessonId = Number(
            formState.lessonId,
        );

        if (!lessonId) {
            setError(
                "Selecciona una lección para guardar el archivo.",
            );

            return;
        }

        if (!cleanTitle) {
            setError(
                "Escribe el nombre del archivo obligatorio.",
            );

            return;
        }

        if (!cleanDescription) {
            setError(
                "Escribe la descripción o indicación del archivo.",
            );

            return;
        }

        if (!cleanAcceptedTypes) {
            setError(
                "Indica los formatos permitidos.",
            );

            return;
        }

        if (
            !cleanMaxFileSize ||
            Number(cleanMaxFileSize) <= 0
        ) {
            setError(
                "Indica un tamaño máximo válido.",
            );

            return;
        }

        try {
            setIsSaving(true);
            setError("");
            setMessage("");

            if (formModal.mode === "create") {
                await createRequiredFileBlock({
                    lessonId,
                    title: cleanTitle,
                    description:
                        cleanDescription,
                    acceptedFileTypes:
                        cleanAcceptedTypes,
                    maxFileSizeMb:
                        cleanMaxFileSize,
                    order: getNextOrder(
                        blocks,
                        lessonId,
                    ),
                    file: formState.file,
                });

                setMessage(
                    "Archivo obligatorio creado correctamente.",
                );
            }

            if (formModal.mode === "edit") {
                const previousLessonId =
                    Number(
                        formModal.block
                            .lesson_id,
                    );

                const movedToAnotherLesson =
                    previousLessonId !==
                    lessonId;

                await updateRequiredFileBlock({
                    block: formModal.block,
                    lessonId,
                    title: cleanTitle,
                    description:
                        cleanDescription,
                    acceptedFileTypes:
                        cleanAcceptedTypes,
                    maxFileSizeMb:
                        cleanMaxFileSize,
                    order: movedToAnotherLesson
                        ? getNextOrder(
                              blocks,
                              lessonId,
                          )
                        : readNumber(
                              formModal.block
                                  .order,
                              1,
                          ),
                    file: formState.file,
                });

                setMessage(
                    "Archivo obligatorio actualizado correctamente.",
                );
            }

            setFormModal(null);

            setFormState(
                getEmptyFormState(
                    String(lessonId),
                ),
            );

            await loadData(false);
        } catch (currentError) {
            setError(
                currentError instanceof Error
                    ? currentError.message
                    : "No se pudo guardar el archivo obligatorio.",
            );
        } finally {
            setIsSaving(false);
        }
    }

    async function handleConfirmDelete() {
        if (!deleteModal) return;

        try {
            setIsSaving(true);
            setError("");
            setMessage("");

            await deleteLessonBlock(
                deleteModal.block.id,
            );

            setDeleteModal(null);

            setMessage(
                "Archivo obligatorio eliminado correctamente.",
            );

            await loadData(false);
        } catch (currentError) {
            setError(
                currentError instanceof Error
                    ? currentError.message
                    : "No se pudo eliminar el archivo obligatorio.",
            );
        } finally {
            setIsSaving(false);
        }
    }

    return {
        isAdminRoute,
        courseId,
        modules,
        lessons,
        blocks,
        requiredBlocks,
        filteredBlocks,
        searchTerm,
        setSearchTerm,
        verificationSearch,
        setVerificationSearch,
        formModal,
        deleteModal,
        verifyModal,
        formState,
        setFormState,
        submissions,
        reviewForms,
        uploadForms,
        isLoading,
        isLoadingVerifications,
        isSaving,
        message,
        error,
        savingReviewId,
        savingUploadKey,
        verificationRows,
        verificationSummary,
        selectedLessonName,
        hasCurrentLessonInOptions,
        loadData,
        openCreateModal,
        openEditModal,
        closeFormModal,
        openDeleteModal,
        closeDeleteModal,
        openVerifyModal,
        closeVerifyModal,
        loadVerificationData,
        updateReviewForm,
        updateUploadForm,
        handleUploadStudentFile,
        handleSaveReview,
        handleFileChange,
        clearCapturedFile,
        handleSubmit,
        handleConfirmDelete,
    };
}


export type MdtRequiredFilesState =
    ReturnType<typeof useMdtRequiredFiles>;
