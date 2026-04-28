"use client";

import Image from "next/image";
import Link from "next/link";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getAllCourses } from "@/services/courses.service";
import { createEnrollment } from "@/services/enrollments.service";
import { getAuthSession } from "@/lib/auth";

type RawCourse = {
    id?: number | string;
    title?: string;
    name?: string;
    description?: string;
    image_url?: string | null;
    image?: string | null;
    thumbnail?: string | null;
    price?: number | string | null;
    is_free?: boolean | null;
    status?: string | null;
    teacher_name?: string | null;
    instructor_name?: string | null;
    duration?: number | string | null;
    duration_hours?: number | string | null;
    duration_minutes?: number | string | null;
    has_discount?: boolean | null;
    discount?: boolean | null;
    discount_percentage?: number | string | null;
    discount_percent?: number | string | null;
    discount_rate?: number | string | null;
    discounted_price?: number | string | null;
    discount_price?: number | string | null;
};

type CourseEnrollmentItem = {
    id: number;
    title: string;
    description: string;
    imageUrl: string | null;
    price: number;
    isFree: boolean;
    status: string;
    teacherName: string;
    durationLabel: string;
    hasDiscount: boolean;
    discountPercentage: number;
    discountedPrice: number | null;
};

type PaymentMethod = "transferencia" | "tarjeta" | "efectivo" | "gratis";

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ||
    "http://213.165.74.184:9000";

function resolveImageUrl(value?: string | null): string | null {
    if (!value || value.trim().length === 0) return null;

    const trimmed = value.trim();

    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    if (trimmed.startsWith("/")) return `${API_BASE_URL}${trimmed}`;

    return `${API_BASE_URL}/${trimmed.replace(/^\/+/, "")}`;
}

function toNumber(value: unknown, fallback = 0): number {
    const parsed = typeof value === "number" ? value : Number(value ?? fallback);
    return Number.isNaN(parsed) ? fallback : parsed;
}

function formatPrice(value: number): string {
    return `$${value.toFixed(2)}`;
}

function formatDurationFromValues(
    duration?: unknown,
    hours?: unknown,
    minutes?: unknown,
): string {
    const durationValue = toNumber(duration, 0);
    const hoursValue = toNumber(hours, 0);
    const minutesValue = toNumber(minutes, 0);

    if (hoursValue > 0 || minutesValue > 0) {
        const parts: string[] = [];
        if (hoursValue > 0) parts.push(`${hoursValue} h`);
        if (minutesValue > 0) parts.push(`${minutesValue} min`);
        return parts.join(" ");
    }

    if (durationValue > 0) {
        if (durationValue >= 60) {
            const h = Math.floor(durationValue / 60);
            const m = durationValue % 60;
            return m > 0 ? `${h} h ${m} min` : `${h} h`;
        }
        return `${durationValue} min`;
    }

    return "No definida";
}

function normalizeCourse(course: RawCourse): CourseEnrollmentItem {
    const price = toNumber(course.price, 0);
    const isFree =
        typeof course.is_free === "boolean" ? course.is_free : price <= 0;

    const rawDiscountPercentage = toNumber(
        course.discount_percentage ??
        course.discount_percent ??
        course.discount_rate,
        0,
    );

    const rawDiscountedPrice =
        course.discounted_price !== undefined && course.discounted_price !== null
            ? toNumber(course.discounted_price, price)
            : course.discount_price !== undefined &&
                course.discount_price !== null
                ? toNumber(course.discount_price, price)
                : null;

    const hasDiscount =
        !isFree &&
        (Boolean(course.has_discount) ||
            Boolean(course.discount) ||
            rawDiscountPercentage > 0 ||
            (rawDiscountedPrice !== null && rawDiscountedPrice < price));

    const discountedPrice =
        hasDiscount && rawDiscountedPrice !== null
            ? rawDiscountedPrice
            : hasDiscount && rawDiscountPercentage > 0
                ? Math.max(price - price * (rawDiscountPercentage / 100), 0)
                : null;

    return {
        id: Number(course.id ?? 0),
        title: course.title?.trim() || course.name?.trim() || "Curso sin título",
        description:
            course.description?.trim() || "Sin descripción disponible.",
        imageUrl: resolveImageUrl(
            course.image_url ?? course.image ?? course.thumbnail ?? null,
        ),
        price,
        isFree,
        status: course.status?.trim() || "No disponible",
        teacherName:
            course.teacher_name?.trim() ||
            course.instructor_name?.trim() ||
            "Docente no asignado",
        durationLabel: formatDurationFromValues(
            course.duration,
            course.duration_hours,
            course.duration_minutes,
        ),
        hasDiscount,
        discountPercentage: rawDiscountPercentage,
        discountedPrice,
    };
}

function generateVoucherNumber(courseId: number): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = `${now.getMonth() + 1}`.padStart(2, "0");
    const day = `${now.getDate()}`.padStart(2, "0");
    const hours = `${now.getHours()}`.padStart(2, "0");
    const minutes = `${now.getMinutes()}`.padStart(2, "0");
    const random = Math.floor(Math.random() * 900 + 100);

    return `COMP-${courseId}-${year}${month}${day}-${hours}${minutes}-${random}`;
}

export default function StudentEnrollmentPage() {
    const params = useParams<{ courseId: string }>();
    const router = useRouter();

    const courseId = useMemo(() => Number(params?.courseId), [params?.courseId]);
    const isValidCourseId = Number.isFinite(courseId) && courseId > 0;

    const [course, setCourse] = useState<CourseEnrollmentItem | null>(null);
    const [loading, setLoading] = useState<boolean>(isValidCourseId);
    const [error, setError] = useState<string>("");
    const [paymentMethod, setPaymentMethod] =
        useState<PaymentMethod>("transferencia");

    const [voucherFile, setVoucherFile] = useState<File | null>(null);
    const [voucherPreview, setVoucherPreview] = useState<string>("");
    const [voucherNumber, setVoucherNumber] = useState<string>("");
    const [referenceCode, setReferenceCode] = useState<string>("");
    const [observations, setObservations] = useState<string>("");

    const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
    const [tempVoucherFile, setTempVoucherFile] = useState<File | null>(null);
    const [tempVoucherPreview, setTempVoucherPreview] = useState<string>("");
    const [tempReferenceCode, setTempReferenceCode] = useState<string>("");
    const [tempObservations, setTempObservations] = useState<string>("");

    const [submittingEnrollment, setSubmittingEnrollment] =
        useState<boolean>(false);
    const [submitError, setSubmitError] = useState<string>("");
    const [submitMessage, setSubmitMessage] = useState<string>("");

    useEffect(() => {
        if (!isValidCourseId) {
            return;
        }

        let active = true;

        const loadCourse = async () => {
            try {
                setLoading(true);

                const response = await getAllCourses();

                if (!active) return;

                const courses = Array.isArray(response)
                    ? response.map((item) =>
                        normalizeCourse(item as unknown as RawCourse),
                    )
                    : [];

                const found = courses.find((item) => item.id === courseId);

                if (!found) {
                    setCourse(null);
                    setError("No se encontró la información del curso.");
                    return;
                }

                setCourse(found);
                setPaymentMethod(found.isFree ? "gratis" : "transferencia");
                setError("");
            } catch (err) {
                if (!active) return;

                setCourse(null);
                setError(
                    err instanceof Error
                        ? err.message
                        : "No se pudo cargar la información de matrícula.",
                );
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        };

        void loadCourse();

        return () => {
            active = false;
        };
    }, [courseId, isValidCourseId]);

    useEffect(() => {
        return () => {
            if (voucherPreview) {
                URL.revokeObjectURL(voucherPreview);
            }
            if (tempVoucherPreview) {
                URL.revokeObjectURL(tempVoucherPreview);
            }
        };
    }, [voucherPreview, tempVoucherPreview]);

    const finalPrice =
        course?.isFree || (course?.price ?? 0) <= 0
            ? 0
            : course?.hasDiscount && course.discountedPrice !== null
                ? course.discountedPrice
                : (course?.price ?? 0);

    const productTotal = course?.price ?? 0;
    const subtotal = course?.price ?? 0;
    const discountAmount = course?.isFree
        ? 0
        : course?.hasDiscount && course.discountedPrice !== null
            ? Math.max((course.price ?? 0) - course.discountedPrice, 0)
            : 0;
    const totalPayable = course?.isFree ? 0 : finalPrice;

    const transferStatus =
        voucherFile !== null
            ? "Comprobante cargado"
            : "Pendiente de cargar comprobante";

    const voucherReviewStatus = voucherFile
        ? "Pendiente de validación"
        : "Pendiente";

    function openVoucherModal() {
        setTempVoucherFile(voucherFile);
        setTempVoucherPreview(voucherPreview);
        setTempReferenceCode(referenceCode);
        setTempObservations(observations);
        setIsVoucherModalOpen(true);
    }

    function closeVoucherModal() {
        if (tempVoucherPreview && tempVoucherPreview !== voucherPreview) {
            URL.revokeObjectURL(tempVoucherPreview);
        }
        setTempVoucherFile(null);
        setTempVoucherPreview("");
        setTempReferenceCode("");
        setTempObservations("");
        setIsVoucherModalOpen(false);
    }

    function handleTempVoucherChange(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0] ?? null;
        setTempVoucherFile(file);

        if (tempVoucherPreview && tempVoucherPreview !== voucherPreview) {
            URL.revokeObjectURL(tempVoucherPreview);
        }

        if (!file) {
            setTempVoucherPreview("");
            return;
        }

        if (file.type.startsWith("image/")) {
            const previewUrl = URL.createObjectURL(file);
            setTempVoucherPreview(previewUrl);
            return;
        }

        setTempVoucherPreview("");
    }

    function saveVoucherData() {
        if (!tempVoucherFile) {
            return;
        }

        if (voucherPreview && voucherPreview !== tempVoucherPreview) {
            URL.revokeObjectURL(voucherPreview);
        }

        setVoucherFile(tempVoucherFile);
        setVoucherPreview(tempVoucherPreview);
        setReferenceCode(tempReferenceCode.trim());
        setObservations(tempObservations.trim());
        setVoucherNumber(generateVoucherNumber(courseId));
        setIsVoucherModalOpen(false);
        setTempVoucherFile(null);
        setTempVoucherPreview("");
        setTempReferenceCode("");
        setTempObservations("");
        setSubmitError("");
        setSubmitMessage("");
    }

    async function handleSubmitEnrollment() {
        if (!course) return;

        try {
            setSubmittingEnrollment(true);
            setSubmitError("");
            setSubmitMessage("");

            const session = getAuthSession();
            const userId = Number(session?.user?.id);

            if (!userId || Number.isNaN(userId)) {
                throw new Error("No se pudo identificar al estudiante autenticado.");
            }

            if (!course.isFree && paymentMethod === "transferencia" && !voucherFile) {
                throw new Error("Debes cargar el comprobante de transferencia.");
            }

            const createdEnrollment = await createEnrollment({
                reference_code: referenceCode || voucherNumber || "",
                comment: observations || null,
                user_id: userId,
                course_id: course.id,
                role_id: 4,
                image: voucherFile,
            });

            setSubmitMessage(
                createdEnrollment.accepted
                    ? "Matrícula registrada correctamente. Ya puedes ingresar al curso."
                    : "Tu matrícula fue registrada correctamente y quedó pendiente de validación.",
            );

            setTimeout(() => {
                router.push("/student/courses");
            }, 1200);

            if (course.isFree) {
                setTimeout(() => {
                    router.push("/student/courses");
                }, 1200);
            }
        } catch (err) {
            setSubmitError(
                err instanceof Error
                    ? err.message
                    : "No se pudo registrar la matrícula.",
            );
        } finally {
            setSubmittingEnrollment(false);
        }
    }

    if (!isValidCourseId) {
        return (
            <section className="space-y-6">
                <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 shadow-sm">
                    El identificador del curso no es válido.
                </div>

                <Link
                    href="/student"
                    className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                    Volver
                </Link>
            </section>
        );
    }

    if (loading) {
        return (
            <section className="space-y-6">
                <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
                    Cargando matrícula...
                </div>
            </section>
        );
    }

    if (error || !course) {
        return (
            <section className="space-y-6">
                <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 shadow-sm">
                    {error || "No se encontró el curso."}
                </div>

                <Link
                    href="/student"
                    className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                    Volver
                </Link>
            </section>
        );
    }

    return (
        <>
            <section className="space-y-6">
                <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
                    <article className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
                        <div className="relative h-[260px] bg-slate-100">
                            {course.imageUrl ? (
                                <Image
                                    src={course.imageUrl}
                                    alt={course.title}
                                    fill
                                    unoptimized
                                    className="object-cover"
                                />
                            ) : (
                                <div className="flex h-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-500">
                                    Sin imagen
                                </div>
                            )}
                        </div>

                        <div className="space-y-5 p-6">
                            <div className="flex flex-wrap gap-2">
                                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                                    {course.isFree ? "Curso gratuito" : "Curso de pago"}
                                </span>

                                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                                    {course.status}
                                </span>

                                {course.hasDiscount ? (
                                    <span className="rounded-full bg-gradient-to-r from-rose-500 to-orange-500 px-3 py-1 text-xs font-extrabold text-white">
                                        {course.discountPercentage > 0
                                            ? `-${course.discountPercentage}% OFF`
                                            : "En descuento"}
                                    </span>
                                ) : (
                                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                                        Sin descuento
                                    </span>
                                )}
                            </div>

                            <div>
                                <h1 className="text-2xl font-extrabold tracking-tight text-slate-950">
                                    {course.title}
                                </h1>

                                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                    <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                                        Descripción del curso
                                    </p>

                                    <p className="max-h-40 overflow-y-auto break-words whitespace-pre-wrap text-sm leading-7 text-slate-600">
                                        {course.description}
                                    </p>
                                </div>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                                        Docente
                                    </p>
                                    <p className="mt-1 text-base font-bold text-slate-900">
                                        {course.teacherName}
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                                        Duración
                                    </p>
                                    <p className="mt-1 text-base font-bold text-slate-900">
                                        {course.durationLabel}
                                    </p>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                                            Total a pagar
                                        </p>
                                        {course.isFree ? (
                                            <p className="mt-1 text-2xl font-extrabold text-emerald-600">
                                                Gratis
                                            </p>
                                        ) : course.hasDiscount &&
                                            course.discountedPrice !== null ? (
                                            <div className="mt-1">
                                                <p className="text-2xl font-extrabold text-rose-600">
                                                    {formatPrice(course.discountedPrice)}
                                                </p>
                                                <p className="text-sm text-slate-400 line-through">
                                                    {formatPrice(course.price)}
                                                </p>
                                            </div>
                                        ) : (
                                            <p className="mt-1 text-2xl font-extrabold text-slate-900">
                                                {formatPrice(course.price)}
                                            </p>
                                        )}
                                    </div>

                                    <div className="rounded-2xl bg-white px-4 py-3 text-right shadow-sm">
                                        <p className="text-xs font-semibold text-slate-400">
                                            Estado
                                        </p>
                                        <p className="text-sm font-bold text-slate-900">
                                            {course.isFree
                                                ? "Matrícula directa"
                                                : "Pendiente de pago"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </article>

                    <aside className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex items-start justify-between gap-4">
                            <h2 className="mt-2 text-xl font-extrabold text-slate-950">
                                Método de pago
                            </h2>
                        </div>

                        <div className="mt-6 space-y-3">
                            {course.isFree ? (
                                <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        checked={paymentMethod === "gratis"}
                                        onChange={() => setPaymentMethod("gratis")}
                                        className="mt-1 h-4 w-4"
                                    />
                                    <div>
                                        <p className="text-sm font-bold text-emerald-700">
                                            Matrícula directa
                                        </p>
                                        <p className="mt-1 text-sm text-emerald-600">
                                            Este curso no requiere pago.
                                        </p>
                                    </div>
                                </label>
                            ) : (
                                <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 p-4 transition hover:bg-slate-50">
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        checked={paymentMethod === "transferencia"}
                                        onChange={() =>
                                            setPaymentMethod("transferencia")
                                        }
                                        className="mt-1 h-4 w-4"
                                    />
                                    <div>
                                        <p className="text-sm font-bold text-slate-900">
                                            Transferencia bancaria
                                        </p>
                                        <p className="mt-1 text-sm text-slate-500">
                                            Realiza tu pago y registra el comprobante.
                                        </p>
                                    </div>
                                </label>
                            )}
                        </div>

                        {paymentMethod === "transferencia" && !course.isFree ? (
                            <div className="mt-6 space-y-4">
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <h3 className="text-sm font-extrabold text-slate-950">
                                                Comprobante de transferencia
                                            </h3>
                                            <p className="mt-1 text-xs text-slate-500">
                                                Resumen del comprobante registrado.
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={openVoucherModal}
                                            className="inline-flex h-10 items-center justify-center rounded-xl bg-[linear-gradient(180deg,#4176ea_0%,#2f63d8_100%)] px-4 text-xs font-semibold text-white shadow-[0_8px_20px_rgba(47,99,216,0.20)] transition hover:brightness-105"
                                        >
                                            {voucherFile
                                                ? "Editar comprobante"
                                                : "Cargar comprobante"}
                                        </button>
                                    </div>

                                    <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                                        <div className="space-y-2 text-xs text-slate-600">
                                            <div className="flex items-center justify-between gap-3">
                                                <span>Número</span>
                                                <span className="font-semibold text-slate-900">
                                                    {voucherNumber || "Pendiente de generar"}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between gap-3">
                                                <span>Archivo</span>
                                                <span className="max-w-[60%] truncate text-right font-semibold text-slate-900">
                                                    {voucherFile
                                                        ? voucherFile.name
                                                        : "Pendiente"}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between gap-3">
                                                <span>Referencia</span>
                                                <span className="font-semibold text-slate-900">
                                                    {referenceCode || "Pendiente"}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between gap-3">
                                                <span>Estado de carga</span>
                                                <span
                                                    className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${voucherFile
                                                        ? "bg-emerald-100 text-emerald-700"
                                                        : "bg-amber-100 text-amber-700"
                                                        }`}
                                                >
                                                    {transferStatus}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between gap-3">
                                                <span>Estado del comprobante</span>
                                                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-700">
                                                    {voucherReviewStatus}
                                                </span>
                                            </div>
                                        </div>

                                        {observations ? (
                                            <div className="mt-3 border-t border-slate-200 pt-3">
                                                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                                    Observación
                                                </p>
                                                <p className="mt-1 text-xs text-slate-700">
                                                    {observations}
                                                </p>
                                            </div>
                                        ) : null}

                                        {voucherPreview ? (
                                            <div className="mt-3 overflow-hidden rounded-xl border border-slate-200">
                                                <div className="relative h-[140px] w-full bg-slate-100">
                                                    <Image
                                                        src={voucherPreview}
                                                        alt="Vista previa del comprobante"
                                                        fill
                                                        unoptimized
                                                        className="object-contain"
                                                    />
                                                </div>
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                        ) : null}

                        <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4">
                            <p className="text-sm font-semibold text-slate-700">
                                Resumen de la matrícula
                            </p>

                            <div className="mt-3 space-y-3 text-sm text-slate-600">
                                <div className="flex items-center justify-between gap-3">
                                    <span>Curso</span>
                                    <span className="max-w-[60%] text-right font-medium text-slate-900">
                                        {course.title}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-3">
                                    <span>Valor del producto</span>
                                    <span className="font-medium text-slate-900">
                                        {course.isFree
                                            ? "Gratis"
                                            : formatPrice(productTotal)}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between gap-3">
                                    <span>Descuento</span>
                                    <span
                                        className={`font-bold ${discountAmount > 0
                                            ? "text-emerald-600"
                                            : "text-slate-900"
                                            }`}
                                    >
                                        {course.isFree
                                            ? "$0.00"
                                            : `- ${formatPrice(discountAmount)}`}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm">
                                    <span className="text-sm font-semibold text-slate-700">
                                        Total a pagar
                                    </span>
                                    <span className="text-base font-extrabold text-slate-950">
                                        {course.isFree
                                            ? "Gratis"
                                            : formatPrice(totalPayable)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {submitError ? (
                            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                {submitError}
                            </div>
                        ) : null}

                        {submitMessage ? (
                            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                                {submitMessage}
                            </div>
                        ) : null}

                        <div className="mt-5 flex flex-wrap justify-end gap-3">
                            <button
                                type="button"
                                onClick={handleSubmitEnrollment}
                                disabled={
                                    submittingEnrollment ||
                                    (!course.isFree &&
                                        paymentMethod === "transferencia" &&
                                        !voucherFile)
                                }
                                className="inline-flex h-11 items-center justify-center rounded-2xl bg-[linear-gradient(180deg,#4176ea_0%,#2f63d8_100%)] px-5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(47,99,216,0.25)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {submittingEnrollment
                                    ? "Guardando..."
                                    : "Confirmar matrícula"}
                            </button>
                        </div>
                    </aside>
                </div>
            </section>

            {isVoucherModalOpen ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-6">
                    <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[28px] border border-slate-200 bg-white shadow-2xl">
                        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-5">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
                                    Modal de comprobante
                                </p>
                                <h3 className="mt-1 text-xl font-extrabold text-slate-950">
                                    Cargar comprobante
                                </h3>
                            </div>

                            <button
                                type="button"
                                onClick={closeVoucherModal}
                                className="inline-flex h-10 items-center justify-center rounded-2xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                                Cerrar
                            </button>
                        </div>

                        <div className="space-y-5 p-6">
                            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">
                                    Número de comprobante
                                </p>
                                <p className="mt-1 text-sm font-bold text-slate-900">
                                    {voucherNumber ||
                                        "Se generará automáticamente al guardar"}
                                </p>
                            </div>

                            <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                                <div className="border-b border-slate-200 bg-white px-3 py-2.5">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                                        Información bancaria
                                    </p>
                                    <h4 className="mt-0.5 text-xs font-extrabold text-slate-950">
                                        Datos para la transferencia
                                    </h4>
                                </div>

                                <div className="grid gap-2.5 p-3 sm:grid-cols-2">
                                    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                            Banco
                                        </p>
                                        <p className="mt-0.5 text-xs font-bold text-slate-900">
                                            Banco Pichincha
                                        </p>
                                    </div>

                                    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                            Tipo de cuenta
                                        </p>
                                        <p className="mt-0.5 text-xs font-bold text-slate-900">
                                            Ahorros
                                        </p>
                                    </div>

                                    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 sm:col-span-2">
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                            Titular
                                        </p>
                                        <p className="mt-0.5 text-xs font-bold leading-5 text-slate-900">
                                            Santic Education Cía. Ltda.
                                        </p>
                                    </div>

                                    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 sm:col-span-2">
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                            Número de cuenta
                                        </p>
                                        <p className="mt-0.5 break-all text-xl font-bold text-red-500">
                                            2201456789
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Código de referencia
                                    </label>
                                    <input
                                        type="text"
                                        value={tempReferenceCode}
                                        onChange={(event) =>
                                            setTempReferenceCode(event.target.value)
                                        }
                                        placeholder="Ej: TRX-2026-001"
                                        className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Archivo del comprobante
                                    </label>
                                    <label className="flex h-11 cursor-pointer items-center rounded-2xl border border-dashed border-blue-300 bg-white px-4 text-sm font-medium text-blue-700 transition hover:bg-blue-50">
                                        <input
                                            type="file"
                                            accept="image/*,.pdf"
                                            className="hidden"
                                            onChange={handleTempVoucherChange}
                                        />
                                        Seleccionar archivo
                                    </label>
                                </div>
                            </div>


                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                                    Archivo seleccionado
                                </p>
                                <p className="mt-2 text-sm font-bold text-slate-900">
                                    {tempVoucherFile
                                        ? tempVoucherFile.name
                                        : "Aún no se ha seleccionado ningún archivo"}
                                </p>

                                {tempVoucherPreview ? (
                                    <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                                        <div className="relative h-[240px] w-full bg-slate-100">
                                            <Image
                                                src={tempVoucherPreview}
                                                alt="Vista previa temporal del comprobante"
                                                fill
                                                unoptimized
                                                className="object-contain"
                                            />
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        </div>

                        <div className="sticky bottom-0 flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 bg-white px-6 py-5">
                            <button
                                type="button"
                                onClick={closeVoucherModal}
                                className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                                Cancelar
                            </button>

                            <button
                                type="button"
                                onClick={saveVoucherData}
                                disabled={!tempVoucherFile}
                                className="inline-flex h-11 items-center justify-center rounded-2xl bg-[linear-gradient(180deg,#4176ea_0%,#2f63d8_100%)] px-5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(47,99,216,0.25)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                Guardar comprobante
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </>
    );
}