"use client";

import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import { useAuth } from "@/hooks/useAuth";
import { notify } from "@/lib/notify";
import {
    getCertificatesByUser,
} from "@/services/certificates.service";

import {
    getEnrollmentsByUserForCertificates,
    getMdtCertificateByCourseAndIdNumber,
} from "./api";
import type {
    CertificateStatusFilter,
    CertificateWithExtraFields,
    EnrollmentForCertificate,
    MdtCertificateForStudent,
} from "./types";
import {
    getCertificateCourseId,
    getCertificateFileUrl,
    getCertificateType,
    getFilteredCertificates,
    getInitials,
    getUserFullName,
    isCertificateGeneratedAfterFinish,
    toNumericId,
} from "./utils";

type CertificateHookRecord =
    Record<string, unknown>;

function getErrorMessage(
    error: unknown,
    fallback: string,
) {
    if (
        error instanceof Error &&
        error.message.trim()
    ) {
        return error.message.trim();
    }

    if (
        typeof error === "string" &&
        error.trim()
    ) {
        return error.trim();
    }

    return fallback;
}

function getEnrollmentCourseId(
    enrollment: EnrollmentForCertificate,
) {
    return (
        toNumericId(
            enrollment.course_id,
        ) ||
        toNumericId(
            enrollment.course?.id,
        ) ||
        null
    );
}

function isApprovedEnrollment(
    enrollment: EnrollmentForCertificate,
) {
    const record =
        enrollment as unknown as CertificateHookRecord;

    const possibleValues = [
        record.accepted,
        record.approved,
        record.is_approved,
        record.isApproved,
        record.status,
    ];

    return possibleValues.some(
        (value) => {
            if (
                value === true ||
                value === 1
            ) {
                return true;
            }

            if (
                typeof value !==
                "string"
            ) {
                return false;
            }

            return [
                "true",
                "1",
                "yes",
                "si",
                "sí",
                "approved",
                "aprobado",
                "aprobada",
                "accepted",
                "aceptado",
                "aceptada",
            ].includes(
                value
                    .trim()
                    .toLowerCase(),
            );
        },
    );
}

function toCertificateHookRecord(
    value: unknown,
): CertificateHookRecord | null {
    if (
        !value ||
        typeof value !==
        "object"
    ) {
        return null;
    }

    return value as CertificateHookRecord;
}

function cleanCertificateHookText(
    value: unknown,
) {
    if (
        typeof value !==
        "string" &&
        typeof value !==
        "number"
    ) {
        return "";
    }

    return String(
        value,
    ).trim();
}

function findDeepCertificateHookText(
    source: unknown,
    keys: string[],
    visited =
        new WeakSet<object>(),
): string {
    if (
        !source ||
        typeof source !==
        "object"
    ) {
        return "";
    }

    const sourceObject =
        source as object;

    if (
        visited.has(
            sourceObject,
        )
    ) {
        return "";
    }

    visited.add(
        sourceObject,
    );

    if (
        Array.isArray(
            source,
        )
    ) {
        for (
            const item of source
        ) {
            const found =
                findDeepCertificateHookText(
                    item,
                    keys,
                    visited,
                );

            if (
                found
            ) {
                return found;
            }
        }

        return "";
    }

    const record =
        toCertificateHookRecord(
            source,
        );

    if (!record) {
        return "";
    }

    for (
        const key of keys
    ) {
        const text =
            cleanCertificateHookText(
                record[key],
            );

        if (
            text
        ) {
            return text;
        }
    }

    for (
        const value of Object.values(
            record,
        )
    ) {
        if (
            value &&
            typeof value ===
            "object"
        ) {
            const found =
                findDeepCertificateHookText(
                    value,
                    keys,
                    visited,
                );

            if (
                found
            ) {
                return found;
            }
        }
    }

    return "";
}

function getStudentIdNumberFromSources(
    ...sources: unknown[]
) {
    const keys = [
        "idnumber",
        "id_number",
        "idNumber",
        "identification",
        "identification_number",
        "cedula",
        "dni",
        "document",
        "document_number",
    ];

    for (
        const source of sources
    ) {
        const value =
            findDeepCertificateHookText(
                source,
                keys,
            ).replace(
                /\s+/g,
                "",
            );

        if (
            value
        ) {
            return value;
        }
    }

    return "";
}

function getCertificateUniqueKey(
    certificate:
        CertificateWithExtraFields,
) {
    const certificateType =
        getCertificateType(
            certificate,
        );

    const certificateId =
        String(
            certificate.id ??
            "",
        ).trim();

    const courseId =
        getCertificateCourseId(
            certificate,
        ) ??
        "unknown";

    const fileUrl =
        String(
            certificate.file_url ??
            "",
        ).trim();

    /*
     * Se incluye el tipo para evitar que un MDT con id 1
     * reemplace accidentalmente a un institucional con id 1.
     */
    return `${certificateType}-${courseId}-${certificateId || fileUrl}`;
}

function mergeCertificates(
    certificates:
        CertificateWithExtraFields[],
) {
    const certificateMap =
        new Map<
            string,
            CertificateWithExtraFields
        >();

    certificates.forEach(
        (certificate) => {
            certificateMap.set(
                getCertificateUniqueKey(
                    certificate,
                ),
                certificate,
            );
        },
    );

    return Array.from(
        certificateMap.values(),
    );
}

function normalizeMdtCertificate(
    certificate:
        MdtCertificateForStudent,
    userId: number,
    courseId: number,
    enrollment?:
        EnrollmentForCertificate,
): CertificateWithExtraFields {
    return {
        ...(
            certificate as unknown as CertificateWithExtraFields
        ),
        user_id:
            userId,
        course_id:
            toNumericId(
                certificate.course_id,
            ) ??
            courseId,
        course_name:
            enrollment?.course
                ?.name ??
            null,
        course:
            enrollment?.course ??
            null,
        certificate_type:
            certificate
                .certificate_type ??
            "MDT",
        is_valid:
            certificate.deleted !==
            true &&
            Boolean(
                certificate
                    .file_url,
            ),
    } as CertificateWithExtraFields;
}

export function useStudentCertificates() {
    const { user } =
        useAuth();

    const numericUserId =
        toNumericId(
            user?.id,
        );

    const displayName =
        getUserFullName(
            user,
        );

    const initials =
        getInitials(
            displayName,
        );

    const refreshInProgressRef =
        useRef(false);

    const [
        certificates,
        setCertificates,
    ] =
        useState<
            CertificateWithExtraFields[]
        >([]);

    const [
        selectedCertificate,
        setSelectedCertificate,
    ] =
        useState<
            CertificateWithExtraFields | null
        >(null);

    const [
        statusFilter,
        setStatusFilter,
    ] =
        useState<CertificateStatusFilter>(
            "all",
        );

    const [
        searchTerm,
        setSearchTerm,
    ] = useState("");

    const [
        isLoading,
        setIsLoading,
    ] = useState(true);

    const [
        isRefreshing,
        setIsRefreshing,
    ] = useState(false);

    const [
        errorMessage,
        setErrorMessage,
    ] = useState("");

    const validCertificates =
        useMemo(
            () =>
                certificates.filter(
                    isCertificateGeneratedAfterFinish,
                ),
            [
                certificates,
            ],
        );

    const validCertificatesCount =
        validCertificates.length;

    const mdtCertificatesCount =
        useMemo(
            () =>
                validCertificates.filter(
                    (
                        certificate,
                    ) =>
                        getCertificateType(
                            certificate,
                        ) ===
                        "mdt",
                ).length,
            [
                validCertificates,
            ],
        );

    const institutionalCertificatesCount =
        useMemo(
            () =>
                validCertificates.filter(
                    (
                        certificate,
                    ) =>
                        getCertificateType(
                            certificate,
                        ) ===
                        "institutional",
                ).length,
            [
                validCertificates,
            ],
        );

    const filteredCertificates =
        useMemo(
            () =>
                getFilteredCertificates(
                    certificates,
                    statusFilter,
                    searchTerm,
                ),
            [
                certificates,
                statusFilter,
                searchTerm,
            ],
        );

    const fetchCertificates =
        useCallback(async () => {
            if (
                !numericUserId
            ) {
                return [];
            }

            const enrollments =
                await getEnrollmentsByUserForCertificates(
                    numericUserId,
                );

            const approvedEnrollments =
                enrollments.filter(
                    isApprovedEnrollment,
                );

            const uniqueCourseIds =
                Array.from(
                    new Set(
                        approvedEnrollments
                            .map(
                                getEnrollmentCourseId,
                            )
                            .filter(
                                (
                                    courseId,
                                ): courseId is number =>
                                    courseId !==
                                    null &&
                                    courseId >
                                    0,
                            ),
                    ),
                );

            const approvedCourseIds =
                new Set(
                    uniqueCourseIds,
                );

            /*
             * Certificados institucionales.
             * El endpoint general por usuario devuelve estos certificados.
             */
            const certificatesByUser =
                await getCertificatesByUser(
                    numericUserId,
                    {
                        onlyValid:
                            true,
                    },
                ).catch(
                    () => [],
                );

            const institutionalCertificates =
                Array.isArray(
                    certificatesByUser,
                )
                    ? (
                        certificatesByUser as CertificateWithExtraFields[]
                    )
                        .map(
                            (
                                certificate,
                            ): CertificateWithExtraFields => {
                                const certificateCourseId =
                                    getCertificateCourseId(
                                        certificate,
                                    );

                                const enrollment =
                                    approvedEnrollments.find(
                                        (
                                            item,
                                        ) =>
                                            getEnrollmentCourseId(
                                                item,
                                            ) ===
                                            certificateCourseId,
                                    );

                                return {
                                    ...certificate,
                                    course_id:
                                        certificate
                                            .course_id ??
                                        enrollment
                                            ?.course_id ??
                                        certificateCourseId,
                                    course_name:
                                        certificate
                                            .course_name ||
                                        certificate
                                            .course
                                            ?.name ||
                                        enrollment
                                            ?.course
                                            ?.name ||
                                        "Curso certificado",
                                    course:
                                        certificate
                                            .course ??
                                        enrollment
                                            ?.course ??
                                        null,
                                };
                            },
                        )
                        .filter(
                            (
                                certificate,
                            ) => {
                                const certificateUserId =
                                    toNumericId(
                                        certificate
                                            .user_id,
                                    );

                                const certificateCourseId =
                                    getCertificateCourseId(
                                        certificate,
                                    );

                                return (
                                    (
                                        certificateUserId ===
                                        null ||
                                        certificateUserId ===
                                        numericUserId
                                    ) &&
                                    certificateCourseId !==
                                    null &&
                                    approvedCourseIds.has(
                                        certificateCourseId,
                                    ) &&
                                    isCertificateGeneratedAfterFinish(
                                        certificate,
                                    )
                                );
                            },
                        )
                    : [];

            const studentIdNumber =
                getStudentIdNumberFromSources(
                    user,
                    approvedEnrollments,
                    enrollments,
                );

            const mdtCertificates =
                studentIdNumber
                    ? (
                        await Promise.all(
                            uniqueCourseIds.map(
                                async (
                                    courseId,
                                ) => {
                                    const enrollment =
                                        approvedEnrollments.find(
                                            (
                                                item,
                                            ) =>
                                                getEnrollmentCourseId(
                                                    item,
                                                ) ===
                                                courseId,
                                        );

                                    const certificate =
                                        await getMdtCertificateByCourseAndIdNumber(
                                            studentIdNumber,
                                            courseId,
                                        ).catch(
                                            () =>
                                                null,
                                        );

                                    if (
                                        !certificate ||
                                        certificate.deleted ===
                                        true
                                    ) {
                                        return null;
                                    }

                                    return normalizeMdtCertificate(
                                        certificate,
                                        numericUserId,
                                        courseId,
                                        enrollment,
                                    );
                                },
                            ),
                        )
                    ).filter(
                        (
                            certificate,
                        ): certificate is CertificateWithExtraFields =>
                            certificate !==
                            null &&
                            isCertificateGeneratedAfterFinish(
                                certificate,
                            ),
                    )
                    : [];

            return mergeCertificates(
                [
                    ...institutionalCertificates,
                    ...mdtCertificates,
                ],
            );
        }, [
            numericUserId,
            user,
        ]);

    /*
     * Carga inicial:
     * - No muestra toast innecesario.
     * - Mantiene una alerta roja visible si falla.
     */
    const loadCertificates =
        useCallback(async () => {
            try {
                setIsLoading(
                    true,
                );

                setErrorMessage(
                    "",
                );

                const data =
                    await fetchCertificates();

                setCertificates(
                    data,
                );
            } catch (
            error
            ) {
                console.error(
                    "Error al cargar los certificados del estudiante:",
                    error,
                );

                setCertificates(
                    [],
                );

                setErrorMessage(
                    getErrorMessage(
                        error,
                        "No se pudieron cargar los certificados.",
                    ),
                );
            } finally {
                setIsLoading(
                    false,
                );
            }
        }, [
            fetchCertificates,
        ]);

    /*
     * Actualización manual:
     * - Muestra toast de carga.
     * - Evita solicitudes duplicadas.
     * - Conserva los certificados visibles si falla la API.
     */
    const refreshCertificates =
        useCallback(async () => {
            if (
                refreshInProgressRef.current
            ) {
                return;
            }

            refreshInProgressRef.current =
                true;

            setIsRefreshing(
                true,
            );

            setErrorMessage(
                "",
            );

            const toastId =
                notify.loading(
                    "Actualizando certificados...",
                    "Estamos consultando tus certificados emitidos.",
                );

            try {
                const data =
                    await fetchCertificates();

                setCertificates(
                    data,
                );

                notify.dismiss(
                    toastId,
                );

                notify.success(
                    "Certificados actualizados correctamente.",
                    "Tu listado de certificados se encuentra al día.",
                );
            } catch (
            error
            ) {
                console.error(
                    "Error al actualizar los certificados del estudiante:",
                    error,
                );

                const message =
                    getErrorMessage(
                        error,
                        "No se pudieron actualizar los certificados.",
                    );

                /*
                 * No se eliminan los certificados anteriores.
                 * El estudiante conserva la última información disponible.
                 */
                setErrorMessage(
                    message,
                );

                notify.dismiss(
                    toastId,
                );

                notify.error(
                    "No se pudieron actualizar los certificados.",
                    message,
                );
            } finally {
                refreshInProgressRef.current =
                    false;

                setIsRefreshing(
                    false,
                );
            }
        }, [
            fetchCertificates,
        ]);

    useEffect(() => {
        const timeoutId =
            window.setTimeout(
                () => {
                    void loadCertificates();
                },
                0,
            );

        return () => {
            window.clearTimeout(
                timeoutId,
            );
        };
    }, [
        loadCertificates,
    ]);

    function openPreviewModal(
        certificate:
            CertificateWithExtraFields,
    ) {
        const fileUrl =
            getCertificateFileUrl(
                certificate,
            );

        if (
            !fileUrl
        ) {
            notify.warning(
                "PDF no disponible.",
                "Este certificado todavía no tiene un archivo asociado.",
            );

            return;
        }

        setSelectedCertificate(
            certificate,
        );
    }

    function closePreviewModal() {
        setSelectedCertificate(
            null,
        );
    }

    return {
        certificates,
        selectedCertificate,
        statusFilter,
        setStatusFilter,
        searchTerm,
        setSearchTerm,
        isLoading,
        isRefreshing,
        errorMessage,
        validCertificatesCount,
        mdtCertificatesCount,
        institutionalCertificatesCount,
        filteredCertificates,
        refreshCertificates,
        openPreviewModal,
        closePreviewModal,
        initials,
    };
}