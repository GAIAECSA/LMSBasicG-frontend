"use client";

import {
    type ChangeEvent,
    type FormEvent,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { usePathname } from "next/navigation";
import { notify } from "@/lib/notify";
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

function createLoadingToast(message: string) {
    const toastId = notify.loading(message);
    let dismissed = false;

    return () => {
        if (dismissed) return;

        notify.dismiss(toastId);
        dismissed = true;
    };
}

function getErrorMessage(error: unknown, fallback: string) {
    return error instanceof Error && error.message.trim()
        ? error.message
        : fallback;
}

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

    const [error, setError] = useState("");

    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

    const loadRequestRef = useRef<{
        courseId: number;
        promise: Promise<void>;
    } | null>(null);
    const verificationRequestRef = useRef<{
        blockId: number;
        promise: Promise<void>;
    } | null>(null);
    const verificationRequestSequenceRef = useRef(0);
    const requiredFileMutationRef = useRef(false);
    const reviewMutationRef = useRef<number | null>(null);
    const uploadMutationRef = useRef<string | null>(null);

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
        () =>
            blocks.filter(
                (block) =>
                    isRequiredFileBlock(block) &&
                    isRequiredFileWithoutLesson(block),
            ),
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

            const blockLessonId =
                block.lesson_id !== null &&
                    block.lesson_id !== undefined
                    ? Number(block.lesson_id)
                    : null;

            const lessonName =
                blockLessonId !== null &&
                    Number.isFinite(blockLessonId) &&
                    blockLessonId > 0
                    ? normalizeSearch(
                        getLessonName(
                            lessons,
                            blockLessonId,
                        ),
                    )
                    : "";

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
        async (clearFeedback = true, showToast = false) => {
            if (!courseId) {
                setIsLoading(false);
                return;
            }

            const activeRequest = loadRequestRef.current;

            if (activeRequest?.courseId === courseId) {
                if (showToast) {
                    notify.warning(
                        "La información de archivos MDT ya se está actualizando.",
                    );
                }

                return activeRequest.promise;
            }

            const requestPromise = (async () => {
                const dismissLoadingToast = showToast
                    ? createLoadingToast("Actualizando archivos MDT...")
                    : () => undefined;

                try {
                    setIsLoading(true);

                    if (clearFeedback) {
                        setError("");
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

                    if (showToast) {
                        notify.success(
                            "Archivos MDT actualizados correctamente.",
                        );
                    }
                } catch (currentError) {
                    const errorMessage = getErrorMessage(
                        currentError,
                        "No se pudo cargar la información de archivos MDT.",
                    );

                    setError(errorMessage);
                    setModules([]);
                    setLessons([]);
                    setBlocks([]);
                    notify.error(errorMessage);
                } finally {
                    setHasLoadedOnce(true);
                    dismissLoadingToast();
                    setIsLoading(false);
                }
            })();

            loadRequestRef.current = {
                courseId,
                promise: requestPromise,
            };

            try {
                await requestPromise;
            } finally {
                if (loadRequestRef.current?.promise === requestPromise) {
                    loadRequestRef.current = null;
                }
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

        setDeleteModal({
            block,
        });
    }

    function closeDeleteModal() {
        if (isSaving) return;

        setDeleteModal(null);
    }

    async function loadVerificationData(
        block: LessonBlock,
        showToast = false,
    ) {
        const blockId = readNumber(block.id, 0);

        if (!courseId || !blockId) {
            notify.error(
                "No se pudo identificar el curso o el archivo requerido.",
            );

            return;
        }

        const activeRequest = verificationRequestRef.current;

        if (activeRequest?.blockId === blockId) {
            if (showToast) {
                notify.warning(
                    "Los documentos enviados ya se están actualizando.",
                );
            }

            return activeRequest.promise;
        }

        const requestSequence =
            verificationRequestSequenceRef.current + 1;

        verificationRequestSequenceRef.current = requestSequence;

        const requestPromise = (async () => {
            const dismissLoadingToast = showToast
                ? createLoadingToast(
                    "Actualizando documentos enviados...",
                )
                : () => undefined;

            try {
                setIsLoadingVerifications(true);

                const [enrollmentItems, submissionItems] =
                    await Promise.all([
                        getCourseEnrollmentsForVerification(
                            courseId,
                        ),
                        getRequiredFileSubmissionsByBlock(
                            blockId,
                        ),
                    ]);

                if (
                    verificationRequestSequenceRef.current !==
                    requestSequence
                ) {
                    return;
                }

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

                if (showToast) {
                    notify.success(
                        "Documentos enviados actualizados correctamente.",
                    );
                }
            } catch (currentError) {
                if (
                    verificationRequestSequenceRef.current ===
                    requestSequence
                ) {
                    setEnrollments([]);
                    setSubmissions([]);
                    setReviewForms({});
                    setUploadForms({});
                }

                notify.error(
                    getErrorMessage(
                        currentError,
                        "No se pudieron cargar los documentos enviados por los estudiantes.",
                    ),
                );
            } finally {
                dismissLoadingToast();

                if (
                    verificationRequestSequenceRef.current ===
                    requestSequence
                ) {
                    setIsLoadingVerifications(false);
                }
            }
        })();

        verificationRequestRef.current = {
            blockId,
            promise: requestPromise,
        };

        try {
            await requestPromise;
        } finally {
            if (
                verificationRequestRef.current?.promise ===
                requestPromise
            ) {
                verificationRequestRef.current = null;
            }
        }
    }

    function openVerifyModal(block: LessonBlock) {
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

        if (uploadMutationRef.current) {
            notify.warning(
                "Espera a que termine la carga del archivo en proceso.",
            );
            return;
        }

        if (reviewMutationRef.current) {
            notify.warning(
                "Espera a que termine la revisión en proceso.",
            );
            return;
        }

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
            notify.warning(
                "Selecciona el archivo que deseas subir o actualizar.",
            );

            return;
        }

        if (!enrollmentId) {
            notify.error(
                "No se encontró la matrícula del estudiante.",
            );

            return;
        }

        if (!blockId) {
            notify.error(
                "No se encontró el archivo obligatorio seleccionado.",
            );

            return;
        }

        uploadMutationRef.current = rowKey;
        setSavingUploadKey(rowKey);

        const dismissLoadingToast = createLoadingToast(
            submissionId
                ? "Actualizando archivo del estudiante..."
                : "Subiendo archivo del estudiante...",
        );

        try {
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

                notify.success(
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

                notify.success(
                    "Archivo faltante subido correctamente.",
                );
            }

            clearUploadForm(row);
        } catch (currentError) {
            notify.error(
                getErrorMessage(
                    currentError,
                    "No se pudo subir o actualizar el archivo del estudiante.",
                ),
            );
        } finally {
            dismissLoadingToast();

            if (uploadMutationRef.current === rowKey) {
                uploadMutationRef.current = null;
            }

            setSavingUploadKey("");
        }
    }

    async function handleSaveReview(
        submission: RequiredFileSubmission | null,
    ) {
        if (reviewMutationRef.current) {
            notify.warning(
                "Espera a que termine la revisión en proceso.",
            );
            return;
        }

        if (uploadMutationRef.current) {
            notify.warning(
                "Espera a que termine la carga del archivo en proceso.",
            );
            return;
        }

        if (!submission) {
            notify.warning(
                "El estudiante todavía no ha subido este documento.",
            );

            return;
        }

        const submissionId =
            getSubmissionId(submission);

        if (!submissionId) {
            notify.error(
                "No se encontró el identificador de la entrega.",
            );

            return;
        }

        const currentForm =
            reviewForms[
            String(submissionId)
            ] ??
            getReviewInitialForm(submission);

        const cleanScore = currentForm.score.trim();
        const numericScore = Number(cleanScore);

        if (cleanScore && !Number.isFinite(numericScore)) {
            notify.warning(
                "La calificación debe ser un número válido.",
            );

            return;
        }

        if (cleanScore && (numericScore < 0 || numericScore > 10)) {
            notify.warning(
                "La calificación debe estar entre 0 y 10.",
            );

            return;
        }

        reviewMutationRef.current = submissionId;
        setSavingReviewId(submissionId);

        const dismissLoadingToast = createLoadingToast(
            "Guardando revisión del documento...",
        );

        try {
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

            notify.success(
                "Documento del estudiante actualizado correctamente.",
            );
        } catch (currentError) {
            notify.error(
                getErrorMessage(
                    currentError,
                    "No se pudo actualizar la revisión del documento.",
                ),
            );
        } finally {
            dismissLoadingToast();

            if (reviewMutationRef.current === submissionId) {
                reviewMutationRef.current = null;
            }

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

        if (requiredFileMutationRef.current) {
            notify.warning(
                "Espera a que termine el proceso en curso.",
            );
            return;
        }

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

        const maxFileSize = Number(cleanMaxFileSize);

        if (!lessonId) {
            notify.warning(
                "Selecciona una lección para guardar el archivo.",
            );

            return;
        }

        if (!cleanTitle) {
            notify.warning(
                "Escribe el nombre del archivo obligatorio.",
            );

            return;
        }

        if (!cleanDescription) {
            notify.warning(
                "Escribe la descripción o indicación del archivo.",
            );

            return;
        }

        if (!cleanAcceptedTypes) {
            notify.warning(
                "Indica los formatos permitidos.",
            );

            return;
        }

        if (
            !cleanMaxFileSize ||
            !Number.isFinite(maxFileSize) ||
            maxFileSize <= 0
        ) {
            notify.warning(
                "Indica un tamaño máximo válido.",
            );

            return;
        }

        requiredFileMutationRef.current = true;
        setIsSaving(true);

        const isCreating = formModal.mode === "create";
        const dismissLoadingToast = createLoadingToast(
            isCreating
                ? "Creando archivo obligatorio..."
                : "Actualizando archivo obligatorio...",
        );

        try {
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

                notify.success(
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

                notify.success(
                    "Archivo obligatorio actualizado correctamente.",
                );
            }

            setFormModal(null);

            setFormState(
                getEmptyFormState(
                    String(lessonId),
                ),
            );

            await loadData(false, false);
        } catch (currentError) {
            notify.error(
                getErrorMessage(
                    currentError,
                    "No se pudo guardar el archivo obligatorio.",
                ),
            );
        } finally {
            dismissLoadingToast();
            requiredFileMutationRef.current = false;
            setIsSaving(false);
        }
    }

    async function handleConfirmDelete() {
        if (!deleteModal) return;

        if (requiredFileMutationRef.current) {
            notify.warning(
                "Espera a que termine el proceso en curso.",
            );
            return;
        }

        requiredFileMutationRef.current = true;
        setIsSaving(true);

        const dismissLoadingToast = createLoadingToast(
            "Eliminando archivo obligatorio...",
        );

        try {
            await deleteLessonBlock(
                deleteModal.block.id,
            );

            setDeleteModal(null);

            notify.success(
                "Archivo obligatorio eliminado correctamente.",
            );

            await loadData(false, false);
        } catch (currentError) {
            notify.error(
                getErrorMessage(
                    currentError,
                    "No se pudo eliminar el archivo obligatorio.",
                ),
            );
        } finally {
            dismissLoadingToast();
            requiredFileMutationRef.current = false;
            setIsSaving(false);
        }
    }

    const isInitialLoading =
        isLoading && !hasLoadedOnce;

    const isBusy =
        isLoading ||
        isSaving ||
        isLoadingVerifications ||
        Boolean(savingReviewId) ||
        Boolean(savingUploadKey);

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
        isInitialLoading,
        isBusy,
        isLoadingVerifications,
        isSaving,
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

function isRequiredFileWithoutLesson(
    block: LessonBlock,
): boolean {
    const lessonId = (
        block as LessonBlock & {
            lesson_id?:
            | number
            | string
            | null;
        }
    ).lesson_id;

    if (
        lessonId === null ||
        lessonId === undefined ||
        String(lessonId).trim() === ""
    ) {
        return true;
    }

    const numericLessonId =
        Number(lessonId);

    return (
        Number.isFinite(numericLessonId) &&
        numericLessonId <= 0
    );
}


export type MdtRequiredFilesState =
    ReturnType<typeof useMdtRequiredFiles>;
