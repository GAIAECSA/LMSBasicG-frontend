"use client";

import Link from "next/link";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    AlertCircle,
    Award,
    Banknote,
    Bell,
    BookOpen,
    CalendarDays,
    CheckCircle2,
    ChevronRight,
    Clock3,
    CreditCard,
    FileCheck2,
    FileImage,
    FileWarning,
    GraduationCap,
    ImageIcon,
    Info,
    Layers3,
    Loader2,
    Lock,
    Percent,
    ReceiptText,
    RefreshCw,
    ShieldCheck,
    Sparkles,
    UploadCloud,
    UsersRound,
    X,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getAllCourses } from "@/services/courses.service";
import {
    createEnrollment,
    getEnrollmentsByUser,
    type Enrollment,
} from "@/services/enrollments.service";
import { getAuthSession } from "@/lib/auth";

type RawCourse = {
    id?: number | string;
    title?: string;
    name?: string;
    description?: string;
    image_url?: string | null;
    image?: string | null;
    thumbnail?: string | null;
    course_image_url?: string | null;
    price?: number | string | null;
    is_free?: boolean | null;
    status?: string | null;
    teacher_name?: string | null;
    instructor_name?: string | null;
    duration?: number | string | null;
    duration_hours?: number | string | null;
    duration_minutes?: number | string | null;
    total_lessons?: number | string | null;
    total_students?: number | string | null;
    category?: string | null;
    category_name?: string | null;
    subcategory?: string | null;
    subcategory_name?: string | null;
    has_discount?: boolean | null;
    discount?: boolean | null;
    discount_percentage?: number | string | null;
    discount_percent?: number | string | null;
    discount_rate?: number | string | null;
    discounted_price?: number | string | null;
    discount_price?: number | string | null;
    open_enrollment?: boolean | null;
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
    totalLessons: number;
    totalStudents: number;
    category: string;
    openEnrollment: boolean;
    hasDiscount: boolean;
    discountPercentage: number;
    discountedPrice: number | null;
};

type PaymentMethod = "transferencia" | "gratis";

type ExistingEnrollmentState =
    | {
        type: "none";
        enrollment: null;
    }
    | {
        type: "approved" | "pending" | "rejected";
        enrollment: Enrollment;
    };

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ||
    "http://213.165.74.184:9000";

function resolveImageUrl(value?: string | null): string | null {
    if (!value || value.trim().length === 0) return null;

    const trimmed = value.trim();

    if (
        trimmed.startsWith("http://") ||
        trimmed.startsWith("https://") ||
        trimmed.startsWith("data:image/")
    ) {
        return trimmed;
    }

    if (trimmed.startsWith("/")) return `${API_BASE_URL}${trimmed}`;

    return `${API_BASE_URL}/${trimmed.replace(/^\/+/, "")}`;
}

function toNumber(value: unknown, fallback = 0): number {
    const parsed = typeof value === "number" ? value : Number(value ?? fallback);

    return Number.isFinite(parsed) ? parsed : fallback;
}

function formatPrice(value: number): string {
    return new Intl.NumberFormat("es-EC", {
        style: "currency",
        currency: "USD",
    }).format(value);
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

function getCourseCategory(course: RawCourse) {
    return (
        course.subcategory_name ||
        course.category_name ||
        course.subcategory ||
        course.category ||
        "Curso académico"
    );
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
        price > 0 &&
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

    const discountPercentage =
        hasDiscount && rawDiscountPercentage > 0
            ? Math.round(rawDiscountPercentage)
            : hasDiscount && discountedPrice !== null && price > 0
                ? Math.round(((price - discountedPrice) / price) * 100)
                : 0;

    return {
        id: Number(course.id ?? 0),
        title: course.title?.trim() || course.name?.trim() || "Curso sin título",
        description:
            course.description?.trim() ||
            "Este curso está disponible para iniciar tu aprendizaje.",
        imageUrl: resolveImageUrl(
            course.image_url ??
            course.course_image_url ??
            course.image ??
            course.thumbnail ??
            null,
        ),
        price,
        isFree,
        status: course.status?.trim() || "Disponible",
        teacherName:
            course.teacher_name?.trim() ||
            course.instructor_name?.trim() ||
            "Docente no asignado",
        durationLabel: formatDurationFromValues(
            course.duration,
            course.duration_hours,
            course.duration_minutes,
        ),
        totalLessons: toNumber(course.total_lessons, 0),
        totalStudents: toNumber(course.total_students, 0),
        category: getCourseCategory(course),
        openEnrollment:
            typeof course.open_enrollment === "boolean"
                ? course.open_enrollment
                : true,
        hasDiscount,
        discountPercentage,
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

function getUserFullName(user: unknown) {
    if (!user || typeof user !== "object") return "Estudiante";

    const value = user as {
        firstname?: string;
        lastname?: string;
        fullName?: string;
        name?: string;
        username?: string;
        email?: string;
    };

    const fullName = `${value.firstname ?? ""} ${value.lastname ?? ""}`.trim();

    return (
        value.fullName ||
        fullName ||
        value.name ||
        value.username ||
        value.email?.split("@")[0] ||
        "Estudiante"
    );
}

function getInitials(name: string) {
    const words = name.trim().split(/\s+/).filter(Boolean);

    if (words.length === 0) return "ES";

    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();

    return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

function getEnrollmentState(
    enrollments: Enrollment[],
    courseId: number,
): ExistingEnrollmentState {
    const enrollment =
        enrollments.find((item) => Number(item.course?.id) === courseId) ??
        null;

    if (!enrollment) {
        return {
            type: "none",
            enrollment: null,
        };
    }

    if (enrollment.accepted === true) {
        return {
            type: "approved",
            enrollment,
        };
    }

    if (enrollment.accepted === false) {
        return {
            type: "pending",
            enrollment,
        };
    }

    return {
        type: "pending",
        enrollment,
    };
}

function PageTopBar({ initials }: { initials: string }) {
    return (
        <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex h-10 items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)] px-4 text-sm font-black text-[var(--foreground)] shadow-sm">
                <GraduationCap className="h-4 w-4 text-[var(--primary)]" />
                Rol: Estudiante
            </span>

            <button
                type="button"
                className="relative flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] shadow-sm transition hover:bg-[var(--muted)]"
                aria-label="Notificaciones"
            >
                <Bell className="h-5 w-5" />

                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--primary)] text-[10px] font-black text-[var(--primary-foreground)]">
                    3
                </span>
            </button>

            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--primary)] text-sm font-black text-[var(--primary-foreground)] shadow-sm">
                {initials}
            </div>
        </div>
    );
}

function SummaryItem({
    icon,
    title,
    value,
}: {
    icon: React.ReactNode;
    title: string;
    value: string;
}) {
    return (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--muted)] p-4">
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[var(--primary)] shadow-sm">
                    {icon}
                </div>

                <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wide text-[var(--muted-foreground)]">
                        {title}
                    </p>
                    <p className="mt-1 truncate text-sm font-black text-[var(--foreground)]">
                        {value}
                    </p>
                </div>
            </div>
        </div>
    );
}

function StepItem({
    number,
    title,
    description,
    active,
    done,
}: {
    number: number;
    title: string;
    description: string;
    active?: boolean;
    done?: boolean;
}) {
    return (
        <div className="flex gap-3">
            <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-black ${done
                    ? "bg-[var(--success)] text-white"
                    : active
                        ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                        : "bg-[var(--muted)] text-[var(--muted-foreground)]"
                    }`}
            >
                {done ? <CheckCircle2 className="h-5 w-5" /> : number}
            </div>

            <div>
                <p className="text-sm font-black text-[var(--foreground)]">
                    {title}
                </p>
                <p className="mt-1 text-xs font-semibold leading-5 text-[var(--muted-foreground)]">
                    {description}
                </p>
            </div>
        </div>
    );
}

export default function StudentEnrollmentPage() {
    const params = useParams<{ courseId: string }>();
    const router = useRouter();
    const { user } = useAuth();

    const courseId = useMemo(() => Number(params?.courseId), [params?.courseId]);
    const isValidCourseId = Number.isFinite(courseId) && courseId > 0;

    const displayName = getUserFullName(user);
    const initials = getInitials(displayName);

    const [course, setCourse] = useState<CourseEnrollmentItem | null>(null);
    const [existingEnrollmentState, setExistingEnrollmentState] =
        useState<ExistingEnrollmentState>({
            type: "none",
            enrollment: null,
        });
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
        if (!isValidCourseId) return;

        let active = true;

        const timeoutId = window.setTimeout(() => {
            const loadCourse = async () => {
                try {
                    setLoading(true);
                    setError("");

                    const session = getAuthSession();
                    const userId = Number(user?.id ?? session?.user?.id);

                    const [coursesResponse, enrollmentsResponse] =
                        await Promise.all([
                            getAllCourses(),
                            userId && !Number.isNaN(userId)
                                ? getEnrollmentsByUser(userId)
                                : Promise.resolve([]),
                        ]);

                    if (!active) return;

                    const courses = Array.isArray(coursesResponse)
                        ? coursesResponse.map((item) =>
                            normalizeCourse(item as unknown as RawCourse),
                        )
                        : [];

                    const found = courses.find((item) => item.id === courseId);

                    if (!found) {
                        setCourse(null);
                        setError("No se encontró la información del curso.");
                        return;
                    }

                    const enrollmentState = getEnrollmentState(
                        Array.isArray(enrollmentsResponse)
                            ? enrollmentsResponse
                            : [],
                        courseId,
                    );

                    setCourse(found);
                    setPaymentMethod(found.isFree ? "gratis" : "transferencia");
                    setExistingEnrollmentState(enrollmentState);
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
        }, 0);

        return () => {
            active = false;
            window.clearTimeout(timeoutId);
        };
    }, [courseId, isValidCourseId, user?.id]);

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

    const discountAmount = course?.isFree
        ? 0
        : course?.hasDiscount && course.discountedPrice !== null
            ? Math.max((course.price ?? 0) - course.discountedPrice, 0)
            : 0;

    const totalPayable = course?.isFree ? 0 : finalPrice;

    const canSubmit =
        Boolean(course) &&
        !submittingEnrollment &&
        existingEnrollmentState.type === "none" &&
        (course?.isFree ||
            paymentMethod === "gratis" ||
            Boolean(voucherFile));

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
        if (!tempVoucherFile) return;

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
            const userId = Number(user?.id ?? session?.user?.id);

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

            setExistingEnrollmentState({
                type: createdEnrollment.accepted ? "approved" : "pending",
                enrollment: createdEnrollment,
            });

            setSubmitMessage(
                createdEnrollment.accepted
                    ? "Matrícula registrada correctamente. Ya puedes ingresar al aula."
                    : "Tu matrícula fue registrada correctamente y quedó pendiente de validación.",
            );

            window.setTimeout(() => {
                router.push(
                    createdEnrollment.accepted
                        ? "/student/courses"
                        : "/student/catalog",
                );
            }, 1400);
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
            <section className="min-h-screen bg-[var(--background)] px-4 py-5 pt-16 text-[var(--foreground)] sm:px-5 md:px-8 md:pt-7 xl:px-10">
                <div className="rounded-[26px] border border-[var(--danger)] bg-[var(--danger-soft)] p-6 text-sm font-bold text-[var(--danger)] shadow-sm">
                    El identificador del curso no es válido.
                </div>

                <Link
                    href="/student/catalog"
                    className="mt-5 inline-flex h-11 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--card)] px-5 text-sm font-black text-[var(--foreground)] transition hover:bg-[var(--muted)]"
                >
                    Volver al catálogo
                </Link>
            </section>
        );
    }

    if (loading) {
        return (
            <section className="min-h-screen bg-[var(--background)] px-4 py-5 pt-16 text-[var(--foreground)] sm:px-5 md:px-8 md:pt-7 xl:px-10">
                <div className="flex min-h-[420px] flex-col items-center justify-center rounded-[28px] border border-[var(--border)] bg-[var(--card)] p-8 shadow-sm">
                    <Loader2 className="h-9 w-9 animate-spin text-[var(--primary)]" />
                    <p className="mt-4 text-sm font-black text-[var(--muted-foreground)]">
                        Cargando proceso de matrícula...
                    </p>
                </div>
            </section>
        );
    }

    if (error || !course) {
        return (
            <section className="min-h-screen bg-[var(--background)] px-4 py-5 pt-16 text-[var(--foreground)] sm:px-5 md:px-8 md:pt-7 xl:px-10">
                <div className="rounded-[26px] border border-[var(--danger)] bg-[var(--danger-soft)] p-6 text-sm font-bold text-[var(--danger)] shadow-sm">
                    {error || "No se encontró el curso."}
                </div>

                <Link
                    href="/student/catalog"
                    className="mt-5 inline-flex h-11 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--card)] px-5 text-sm font-black text-[var(--foreground)] transition hover:bg-[var(--muted)]"
                >
                    Volver al catálogo
                </Link>
            </section>
        );
    }

    return (
        <>
            <section className="min-h-screen bg-[var(--background)] px-4 py-5 pt-16 text-[var(--foreground)] sm:px-5 md:px-8 md:pt-7 xl:px-10">
                <div className="mb-6 flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                    <div>
                        <div className="flex flex-wrap items-center gap-2 text-sm font-black">
                            <Link
                                href="/student/catalog"
                                className="text-[var(--primary)]"
                            >
                                Catálogo
                            </Link>

                            <ChevronRight className="h-4 w-4 text-[var(--muted-foreground)]" />

                            <span className="text-[var(--foreground)]">
                                Matrícula
                            </span>
                        </div>

                        <h1 className="mt-4 text-3xl font-black tracking-tight text-[var(--foreground)] sm:text-4xl">
                            Matricularme en el curso
                        </h1>

                        <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-[var(--muted-foreground)] sm:text-base">
                            Revisa la información académica, confirma el método
                            de pago y registra tu matrícula.
                        </p>
                    </div>

                    <PageTopBar initials={initials} />
                </div>

                {existingEnrollmentState.type !== "none" ? (
                    <div
                        className={`mb-6 rounded-[24px] border p-5 shadow-sm ${existingEnrollmentState.type === "approved"
                            ? "border-[var(--success)]/30 bg-[var(--success-soft)] text-[var(--success)]"
                            : "border-[var(--warning)]/30 bg-[var(--warning-soft)] text-[var(--warning)]"
                            }`}
                    >
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div className="flex items-start gap-3">
                                {existingEnrollmentState.type === "approved" ? (
                                    <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0" />
                                ) : (
                                    <Clock3 className="mt-0.5 h-6 w-6 shrink-0" />
                                )}

                                <div>
                                    <p className="text-base font-black">
                                        {existingEnrollmentState.type === "approved"
                                            ? "Ya tienes matrícula aprobada"
                                            : "Tu matrícula está pendiente de validación"}
                                    </p>

                                    <p className="mt-1 text-sm font-semibold opacity-80">
                                        {existingEnrollmentState.type === "approved"
                                            ? "Puedes ingresar al aula desde tus cursos."
                                            : "Cuando el administrador apruebe el comprobante, el curso aparecerá en Mis cursos."}
                                    </p>
                                </div>
                            </div>

                            <Link
                                href={
                                    existingEnrollmentState.type === "approved"
                                        ? `/student/courses/${course.id}`
                                        : "/student/catalog"
                                }
                                className="inline-flex h-11 items-center justify-center rounded-2xl bg-white px-5 text-sm font-black text-[var(--primary)] shadow-sm transition hover:bg-white/90"
                            >
                                {existingEnrollmentState.type === "approved"
                                    ? "Entrar al aula"
                                    : "Volver al catálogo"}
                            </Link>
                        </div>
                    </div>
                ) : null}

                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
                    <div className="space-y-6">
                        <article className="overflow-hidden rounded-[30px] border border-[var(--border)] bg-[var(--card)] shadow-sm">
                            <div className="grid gap-0 lg:grid-cols-[420px_minmax(0,1fr)]">
                                <div className="relative h-[260px] overflow-hidden bg-[var(--muted)] lg:h-full">
                                    {course.imageUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={course.imageUrl}
                                            alt={course.title}
                                            className="h-full w-full object-cover object-center"
                                        />
                                    ) : (
                                        <div className="flex h-full items-center justify-center bg-[var(--muted)] text-[var(--muted-foreground)]">
                                            <ImageIcon className="h-12 w-12" />
                                        </div>
                                    )}

                                    <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/70 to-transparent" />

                                    <div className="absolute left-5 top-5 flex flex-wrap gap-2">
                                        <span className="rounded-full bg-[var(--primary)] px-3 py-1 text-xs font-black uppercase text-[var(--primary-foreground)] shadow-sm">
                                            {course.category}
                                        </span>

                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-black uppercase text-white shadow-sm ${course.openEnrollment
                                                ? "bg-[var(--success)]"
                                                : "bg-slate-800"
                                                }`}
                                        >
                                            {course.openEnrollment
                                                ? "Matrícula abierta"
                                                : "Matrícula cerrada"}
                                        </span>
                                    </div>

                                    {course.hasDiscount ? (
                                        <div className="absolute right-5 top-5 flex h-20 w-20 rotate-3 flex-col items-center justify-center rounded-3xl bg-orange-500 text-white shadow-lg ring-4 ring-white/30">
                                            <Percent className="h-5 w-5" />
                                            <span className="mt-1 text-lg font-black">
                                                -{course.discountPercentage}%
                                            </span>
                                        </div>
                                    ) : null}

                                    <div className="absolute bottom-5 left-5 right-5">
                                        <p className="text-sm font-bold text-white/80">
                                            Proceso de matrícula
                                        </p>
                                        <h2 className="mt-1 line-clamp-2 text-2xl font-black text-white">
                                            {course.title}
                                        </h2>
                                    </div>
                                </div>

                                <div className="p-6">
                                    <div className="flex flex-wrap gap-2">
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-black ${course.isFree
                                                ? "bg-[var(--success-soft)] text-[var(--success)]"
                                                : "bg-[var(--secondary)] text-[var(--primary)]"
                                                }`}
                                        >
                                            {course.isFree
                                                ? "Curso gratuito"
                                                : "Curso de pago"}
                                        </span>

                                        {course.hasDiscount ? (
                                            <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-black text-orange-700">
                                                Oferta activa
                                            </span>
                                        ) : null}
                                    </div>

                                    <h2 className="mt-4 text-2xl font-black text-[var(--foreground)]">
                                        {course.title}
                                    </h2>

                                    <p className="mt-3 max-h-[150px] overflow-y-auto whitespace-pre-wrap text-sm font-semibold leading-7 text-[var(--muted-foreground)]">
                                        {course.description}
                                    </p>

                                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                                        <SummaryItem
                                            icon={<GraduationCap className="h-5 w-5" />}
                                            title="Docente"
                                            value={course.teacherName}
                                        />

                                        <SummaryItem
                                            icon={<Clock3 className="h-5 w-5" />}
                                            title="Duración"
                                            value={course.durationLabel}
                                        />

                                        <SummaryItem
                                            icon={<Layers3 className="h-5 w-5" />}
                                            title="Contenidos"
                                            value={
                                                course.totalLessons > 0
                                                    ? `${course.totalLessons} lecciones`
                                                    : "Por definir"
                                            }
                                        />

                                        <SummaryItem
                                            icon={<UsersRound className="h-5 w-5" />}
                                            title="Estudiantes"
                                            value={
                                                course.totalStudents > 0
                                                    ? `${course.totalStudents} inscritos`
                                                    : "Sin inscritos"
                                            }
                                        />
                                    </div>
                                </div>
                            </div>
                        </article>

                        <article className="rounded-[28px] border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--secondary)] text-[var(--primary)]">
                                    <ReceiptText className="h-6 w-6" />
                                </div>

                                <div>
                                    <h2 className="text-xl font-black text-[var(--foreground)]">
                                        Resumen de pago
                                    </h2>
                                    <p className="text-sm font-semibold text-[var(--muted-foreground)]">
                                        Valores generados para esta matrícula.
                                    </p>
                                </div>
                            </div>

                            <div className="mt-5 space-y-3 rounded-2xl bg-[var(--muted)] p-4">
                                <div className="flex items-center justify-between gap-4 text-sm">
                                    <span className="font-semibold text-[var(--muted-foreground)]">
                                        Precio del curso
                                    </span>
                                    <span className="font-black text-[var(--foreground)]">
                                        {course.isFree
                                            ? "Gratis"
                                            : formatPrice(course.price)}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between gap-4 text-sm">
                                    <span className="font-semibold text-[var(--muted-foreground)]">
                                        Descuento aplicado
                                    </span>
                                    <span
                                        className={`font-black ${discountAmount > 0
                                            ? "text-orange-600"
                                            : "text-[var(--muted-foreground)]"
                                            }`}
                                    >
                                        {discountAmount > 0
                                            ? `-${formatPrice(discountAmount)}`
                                            : formatPrice(0)}
                                    </span>
                                </div>

                                <div className="border-t border-[var(--border)] pt-3">
                                    <div className="flex items-center justify-between gap-4">
                                        <span className="text-base font-black text-[var(--foreground)]">
                                            Total a pagar
                                        </span>
                                        <span
                                            className={`text-3xl font-black ${totalPayable === 0
                                                ? "text-[var(--success)]"
                                                : "text-[var(--primary)]"
                                                }`}
                                        >
                                            {totalPayable === 0
                                                ? "Gratis"
                                                : formatPrice(totalPayable)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </article>
                    </div>

                    <aside className="space-y-6">
                        <article className="rounded-[28px] border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--secondary)] text-[var(--primary)]">
                                    <CreditCard className="h-6 w-6" />
                                </div>

                                <div>
                                    <h2 className="text-xl font-black text-[var(--foreground)]">
                                        Método de matrícula
                                    </h2>
                                    <p className="text-sm font-semibold text-[var(--muted-foreground)]">
                                        Completa el paso requerido.
                                    </p>
                                </div>
                            </div>

                            <div className="mt-6 space-y-3">
                                {course.isFree ? (
                                    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[var(--success)]/30 bg-[var(--success-soft)] p-4">
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            checked={paymentMethod === "gratis"}
                                            onChange={() =>
                                                setPaymentMethod("gratis")
                                            }
                                            className="mt-1 h-4 w-4 accent-[var(--success)]"
                                        />

                                        <div>
                                            <p className="text-sm font-black text-[var(--success)]">
                                                Matrícula directa
                                            </p>

                                            <p className="mt-1 text-sm font-semibold leading-6 text-[var(--success)]/80">
                                                Este curso no requiere pago.
                                                Confirma la matrícula para
                                                solicitar el acceso.
                                            </p>
                                        </div>
                                    </label>
                                ) : (
                                    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[var(--border)] bg-white p-4 transition hover:bg-[var(--muted)]">
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            checked={
                                                paymentMethod === "transferencia"
                                            }
                                            onChange={() =>
                                                setPaymentMethod(
                                                    "transferencia",
                                                )
                                            }
                                            className="mt-1 h-4 w-4 accent-[var(--primary)]"
                                        />

                                        <div>
                                            <p className="text-sm font-black text-[var(--foreground)]">
                                                Transferencia bancaria
                                            </p>

                                            <p className="mt-1 text-sm font-semibold leading-6 text-[var(--muted-foreground)]">
                                                Realiza el pago, sube tu
                                                comprobante y espera la
                                                validación administrativa.
                                            </p>
                                        </div>
                                    </label>
                                )}
                            </div>

                            {paymentMethod === "transferencia" &&
                                !course.isFree ? (
                                <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--muted)] p-4">
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <h3 className="text-sm font-black text-[var(--foreground)]">
                                                Comprobante de transferencia
                                            </h3>

                                            <p className="mt-1 text-xs font-semibold text-[var(--muted-foreground)]">
                                                Archivo requerido para validar
                                                tu matrícula.
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={openVoucherModal}
                                            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 text-xs font-black text-[var(--primary-foreground)] shadow-sm transition hover:opacity-95"
                                        >
                                            <UploadCloud className="h-4 w-4" />
                                            {voucherFile
                                                ? "Editar"
                                                : "Cargar"}
                                        </button>
                                    </div>

                                    <div className="mt-4 space-y-3 rounded-2xl bg-white p-4">
                                        <div className="flex items-center justify-between gap-3 text-xs">
                                            <span className="font-semibold text-[var(--muted-foreground)]">
                                                Número
                                            </span>
                                            <span className="font-black text-[var(--foreground)]">
                                                {voucherNumber ||
                                                    "Pendiente de generar"}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between gap-3 text-xs">
                                            <span className="font-semibold text-[var(--muted-foreground)]">
                                                Archivo
                                            </span>
                                            <span className="max-w-[60%] truncate text-right font-black text-[var(--foreground)]">
                                                {voucherFile
                                                    ? voucherFile.name
                                                    : "Pendiente"}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between gap-3 text-xs">
                                            <span className="font-semibold text-[var(--muted-foreground)]">
                                                Estado
                                            </span>
                                            <span
                                                className={`font-black ${voucherFile
                                                    ? "text-[var(--warning)]"
                                                    : "text-[var(--muted-foreground)]"
                                                    }`}
                                            >
                                                {voucherFile
                                                    ? "Pendiente de validación"
                                                    : "Pendiente"}
                                            </span>
                                        </div>
                                    </div>

                                    {voucherPreview ? (
                                        <div className="mt-4 overflow-hidden rounded-2xl border border-[var(--border)] bg-white">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={voucherPreview}
                                                alt="Vista previa del comprobante"
                                                className="max-h-[220px] w-full object-contain"
                                            />
                                        </div>
                                    ) : null}
                                </div>
                            ) : null}

                            {submitError ? (
                                <div className="mt-5 rounded-2xl border border-[var(--danger)] bg-[var(--danger-soft)] p-4 text-sm font-bold text-[var(--danger)]">
                                    <div className="flex gap-2">
                                        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                                        <span>{submitError}</span>
                                    </div>
                                </div>
                            ) : null}

                            {submitMessage ? (
                                <div className="mt-5 rounded-2xl border border-[var(--success)]/30 bg-[var(--success-soft)] p-4 text-sm font-bold text-[var(--success)]">
                                    <div className="flex gap-2">
                                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                                        <span>{submitMessage}</span>
                                    </div>
                                </div>
                            ) : null}

                            <button
                                type="button"
                                onClick={() => void handleSubmitEnrollment()}
                                disabled={!canSubmit}
                                className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-5 text-sm font-black text-[var(--primary-foreground)] shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {submittingEnrollment ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : course.isFree ? (
                                    <BookOpen className="h-4 w-4" />
                                ) : (
                                    <ReceiptText className="h-4 w-4" />
                                )}

                                {submittingEnrollment
                                    ? "Registrando matrícula..."
                                    : course.isFree
                                        ? "Confirmar matrícula"
                                        : "Enviar matrícula"}
                            </button>
                        </article>

                        <article className="rounded-[28px] border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
                            <h2 className="text-lg font-black text-[var(--foreground)]">
                                Flujo de matrícula
                            </h2>

                            <div className="mt-5 space-y-5">
                                <StepItem
                                    number={1}
                                    title="Revisar curso"
                                    description="Verifica la información académica y el costo del curso."
                                    done
                                />

                                <StepItem
                                    number={2}
                                    title={
                                        course.isFree
                                            ? "Confirmar acceso"
                                            : "Subir comprobante"
                                    }
                                    description={
                                        course.isFree
                                            ? "El curso gratuito no requiere comprobante."
                                            : "Carga una imagen o PDF del pago realizado."
                                    }
                                    active={!voucherFile && !course.isFree}
                                    done={course.isFree || Boolean(voucherFile)}
                                />

                                <StepItem
                                    number={3}
                                    title="Validación"
                                    description="La administración revisa tu solicitud y habilita el aula."
                                    active={Boolean(voucherFile) || course.isFree}
                                />
                            </div>
                        </article>

                        <article className="rounded-[28px] border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
                            <div className="flex gap-3">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--secondary)] text-[var(--primary)]">
                                    <ShieldCheck className="h-5 w-5" />
                                </div>

                                <div>
                                    <h3 className="text-base font-black text-[var(--foreground)]">
                                        Validación segura
                                    </h3>

                                    <p className="mt-2 text-sm font-semibold leading-6 text-[var(--muted-foreground)]">
                                        Tu comprobante será revisado antes de
                                        habilitar el aula. Cuando sea aprobado,
                                        el curso aparecerá en la sección
                                        “Mis cursos”.
                                    </p>
                                </div>
                            </div>
                        </article>
                    </aside>
                </div>
            </section>

            {isVoucherModalOpen ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
                    <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl">
                        <div className="flex items-center justify-between gap-4 border-b border-[var(--border)] bg-[var(--primary)] px-6 py-5 text-[var(--primary-foreground)]">
                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.18em] text-white/70">
                                    Comprobante de pago
                                </p>
                                <h3 className="mt-1 text-xl font-black">
                                    Cargar comprobante
                                </h3>
                            </div>

                            <button
                                type="button"
                                onClick={closeVoucherModal}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-white transition hover:bg-white/20"
                                aria-label="Cerrar"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="overflow-y-auto p-6">
                            <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
                                <div className="space-y-5">
                                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--muted)] p-4">
                                        <p className="text-xs font-black uppercase tracking-wide text-[var(--muted-foreground)]">
                                            Número de comprobante
                                        </p>

                                        <p className="mt-2 text-sm font-black text-[var(--foreground)]">
                                            {voucherNumber ||
                                                "Se generará automáticamente al guardar"}
                                        </p>
                                    </div>

                                    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white">
                                        <div className="border-b border-[var(--border)] bg-[var(--muted)] px-4 py-3">
                                            <h4 className="text-sm font-black text-[var(--foreground)]">
                                                Datos para transferencia
                                            </h4>
                                        </div>

                                        <div className="grid gap-3 p-4 sm:grid-cols-2">
                                            <div className="rounded-xl bg-[var(--muted)] p-3">
                                                <p className="text-xs font-bold text-[var(--muted-foreground)]">
                                                    Banco
                                                </p>
                                                <p className="mt-1 text-sm font-black">
                                                    Banco Pichincha
                                                </p>
                                            </div>

                                            <div className="rounded-xl bg-[var(--muted)] p-3">
                                                <p className="text-xs font-bold text-[var(--muted-foreground)]">
                                                    Tipo de cuenta
                                                </p>
                                                <p className="mt-1 text-sm font-black">
                                                    Ahorros
                                                </p>
                                            </div>

                                            <div className="rounded-xl bg-[var(--muted)] p-3 sm:col-span-2">
                                                <p className="text-xs font-bold text-[var(--muted-foreground)]">
                                                    Titular
                                                </p>
                                                <p className="mt-1 text-sm font-black">
                                                    Santic Education Cía. Ltda.
                                                </p>
                                            </div>

                                            <div className="rounded-xl bg-[var(--secondary)] p-3 sm:col-span-2">
                                                <p className="text-xs font-bold text-[var(--primary)]">
                                                    Número de cuenta
                                                </p>
                                                <p className="mt-1 break-all text-2xl font-black text-[var(--primary)]">
                                                    2201456789
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid gap-4">
                                        <div>
                                            <label className="mb-2 block text-sm font-black text-[var(--foreground)]">
                                                Código de referencia
                                            </label>

                                            <input
                                                type="text"
                                                value={tempReferenceCode}
                                                onChange={(event) =>
                                                    setTempReferenceCode(
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="Ej: TRX-2026-001"
                                                className="h-12 w-full rounded-2xl border border-[var(--border)] bg-white px-4 text-sm font-semibold text-[var(--foreground)] outline-none transition focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--ring)]/30"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-sm font-black text-[var(--foreground)]">
                                                Observaciones
                                            </label>

                                            <textarea
                                                value={tempObservations}
                                                onChange={(event) =>
                                                    setTempObservations(
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="Agrega una nota opcional para administración."
                                                rows={4}
                                                className="w-full resize-none rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm font-semibold text-[var(--foreground)] outline-none transition focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--ring)]/30"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-5">
                                    <label className="flex min-h-[190px] cursor-pointer flex-col items-center justify-center rounded-[24px] border-2 border-dashed border-[var(--primary)]/30 bg-[var(--secondary)] p-6 text-center transition hover:bg-[var(--secondary)]/70">
                                        <input
                                            type="file"
                                            accept="image/*,.pdf"
                                            className="hidden"
                                            onChange={handleTempVoucherChange}
                                        />

                                        <UploadCloud className="h-12 w-12 text-[var(--primary)]" />

                                        <p className="mt-3 text-sm font-black text-[var(--primary)]">
                                            Seleccionar comprobante
                                        </p>

                                        <p className="mt-1 text-xs font-semibold leading-5 text-[var(--muted-foreground)]">
                                            Formatos permitidos: imagen o PDF.
                                        </p>
                                    </label>

                                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--muted)] p-4">
                                        <div className="flex items-center gap-3">
                                            {tempVoucherFile ? (
                                                <FileCheck2 className="h-5 w-5 text-[var(--success)]" />
                                            ) : (
                                                <FileWarning className="h-5 w-5 text-[var(--warning)]" />
                                            )}

                                            <div className="min-w-0">
                                                <p className="text-xs font-bold uppercase text-[var(--muted-foreground)]">
                                                    Archivo seleccionado
                                                </p>

                                                <p className="mt-1 truncate text-sm font-black text-[var(--foreground)]">
                                                    {tempVoucherFile
                                                        ? tempVoucherFile.name
                                                        : "Aún no has seleccionado un archivo"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {tempVoucherPreview ? (
                                        <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={tempVoucherPreview}
                                                alt="Vista previa temporal del comprobante"
                                                className="max-h-[310px] w-full object-contain"
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex min-h-[210px] flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--muted)] text-center">
                                            <FileImage className="h-10 w-10 text-[var(--muted-foreground)]" />
                                            <p className="mt-3 text-sm font-bold text-[var(--muted-foreground)]">
                                                La vista previa aparecerá aquí
                                            </p>
                                        </div>
                                    )}

                                    <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm font-semibold leading-6 text-blue-800">
                                        <div className="flex gap-2">
                                            <Info className="mt-0.5 h-5 w-5 shrink-0" />
                                            <p>
                                                Verifica que el comprobante sea
                                                claro y que el valor coincida con
                                                el total a pagar.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-[var(--border)] bg-white px-6 py-5">
                            <button
                                type="button"
                                onClick={closeVoucherModal}
                                className="inline-flex h-11 items-center justify-center rounded-2xl border border-[var(--border)] bg-white px-5 text-sm font-black text-[var(--foreground)] transition hover:bg-[var(--muted)]"
                            >
                                Cancelar
                            </button>

                            <button
                                type="button"
                                onClick={saveVoucherData}
                                disabled={!tempVoucherFile}
                                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-5 text-sm font-black text-[var(--primary-foreground)] shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <CheckCircle2 className="h-4 w-4" />
                                Guardar comprobante
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </>
    );
}