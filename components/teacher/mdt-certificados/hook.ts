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
import {
    ACCEPTED_CERTIFICATE_FILES,
    STUDENT_ROLE_ID,
} from "./constants";
import type {
    CourseStudent,
    DeleteModalState,
    EditModalState,
    MdtCertificatesTeacherViewProps,
    UploadType,
    UpdateMdtCertificatePayload,
} from "./types";
import {
    adaptCourseStudent,
    getErrorMessage,
    getFileKey,
    getIdNumberFromFileName,
    normalizeIdNumber,
    normalizeSearch,
} from "./utils";

export function useMdtCertificatesTeacher({
    initialCourseId = 0,
    lockCourse = false,
}: MdtCertificatesTeacherViewProps) {
    const router = useRouter();
    const pathname = usePathname();

    const isAdminRoute = pathname.startsWith("/admin/");

    const filesInputRef =
        useRef<HTMLInputElement | null>(null);

    const multipleFilesInputRef =
        useRef<HTMLInputElement | null>(null);

    const [uploadModalOpen, setUploadModalOpen] =
        useState(false);

    const [deleteModal, setDeleteModal] =
        useState<DeleteModalState | null>(null);

    const [editModal, setEditModal] =
        useState<EditModalState | null>(null);

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

    const [loading, setLoading] = useState(false);

    const [loadingStudents, setLoadingStudents] =
        useState(false);

    const [uploading, setUploading] = useState(false);

    const [editing, setEditing] = useState(false);

    const [processingId, setProcessingId] =
        useState<number | null>(null);

    const [successMessage, setSuccessMessage] =
        useState("");

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

    const loadCertificates = useCallback(
        async (requestedCourseId?: number) => {
            const validCourseId =
                requestedCourseId ?? numericCourseId;

            setErrorMessage("");
            setSuccessMessage("");

            if (
                !Number.isFinite(validCourseId) ||
                validCourseId <= 0
            ) {
                setCertificates([]);
                setErrorMessage(
                    "Ingrese un ID de curso válido.",
                );

                return;
            }

            try {
                setLoading(true);

                const data =
                    await getMdtCertificatesByCourseId(
                        validCourseId,
                    );

                setCertificates(
                    Array.isArray(data) ? data : [],
                );
            } catch (error) {
                setCertificates([]);
                setErrorMessage(
                    getErrorMessage(error),
                );
            } finally {
                setLoading(false);
            }
        },
        [numericCourseId],
    );

    const loadStudents = useCallback(
        async (requestedCourseId?: number) => {
            const validCourseId =
                requestedCourseId ?? numericCourseId;

            if (
                !Number.isFinite(validCourseId) ||
                validCourseId <= 0
            ) {
                setStudents([]);
                return;
            }

            try {
                setLoadingStudents(true);

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
            } catch {
                setStudents([]);
            } finally {
                setLoadingStudents(false);
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
        if (
            !uploadModalOpen &&
            !editModal &&
            !deleteModal
        ) {
            return;
        }

        function closeWithEscape(event: KeyboardEvent) {
            if (
                event.key !== "Escape" ||
                uploading ||
                editing ||
                processingId !== null
            ) {
                return;
            }

            setUploadModalOpen(false);
            setEditModal(null);
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
        editModal,
        editing,
        processingId,
        uploadModalOpen,
        uploading,
    ]);

    async function submitUpload(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        setErrorMessage("");
        setSuccessMessage("");

        if (
            !Number.isFinite(numericCourseId) ||
            numericCourseId <= 0
        ) {
            setErrorMessage(
                "Ingrese un ID de curso válido.",
            );

            return;
        }

        if (!certificateType.trim()) {
            setErrorMessage(
                "Seleccione el tipo de certificado.",
            );

            return;
        }

        if (
            uploadType === "individual" &&
            !selectedStudent
        ) {
            setErrorMessage(
                "Seleccione un estudiante del curso.",
            );

            return;
        }

        if (
            uploadType === "individual" &&
            selectedStudent &&
            !selectedStudent.idnumber.trim()
        ) {
            setErrorMessage(
                "El estudiante seleccionado no tiene número de identificación registrado.",
            );

            return;
        }

        if (
            uploadType === "individual" &&
            !file
        ) {
            setErrorMessage(
                "Seleccione el certificado del estudiante.",
            );

            return;
        }

        if (
            uploadType === "bulk" &&
            bulkFiles.length === 0
        ) {
            setErrorMessage(
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
                setErrorMessage(
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

        try {
            setUploading(true);

            if (uploadType === "individual") {
                await createMdtCertificate({
                    file: file as File,
                    course_id: numericCourseId,
                    id_number:
                        selectedStudent?.idnumber ?? "",
                    certificate_type:
                        certificateType.trim(),
                });

                setSuccessMessage(
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

                setSuccessMessage(
                    `${bulkFiles.length} certificado(s) subido(s) correctamente.`,
                );
            }

            clearFiles();
            setSelectedEnrollmentId("");
            setUploadModalOpen(false);

            await loadCertificates(numericCourseId);
        } catch (error) {
            setErrorMessage(
                getErrorMessage(error),
            );
        } finally {
            setUploading(false);
        }
    }

    async function updateCertificate(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        if (!editModal) return;

        const cleanCertificateType =
            editModal.certificateType.trim();

        const cleanIdNumber =
            normalizeIdNumber(editModal.idNumber);

        setErrorMessage("");
        setSuccessMessage("");

        if (!cleanCertificateType) {
            setErrorMessage(
                "Seleccione el tipo de certificado.",
            );

            return;
        }

        if (!cleanIdNumber) {
            setErrorMessage(
                "Ingrese la identificación del estudiante.",
            );

            return;
        }

        if (
            !Number.isFinite(numericCourseId) ||
            numericCourseId <= 0
        ) {
            setErrorMessage(
                "No se pudo identificar el curso.",
            );

            return;
        }

        try {
            setEditing(true);
            setProcessingId(
                editModal.certificate.id,
            );

            const payload = {
                course_id: numericCourseId,
                id_number: cleanIdNumber,
                certificate_type:
                    cleanCertificateType,
                ...(editModal.file
                    ? {
                          file: editModal.file,
                      }
                    : {}),
            } as UpdateMdtCertificatePayload;

            await updateMdtCertificate(
                editModal.certificate.id,
                payload,
            );

            setSuccessMessage(
                "Certificado actualizado correctamente.",
            );

            setEditModal(null);

            await loadCertificates(numericCourseId);
        } catch (error) {
            setErrorMessage(
                getErrorMessage(error),
            );
        } finally {
            setEditing(false);
            setProcessingId(null);
        }
    }

    async function toggleCertificateState(
        certificate: MdtCertificate,
    ) {
        setErrorMessage("");
        setSuccessMessage("");
        setProcessingId(certificate.id);

        try {
            await updateMdtCertificate(
                certificate.id,
                {
                    deleted: !certificate.deleted,
                } as UpdateMdtCertificatePayload,
            );

            setSuccessMessage(
                certificate.deleted
                    ? "Certificado restaurado correctamente."
                    : "Certificado ocultado correctamente.",
            );

            await loadCertificates(numericCourseId);
        } catch (error) {
            setErrorMessage(
                getErrorMessage(error),
            );
        } finally {
            setProcessingId(null);
        }
    }

    async function confirmDeleteCertificate() {
        if (!deleteModal) return;

        const certificateId =
            deleteModal.certificate.id;

        setErrorMessage("");
        setSuccessMessage("");
        setProcessingId(certificateId);

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

            setSuccessMessage(
                "Certificado eliminado correctamente.",
            );

            setDeleteModal(null);
        } catch (error) {
            setErrorMessage(
                getErrorMessage(error),
            );
        } finally {
            setProcessingId(null);
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

    function selectEditFile(
        event: ChangeEvent<HTMLInputElement>,
    ) {
        const selectedFile =
            event.target.files?.[0] ?? null;

        setEditModal((current) => {
            if (!current) return current;

            return {
                ...current,
                file: selectedFile,
            };
        });

        event.target.value = "";
    }

    function dropFiles(
        event: DragEvent<HTMLDivElement>,
    ) {
        event.preventDefault();

        const currentFiles = Array.from(
            event.dataTransfer.files ?? [],
        ) as File[];

        assignFiles(currentFiles);
    }

    function assignFiles(currentFiles: File[]) {
        const validFiles = currentFiles.filter(
            (currentFile) =>
                /\.(pdf|jpg|jpeg|png|webp)$/i.test(
                    currentFile.name,
                ),
        );

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

    function clearFiles() {
        setFile(null);
        setBulkFiles([]);

        if (filesInputRef.current) {
            filesInputRef.current.value = "";
        }

        if (multipleFilesInputRef.current) {
            multipleFilesInputRef.current.value =
                "";
        }
    }

    function changeUploadType(
        nextUploadType: UploadType,
    ) {
        setUploadType(nextUploadType);
        clearFiles();

        if (nextUploadType === "bulk") {
            setSelectedEnrollmentId("");
        }
    }

    function openUploadModal() {
        setErrorMessage("");
        setSuccessMessage("");
        clearFiles();

        if (
            Number.isFinite(numericCourseId) &&
            numericCourseId > 0
        ) {
            void loadStudents(numericCourseId);
        }

        setUploadModalOpen(true);
    }

    function openEditModal(
        certificate: MdtCertificate,
    ) {
        setErrorMessage("");
        setSuccessMessage("");

        setEditModal({
            certificate,
            certificateType:
                certificate.certificate_type ||
                "MDT",
            idNumber:
                certificate.id_number || "",
            file: null,
        });
    }

    function closeUploadModal() {
        if (uploading) return;

        setUploadModalOpen(false);
    }

    function closeEditModal() {
        if (editing) return;

        setEditModal(null);
    }

    function closeDeleteModal() {
        if (processingId !== null) return;

        setDeleteModal(null);
    }

    function consultAll() {
        void loadCertificates();
        void loadStudents();
    }

    function changeAdminCourse() {
        setErrorMessage("");
        setSuccessMessage("");

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
        loading,
        loadingStudents,
        uploading,
        editing,
        processingId,
        successMessage,
        errorMessage,
        uploadModalOpen,
        deleteModal,
        setDeleteModal,
        editModal,
        setEditModal,
        filesInputRef,
        multipleFilesInputRef,
        loadCertificates,
        loadStudents,
        submitUpload,
        updateCertificate,
        toggleCertificateState,
        confirmDeleteCertificate,
        selectFiles,
        selectEditFile,
        dropFiles,
        removeCapturedFile,
        clearFiles,
        changeUploadType,
        openUploadModal,
        openEditModal,
        closeUploadModal,
        closeEditModal,
        closeDeleteModal,
        consultAll,
        changeAdminCourse,
        acceptedFiles: ACCEPTED_CERTIFICATE_FILES,
    };
}

export type MdtCertificatesTeacherState =
    ReturnType<typeof useMdtCertificatesTeacher>;
