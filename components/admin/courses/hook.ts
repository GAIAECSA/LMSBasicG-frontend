"use client";

import {
    useCallback,
    useEffect,
    useMemo,
    useState,
    type ChangeEvent,
    type FormEvent,
} from "react";
import {
    createCourse,
    deleteCourse,
    getAllCourses,
    updateCourse,
    type Course,
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
import {
    ROWS_PER_PAGE,
    STUDENT_ROLE_ID,
    TEACHER_ROLE_ID,
    USERS_PER_PAGE,
    initialFormState,
} from "./constants";
import type { CourseFormState, Notice } from "./types";
import {
    buildFormFromCourse,
    getCourseDescription,
    getCourseImageUrl,
    getCourseIsFree,
    getCourseIsMdt,
    getCourseIsPublished,
    getCourseLevel,
    getCourseOpenEnrollment,
    getCourseSubcategoryId,
    getUserFullName,
    parseNumberInput,
    resolveImageUrl,
} from "./utils";

export function useCoursesAdminPanel() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
    const [form, setForm] = useState<CourseFormState>(initialFormState);
    const [editingCourseId, setEditingCourseId] = useState<number | null>(null);

    const [selectedImageFile, setSelectedImageFile] =
        useState<File | null>(null);
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
    const [assigningTeacherId, setAssigningTeacherId] =
        useState<number | null>(null);
    const [assignedTeacherUserIds, setAssignedTeacherUserIds] =
        useState<Set<number>>(new Set());

    const [userSearch, setUserSearch] = useState("");
    const [userCurrentPage, setUserCurrentPage] = useState(1);

    const showNotice = useCallback(
        (type: "success" | "error", text: string) => {
            setNotice({ type, text });

            window.setTimeout(() => {
                setNotice((current) =>
                    current?.text === text ? null : current,
                );
            }, 2500);
        },
        [],
    );

    const resetForm = useCallback(() => {
        if (previewImageUrl.startsWith("blob:")) {
            URL.revokeObjectURL(previewImageUrl);
        }

        setForm(initialFormState);
        setEditingCourseId(null);
        setSelectedImageFile(null);
        setPreviewImageUrl("");
    }, [previewImageUrl]);

    const closeModal = useCallback(() => {
        setIsModalOpen(false);
        resetForm();
    }, [resetForm]);

    const closeTeacherModal = useCallback(() => {
        setIsTeacherModalOpen(false);
        setAssigningCourse(null);
        setAssigningTeacherId(null);
        setAssignedTeacherUserIds(new Set());
        setUserSearch("");
        setUserCurrentPage(1);
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
                    showNotice(
                        "success",
                        "Lista de cursos actualizada correctamente.",
                    );
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
        if (!isModalOpen && !isTeacherModalOpen) return;

        const originalOverflow = document.body.style.overflow;

        function handleEscape(event: KeyboardEvent) {
            if (event.key !== "Escape") return;

            if (isTeacherModalOpen) {
                closeTeacherModal();
                return;
            }

            closeModal();
        }

        document.body.style.overflow = "hidden";
        document.addEventListener("keydown", handleEscape);

        return () => {
            document.body.style.overflow = originalOverflow;
            document.removeEventListener("keydown", handleEscape);
        };
    }, [
        closeModal,
        closeTeacherModal,
        isModalOpen,
        isTeacherModalOpen,
    ]);

    const categoryMap = useMemo(
        () => new Map(categories.map((item) => [item.id, item])),
        [categories],
    );

    const subcategoryMap = useMemo(
        () => new Map(subcategories.map((item) => [item.id, item])),
        [subcategories],
    );

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

            const mdtLabel = getCourseIsMdt(course) ? "mdt" : "normal";

            return (
                getCourseNameSafe(course).includes(term) ||
                getCourseDescription(course).toLowerCase().includes(term) ||
                getCourseLevel(course).toLowerCase().includes(term) ||
                mdtLabel.includes(term) ||
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

        return filteredCourses.slice(
            startIndex,
            startIndex + ROWS_PER_PAGE,
        );
    }, [filteredCourses, activePage]);

    const filteredUsers = useMemo(() => {
        const term = userSearch.trim().toLowerCase();

        if (!term) return users;

        return users.filter((user) => {
            const fullName = getUserFullName(user).toLowerCase();

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

        return filteredUsers.slice(
            startIndex,
            startIndex + USERS_PER_PAGE,
        );
    }, [filteredUsers, activeUserPage]);

    const stats = useMemo(() => {
        return {
            total: courses.length,
            published: courses.filter(getCourseIsPublished).length,
            free: courses.filter(getCourseIsFree).length,
            openEnrollment: courses.filter(getCourseOpenEnrollment).length,
            mdt: courses.filter(getCourseIsMdt).length,
        };
    }, [courses]);

    const previewSrc =
        previewImageUrl || resolveImageUrl(form.image_url);

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

    function openCreateModal() {
        resetForm();
        setIsModalOpen(true);
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
                getEnrollmentsByCourseAndRole(course.id, TEACHER_ROLE_ID),
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

        const nextRoleId = isTeacher ? STUDENT_ROLE_ID : TEACHER_ROLE_ID;

        try {
            setAssigningTeacherId(user.id);

            const userEnrollments = await getEnrollmentsByUser(user.id);

            const courseEnrollment = userEnrollments.find(
                (enrollment) =>
                    enrollment.course.id === assigningCourse.id,
            );

            const savedEnrollment = courseEnrollment
                ? await updateEnrollment(courseEnrollment.id, {
                      accepted: courseEnrollment.accepted ?? true,
                      reference_code:
                          courseEnrollment.reference_code ?? null,
                      comment: courseEnrollment.comment ?? null,
                      user_id: user.id,
                      course_id: assigningCourse.id,
                      role_id: nextRoleId,
                  })
                : await createEnrollment({
                      accepted: true,
                      reference_code: null,
                      comment:
                          "Asignado como docente desde administración.",
                      user_id: user.id,
                      course_id: assigningCourse.id,
                      role_id: TEACHER_ROLE_ID,
                      image: null,
                  });

            setAssignedTeacherUserIds((current) => {
                const next = new Set(current);

                if (nextRoleId === TEACHER_ROLE_ID) {
                    next.add(savedEnrollment.user.id);
                } else {
                    next.delete(savedEnrollment.user.id);
                }

                return next;
            });

            showNotice(
                "success",
                nextRoleId === TEACHER_ROLE_ID
                    ? "Docente asignado al curso correctamente."
                    : "El usuario volvió al rol de estudiante correctamente.",
            );
        } catch (error) {
            showNotice(
                "error",
                error instanceof Error
                    ? error.message
                    : isTeacher
                      ? "No se pudo quitar el docente."
                      : "No se pudo asignar el docente.",
            );
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
        const confirmed = window.confirm(
            "¿Seguro que deseas eliminar este curso?",
        );

        if (!confirmed) return;

        try {
            await deleteCourse(courseId);

            setCourses((current) =>
                current.filter((item) => item.id !== courseId),
            );

            showNotice("success", "Curso eliminado correctamente.");
        } catch (error) {
            showNotice(
                "error",
                error instanceof Error
                    ? error.message
                    : "No se pudo eliminar el curso.",
            );
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
                price: form.is_free
                    ? 0
                    : parseNumberInput(form.price, 0),
                is_free: form.is_free,
                level: form.level,
                is_published: form.is_published,
                open_enrollment: form.open_enrollment,
                duration_hours: parseNumberInput(
                    form.duration_hours,
                    0,
                ),
                total_lessons: parseNumberInput(form.total_lessons, 0),
                subcategory_id: subcategoryId,
                is_mdt: form.is_mdt,
                image: selectedImageFile ?? undefined,
                discount_price: form.is_free
                    ? 0
                    : parseNumberInput(form.discount_price, 0),
            };

            if (editingCourseId) {
                const updatedCourse = await updateCourse(
                    editingCourseId,
                    payload,
                );

                setCourses((current) =>
                    current.map((item) =>
                        item.id === editingCourseId
                            ? updatedCourse
                            : item,
                    ),
                );

                showNotice(
                    "success",
                    "Curso actualizado correctamente.",
                );
            } else {
                const createdCourse = await createCourse(payload);

                setCourses((current) => [createdCourse, ...current]);

                showNotice("success", "Curso creado correctamente.");
            }

            closeModal();
        } catch (error) {
            showNotice(
                "error",
                error instanceof Error
                    ? error.message
                    : "No se pudo guardar el curso.",
            );
        } finally {
            setIsSaving(false);
        }
    }

    return {
        courses,
        categories,
        subcategories,
        categoryMap,
        subcategoryMap,
        availableSubcategories,

        form,
        editingCourseId,
        selectedImageFile,
        previewSrc,

        isLoading,
        isRefreshing,
        isSaving,
        categoriesLoading,
        subcategoriesLoading,
        notice,

        search,
        setSearch,
        currentPage,
        setCurrentPage,
        activePage,
        totalPages,
        filteredCourses,
        paginatedCourses,

        isModalOpen,
        openCreateModal,
        closeModal,
        updateForm,
        handleCategoryChange,
        handleImageChange,
        handleEdit,
        handleDelete,
        handleSubmit,

        users,
        usersLoading,
        isTeacherModalOpen,
        assigningCourse,
        assigningTeacherId,
        assignedTeacherUserIds,
        userSearch,
        setUserSearch,
        userCurrentPage,
        setUserCurrentPage,
        activeUserPage,
        userTotalPages,
        filteredUsers,
        paginatedUsers,
        openAssignTeacherModal,
        closeTeacherModal,
        handleToggleTeacher,

        stats,
        loadCoursesData,
    };
}

function getCourseNameSafe(course: Course) {
    return String(course.name ?? "").toLowerCase();
}
