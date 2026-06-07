"use client";

import {
    useEffect,
    useMemo,
    useRef,
    useState,
    type ChangeEvent,
} from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/hooks/useAuth";
import { getAuthSession } from "@/lib/auth";
import { notify } from "@/lib/notify";
import { getAllCourses } from "@/services/courses.service";
import {
    createEnrollment,
    getEnrollmentsByUser,
} from "@/services/enrollments.service";

import { STUDENT_ROLE_ID } from "./constants";
import type {
    CourseEnrollmentItem,
    ExistingEnrollmentState,
    PaymentMethod,
    RawCourse,
} from "./types";
import {
    generateVoucherNumber,
    getEnrollmentState,
    getInitials,
    getUserFullName,
    normalizeCourse,
} from "./utils";

const MAX_VOUCHER_FILE_SIZE_BYTES =
    10 * 1024 * 1024;

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

function isAllowedVoucherFile(
    file: File,
) {
    return (
        file.type.startsWith(
            "image/",
        ) ||
        file.type ===
        "application/pdf"
    );
}

export function useStudentEnrollment(
    courseIdParam: string,
) {
    const router =
        useRouter();

    const { user } =
        useAuth();

    const numericCourseId =
        useMemo(
            () =>
                Number(
                    courseIdParam,
                ),
            [courseIdParam],
        );

    const isValidCourseId =
        Number.isFinite(
            numericCourseId,
        ) &&
        numericCourseId > 0;

    const displayName =
        getUserFullName(user);

    const initials =
        getInitials(displayName);

    const [
        course,
        setCourse,
    ] =
        useState<CourseEnrollmentItem | null>(
            null,
        );

    const [
        existingEnrollmentState,
        setExistingEnrollmentState,
    ] =
        useState<ExistingEnrollmentState>(
            {
                type: "none",
                enrollment: null,
            },
        );

    const [
        loading,
        setLoading,
    ] = useState<boolean>(
        isValidCourseId,
    );

    const [
        error,
        setError,
    ] = useState("");

    const [
        paymentMethod,
        setPaymentMethod,
    ] =
        useState<PaymentMethod>(
            "transferencia",
        );

    const [
        voucherFile,
        setVoucherFile,
    ] =
        useState<File | null>(
            null,
        );

    const [
        voucherPreview,
        setVoucherPreview,
    ] = useState("");

    const [
        voucherNumber,
        setVoucherNumber,
    ] = useState("");

    const [
        referenceCode,
        setReferenceCode,
    ] = useState("");

    const [
        observations,
        setObservations,
    ] = useState("");

    const [
        isVoucherModalOpen,
        setIsVoucherModalOpen,
    ] = useState(false);

    const [
        tempVoucherFile,
        setTempVoucherFile,
    ] =
        useState<File | null>(
            null,
        );

    const [
        tempVoucherPreview,
        setTempVoucherPreview,
    ] = useState("");

    const [
        tempReferenceCode,
        setTempReferenceCode,
    ] = useState("");

    const [
        tempObservations,
        setTempObservations,
    ] = useState("");

    const [
        submittingEnrollment,
        setSubmittingEnrollment,
    ] = useState(false);

    const [
        submitError,
        setSubmitError,
    ] = useState("");

    const [
        submitMessage,
        setSubmitMessage,
    ] = useState("");

    const voucherPreviewRef =
        useRef("");

    const tempVoucherPreviewRef =
        useRef("");

    const submitInProgressRef =
        useRef(false);

    const redirectTimeoutRef =
        useRef<number | null>(
            null,
        );

    useEffect(() => {
        voucherPreviewRef.current =
            voucherPreview;
    }, [voucherPreview]);

    useEffect(() => {
        tempVoucherPreviewRef.current =
            tempVoucherPreview;
    }, [tempVoucherPreview]);

    useEffect(() => {
        return () => {
            const currentVoucherPreview =
                voucherPreviewRef.current;

            const currentTempPreview =
                tempVoucherPreviewRef.current;

            if (
                currentVoucherPreview
            ) {
                URL.revokeObjectURL(
                    currentVoucherPreview,
                );
            }

            if (
                currentTempPreview &&
                currentTempPreview !==
                currentVoucherPreview
            ) {
                URL.revokeObjectURL(
                    currentTempPreview,
                );
            }

            if (
                redirectTimeoutRef.current
            ) {
                window.clearTimeout(
                    redirectTimeoutRef.current,
                );
            }
        };
    }, []);

    useEffect(() => {
        if (!isValidCourseId) {
            return;
        }

        let active =
            true;

        async function loadCourse() {
            try {
                setLoading(
                    true,
                );

                setError(
                    "",
                );

                const session =
                    getAuthSession();

                const userId =
                    Number(
                        user?.id ??
                        session
                            ?.user
                            ?.id,
                    );

                const [
                    coursesResponse,
                    enrollmentsResponse,
                ] =
                    await Promise.all([
                        getAllCourses(),
                        userId &&
                            !Number.isNaN(
                                userId,
                            )
                            ? getEnrollmentsByUser(
                                userId,
                            )
                            : Promise.resolve(
                                [],
                            ),
                    ]);

                if (!active) {
                    return;
                }

                const courses =
                    Array.isArray(
                        coursesResponse,
                    )
                        ? coursesResponse.map(
                            (
                                item,
                            ) =>
                                normalizeCourse(
                                    item as unknown as RawCourse,
                                ),
                        )
                        : [];

                const found =
                    courses.find(
                        (
                            item,
                        ) =>
                            item.id ===
                            numericCourseId,
                    );

                if (!found) {
                    setCourse(
                        null,
                    );

                    setError(
                        "No se encontró la información del curso.",
                    );

                    return;
                }

                const enrollmentState =
                    getEnrollmentState(
                        Array.isArray(
                            enrollmentsResponse,
                        )
                            ? enrollmentsResponse
                            : [],
                        numericCourseId,
                    );

                setCourse(
                    found,
                );

                setPaymentMethod(
                    found.isFree
                        ? "gratis"
                        : "transferencia",
                );

                setExistingEnrollmentState(
                    enrollmentState,
                );
            } catch (
            currentError
            ) {
                if (!active) {
                    return;
                }

                setCourse(
                    null,
                );

                setError(
                    getErrorMessage(
                        currentError,
                        "No se pudo cargar la información de matrícula.",
                    ),
                );
            } finally {
                if (active) {
                    setLoading(
                        false,
                    );
                }
            }
        }

        void loadCourse();

        return () => {
            active = false;
        };
    }, [
        isValidCourseId,
        numericCourseId,
        user?.id,
    ]);

    const finalPrice =
        course?.isFree ||
            (course?.price ?? 0) <= 0
            ? 0
            : course?.hasDiscount &&
                course.discountedPrice !==
                null
                ? course.discountedPrice
                : (course?.price ?? 0);

    const discountAmount =
        course?.isFree
            ? 0
            : course?.hasDiscount &&
                course.discountedPrice !==
                null
                ? Math.max(
                    (course.price ??
                        0) -
                    course.discountedPrice,
                    0,
                )
                : 0;

    const totalPayable =
        course?.isFree
            ? 0
            : finalPrice;

    /*
     * Permite intentar enviar incluso si todavía
     * falta un comprobante. Así el hook puede mostrar
     * una notificación indicando exactamente qué falta.
     *
     * También permite volver a enviar una matrícula
     * previamente rechazada.
     */
    const canSubmit =
        Boolean(course) &&
        !submittingEnrollment &&
        (
            existingEnrollmentState.type ===
            "none" ||
            existingEnrollmentState.type ===
            "rejected"
        );

    function openVoucherModal() {
        setTempVoucherFile(
            voucherFile,
        );

        setTempVoucherPreview(
            voucherPreview,
        );

        setTempReferenceCode(
            referenceCode,
        );

        setTempObservations(
            observations,
        );

        setIsVoucherModalOpen(
            true,
        );
    }

    function closeVoucherModal() {
        if (
            tempVoucherPreview &&
            tempVoucherPreview !==
            voucherPreview
        ) {
            URL.revokeObjectURL(
                tempVoucherPreview,
            );
        }

        setTempVoucherFile(
            null,
        );

        setTempVoucherPreview(
            "",
        );

        setTempReferenceCode(
            "",
        );

        setTempObservations(
            "",
        );

        setIsVoucherModalOpen(
            false,
        );
    }

    function handleTempVoucherChange(
        event: ChangeEvent<HTMLInputElement>,
    ) {
        const file =
            event.target.files?.[0] ??
            null;

        if (
            tempVoucherPreview &&
            tempVoucherPreview !==
            voucherPreview
        ) {
            URL.revokeObjectURL(
                tempVoucherPreview,
            );
        }

        if (!file) {
            setTempVoucherFile(
                null,
            );

            setTempVoucherPreview(
                "",
            );

            return;
        }

        if (
            !isAllowedVoucherFile(
                file,
            )
        ) {
            setTempVoucherFile(
                null,
            );

            setTempVoucherPreview(
                "",
            );

            notify.warning(
                "Archivo no permitido.",
                "Selecciona una imagen o un archivo PDF.",
            );

            return;
        }

        if (
            file.size >
            MAX_VOUCHER_FILE_SIZE_BYTES
        ) {
            setTempVoucherFile(
                null,
            );

            setTempVoucherPreview(
                "",
            );

            notify.warning(
                "Archivo demasiado pesado.",
                "El comprobante no puede superar los 10 MB.",
            );

            return;
        }

        setTempVoucherFile(
            file,
        );

        if (
            file.type.startsWith(
                "image/",
            )
        ) {
            setTempVoucherPreview(
                URL.createObjectURL(
                    file,
                ),
            );

            return;
        }

        setTempVoucherPreview(
            "",
        );
    }

    function saveVoucherData() {
        if (
            !tempReferenceCode.trim()
        ) {
            notify.warning(
                "Código de referencia requerido.",
                "Ingresa el código que aparece en tu comprobante.",
            );

            return;
        }

        if (
            !tempVoucherFile
        ) {
            notify.warning(
                "Comprobante requerido.",
                "Selecciona una imagen o un archivo PDF para continuar.",
            );

            return;
        }

        if (
            voucherPreview &&
            voucherPreview !==
            tempVoucherPreview
        ) {
            URL.revokeObjectURL(
                voucherPreview,
            );
        }

        setVoucherFile(
            tempVoucherFile,
        );

        setVoucherPreview(
            tempVoucherPreview,
        );

        setReferenceCode(
            tempReferenceCode.trim(),
        );

        setObservations(
            tempObservations.trim(),
        );

        setVoucherNumber(
            generateVoucherNumber(
                numericCourseId,
            ),
        );

        setIsVoucherModalOpen(
            false,
        );

        setTempVoucherFile(
            null,
        );

        setTempVoucherPreview(
            "",
        );

        setTempReferenceCode(
            "",
        );

        setTempObservations(
            "",
        );

        setSubmitError(
            "",
        );

        setSubmitMessage(
            "",
        );

        notify.success(
            "Comprobante guardado.",
            "Ya puedes enviar tu solicitud de matrícula.",
        );
    }

    async function handleSubmitEnrollment() {
        if (
            submitInProgressRef.current ||
            submittingEnrollment
        ) {
            return;
        }

        if (!course) {
            return;
        }

        setSubmitError(
            "",
        );

        setSubmitMessage(
            "",
        );

        if (
            existingEnrollmentState.type ===
            "approved" ||
            existingEnrollmentState.type ===
            "pending"
        ) {
            notify.info(
                "La matrícula ya fue registrada.",
                existingEnrollmentState.type ===
                    "approved"
                    ? "Tu acceso al aula ya se encuentra habilitado."
                    : "La solicitud todavía se encuentra pendiente de validación.",
            );

            return;
        }

        const session =
            getAuthSession();

        const userId =
            Number(
                user?.id ??
                session?.user?.id,
            );

        if (
            !userId ||
            Number.isNaN(userId)
        ) {
            const message =
                "No se pudo identificar al estudiante autenticado.";

            setSubmitError(
                message,
            );

            notify.error(
                "No se pudo continuar.",
                message,
            );

            return;
        }

        if (
            !course.isFree &&
            paymentMethod ===
            "transferencia" &&
            !voucherFile
        ) {
            const message =
                "Debes cargar el comprobante de transferencia.";

            setSubmitError(
                message,
            );

            notify.warning(
                "Comprobante requerido.",
                message,
            );

            return;
        }

        if (
            !course.isFree &&
            paymentMethod ===
            "transferencia" &&
            !referenceCode.trim()
        ) {
            const message =
                "Debes ingresar el código de referencia de la transferencia.";

            setSubmitError(
                message,
            );

            notify.warning(
                "Código de referencia requerido.",
                message,
            );

            return;
        }

        submitInProgressRef.current =
            true;

        setSubmittingEnrollment(
            true,
        );

        const toastId =
            notify.loading(
                "Registrando matrícula...",
                "Estamos enviando tu solicitud.",
            );

        try {
            const isFreeEnrollment =
                course.isFree ||
                paymentMethod ===
                "gratis";

            const createdEnrollment =
                await createEnrollment(
                    {
                        accepted:
                            isFreeEnrollment
                                ? true
                                : null,
                        reference_code:
                            isFreeEnrollment
                                ? `GRATIS-AUTO-${course.id}-${userId}`
                                : referenceCode.trim(),
                        comment:
                            isFreeEnrollment
                                ? "Matrícula gratuita aprobada automáticamente."
                                : observations ||
                                null,
                        user_id:
                            userId,
                        course_id:
                            course.id,
                        role_id:
                            STUDENT_ROLE_ID,
                        image:
                            isFreeEnrollment
                                ? null
                                : voucherFile,
                    },
                );

            const enrollmentIsApproved =
                isFreeEnrollment ||
                createdEnrollment.accepted ===
                true;

            const message =
                enrollmentIsApproved
                    ? "Matrícula gratuita registrada correctamente. Ya puedes ingresar al aula."
                    : "Tu matrícula fue registrada correctamente y quedó pendiente de validación.";

            setExistingEnrollmentState(
                {
                    type: enrollmentIsApproved
                        ? "approved"
                        : "pending",
                    enrollment: {
                        ...createdEnrollment,
                        accepted:
                            enrollmentIsApproved
                                ? true
                                : createdEnrollment.accepted,
                    },
                },
            );

            setSubmitMessage(
                message,
            );

            notify.dismiss(
                toastId,
            );

            notify.success(
                enrollmentIsApproved
                    ? "Matrícula aprobada."
                    : "Solicitud enviada.",
                message,
            );

            redirectTimeoutRef.current =
                window.setTimeout(
                    () => {
                        router.push(
                            enrollmentIsApproved
                                ? `/student/courses/${course.id}`
                                : "/student/catalog",
                        );
                    },
                    1400,
                );
        } catch (
        currentError
        ) {
            const message =
                getErrorMessage(
                    currentError,
                    "No se pudo registrar la matrícula.",
                );

            setSubmitError(
                message,
            );

            notify.dismiss(
                toastId,
            );

            notify.error(
                "No se pudo registrar la matrícula.",
                message,
            );
        } finally {
            submitInProgressRef.current =
                false;

            setSubmittingEnrollment(
                false,
            );
        }
    }

    return {
        numericCourseId,
        isValidCourseId,
        displayName,
        initials,
        course,
        existingEnrollmentState,
        loading,
        error,
        paymentMethod,
        setPaymentMethod,
        voucherFile,
        voucherPreview,
        voucherNumber,
        referenceCode,
        observations,
        isVoucherModalOpen,
        tempVoucherFile,
        tempVoucherPreview,
        tempReferenceCode,
        setTempReferenceCode,
        tempObservations,
        setTempObservations,
        submittingEnrollment,
        submitError,
        submitMessage,
        finalPrice,
        discountAmount,
        totalPayable,
        canSubmit,
        openVoucherModal,
        closeVoucherModal,
        handleTempVoucherChange,
        saveVoucherData,
        handleSubmitEnrollment,
    };
}

export type StudentEnrollmentState =
    ReturnType<
        typeof useStudentEnrollment
    >;