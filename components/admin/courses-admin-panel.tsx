"use client";

/* eslint-disable @next/next/no-img-element */

import {
    useCallback,
    useEffect,
    useMemo,
    useState,
    type ChangeEvent,
    type FormEvent,
} from "react";
import {
    COURSE_LEVEL_OPTIONS,
    createCourse,
    deleteCourse,
    getAllCourses,
    updateCourse,
    type Course,
    type CourseLevel,
} from "@/services/courses.service";
import {
    getAllSubcategories,
    type Subcategory,
} from "@/services/subcategories.service";
import {
    getAllCategories,
    type Category,
} from "@/services/categories.service";
import { getAllUsers, type User } from "@/services/users.service";
import {
    createEnrollment,
    getEnrollmentsByCourseAndRole,
    getEnrollmentsByUser,
    updateEnrollment,
} from "@/services/enrollments.service";

type Notice =
    | { type: "success"; text: string }
    | { type: "error"; text: string }
    | null;

type CourseFormState = {
    name: string;
    description: string;
    price: string;
    is_free: boolean;
    level: CourseLevel;
    is_published: boolean;
    open_enrollment: boolean;
    duration_hours: string;
    total_lessons: string;
    image_url: string;
    discount_price: string;
    currency: string;
    rating: string;
    total_students: string;
    category_id: string;
    subcategory_id: string;
};

type ApiCourseFields = {
    name?: string;
    description?: string;
    price?: number | string;
    is_free?: boolean;
    level?: CourseLevel;
    is_published?: boolean;
    open_enrollment?: boolean;
    duration_hours?: number;
    total_lessons?: number;
    subcategory_id?: number | null;
    image_url?: string | null;
    discount_price?: number | string;
    currency?: string;
    rating?: number | string;
    total_students?: number;
};

const EMPTY_IMAGE =
    "https://placehold.co/1200x700/e5e7eb/64748b?text=Sin+imagen";

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ||
    "http://213.165.74.184:9000";

const ROWS_PER_PAGE = 7;
const USERS_PER_PAGE = 5;

const initialFormState: CourseFormState = {
    name: "",
    description: "",
    price: "0",
    is_free: false,
    level: "PRINCIPIANTE",
    is_published: false,
    open_enrollment: true,
    duration_hours: "0",
    total_lessons: "0",
    image_url: "",
    discount_price: "0",
    currency: "USD",
    rating: "5",
    total_students: "0",
    category_id: "",
    subcategory_id: "",
};

function parseNumberInput(value: string, fallback = 0): number {
    const normalized = value.replace(",", ".").trim();

    if (!normalized) return fallback;

    const parsed = Number(normalized);

    return Number.isFinite(parsed) ? parsed : fallback;
}

function formatMoney(value: number, currency = "USD") {
    try {
        return new Intl.NumberFormat("es-EC", {
            style: "currency",
            currency: currency || "USD",
            minimumFractionDigits: 2,
        }).format(value);
    } catch {
        return `${currency || "USD"} ${value.toFixed(2)}`;
    }
}

function resolveImageUrl(imageUrl?: string | null): string {
    if (!imageUrl) return EMPTY_IMAGE;

    const trimmed = imageUrl.trim();

    if (!trimmed) return EMPTY_IMAGE;

    if (
        trimmed.startsWith("http://") ||
        trimmed.startsWith("https://") ||
        trimmed.startsWith("blob:")
    ) {
        return trimmed;
    }

    if (trimmed.startsWith("/")) {
        return `${API_BASE_URL}${trimmed}`;
    }

    return `${API_BASE_URL}/${trimmed.replace(/^\/+/, "")}`;
}

function asApiCourse(course: Course): Course & ApiCourseFields {
    return course as Course & ApiCourseFields;
}

function getCourseName(course: Course): string {
    return asApiCourse(course).name ?? "";
}

function getCourseDescription(course: Course): string {
    return asApiCourse(course).description ?? "";
}

function getCoursePrice(course: Course): number {
    const raw = asApiCourse(course).price;

    if (typeof raw === "number") return raw;

    if (typeof raw === "string") {
        const parsed = Number(raw);
        return Number.isFinite(parsed) ? parsed : 0;
    }

    return 0;
}

function getCourseLevel(course: Course): CourseLevel {
    return asApiCourse(course).level ?? "PRINCIPIANTE";
}

function getCourseOpenEnrollment(course: Course): boolean {
    return asApiCourse(course).open_enrollment ?? true;
}

function getCourseIsPublished(course: Course): boolean {
    return asApiCourse(course).is_published ?? false;
}

function getCourseIsFree(course: Course): boolean {
    return asApiCourse(course).is_free ?? false;
}

function getCourseSubcategoryId(course: Course): number | null {
    const raw = asApiCourse(course).subcategory_id;

    return typeof raw === "number" ? raw : null;
}

function getCourseDurationHours(course: Course): number {
    return asApiCourse(course).duration_hours ?? 0;
}

function getCourseTotalLessons(course: Course): number {
    return asApiCourse(course).total_lessons ?? 0;
}

function getCourseImageUrl(course: Course): string {
    return asApiCourse(course).image_url ?? "";
}

function getCourseDiscountPrice(course: Course): number {
    const raw = asApiCourse(course).discount_price;

    if (typeof raw === "number") return raw;

    if (typeof raw === "string") {
        const parsed = Number(raw);
        return Number.isFinite(parsed) ? parsed : 0;
    }

    return 0;
}

function getCourseCurrency(course: Course): string {
    return asApiCourse(course).currency ?? "USD";
}

function getCourseRating(course: Course): number {
    const raw = asApiCourse(course).rating;

    if (typeof raw === "number") return raw;

    if (typeof raw === "string") {
        const parsed = Number(raw);
        return Number.isFinite(parsed) ? parsed : 5;
    }

    return 5;
}

function getCourseTotalStudents(course: Course): number {
    return asApiCourse(course).total_students ?? 0;
}

function buildFormFromCourse(course: Course): CourseFormState {
    return {
        name: getCourseName(course),
        description: getCourseDescription(course),
        price: String(getCoursePrice(course)),
        is_free: getCourseIsFree(course),
        level: getCourseLevel(course),
        is_published: getCourseIsPublished(course),
        open_enrollment: getCourseOpenEnrollment(course),
        duration_hours: String(getCourseDurationHours(course)),
        total_lessons: String(getCourseTotalLessons(course)),
        image_url: getCourseImageUrl(course),
        discount_price: String(getCourseDiscountPrice(course)),
        currency: getCourseCurrency(course),
        rating: String(getCourseRating(course)),
        total_students: String(getCourseTotalStudents(course)),
        category_id: "",
        subcategory_id: String(getCourseSubcategoryId(course) ?? ""),
    };
}

function getPublishedBadgeClass(course: Course) {
    if (getCourseIsPublished(course)) {
        return "bg-emerald-100 text-emerald-700";
    }

    return "bg-orange-100 text-orange-700";
}

function SwitchCard({
    checked,
    label,
    onChange,
}: {
    checked: boolean;
    label: string;
    onChange: (value: boolean) => void;
}) {
    return (
        <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50/40">
            <input
                type="checkbox"
                checked={checked}
                onChange={(event) => onChange(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300"
            />
            <span>{label}</span>
        </label>
    );
}

export function CoursesAdminPanel() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
    const [form, setForm] = useState<CourseFormState>(initialFormState);
    const [editingCourseId, setEditingCourseId] = useState<number | null>(null);

    const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
    const [previewImageUrl, setPreviewImageUrl] = useState("");

    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [categoriesLoading, setCategoriesLoading] = useState(true);
    const [subcategoriesLoading, setSubcategoriesLoading] = useState(true);

    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [notice, setNotice] = useState<Notice>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [users, setUsers] = useState<User[]>([]);
    const [usersLoading, setUsersLoading] = useState(false);
    const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
    const [assigningCourse, setAssigningCourse] = useState<Course | null>(null);
    const [assigningTeacherId, setAssigningTeacherId] = useState<number | null>(
        null,
    );

    const [assignedTeacherUserIds, setAssignedTeacherUserIds] = useState<
        Set<number>
    >(new Set());

    const [userSearch, setUserSearch] = useState("");
    const [userCurrentPage, setUserCurrentPage] = useState(1);

    const showNotice = useCallback((type: "success" | "error", text: string) => {
        setNotice({ type, text });

        window.setTimeout(() => {
            setNotice((current) => (current?.text === text ? null : current));
        }, 2500);
    }, []);

    const loadCoursesData = useCallback(
        async (showSuccess = false) => {
            try {
                if (showSuccess) {
                    setIsRefreshing(true);
                } else {
                    setIsLoading(true);
                }

                setCategoriesLoading(true);
                setSubcategoriesLoading(true);

                const [coursesResult, categoriesResult, subcategoriesResult] =
                    await Promise.allSettled([
                        getAllCourses(),
                        getAllCategories(),
                        getAllSubcategories(),
                    ]);

                if (coursesResult.status === "fulfilled") {
                    setCourses(
                        Array.isArray(coursesResult.value)
                            ? coursesResult.value
                            : [],
                    );
                } else {
                    setCourses([]);
                    showNotice(
                        "error",
                        coursesResult.reason instanceof Error
                            ? coursesResult.reason.message
                            : "No se pudieron cargar los cursos.",
                    );
                }

                if (categoriesResult.status === "fulfilled") {
                    setCategories(
                        Array.isArray(categoriesResult.value)
                            ? categoriesResult.value
                            : [],
                    );
                } else {
                    setCategories([]);
                    showNotice(
                        "error",
                        categoriesResult.reason instanceof Error
                            ? categoriesResult.reason.message
                            : "No se pudieron cargar las categorías.",
                    );
                }

                if (subcategoriesResult.status === "fulfilled") {
                    setSubcategories(
                        Array.isArray(subcategoriesResult.value)
                            ? subcategoriesResult.value
                            : [],
                    );
                } else {
                    setSubcategories([]);
                    showNotice(
                        "error",
                        subcategoriesResult.reason instanceof Error
                            ? subcategoriesResult.reason.message
                            : "No se pudieron cargar las subcategorías.",
                    );
                }

                if (showSuccess) {
                    showNotice("success", "Lista de cursos actualizada correctamente.");
                }
            } finally {
                setCategoriesLoading(false);
                setSubcategoriesLoading(false);
                setIsLoading(false);
                setIsRefreshing(false);
            }
        },
        [showNotice],
    );

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void loadCoursesData();
        }, 0);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [loadCoursesData]);

    useEffect(() => {
        if (!isModalOpen) return;

        function handleEscape(event: KeyboardEvent) {
            if (event.key === "Escape") {
                closeModal();
            }
        }

        document.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener("keydown", handleEscape);
        };
    }, [isModalOpen]);

    const categoryMap = useMemo(() => {
        return new Map(categories.map((item) => [item.id, item]));
    }, [categories]);

    const subcategoryMap = useMemo(() => {
        return new Map(subcategories.map((item) => [item.id, item]));
    }, [subcategories]);

    const availableSubcategories = useMemo(() => {
        const categoryId = Number(form.category_id || 0);

        if (!categoryId) return [];

        return subcategories.filter(
            (subcategory) => subcategory.category_id === categoryId,
        );
    }, [form.category_id, subcategories]);

    const filteredCourses = useMemo(() => {
        const term = search.trim().toLowerCase();

        if (!term) return courses;

        return courses.filter((course) => {
            const courseSubcategoryId = getCourseSubcategoryId(course);
            const subcategory =
                courseSubcategoryId !== null
                    ? subcategoryMap.get(courseSubcategoryId)
                    : undefined;

            const category = subcategory
                ? categoryMap.get(subcategory.category_id)
                : null;

            return (
                getCourseName(course).toLowerCase().includes(term) ||
                getCourseDescription(course).toLowerCase().includes(term) ||
                getCourseLevel(course).toLowerCase().includes(term) ||
                String(courseSubcategoryId ?? "").includes(term) ||
                (subcategory?.name ?? "").toLowerCase().includes(term) ||
                (category?.name ?? "").toLowerCase().includes(term)
            );
        });
    }, [courses, search, subcategoryMap, categoryMap]);

    const totalPages = Math.max(
        1,
        Math.ceil(filteredCourses.length / ROWS_PER_PAGE),
    );

    const activePage = Math.min(currentPage, totalPages);

    const paginatedCourses = useMemo(() => {
        const startIndex = (activePage - 1) * ROWS_PER_PAGE;

        return filteredCourses.slice(startIndex, startIndex + ROWS_PER_PAGE);
    }, [filteredCourses, activePage]);

    const filteredUsers = useMemo(() => {
        const term = userSearch.trim().toLowerCase();

        if (!term) return users;

        return users.filter((user) => {
            const fullName = `${user.firstname} ${user.lastname}`.toLowerCase();

            return (
                fullName.includes(term) ||
                user.username.toLowerCase().includes(term) ||
                user.email.toLowerCase().includes(term) ||
                String(user.role_id).includes(term) ||
                (user.phone_number ?? "").toLowerCase().includes(term) ||
                (user.departament ?? "").toLowerCase().includes(term)
            );
        });
    }, [users, userSearch]);

    const userTotalPages = Math.max(
        1,
        Math.ceil(filteredUsers.length / USERS_PER_PAGE),
    );

    const activeUserPage = Math.min(userCurrentPage, userTotalPages);

    const paginatedUsers = useMemo(() => {
        const startIndex = (activeUserPage - 1) * USERS_PER_PAGE;

        return filteredUsers.slice(startIndex, startIndex + USERS_PER_PAGE);
    }, [filteredUsers, activeUserPage]);

    const stats = useMemo(() => {
        const publishedCourses = courses.filter((course) =>
            getCourseIsPublished(course),
        ).length;

        const freeCourses = courses.filter((course) =>
            getCourseIsFree(course),
        ).length;

        const openEnrollmentCourses = courses.filter((course) =>
            getCourseOpenEnrollment(course),
        ).length;

        return {
            total: courses.length,
            published: publishedCourses,
            free: freeCourses,
            openEnrollment: openEnrollmentCourses,
        };
    }, [courses]);

    const previewSrc = previewImageUrl || resolveImageUrl(form.image_url);

    function updateForm<K extends keyof CourseFormState>(
        key: K,
        value: CourseFormState[K],
    ) {
        setForm((current) => ({
            ...current,
            [key]: value,
        }));
    }

    function handleCategoryChange(categoryId: string) {
        setForm((current) => ({
            ...current,
            category_id: categoryId,
            subcategory_id: "",
        }));
    }

    function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0] ?? null;

        if (previewImageUrl.startsWith("blob:")) {
            URL.revokeObjectURL(previewImageUrl);
        }

        if (!file) {
            setSelectedImageFile(null);
            setPreviewImageUrl(resolveImageUrl(form.image_url));
            return;
        }

        const objectUrl = URL.createObjectURL(file);

        setSelectedImageFile(file);
        setPreviewImageUrl(objectUrl);
    }

    function resetForm() {
        if (previewImageUrl.startsWith("blob:")) {
            URL.revokeObjectURL(previewImageUrl);
        }

        setForm(initialFormState);
        setEditingCourseId(null);
        setSelectedImageFile(null);
        setPreviewImageUrl("");
    }

    function openCreateModal() {
        resetForm();
        setIsModalOpen(true);
    }

    function closeModal() {
        setIsModalOpen(false);
        resetForm();
    }

    function closeTeacherModal() {
        setIsTeacherModalOpen(false);
        setAssigningCourse(null);
        setAssigningTeacherId(null);
        setAssignedTeacherUserIds(new Set());
        setUserSearch("");
        setUserCurrentPage(1);
    }

    async function openAssignTeacherModal(course: Course) {
        setAssigningCourse(course);
        setIsTeacherModalOpen(true);
        setUserSearch("");
        setUserCurrentPage(1);
        setAssignedTeacherUserIds(new Set());

        try {
            setUsersLoading(true);

            const [usersData, teacherEnrollments] = await Promise.all([
                getAllUsers(),
                getEnrollmentsByCourseAndRole(course.id, 3),
            ]);

            setUsers(Array.isArray(usersData) ? usersData : []);
            setAssignedTeacherUserIds(
                new Set(
                    teacherEnrollments.map(
                        (enrollment) => enrollment.user.id,
                    ),
                ),
            );
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : "No se pudieron cargar los usuarios.";

            showNotice("error", message);
            setUsers([]);
            setAssignedTeacherUserIds(new Set());
        } finally {
            setUsersLoading(false);
        }
    }

    async function handleToggleTeacher(user: User, isTeacher: boolean) {
        if (!assigningCourse) {
            showNotice("error", "No se encontró el curso seleccionado.");
            return;
        }

        const nextRoleId = isTeacher ? 4 : 3;

        try {
            setAssigningTeacherId(user.id);

            const userEnrollments = await getEnrollmentsByUser(user.id);

            const courseEnrollment = userEnrollments.find(
                (enrollment) => enrollment.course.id === assigningCourse.id,
            );

            let savedEnrollment;

            if (courseEnrollment) {
                savedEnrollment = await updateEnrollment(courseEnrollment.id, {
                    accepted: courseEnrollment.accepted ?? true,
                    reference_code: courseEnrollment.reference_code ?? null,
                    comment: courseEnrollment.comment ?? null,
                    user_id: user.id,
                    course_id: assigningCourse.id,
                    role_id: nextRoleId,
                });
            } else {
                savedEnrollment = await createEnrollment({
                    accepted: true,
                    reference_code: null,
                    comment: "Asignado como docente desde administración.",
                    user_id: user.id,
                    course_id: assigningCourse.id,
                    role_id: 3,
                    image: null,
                });
            }

            setAssignedTeacherUserIds((current) => {
                const next = new Set(current);

                if (nextRoleId === 3) {
                    next.add(savedEnrollment.user.id);
                } else {
                    next.delete(savedEnrollment.user.id);
                }

                return next;
            });

            showNotice(
                "success",
                nextRoleId === 3
                    ? "Docente asignado al curso correctamente."
                    : "El usuario volvió al rol de estudiante correctamente.",
            );
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : isTeacher
                        ? "No se pudo quitar el docente."
                        : "No se pudo asignar el docente.";

            showNotice("error", message);
        } finally {
            setAssigningTeacherId(null);
        }
    }

    function handleEdit(course: Course) {
        const courseSubcategoryId = getCourseSubcategoryId(course);

        const foundSubcategory =
            courseSubcategoryId !== null
                ? subcategoryMap.get(courseSubcategoryId)
                : undefined;

        const nextForm = {
            ...buildFormFromCourse(course),
            category_id: foundSubcategory
                ? String(foundSubcategory.category_id)
                : "",
            subcategory_id: String(courseSubcategoryId ?? ""),
        };

        if (previewImageUrl.startsWith("blob:")) {
            URL.revokeObjectURL(previewImageUrl);
        }

        setEditingCourseId(course.id);
        setForm(nextForm);
        setSelectedImageFile(null);
        setPreviewImageUrl(resolveImageUrl(getCourseImageUrl(course)));
        setIsModalOpen(true);
    }

    async function handleDelete(courseId: number) {
        const confirmed = window.confirm("¿Seguro que deseas eliminar este curso?");

        if (!confirmed) return;

        try {
            await deleteCourse(courseId);

            setCourses((current) =>
                current.filter((item) => item.id !== courseId),
            );

            showNotice("success", "Curso eliminado correctamente.");
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : "No se pudo eliminar el curso.";

            showNotice("error", message);
        }
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const subcategoryId = parseNumberInput(form.subcategory_id, 0);

        if (!form.name.trim()) {
            showNotice("error", "El nombre del curso es obligatorio.");
            return;
        }

        if (!form.description.trim()) {
            showNotice("error", "La descripción del curso es obligatoria.");
            return;
        }

        if (!form.category_id) {
            showNotice("error", "La categoría es obligatoria.");
            return;
        }

        if (!subcategoryId || subcategoryId <= 0) {
            showNotice("error", "La subcategoría es obligatoria.");
            return;
        }

        try {
            setIsSaving(true);

            const payload = {
                name: form.name.trim(),
                description: form.description.trim(),
                price: form.is_free ? 0 : parseNumberInput(form.price, 0),
                is_free: form.is_free,
                level: form.level,
                is_published: form.is_published,
                open_enrollment: form.open_enrollment,
                duration_hours: parseNumberInput(form.duration_hours, 0),
                total_lessons: parseNumberInput(form.total_lessons, 0),
                subcategory_id: subcategoryId,
                image: selectedImageFile ?? undefined,
                discount_price: form.is_free
                    ? 0
                    : parseNumberInput(form.discount_price, 0),
            };

            if (editingCourseId) {
                const updatedCourse = await updateCourse(editingCourseId, payload);

                setCourses((current) =>
                    current.map((item) =>
                        item.id === editingCourseId ? updatedCourse : item,
                    ),
                );

                showNotice("success", "Curso actualizado correctamente.");
            } else {
                const createdCourse = await createCourse(payload);

                setCourses((current) => [createdCourse, ...current]);
                showNotice("success", "Curso creado correctamente.");
            }

            closeModal();
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : "No se pudo guardar el curso.";

            showNotice("error", message);
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <>
            <section className="space-y-6">
                <div className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#07111F] via-[#172861] via-70% to-[#F97316] p-6 text-white shadow-lg">
                    <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                        <div>
                            <p className="text-sm font-medium uppercase tracking-[0.25em] text-blue-100">
                                Gestión de cursos
                            </p>

                            <h2 className="mt-3 text-2xl font-bold md:text-3xl">
                                Cursos
                            </h2>

                            <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-50">
                                Administra, crea, edita y publica cursos.
                                También puedes asignar docentes y organizar cada
                                curso por categoría y subcategoría.
                            </p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:min-w-[620px]">
                            <div className="rounded-2xl bg-white/15 p-4 ring-1 ring-white/20">
                                <p className="text-xs font-bold uppercase tracking-wide text-white/75">
                                    Total
                                </p>
                                <p className="mt-2 text-3xl font-bold">
                                    {isLoading ? "..." : stats.total}
                                </p>
                            </div>

                            <div className="rounded-2xl bg-white/15 p-4 ring-1 ring-white/20">
                                <p className="text-xs font-bold uppercase tracking-wide text-white/75">
                                    Publicados
                                </p>
                                <p className="mt-2 text-3xl font-bold">
                                    {isLoading ? "..." : stats.published}
                                </p>
                            </div>

                            <div className="rounded-2xl bg-white/15 p-4 ring-1 ring-white/20">
                                <p className="text-xs font-bold uppercase tracking-wide text-white/75">
                                    Gratis
                                </p>
                                <p className="mt-2 text-3xl font-bold">
                                    {isLoading ? "..." : stats.free}
                                </p>
                            </div>

                            <div className="rounded-2xl bg-white/15 p-4 ring-1 ring-white/20">
                                <p className="text-xs font-bold uppercase tracking-wide text-white/75">
                                    Matrícula abierta
                                </p>
                                <p className="mt-2 text-3xl font-bold">
                                    {isLoading ? "..." : stats.openEnrollment}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {notice ? (
                    <div
                        className={`rounded-2xl border px-5 py-4 text-sm font-semibold ${notice.type === "success"
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-red-200 bg-red-50 text-red-700"
                            }`}
                    >
                        {notice.text}
                    </div>
                ) : null}

                <div className="rounded-3xl border border-[var(--border)] bg-white p-5 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-slate-950">
                                Lista de cursos
                            </h3>

                            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                                Busca por nombre, descripción, nivel, categoría
                                o subcategoría.
                            </p>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row">
                            <button
                                type="button"
                                onClick={openCreateModal}
                                className="h-12 rounded-2xl bg-[#172861] px-5 text-sm font-bold text-white shadow-sm transition hover:bg-[#0B163F]"
                            >
                                Nuevo curso
                            </button>

                            <button
                                type="button"
                                onClick={() => void loadCoursesData(true)}
                                disabled={isRefreshing}
                                className="h-12 rounded-2xl bg-orange-500 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {isRefreshing ? "Actualizando..." : "Actualizar"}
                            </button>
                        </div>
                    </div>

                    <div className="mt-5">
                        <input
                            value={search}
                            onChange={(event) => {
                                setSearch(event.target.value);
                                setCurrentPage(1);
                            }}
                            placeholder="Buscar por nombre, nivel, categoría o subcategoría"
                            className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 lg:max-w-[460px]"
                        />
                    </div>
                </div>

                <div className="overflow-hidden rounded-3xl border border-[var(--border)] bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                                        Curso
                                    </th>
                                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                                        Categoría
                                    </th>
                                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                                        Subcategoría
                                    </th>
                                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                                        Nivel
                                    </th>
                                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                                        Precio
                                    </th>
                                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                                        Duración
                                    </th>
                                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                                        Estado
                                    </th>
                                    <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-600">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">
                                {isLoading ? (
                                    <tr>
                                        <td
                                            colSpan={8}
                                            className="px-5 py-12 text-center text-sm font-semibold text-slate-500"
                                        >
                                            Cargando cursos, categorías y
                                            subcategorías...
                                        </td>
                                    </tr>
                                ) : filteredCourses.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={8}
                                            className="px-5 py-12 text-center"
                                        >
                                            <p className="text-sm font-bold text-slate-800">
                                                No hay cursos para mostrar.
                                            </p>
                                            <p className="mt-1 text-sm text-slate-500">
                                                Crea un curso nuevo desde el
                                                botón superior.
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedCourses.map((course) => {
                                        const courseSubcategoryId =
                                            getCourseSubcategoryId(course);

                                        const subcategory =
                                            courseSubcategoryId !== null
                                                ? subcategoryMap.get(
                                                    courseSubcategoryId,
                                                )
                                                : undefined;

                                        const category = subcategory
                                            ? categoryMap.get(
                                                subcategory.category_id,
                                            )
                                            : null;

                                        return (
                                            <tr
                                                key={course.id}
                                                className="align-top transition hover:bg-blue-50/40"
                                            >
                                                <td className="px-5 py-4">
                                                    <div className="flex min-w-[260px] items-center gap-3">
                                                        <div className="h-12 w-16 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                                                            <img
                                                                src={resolveImageUrl(
                                                                    getCourseImageUrl(
                                                                        course,
                                                                    ),
                                                                )}
                                                                alt={getCourseName(
                                                                    course,
                                                                )}
                                                                className="h-full w-full object-cover"
                                                            />
                                                        </div>

                                                        <div>
                                                            <p className="text-sm font-bold text-slate-950">
                                                                {getCourseName(
                                                                    course,
                                                                )}
                                                            </p>
                                                            <p className="mt-0.5 text-xs font-medium text-slate-500">
                                                                Curso #{course.id}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-5 py-4 text-sm font-semibold text-slate-700">
                                                    {category?.name ||
                                                        "Sin categoría"}
                                                </td>

                                                <td className="px-5 py-4 text-sm font-semibold text-slate-700">
                                                    {subcategory?.name ||
                                                        (courseSubcategoryId !==
                                                            null
                                                            ? `#${courseSubcategoryId}`
                                                            : "Sin subcategoría")}
                                                </td>

                                                <td className="px-5 py-4">
                                                    <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                                                        {getCourseLevel(course)}
                                                    </span>
                                                </td>

                                                <td className="px-5 py-4 text-sm font-bold text-slate-900">
                                                    {getCourseIsFree(course)
                                                        ? "Gratis"
                                                        : formatMoney(
                                                            getCoursePrice(
                                                                course,
                                                            ),
                                                            getCourseCurrency(
                                                                course,
                                                            ),
                                                        )}
                                                </td>

                                                <td className="px-5 py-4 text-sm font-semibold text-slate-700">
                                                    {getCourseDurationHours(
                                                        course,
                                                    )}{" "}
                                                    h
                                                </td>

                                                <td className="px-5 py-4">
                                                    <div className="flex flex-col gap-2">
                                                        <span
                                                            className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold ${getPublishedBadgeClass(
                                                                course,
                                                            )}`}
                                                        >
                                                            {getCourseIsPublished(
                                                                course,
                                                            )
                                                                ? "Publicado"
                                                                : "Borrador"}
                                                        </span>

                                                        {getCourseIsFree(
                                                            course,
                                                        ) ? (
                                                            <span className="inline-flex w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                                                                Gratis
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <div className="flex min-w-[280px] justify-end gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleEdit(
                                                                    course,
                                                                )
                                                            }
                                                            className="rounded-xl border border-blue-200 px-3 py-2 text-xs font-bold text-blue-700 transition hover:bg-blue-50"
                                                        >
                                                            Editar
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                void openAssignTeacherModal(
                                                                    course,
                                                                )
                                                            }
                                                            className="rounded-xl border border-orange-200 px-3 py-2 text-xs font-bold text-orange-700 transition hover:bg-orange-50"
                                                        >
                                                            Docente
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                void handleDelete(
                                                                    course.id,
                                                                )
                                                            }
                                                            className="rounded-xl border border-red-200 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50"
                                                        >
                                                            Eliminar
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm font-semibold text-slate-500">
                            Mostrando {paginatedCourses.length} de{" "}
                            {filteredCourses.length} cursos
                        </p>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() =>
                                    setCurrentPage((page) =>
                                        Math.max(1, page - 1),
                                    )
                                }
                                disabled={activePage === 1}
                                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Anterior
                            </button>

                            <span className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700">
                                Página {activePage} de {totalPages}
                            </span>

                            <button
                                type="button"
                                onClick={() =>
                                    setCurrentPage((page) =>
                                        Math.min(totalPages, page + 1),
                                    )
                                }
                                disabled={activePage === totalPages}
                                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Siguiente
                            </button>
                        </div>
                    </div>
                </div>

                {isTeacherModalOpen ? (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
                        onClick={closeTeacherModal}
                    >
                        <div
                            className="flex max-h-[88vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
                            onClick={(event) => event.stopPropagation()}
                        >
                            <div className="bg-gradient-to-br from-[#07111F] via-[#172861] to-[#F97316] px-6 py-5 text-white">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-100">
                                            Asignación de docente
                                        </p>

                                        <h2 className="mt-2 text-2xl font-bold">
                                            Asignar docente
                                        </h2>

                                        <p className="mt-1 text-sm text-blue-50">
                                            Curso:{" "}
                                            <span className="font-semibold">
                                                {assigningCourse
                                                    ? getCourseName(
                                                        assigningCourse,
                                                    )
                                                    : "Sin curso seleccionado"}
                                            </span>
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={closeTeacherModal}
                                        className="rounded-2xl bg-white/15 px-4 py-2 text-sm font-bold text-white ring-1 ring-white/20 transition hover:bg-white/25"
                                    >
                                        Cerrar
                                    </button>
                                </div>
                            </div>

                            <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 p-5">
                                {usersLoading ? (
                                    <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm font-semibold text-slate-500">
                                        Cargando usuarios...
                                    </div>
                                ) : users.length === 0 ? (
                                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
                                        <p className="font-bold text-slate-700">
                                            No hay usuarios para mostrar.
                                        </p>
                                        <p className="mt-1 text-sm text-slate-500">
                                            Verifica que el servicio de usuarios
                                            esté respondiendo correctamente.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                                <div>
                                                    <p className="text-sm font-bold text-slate-950">
                                                        Usuarios disponibles
                                                    </p>
                                                    <p className="mt-1 text-xs text-slate-500">
                                                        Busca por nombre,
                                                        usuario, correo,
                                                        teléfono, departamento o
                                                        rol.
                                                    </p>
                                                </div>

                                                <input
                                                    value={userSearch}
                                                    onChange={(event) => {
                                                        setUserSearch(
                                                            event.target.value,
                                                        );
                                                        setUserCurrentPage(1);
                                                    }}
                                                    placeholder="Buscar usuario..."
                                                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 md:w-80"
                                                />
                                            </div>
                                        </div>

                                        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                                            <div className="overflow-x-auto">
                                                <table className="min-w-full divide-y divide-slate-200 text-sm">
                                                    <thead className="bg-slate-50">
                                                        <tr>
                                                            <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                                                                Usuario
                                                            </th>
                                                            <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                                                                Correo
                                                            </th>
                                                            <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                                                                Teléfono
                                                            </th>
                                                            <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                                                                Departamento
                                                            </th>
                                                            <th className="px-5 py-4 text-center text-xs font-bold uppercase tracking-wide text-slate-600">
                                                                Estado
                                                            </th>
                                                            <th className="px-5 py-4 text-center text-xs font-bold uppercase tracking-wide text-slate-600">
                                                                Acción
                                                            </th>
                                                        </tr>
                                                    </thead>

                                                    <tbody className="divide-y divide-slate-100">
                                                        {paginatedUsers.map(
                                                            (user) => {
                                                                const fullName =
                                                                    `${user.firstname} ${user.lastname}`.trim() ||
                                                                    user.username;

                                                                const isTeacher =
                                                                    assignedTeacherUserIds.has(
                                                                        user.id,
                                                                    );

                                                                const isAssigning =
                                                                    assigningTeacherId ===
                                                                    user.id;

                                                                return (
                                                                    <tr
                                                                        key={
                                                                            user.id
                                                                        }
                                                                        className="align-top transition hover:bg-blue-50/40"
                                                                    >
                                                                        <td className="px-5 py-4">
                                                                            <div className="flex items-center gap-3">
                                                                                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#172861] text-sm font-bold text-white">
                                                                                    {fullName
                                                                                        .charAt(
                                                                                            0,
                                                                                        )
                                                                                        .toUpperCase()}
                                                                                </div>

                                                                                <div>
                                                                                    <p className="text-sm font-bold text-slate-950">
                                                                                        {
                                                                                            fullName
                                                                                        }
                                                                                    </p>
                                                                                    <p className="mt-0.5 text-xs font-medium text-slate-500">
                                                                                        @
                                                                                        {
                                                                                            user.username
                                                                                        }
                                                                                    </p>
                                                                                </div>
                                                                            </div>
                                                                        </td>

                                                                        <td className="px-5 py-4 font-semibold text-slate-700">
                                                                            {
                                                                                user.email
                                                                            }
                                                                        </td>

                                                                        <td className="px-5 py-4 font-semibold text-slate-500">
                                                                            {user.phone_number ||
                                                                                "Sin teléfono"}
                                                                        </td>

                                                                        <td className="px-5 py-4 font-semibold text-slate-500">
                                                                            {user.departament ||
                                                                                "Sin departamento"}
                                                                        </td>

                                                                        <td className="px-5 py-4 text-center">
                                                                            <span
                                                                                className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${isTeacher
                                                                                        ? "bg-blue-100 text-blue-700"
                                                                                        : "bg-slate-100 text-slate-700"
                                                                                    }`}
                                                                            >
                                                                                {isTeacher
                                                                                    ? "Docente del curso"
                                                                                    : "Disponible"}
                                                                            </span>
                                                                        </td>

                                                                        <td className="px-5 py-4 text-center">
                                                                            <button
                                                                                type="button"
                                                                                disabled={
                                                                                    isAssigning
                                                                                }
                                                                                onClick={() =>
                                                                                    void handleToggleTeacher(
                                                                                        user,
                                                                                        isTeacher,
                                                                                    )
                                                                                }
                                                                                className={`rounded-xl px-4 py-2 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-70 ${isTeacher
                                                                                        ? "bg-orange-100 text-orange-700 hover:bg-orange-200"
                                                                                        : "bg-[#172861] text-white hover:bg-[#0B163F]"
                                                                                    }`}
                                                                            >
                                                                                {isAssigning
                                                                                    ? isTeacher
                                                                                        ? "Quitando..."
                                                                                        : "Asignando..."
                                                                                    : isTeacher
                                                                                        ? "Volver a estudiante"
                                                                                        : "Seleccionar"}
                                                                            </button>
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            },
                                                        )}

                                                        {paginatedUsers.length ===
                                                            0 ? (
                                                            <tr>
                                                                <td
                                                                    colSpan={6}
                                                                    className="px-5 py-8 text-center text-sm font-semibold text-slate-500"
                                                                >
                                                                    No se
                                                                    encontraron
                                                                    usuarios con
                                                                    esa búsqueda.
                                                                </td>
                                                            </tr>
                                                        ) : null}
                                                    </tbody>
                                                </table>
                                            </div>

                                            <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                                                <p className="text-sm font-semibold text-slate-500">
                                                    Mostrando{" "}
                                                    {paginatedUsers.length} de{" "}
                                                    {filteredUsers.length}{" "}
                                                    usuarios
                                                </p>

                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setUserCurrentPage(
                                                                (page) =>
                                                                    Math.max(
                                                                        1,
                                                                        page -
                                                                        1,
                                                                    ),
                                                            )
                                                        }
                                                        disabled={
                                                            activeUserPage === 1
                                                        }
                                                        className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        Anterior
                                                    </button>

                                                    <span className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700">
                                                        Página {activeUserPage}{" "}
                                                        de {userTotalPages}
                                                    </span>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setUserCurrentPage(
                                                                (page) =>
                                                                    Math.min(
                                                                        userTotalPages,
                                                                        page +
                                                                        1,
                                                                    ),
                                                            )
                                                        }
                                                        disabled={
                                                            activeUserPage ===
                                                            userTotalPages
                                                        }
                                                        className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        Siguiente
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : null}
            </section>

            {isModalOpen ? (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
                    onClick={closeModal}
                >
                    <div
                        className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="bg-gradient-to-br from-[#07111F] via-[#172861] to-[#F97316] px-6 py-5 text-white">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-100">
                                        {editingCourseId
                                            ? "Editar curso"
                                            : "Nuevo curso"}
                                    </p>

                                    <h2 className="mt-2 text-2xl font-bold">
                                        {editingCourseId
                                            ? "Actualizar curso"
                                            : "Crear nuevo curso"}
                                    </h2>

                                    <p className="mt-1 text-sm text-blue-50">
                                        Completa la información del curso y
                                        selecciona primero una categoría.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="rounded-2xl bg-white/15 px-4 py-2 text-sm font-bold text-white ring-1 ring-white/20 transition hover:bg-white/25"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>

                        <form
                            onSubmit={handleSubmit}
                            className="flex min-h-0 flex-1 flex-col"
                        >
                            <div className="grid min-h-0 flex-1 xl:grid-cols-[1.5fr_0.95fr]">
                                <div className="min-h-0 overflow-y-auto border-r border-slate-200 bg-white px-6 py-6">
                                    <div className="space-y-5">
                                        <div>
                                            <label className="mb-2 block text-sm font-bold text-slate-700">
                                                Nombre del curso
                                            </label>
                                            <input
                                                value={form.name}
                                                onChange={(event) =>
                                                    updateForm(
                                                        "name",
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="Ej. Curso de React"
                                                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-sm font-bold text-slate-700">
                                                Descripción
                                            </label>
                                            <textarea
                                                value={form.description}
                                                onChange={(event) =>
                                                    updateForm(
                                                        "description",
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="Describe brevemente el curso"
                                                rows={4}
                                                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-sm font-bold text-slate-700">
                                                Imagen del curso
                                            </label>

                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageChange}
                                                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition file:mr-3 file:rounded-xl file:border-0 file:bg-[#172861] file:px-4 file:py-2 file:text-sm file:font-bold file:text-white hover:file:bg-[#0B163F]"
                                            />

                                            {selectedImageFile ? (
                                                <p className="mt-2 text-xs font-semibold text-slate-600">
                                                    Archivo seleccionado:{" "}
                                                    {selectedImageFile.name}
                                                </p>
                                            ) : form.image_url ? (
                                                <p className="mt-2 text-xs font-semibold text-slate-500">
                                                    Se mantiene la imagen actual
                                                    mientras no selecciones otra.
                                                </p>
                                            ) : null}
                                        </div>

                                        <div className="grid gap-4 md:grid-cols-3">
                                            <div>
                                                <label className="mb-2 block text-sm font-bold text-slate-700">
                                                    Categoría
                                                </label>
                                                <select
                                                    value={form.category_id}
                                                    onChange={(event) =>
                                                        handleCategoryChange(
                                                            event.target.value,
                                                        )
                                                    }
                                                    disabled={categoriesLoading}
                                                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
                                                >
                                                    <option value="">
                                                        {categoriesLoading
                                                            ? "Cargando categorías..."
                                                            : "Selecciona una categoría"}
                                                    </option>

                                                    {categories.map(
                                                        (category) => (
                                                            <option
                                                                key={
                                                                    category.id
                                                                }
                                                                value={
                                                                    category.id
                                                                }
                                                            >
                                                                {category.name}
                                                            </option>
                                                        ),
                                                    )}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="mb-2 block text-sm font-bold text-slate-700">
                                                    Subcategoría
                                                </label>
                                                <select
                                                    value={form.subcategory_id}
                                                    onChange={(event) =>
                                                        updateForm(
                                                            "subcategory_id",
                                                            event.target.value,
                                                        )
                                                    }
                                                    disabled={
                                                        !form.category_id ||
                                                        subcategoriesLoading
                                                    }
                                                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
                                                >
                                                    <option value="">
                                                        {!form.category_id
                                                            ? "Primero selecciona una categoría"
                                                            : subcategoriesLoading
                                                                ? "Cargando subcategorías..."
                                                                : "Selecciona una subcategoría"}
                                                    </option>

                                                    {availableSubcategories.map(
                                                        (subcategory) => (
                                                            <option
                                                                key={
                                                                    subcategory.id
                                                                }
                                                                value={
                                                                    subcategory.id
                                                                }
                                                            >
                                                                {
                                                                    subcategory.name
                                                                }
                                                            </option>
                                                        ),
                                                    )}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="mb-2 block text-sm font-bold text-slate-700">
                                                    Nivel
                                                </label>
                                                <select
                                                    value={form.level}
                                                    onChange={(event) =>
                                                        updateForm(
                                                            "level",
                                                            event.target
                                                                .value as CourseLevel,
                                                        )
                                                    }
                                                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                                >
                                                    {COURSE_LEVEL_OPTIONS.map(
                                                        (option) => (
                                                            <option
                                                                key={
                                                                    option.value
                                                                }
                                                                value={
                                                                    option.value
                                                                }
                                                            >
                                                                {option.label}
                                                            </option>
                                                        ),
                                                    )}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                            <div>
                                                <label className="mb-2 block text-sm font-bold text-slate-700">
                                                    Moneda
                                                </label>
                                                <input
                                                    value={form.currency}
                                                    onChange={(event) =>
                                                        updateForm(
                                                            "currency",
                                                            event.target.value.toUpperCase(),
                                                        )
                                                    }
                                                    placeholder="USD"
                                                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm uppercase outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                                />
                                            </div>

                                            <div>
                                                <label className="mb-2 block text-sm font-bold text-slate-700">
                                                    Precio
                                                </label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    disabled={form.is_free}
                                                    value={form.price}
                                                    onChange={(event) =>
                                                        updateForm(
                                                            "price",
                                                            event.target.value,
                                                        )
                                                    }
                                                    placeholder="0.00"
                                                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
                                                />
                                            </div>

                                            <div>
                                                <label className="mb-2 block text-sm font-bold text-slate-700">
                                                    Precio descuento
                                                </label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    disabled={form.is_free}
                                                    value={form.discount_price}
                                                    onChange={(event) =>
                                                        updateForm(
                                                            "discount_price",
                                                            event.target.value,
                                                        )
                                                    }
                                                    placeholder="0.00"
                                                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
                                                />
                                            </div>

                                            <div>
                                                <label className="mb-2 block text-sm font-bold text-slate-700">
                                                    Duración horas
                                                </label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={form.duration_hours}
                                                    onChange={(event) =>
                                                        updateForm(
                                                            "duration_hours",
                                                            event.target.value,
                                                        )
                                                    }
                                                    placeholder="0"
                                                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid gap-3 md:grid-cols-3">
                                            <SwitchCard
                                                checked={form.is_free}
                                                label="Curso gratuito"
                                                onChange={(value) =>
                                                    updateForm(
                                                        "is_free",
                                                        value,
                                                    )
                                                }
                                            />

                                            <SwitchCard
                                                checked={form.is_published}
                                                label="Publicado"
                                                onChange={(value) =>
                                                    updateForm(
                                                        "is_published",
                                                        value,
                                                    )
                                                }
                                            />

                                            <SwitchCard
                                                checked={form.open_enrollment}
                                                label="Matrícula abierta"
                                                onChange={(value) =>
                                                    updateForm(
                                                        "open_enrollment",
                                                        value,
                                                    )
                                                }
                                            />
                                        </div>
                                    </div>
                                </div>

                                <aside className="min-h-0 overflow-y-auto bg-gradient-to-b from-slate-50 via-white to-slate-100/70 px-5 py-5">
                                    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                                        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                                            <div className="relative h-[310px] overflow-hidden bg-slate-100">
                                                <img
                                                    src={previewSrc}
                                                    alt="Vista previa del curso"
                                                    className="h-full w-full object-cover"
                                                />

                                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-900/20 to-transparent" />

                                                <div className="absolute inset-x-0 top-4 flex items-start justify-between gap-3 px-4">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="rounded-full border border-white/20 bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white backdrop-blur-md">
                                                            {form.level}
                                                        </span>

                                                        {form.is_published ? (
                                                            <span className="rounded-full bg-emerald-400 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-950 shadow-sm">
                                                                Publicado
                                                            </span>
                                                        ) : (
                                                            <span className="rounded-full bg-orange-300 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-950 shadow-sm">
                                                                Borrador
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="rounded-2xl bg-white/95 px-3 py-2 text-sm font-bold text-slate-900 shadow-lg">
                                                        {form.is_free
                                                            ? "Gratis"
                                                            : formatMoney(
                                                                parseNumberInput(
                                                                    form.price,
                                                                    0,
                                                                ),
                                                                form.currency,
                                                            )}
                                                    </div>
                                                </div>

                                                <div className="absolute inset-x-0 bottom-0 p-5">
                                                    <div className="mb-3">
                                                        {form.open_enrollment ? (
                                                            <span className="rounded-full bg-blue-400 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-950 shadow-sm">
                                                                Matrícula abierta
                                                            </span>
                                                        ) : (
                                                            <span className="rounded-full bg-slate-300 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-800 shadow-sm">
                                                                Matrícula cerrada
                                                            </span>
                                                        )}
                                                    </div>

                                                    <h4 className="line-clamp-2 max-w-[85%] text-3xl font-extrabold leading-tight text-white drop-shadow-sm">
                                                        {form.name ||
                                                            "Nombre del curso"}
                                                    </h4>
                                                </div>
                                            </div>

                                            <div className="space-y-4 bg-white p-5">
                                                <div>
                                                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
                                                        Descripción
                                                    </p>

                                                    <p className="mt-3 min-h-[72px] text-sm leading-6 text-slate-600">
                                                        {form.description ||
                                                            "Aquí se mostrará una vista previa breve de la descripción del curso."}
                                                    </p>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="rounded-2xl border border-orange-100 bg-orange-50 p-4">
                                                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-orange-500">
                                                            Precio
                                                        </p>
                                                        <p className="mt-2 text-2xl font-extrabold text-slate-900">
                                                            {form.is_free
                                                                ? "Gratis"
                                                                : formatMoney(
                                                                    parseNumberInput(
                                                                        form.price,
                                                                        0,
                                                                    ),
                                                                    form.currency,
                                                                )}
                                                        </p>
                                                    </div>

                                                    <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                                                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-500">
                                                            Duración
                                                        </p>
                                                        <p className="mt-2 text-2xl font-extrabold text-slate-900">
                                                            {parseNumberInput(
                                                                form.duration_hours,
                                                                0,
                                                            )}{" "}
                                                            h
                                                        </p>
                                                    </div>

                                                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                                                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-500">
                                                            Categoría
                                                        </p>
                                                        <p className="mt-2 line-clamp-1 text-sm font-bold text-slate-900">
                                                            {form.category_id
                                                                ? categories.find(
                                                                    (item) =>
                                                                        String(
                                                                            item.id,
                                                                        ) ===
                                                                        form.category_id,
                                                                )?.name ??
                                                                "Sin categoría"
                                                                : "Sin categoría"}
                                                        </p>
                                                    </div>

                                                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                                                            Subcategoría
                                                        </p>
                                                        <p className="mt-2 line-clamp-1 text-sm font-bold text-slate-900">
                                                            {form.subcategory_id
                                                                ? subcategories.find(
                                                                    (item) =>
                                                                        String(
                                                                            item.id,
                                                                        ) ===
                                                                        form.subcategory_id,
                                                                )?.name ??
                                                                "Sin subcategoría"
                                                                : "Sin subcategoría"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </aside>
                            </div>

                            <div className="flex flex-col gap-3 border-t border-slate-200 bg-white px-6 py-4 sm:flex-row sm:items-center sm:justify-end">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="rounded-2xl bg-[#172861] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#0B163F] disabled:cursor-not-allowed disabled:opacity-70"
                                >
                                    {isSaving
                                        ? "Guardando..."
                                        : editingCourseId
                                            ? "Actualizar curso"
                                            : "Crear curso"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}
        </>
    );
}