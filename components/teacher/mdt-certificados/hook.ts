"use client";

import {
    type ChangeEvent,
    type DragEvent,
    type FormEvent,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import {
    usePathname,
    useRouter,
} from "next/navigation";
import { notify } from "@/lib/notify";
import {
    createMdtCertificate,
    deleteMdtCertificate,
    getMdtCertificatesByCourseId,
    updateMdtCertificate,
    type MdtCertificate,
} from "@/services/mdt-certificates.service";
import {
    getEnrollmentsByCourseAndRole,
    type Enrollment,
} from "@/services/enrollments.service";
import { STUDENT_ROLE_ID } from "./constants";
import type {
    CourseStudent,
    DeleteModalState,
    MdtCertificatesTeacherViewProps,
    UploadType,
} from "./types";
import {
    adaptCourseStudent,
    getErrorMessage,
    getFileKey,
    getIdNumberFromFileName,
    isPdfFile,
    normalizeSearch,
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

export function useMdtCertificatesTeacher({
    initialCourseId = 0,
    lockCourse = false,
}: MdtCertificatesTeacherViewProps) {
    const router = useRouter();
    const pathname = usePathname();

    const isAdminRoute = pathname.startsWith("/admin/");

    const certificatesRequestRef = useRef<{
        courseId: number;
        promise: Promise<boolean>;
    } | null>(null);

    const studentsRequestRef = useRef<{
        courseId: number;
        promise: Promise<boolean>;
    } | null>(null);

    const refreshMutationRef = useRef(false);
    const uploadMutationRef = useRef(false);
    const certificateMutationRef = useRef<number | null>(null);
    const hasCompletedInitialLoadRef = useRef(initialCourseId <= 0);

    const [uploadModalOpen, setUploadModalOpen] =
        useState(false);

    const [deleteModal, setDeleteModal] =
        useState<DeleteModalState | null>(null);

    const [courseId, setCourseId] = useState(() =>
        initialCourseId > 0 ? String(initialCourseId) : "",
    );

    const [students, setStudents] = useState<CourseStudent[]>([]);

    const [selectedEnrollmentId, setSelectedEnrollmentId] =
        useState("");

    const [certificateType, setCertificateType] =
        useState("MDT");

    const [uploadType, setUploadType] =
        useState<UploadType>("individual");

    const [file, setFile] = useState<File | null>(null);

    const [bulkFiles, setBulkFiles] =
        useState<File[]>([]);

    const [certificates, setCertificates] =
        useState<MdtCertificate[]>([]);

    const [searchTerm, setSearchTerm] = useState("");

    const [showDeleted, setShowDeleted] = useState(true);

    const [initialLoading, setInitialLoading] = useState(
        initialCourseId > 0,
    );

    const [loading, setLoading] = useState(false);

    const [loadingStudents, setLoadingStudents] =
        useState(false);

    const [uploading, setUploading] = useState(false);

    const [processingId, setProcessingId] =
        useState<number | null>(null);

    const [errorMessage, setErrorMessage] =
        useState("");

    const currentCourseId =
        lockCourse && initialCourseId > 0
            ? String(initialCourseId)
            : courseId;

    const numericCourseId = useMemo(
        () => Number(currentCourseId),
        [currentCourseId],
    );

    const selectedStudent = useMemo(() => {
        return students.find(
            (student) =>
                String(student.enrollmentId) ===
                selectedEnrollmentId,
        );
    }, [selectedEnrollmentId, students]);

    const activeCount = useMemo(
        () =>
            certificates.filter(
                (certificate) => !certificate.deleted,
            ).length,
        [certificates],
    );

    const deletedCount = useMemo(
        () =>
            certificates.filter(
                (certificate) => certificate.deleted,
            ).length,
        [certificates],
    );

    const selectedFiles = useMemo(() => {
        if (uploadType === "individual") {
            return file ? [file] : [];
        }

        return bulkFiles;
    }, [bulkFiles, file, uploadType]);

    const filteredCertificates = useMemo(() => {
        const normalizedTerm =
            normalizeSearch(searchTerm);

        return certificates
            .filter((certificate) => {
                if (showDeleted) return true;

                return !certificate.deleted;
            })
            .filter((certificate) => {
                if (!normalizedTerm) return true;

                const searchableContent = normalizeSearch(
                    [
                        certificate.file_name,
                        certificate.id_number,
                        certificate.certificate_type,
                        certificate.created_at,
                    ].join(" "),
                );

                return searchableContent.includes(
                    normalizedTerm,
                );
            });
    }, [certificates, searchTerm, showDeleted]);

    const isMutating =
        uploading || processingId !== null;

    const isBusy =
        initialLoading ||
        loading ||
        loadingStudents ||
        isMutating;

    const loadCertificates = useCallback(
        async (requestedCourseId?: number) => {
            const validCourseId =
                requestedCourseId ?? numericCourseId;

            if (
                !Number.isFinite(validCourseId) ||
                validCourseId <= 0
            ) {
                setCertificates([]);
                setInitialLoading(false);
                hasCompletedInitialLoadRef.current = true;
                notify.warning("Ingrese un ID de curso válido.");

                return false;
            }

            const activeRequest = certificatesRequestRef.current;

            if (activeRequest) {
                return activeRequest.promise;
            }

            const request = (async () => {
                setLoading(true);
                setErrorMessage("");

                if (!hasCompletedInitialLoadRef.current) {
                    setInitialLoading(true);
                }

                try {
                    const data =
                        await getMdtCertificatesByCourseId(
                            validCourseId,
                        );

                    setCertificates(
                        Array.isArray(data) ? data : [],
                    );

                    return true;
                } catch (error) {
                    setCertificates([]);
                    setErrorMessage(
                        getErrorMessage(error),
                    );

                    return false;
                } finally {
                    setLoading(false);
                    setInitialLoading(false);
                    hasCompletedInitialLoadRef.current = true;
                }
            })();

            certificatesRequestRef.current = {
                courseId: validCourseId,
                promise: request,
            };

            try {
                return await request;
            } finally {
                if (
                    certificatesRequestRef.current?.promise ===
                    request
                ) {
                    certificatesRequestRef.current = null;
                }
            }
        },
        [numericCourseId],
    );

    const loadStudents = useCallback(
        async (
            requestedCourseId?: number,
            showErrorToast = false,
        ) => {
            const validCourseId =
                requestedCourseId ?? numericCourseId;

            if (
                !Number.isFinite(validCourseId) ||
                validCourseId <= 0
            ) {
                setStudents([]);

                if (showErrorToast) {
                    notify.warning("Ingrese un ID de curso válido.");
                }

                return false;
            }

            const activeRequest = studentsRequestRef.current;

            if (activeRequest) {
                return activeRequest.promise;
            }

            const request = (async () => {
                setLoadingStudents(true);

                try {
                    const data =
                        await getEnrollmentsByCourseAndRole(
                            validCourseId,
                            STUDENT_ROLE_ID,
                        );

                    const adaptedStudents = Array.isArray(data)
                        ? data
                              .map((enrollment) =>
                                  adaptCourseStudent(
                                      enrollment as Enrollment,
                                  ),
                              )
                              .filter((student) => {
                                  return (
                                      student.enrollmentId > 0 ||
                                      student.userId > 0 ||
                                      student.idnumber.trim()
                                          .length > 0
                                  );
                              })
                        : [];

                    setStudents(adaptedStudents);

                    return true;
                } catch (error) {
                    setStudents([]);

                    if (showErrorToast) {
                        notify.error(
                            getErrorMessage(error),
                        );
                    }

                    return false;
                } finally {
                    setLoadingStudents(false);
                }
            })();

            studentsRequestRef.current = {
                courseId: validCourseId,
                promise: request,
            };

            try {
                return await request;
            } finally {
                if (
                    studentsRequestRef.current?.promise ===
                    request
                ) {
                    studentsRequestRef.current = null;
                }
            }
        },
        [numericCourseId],
    );

    useEffect(() => {
        if (initialCourseId <= 0) return;

        const timeoutId = window.setTimeout(() => {
            void loadCertificates(initialCourseId);
            void loadStudents(initialCourseId);
        }, 0);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [
        initialCourseId,
        loadCertificates,
        loadStudents,
    ]);

    useEffect(() => {
        if (!uploadModalOpen && !deleteModal) {
            return;
        }

        function closeWithEscape(event: KeyboardEvent) {
            if (
                event.key !== "Escape" ||
                uploading ||
                processingId !== null
            ) {
                return;
            }

            setUploadModalOpen(false);
            setDeleteModal(null);
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
        processingId,
        uploadModalOpen,
        uploading,
    ]);

    async function submitUpload(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        if (uploadMutationRef.current) {
            notify.warning(
                "La carga de certificados ya está en proceso.",
            );
            return;
        }

        if (
            !Number.isFinite(numericCourseId) ||
            numericCourseId <= 0
        ) {
            notify.warning("Ingrese un ID de curso válido.");
            return;
        }

        if (!certificateType.trim()) {
            notify.warning(
                "Seleccione el tipo de certificado.",
            );
            return;
        }

        if (
            uploadType === "individual" &&
            !selectedStudent
        ) {
            notify.warning(
                "Seleccione un estudiante del curso.",
            );
            return;
        }

        if (
            uploadType === "individual" &&
            selectedStudent &&
            !selectedStudent.idnumber.trim()
        ) {
            notify.warning(
                "El estudiante seleccionado no tiene número de identificación registrado.",
            );
            return;
        }

        if (
            uploadType === "individual" &&
            !file
        ) {
            notify.warning(
                "Seleccione el certificado del estudiante.",
            );
            return;
        }

        if (
            uploadType === "bulk" &&
            bulkFiles.length === 0
        ) {
            notify.warning(
                "Seleccione uno o varios certificados para subir.",
            );
            return;
        }

        if (uploadType === "bulk") {
            const filesWithoutIdNumber =
                bulkFiles.filter(
                    (currentFile) =>
                        !getIdNumberFromFileName(
                            currentFile.name,
                        ),
                );

            if (filesWithoutIdNumber.length > 0) {
                notify.warning(
                    `Los archivos deben llamarse con la cédula. Ejemplo: 1312345678.pdf. Revise: ${filesWithoutIdNumber
                        .map(
                            (currentFile) =>
                                currentFile.name,
                        )
                        .slice(0, 3)
                        .join(", ")}`,
                );
                return;
            }
        }

        uploadMutationRef.current = true;
        setUploading(true);

        const dismissLoadingToast = createLoadingToast(
            uploadType === "individual"
                ? "Subiendo certificado..."
                : `Subiendo ${bulkFiles.length} certificado(s)...`,
        );

        try {
            if (uploadType === "individual") {
                await createMdtCertificate({
                    file: file as File,
                    course_id: numericCourseId,
                    id_number:
                        selectedStudent?.idnumber ?? "",
                    certificate_type:
                        certificateType.trim(),
                });

                dismissLoadingToast();
                notify.success(
                    "Certificado subido correctamente.",
                );
            } else {
                for (const currentFile of bulkFiles) {
                    await createMdtCertificate({
                        file: currentFile,
                        course_id: numericCourseId,
                        id_number:
                            getIdNumberFromFileName(
                                currentFile.name,
                            ),
                        certificate_type:
                            certificateType.trim(),
                    });
                }

                dismissLoadingToast();
                notify.success(
                    `${bulkFiles.length} certificado(s) subido(s) correctamente.`,
                );
            }

            resetFiles();
            setSelectedEnrollmentId("");
            setUploadModalOpen(false);

            await loadCertificates(numericCourseId);
        } catch (error) {
            notify.error(getErrorMessage(error));
        } finally {
            dismissLoadingToast();
            setUploading(false);
            uploadMutationRef.current = false;
        }
    }

    async function toggleCertificateState(
        certificate: MdtCertificate,
    ) {
        if (certificateMutationRef.current !== null) {
            notify.warning(
                "Espera a que finalice la acción actual.",
            );
            return;
        }

        certificateMutationRef.current = certificate.id;
        setProcessingId(certificate.id);

        const nextDeleted = !certificate.deleted;
        const dismissLoadingToast = createLoadingToast(
            nextDeleted
                ? "Ocultando certificado..."
                : "Restaurando certificado...",
        );

        try {
            const updatedCertificate =
                await updateMdtCertificate(
                    certificate.id,
                    {
                        deleted: nextDeleted,
                    },
                );

            setCertificates((current) =>
                current.map((item) =>
                    item.id === updatedCertificate.id
                        ? updatedCertificate
                        : item,
                ),
            );

            dismissLoadingToast();
            notify.success(
                certificate.deleted
                    ? "Certificado restaurado correctamente."
                    : "Certificado ocultado correctamente.",
            );
        } catch (error) {
            notify.error(getErrorMessage(error));
        } finally {
            dismissLoadingToast();
            setProcessingId(null);
            certificateMutationRef.current = null;
        }
    }

    async function confirmDeleteCertificate() {
        if (!deleteModal) return;

        if (certificateMutationRef.current !== null) {
            notify.warning(
                "Espera a que finalice la acción actual.",
            );
            return;
        }

        const certificateId =
            deleteModal.certificate.id;

        certificateMutationRef.current = certificateId;
        setProcessingId(certificateId);

        const dismissLoadingToast = createLoadingToast(
            "Eliminando certificado...",
        );

        try {
            const deletedCertificate =
                await deleteMdtCertificate(
                    certificateId,
                );

            setCertificates((current) =>
                current.map((certificate) =>
                    certificate.id ===
                    deletedCertificate.id
                        ? deletedCertificate
                        : certificate,
                ),
            );

            setDeleteModal(null);
            dismissLoadingToast();
            notify.success(
                "Certificado eliminado correctamente.",
            );
        } catch (error) {
            notify.error(getErrorMessage(error));
        } finally {
            dismissLoadingToast();
            setProcessingId(null);
            certificateMutationRef.current = null;
        }
    }

    function selectFiles(
        event: ChangeEvent<HTMLInputElement>,
    ) {
        const currentFiles = Array.from(
            event.target.files ?? [],
        ) as File[];

        assignFiles(currentFiles);

        event.target.value = "";
    }

    function dropFiles(
        event: DragEvent<HTMLDivElement>,
    ) {
        event.preventDefault();

        if (uploadMutationRef.current) {
            notify.warning(
                "Espera a que finalice la carga actual.",
            );
            return;
        }

        const currentFiles = Array.from(
            event.dataTransfer.files ?? [],
        ) as File[];

        assignFiles(currentFiles);
    }

    function assignFiles(currentFiles: File[]) {
        if (uploadMutationRef.current) {
            notify.warning(
                "Espera a que finalice la carga actual.",
            );
            return;
        }

        const validFiles = currentFiles.filter(
            isPdfFile,
        );

        if (currentFiles.length > validFiles.length) {
            notify.warning(
                "Se omitieron archivos con formatos no permitidos.",
            );
        }

        if (validFiles.length === 0) {
            notify.warning(
                "Seleccione únicamente archivos PDF.",
            );
            return;
        }

        const firstFile = validFiles[0] ?? null;

        if (uploadType === "individual") {
            setFile(firstFile);
            setBulkFiles([]);

            return;
        }

        setFile(null);

        setBulkFiles((previousFiles) => {
            const uniqueFiles = new Map<
                string,
                File
            >();

            [
                ...previousFiles,
                ...validFiles,
            ].forEach((currentFile) => {
                uniqueFiles.set(
                    getFileKey(currentFile),
                    currentFile,
                );
            });

            return Array.from(
                uniqueFiles.values(),
            );
        });
    }

    function removeCapturedFile(
        currentFile: File,
    ) {
        if (uploadMutationRef.current) return;

        if (uploadType === "individual") {
            setFile(null);
            return;
        }

        const key = getFileKey(currentFile);

        setBulkFiles((previousFiles) =>
            previousFiles.filter(
                (item) => getFileKey(item) !== key,
            ),
        );
    }

    function resetFiles() {
        setFile(null);
        setBulkFiles([]);

    }

    function clearFiles() {
        if (uploadMutationRef.current) return;

        resetFiles();
    }

    function changeUploadType(
        nextUploadType: UploadType,
    ) {
        if (uploadMutationRef.current) return;

        setUploadType(nextUploadType);
        clearFiles();

        if (nextUploadType === "bulk") {
            setSelectedEnrollmentId("");
        }
    }

    function openUploadModal() {
        if (isMutating) {
            notify.warning(
                "Espera a que finalice la acción actual.",
            );
            return;
        }

        clearFiles();

        if (
            Number.isFinite(numericCourseId) &&
            numericCourseId > 0
        ) {
            void loadStudents(numericCourseId, true);
        }

        setUploadModalOpen(true);
    }

    function closeUploadModal() {
        if (uploading) return;

        setUploadModalOpen(false);
    }

    function closeDeleteModal() {
        if (processingId !== null) return;

        setDeleteModal(null);
    }

    async function consultAll() {
        if (refreshMutationRef.current || isMutating) {
            notify.warning(
                "Espera a que finalice la acción actual.",
            );
            return;
        }

        if (
            !Number.isFinite(numericCourseId) ||
            numericCourseId <= 0
        ) {
            notify.warning("Ingrese un ID de curso válido.");
            return;
        }

        refreshMutationRef.current = true;
        const dismissLoadingToast = createLoadingToast(
            "Actualizando certificados...",
        );

        try {
            const [certificatesLoaded, studentsLoaded] =
                await Promise.all([
                    loadCertificates(numericCourseId),
                    loadStudents(numericCourseId),
                ]);

            if (certificatesLoaded && studentsLoaded) {
                notify.success(
                    "Certificados actualizados correctamente.",
                );
            } else {
                notify.error(
                    "No se pudo actualizar toda la información.",
                );
            }
        } finally {
            dismissLoadingToast();
            refreshMutationRef.current = false;
        }
    }

    function changeAdminCourse() {
        if (isMutating) {
            notify.warning(
                "Espera a que finalice la acción actual.",
            );
            return;
        }

        router.push("/admin/mdt-certificados");
    }

    return {
        isAdminRoute,
        lockCourse,
        courseId,
        setCourseId,
        numericCourseId,
        students,
        selectedEnrollmentId,
        setSelectedEnrollmentId,
        selectedStudent,
        certificateType,
        setCertificateType,
        uploadType,
        selectedFiles,
        certificates,
        filteredCertificates,
        activeCount,
        deletedCount,
        searchTerm,
        setSearchTerm,
        showDeleted,
        setShowDeleted,
        initialLoading,
        loading,
        loadingStudents,
        uploading,
        processingId,
        isBusy,
        isMutating,
        errorMessage,
        uploadModalOpen,
        deleteModal,
        setDeleteModal,
        loadCertificates,
        loadStudents,
        submitUpload,
        toggleCertificateState,
        confirmDeleteCertificate,
        selectFiles,
        dropFiles,
        removeCapturedFile,
        clearFiles,
        changeUploadType,
        openUploadModal,
        closeUploadModal,
        closeDeleteModal,
        consultAll,
        changeAdminCourse,
    };
}

export type MdtCertificatesTeacherState =
    ReturnType<typeof useMdtCertificatesTeacher>;
