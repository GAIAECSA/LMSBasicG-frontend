"use client";

import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
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
import {
    getAllUsers,
    type User,
} from "@/services/users.service";
import {
    getMyModules,
    hasBusinessLmsModule,
    type BusinessLmsPlan,
} from "@/services/business-lms-config.service";
import {
    createEnrollment,
    getEnrollmentsByCourseAndRole,
    getEnrollmentsByUser,
    updateEnrollment,
} from "@/services/enrollments.service";
import {
    notify,
} from "@/lib/notify";
import {
    ROWS_PER_PAGE,
    STUDENT_ROLE_ID,
    TEACHER_ROLE_ID,
    USERS_PER_PAGE,
    initialFormState,
} from "./constants";
import type {
    CourseFormState,
    Notice,
} from "./types";
import {
    buildFormFromCourse,
    getCourseDescription,
    getCourseImageUrl,
    getCourseIsFree,
    getCourseIsMdt,
    getCourseIsPublished,
    getCourseLevel,
    getCourseName,
    getCourseOpenEnrollment,
    getCourseSubcategoryId,
    getUserFullName,
    parseNumberInput,
    resolveImageUrl,
} from "./utils";

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

function getErrorMessage(
    error: unknown,
    fallback: string,
) {
    return error instanceof Error
        ? error.message
        : fallback;
}

export function useCoursesAdminPanel() {
    const [courses, setCourses] =
        useState<Course[]>([]);

    const [
        businessPlans,
        setBusinessPlans,
    ] =
        useState<
            BusinessLmsPlan[] |
            null
        >(
            null,
        );

    const [
        businessPlansLoading,
        setBusinessPlansLoading,
    ] =
        useState(
            true,
        );

    const [categories, setCategories] =
        useState<Category[]>([]);

    const [subcategories, setSubcategories] =
        useState<Subcategory[]>([]);

    const [form, setForm] =
        useState<CourseFormState>(
            initialFormState,
        );

    const [
        editingCourseId,
        setEditingCourseId,
    ] =
        useState<number | null>(
            null,
        );

    const [
        selectedImageFile,
        setSelectedImageFile,
    ] =
        useState<File | null>(
            null,
        );

    const [
        previewImageUrl,
        setPreviewImageUrl,
    ] =
        useState("");

    const [isLoading, setIsLoading] =
        useState(true);

    const [
        isRefreshing,
        setIsRefreshing,
    ] =
        useState(false);

    const [isSaving, setIsSaving] =
        useState(false);

    const [
        categoriesLoading,
        setCategoriesLoading,
    ] =
        useState(true);

    const [
        subcategoriesLoading,
        setSubcategoriesLoading,
    ] =
        useState(true);

    const [search, setSearch] =
        useState("");

    const [
        currentPage,
        setCurrentPage,
    ] =
        useState(1);

    const [notice, setNotice] =
        useState<Notice>(
            null,
        );

    const [
        isModalOpen,
        setIsModalOpen,
    ] =
        useState(false);

    const [users, setUsers] =
        useState<User[]>([]);

    const [
        usersLoading,
        setUsersLoading,
    ] =
        useState(false);

    const [
        isTeacherModalOpen,
        setIsTeacherModalOpen,
    ] =
        useState(false);

    const [
        assigningCourse,
        setAssigningCourse,
    ] =
        useState<Course | null>(
            null,
        );

    const [
        assigningTeacherId,
        setAssigningTeacherId,
    ] =
        useState<number | null>(
            null,
        );

    const [
        assignedTeacherUserIds,
        setAssignedTeacherUserIds,
    ] =
        useState<Set<number>>(
            new Set(),
        );

    const [
        userSearch,
        setUserSearch,
    ] =
        useState("");

    const [
        userCurrentPage,
        setUserCurrentPage,
    ] =
        useState(1);

    const [
        deleteCandidate,
        setDeleteCandidate,
    ] =
        useState<Course | null>(
            null,
        );

    const [
        isDeleting,
        setIsDeleting,
    ] =
        useState(false);

    const refreshInProgressRef =
        useRef(false);

    const saveInProgressRef =
        useRef(false);

    const deleteInProgressRef =
        useRef(false);

    const teacherOperationsRef =
        useRef<Set<number>>(
            new Set(),
        );

    const showPersistentError =
        useCallback(
            (
                message: string,
            ) => {
                setNotice({
                    type: "error",
                    text:
                        message,
                });
            },
            [],
        );

    const clearNotice =
        useCallback(
            () => {
                setNotice(
                    null,
                );
            },
            [],
        );

    const resetForm =
        useCallback(
            () => {
                if (
                    previewImageUrl.startsWith(
                        "blob:",
                    )
                ) {
                    URL.revokeObjectURL(
                        previewImageUrl,
                    );
                }

                setForm(
                    initialFormState,
                );

                setEditingCourseId(
                    null,
                );

                setSelectedImageFile(
                    null,
                );

                setPreviewImageUrl(
                    "",
                );
            },
            [
                previewImageUrl,
            ],
        );

    const closeModal =
        useCallback(
            () => {
                if (
                    isSaving
                ) {
                    return;
                }

                setIsModalOpen(
                    false,
                );

                resetForm();
            },
            [
                isSaving,
                resetForm,
            ],
        );

    const closeTeacherModal =
        useCallback(
            () => {
                if (
                    assigningTeacherId !==
                    null
                ) {
                    return;
                }

                setIsTeacherModalOpen(
                    false,
                );

                setAssigningCourse(
                    null,
                );

                setAssigningTeacherId(
                    null,
                );

                setAssignedTeacherUserIds(
                    new Set(),
                );

                setUserSearch(
                    "",
                );

                setUserCurrentPage(
                    1,
                );
            },
            [
                assigningTeacherId,
            ],
        );

    const closeDeleteModal =
        useCallback(
            () => {
                if (
                    isDeleting
                ) {
                    return;
                }

                setDeleteCandidate(
                    null,
                );
            },
            [
                isDeleting,
            ],
        );

    const loadCoursesData =
        useCallback(
            async (
                showSuccess =
                    false,
            ) => {
                if (
                    refreshInProgressRef.current
                ) {
                    return;
                }

                refreshInProgressRef.current =
                    true;

                clearNotice();

                if (
                    showSuccess
                ) {
                    setIsRefreshing(
                        true,
                    );
                } else {
                    setIsLoading(
                        true,
                    );
                }

                setCategoriesLoading(
                    true,
                );

                setSubcategoriesLoading(
                    true,
                );

                const toastId =
                    showSuccess
                        ? notify.loading(
                            "Actualizando cursos...",
                            "Estamos consultando los cursos, categorías y subcategorías.",
                        )
                        : null;

                try {
                    const [
                        coursesResult,
                        categoriesResult,
                        subcategoriesResult,
                    ] =
                        await Promise.allSettled([
                            getAllCourses(),
                            getAllCategories(),
                            getAllSubcategories(),
                        ]);

                    const issues:
                        string[] =
                        [];

                    if (
                        coursesResult.status ===
                        "fulfilled"
                    ) {
                        setCourses(
                            Array.isArray(
                                coursesResult.value,
                            )
                                ? coursesResult.value
                                : [],
                        );
                    } else {
                        setCourses(
                            [],
                        );

                        issues.push(
                            getErrorMessage(
                                coursesResult.reason,
                                "No se pudieron cargar los cursos.",
                            ),
                        );
                    }

                    if (
                        categoriesResult.status ===
                        "fulfilled"
                    ) {
                        setCategories(
                            Array.isArray(
                                categoriesResult.value,
                            )
                                ? categoriesResult.value
                                : [],
                        );
                    } else {
                        setCategories(
                            [],
                        );

                        issues.push(
                            getErrorMessage(
                                categoriesResult.reason,
                                "No se pudieron cargar las categorías.",
                            ),
                        );
                    }

                    if (
                        subcategoriesResult.status ===
                        "fulfilled"
                    ) {
                        setSubcategories(
                            Array.isArray(
                                subcategoriesResult.value,
                            )
                                ? subcategoriesResult.value
                                : [],
                        );
                    } else {
                        setSubcategories(
                            [],
                        );

                        issues.push(
                            getErrorMessage(
                                subcategoriesResult.reason,
                                "No se pudieron cargar las subcategorías.",
                            ),
                        );
                    }

                    if (
                        toastId !==
                        null
                    ) {
                        notify.dismiss(
                            toastId,
                        );
                    }

                    if (
                        issues.length >
                        0
                    ) {
                        const message =
                            issues.join(
                                " ",
                            );

                        showPersistentError(
                            message,
                        );

                        notify.error(
                            "No se pudo cargar toda la información.",
                            message,
                        );

                        return;
                    }

                    if (
                        showSuccess
                    ) {
                        notify.success(
                            "Lista de cursos actualizada.",
                            "La información se encuentra al día.",
                        );
                    }
                } catch (
                error
                ) {
                    if (
                        toastId !==
                        null
                    ) {
                        notify.dismiss(
                            toastId,
                        );
                    }

                    const message =
                        getErrorMessage(
                            error,
                            "No se pudo cargar la gestión de cursos.",
                        );

                    showPersistentError(
                        message,
                    );

                    notify.error(
                        "No se pudo cargar la información.",
                        message,
                    );
                } finally {
                    setCategoriesLoading(
                        false,
                    );

                    setSubcategoriesLoading(
                        false,
                    );

                    setIsLoading(
                        false,
                    );

                    setIsRefreshing(
                        false,
                    );

                    refreshInProgressRef.current =
                        false;
                }
            },
            [
                clearNotice,
                showPersistentError,
            ],
        );

    useEffect(() => {
        const timeoutId =
            window.setTimeout(
                () => {
                    void loadCoursesData();
                },
                0,
            );

        return () => {
            window.clearTimeout(
                timeoutId,
            );
        };
    }, [
        loadCoursesData,
    ]);

    useEffect(() => {
        let ignoreResponse =
            false;

        async function loadBusinessPlans() {
            try {
                const plans =
                    await getMyModules();

                if (
                    ignoreResponse
                ) {
                    return;
                }

                setBusinessPlans(
                    plans,
                );
            } catch (
            error
            ) {
                if (
                    ignoreResponse
                ) {
                    return;
                }

                /*
                 * Si no se puede consultar el plan, MDT queda oculto.
                 * Los módulos normales continúan disponibles.
                 */
                setBusinessPlans(
                    [],
                );

                console.warn(
                    "No se pudieron cargar los planes empresariales. MDT permanecerá oculto.",
                    error,
                );
            } finally {
                if (
                    !ignoreResponse
                ) {
                    setBusinessPlansLoading(
                        false,
                    );
                }
            }
        }

        void loadBusinessPlans();

        return () => {
            ignoreResponse =
                true;
        };
    }, []);

    useEffect(() => {
        if (
            !isModalOpen &&
            !isTeacherModalOpen &&
            !deleteCandidate
        ) {
            return;
        }

        const originalOverflow =
            document.body.style
                .overflow;

        function handleEscape(
            event:
                KeyboardEvent,
        ) {
            if (
                event.key !==
                "Escape"
            ) {
                return;
            }

            if (
                deleteCandidate
            ) {
                closeDeleteModal();
                return;
            }

            if (
                isTeacherModalOpen
            ) {
                closeTeacherModal();
                return;
            }

            closeModal();
        }

        document.body.style.overflow =
            "hidden";

        document.addEventListener(
            "keydown",
            handleEscape,
        );

        return () => {
            document.body.style.overflow =
                originalOverflow;

            document.removeEventListener(
                "keydown",
                handleEscape,
            );
        };
    }, [
        closeDeleteModal,
        closeModal,
        closeTeacherModal,
        deleteCandidate,
        isModalOpen,
        isTeacherModalOpen,
    ]);

    useEffect(() => {
        return () => {
            if (
                previewImageUrl.startsWith(
                    "blob:",
                )
            ) {
                URL.revokeObjectURL(
                    previewImageUrl,
                );
            }
        };
    }, [
        previewImageUrl,
    ]);

    const categoryMap =
        useMemo(
            () =>
                new Map(
                    categories.map(
                        (
                            item,
                        ) => [
                                item.id,
                                item,
                            ],
                    ),
                ),
            [
                categories,
            ],
        );

    const subcategoryMap =
        useMemo(
            () =>
                new Map(
                    subcategories.map(
                        (
                            item,
                        ) => [
                                item.id,
                                item,
                            ],
                    ),
                ),
            [
                subcategories,
            ],
        );

    const availableSubcategories =
        useMemo(
            () => {
                const categoryId =
                    Number(
                        form.category_id ||
                        0,
                    );

                if (
                    !categoryId
                ) {
                    return [];
                }

                return subcategories.filter(
                    (
                        subcategory,
                    ) =>
                        subcategory.category_id ===
                        categoryId,
                );
            },
            [
                form.category_id,
                subcategories,
            ],
        );

    const canUseMdt =
        useMemo(
            () =>
                hasBusinessLmsModule(
                    businessPlans,
                    "mdt",
                ),
            [
                businessPlans,
            ],
        );

    /*
     * En el plan básico no se muestran cursos MDT existentes.
     * Esto evita que se puedan editar o gestionar desde esta vista.
     */
    const visibleCourses =
        useMemo(
            () => {
                if (
                    canUseMdt
                ) {
                    return courses;
                }

                return courses.filter(
                    (
                        course,
                    ) =>
                        !getCourseIsMdt(
                            course,
                        ),
                );
            },
            [
                canUseMdt,
                courses,
            ],
        );

    const filteredCourses =
        useMemo(
            () => {
                const term =
                    search
                        .trim()
                        .toLowerCase();

                if (
                    !term
                ) {
                    return visibleCourses;
                }

                return visibleCourses.filter(
                    (
                        course,
                    ) => {
                        const courseSubcategoryId =
                            getCourseSubcategoryId(
                                course,
                            );

                        const subcategory =
                            courseSubcategoryId !==
                                null
                                ? subcategoryMap.get(
                                    courseSubcategoryId,
                                )
                                : undefined;

                        const category =
                            subcategory
                                ? categoryMap.get(
                                    subcategory.category_id,
                                )
                                : null;

                        const mdtLabel =
                            getCourseIsMdt(
                                course,
                            )
                                ? "mdt"
                                : "normal";

                        return (
                            getCourseNameSafe(
                                course,
                            ).includes(
                                term,
                            ) ||
                            getCourseDescription(
                                course,
                            )
                                .toLowerCase()
                                .includes(
                                    term,
                                ) ||
                            getCourseLevel(
                                course,
                            )
                                .toLowerCase()
                                .includes(
                                    term,
                                ) ||
                            mdtLabel.includes(
                                term,
                            ) ||
                            String(
                                courseSubcategoryId ??
                                "",
                            ).includes(
                                term,
                            ) ||
                            (
                                subcategory?.name ??
                                ""
                            )
                                .toLowerCase()
                                .includes(
                                    term,
                                ) ||
                            (
                                category?.name ??
                                ""
                            )
                                .toLowerCase()
                                .includes(
                                    term,
                                )
                        );
                    },
                );
            },
            [
                categoryMap,
                visibleCourses,
                search,
                subcategoryMap,
            ],
        );

    const totalPages =
        Math.max(
            1,
            Math.ceil(
                filteredCourses.length /
                ROWS_PER_PAGE,
            ),
        );

    const activePage =
        Math.min(
            currentPage,
            totalPages,
        );

    const paginatedCourses =
        useMemo(
            () => {
                const startIndex =
                    (
                        activePage -
                        1
                    ) *
                    ROWS_PER_PAGE;

                return filteredCourses.slice(
                    startIndex,
                    startIndex +
                    ROWS_PER_PAGE,
                );
            },
            [
                activePage,
                filteredCourses,
            ],
        );

    const filteredUsers =
        useMemo(
            () => {
                const term =
                    userSearch
                        .trim()
                        .toLowerCase();

                if (
                    !term
                ) {
                    return users;
                }

                return users.filter(
                    (
                        user,
                    ) => {
                        const fullName =
                            getUserFullName(
                                user,
                            ).toLowerCase();

                        return (
                            fullName.includes(
                                term,
                            ) ||
                            user.username
                                .toLowerCase()
                                .includes(
                                    term,
                                ) ||
                            user.email
                                .toLowerCase()
                                .includes(
                                    term,
                                ) ||
                            String(
                                user.role_id,
                            ).includes(
                                term,
                            ) ||
                            (
                                user.phone_number ??
                                ""
                            )
                                .toLowerCase()
                                .includes(
                                    term,
                                ) ||
                            (
                                user.departament ??
                                ""
                            )
                                .toLowerCase()
                                .includes(
                                    term,
                                )
                        );
                    },
                );
            },
            [
                userSearch,
                users,
            ],
        );

    const userTotalPages =
        Math.max(
            1,
            Math.ceil(
                filteredUsers.length /
                USERS_PER_PAGE,
            ),
        );

    const activeUserPage =
        Math.min(
            userCurrentPage,
            userTotalPages,
        );

    const paginatedUsers =
        useMemo(
            () => {
                const startIndex =
                    (
                        activeUserPage -
                        1
                    ) *
                    USERS_PER_PAGE;

                return filteredUsers.slice(
                    startIndex,
                    startIndex +
                    USERS_PER_PAGE,
                );
            },
            [
                activeUserPage,
                filteredUsers,
            ],
        );

    const stats =
        useMemo(
            () => ({
                total:
                    visibleCourses.length,
                published:
                    visibleCourses.filter(
                        getCourseIsPublished,
                    ).length,
                free:
                    visibleCourses.filter(
                        getCourseIsFree,
                    ).length,
                openEnrollment:
                    visibleCourses.filter(
                        getCourseOpenEnrollment,
                    ).length,
                mdt:
                    visibleCourses.filter(
                        getCourseIsMdt,
                    ).length,
            }),
            [
                visibleCourses,
            ],
        );

    const previewSrc =
        previewImageUrl ||
        resolveImageUrl(
            form.image_url,
        );

    function updateForm<
        K extends keyof CourseFormState,
    >(
        key: K,
        value:
            CourseFormState[K],
    ) {
        if (
            key ===
            "is_mdt" &&
            value ===
            true &&
            !canUseMdt
        ) {
            notify.warning(
                "MDT no disponible.",
                "El plan actual no permite crear cursos MDT.",
            );

            return;
        }

        setForm(
            (
                current,
            ) => ({
                ...current,
                [key]:
                    value,
            }),
        );

        clearNotice();
    }

    function handleCategoryChange(
        categoryId: string,
    ) {
        setForm(
            (
                current,
            ) => ({
                ...current,
                category_id:
                    categoryId,
                subcategory_id:
                    "",
            }),
        );

        clearNotice();
    }

    function handleImageChange(
        event:
            ChangeEvent<HTMLInputElement>,
    ) {
        const file =
            event.target.files?.[0] ??
            null;

        if (
            previewImageUrl.startsWith(
                "blob:",
            )
        ) {
            URL.revokeObjectURL(
                previewImageUrl,
            );
        }

        if (
            !file
        ) {
            setSelectedImageFile(
                null,
            );

            setPreviewImageUrl(
                resolveImageUrl(
                    form.image_url,
                ),
            );

            return;
        }

        if (
            !file.type.startsWith(
                "image/",
            )
        ) {
            event.target.value =
                "";

            setSelectedImageFile(
                null,
            );

            notify.warning(
                "Imagen no válida.",
                "Selecciona un archivo de imagen permitido.",
            );

            return;
        }

        if (
            file.size >
            MAX_IMAGE_SIZE_BYTES
        ) {
            event.target.value =
                "";

            setSelectedImageFile(
                null,
            );

            notify.warning(
                "Imagen demasiado pesada.",
                "Selecciona una imagen de hasta 5 MB.",
            );

            return;
        }

        const objectUrl =
            URL.createObjectURL(
                file,
            );

        setSelectedImageFile(
            file,
        );

        setPreviewImageUrl(
            objectUrl,
        );
    }

    function openCreateModal() {
        clearNotice();
        resetForm();

        setIsModalOpen(
            true,
        );
    }

    async function openAssignTeacherModal(
        course: Course,
    ) {
        setAssigningCourse(
            course,
        );

        setIsTeacherModalOpen(
            true,
        );

        setUserSearch(
            "",
        );

        setUserCurrentPage(
            1,
        );

        setAssignedTeacherUserIds(
            new Set(),
        );

        try {
            setUsersLoading(
                true,
            );

            const [
                usersData,
                teacherEnrollments,
            ] =
                await Promise.all([
                    getAllUsers(),
                    getEnrollmentsByCourseAndRole(
                        course.id,
                        TEACHER_ROLE_ID,
                    ),
                ]);

            setUsers(
                Array.isArray(
                    usersData,
                )
                    ? usersData
                    : [],
            );

            setAssignedTeacherUserIds(
                new Set(
                    teacherEnrollments.map(
                        (
                            enrollment,
                        ) =>
                            enrollment.user
                                .id,
                    ),
                ),
            );
        } catch (
        error
        ) {
            const message =
                getErrorMessage(
                    error,
                    "No se pudieron cargar los usuarios.",
                );

            setUsers(
                [],
            );

            setAssignedTeacherUserIds(
                new Set(),
            );

            notify.error(
                "No se pudo abrir la asignación de docentes.",
                message,
            );
        } finally {
            setUsersLoading(
                false,
            );
        }
    }

    async function handleToggleTeacher(
        user: User,
        isTeacher: boolean,
    ) {
        if (
            !assigningCourse
        ) {
            notify.warning(
                "Curso no disponible.",
                "No se encontró el curso seleccionado.",
            );

            return;
        }

        if (
            teacherOperationsRef.current.has(
                user.id,
            )
        ) {
            return;
        }

        teacherOperationsRef.current.add(
            user.id,
        );

        setAssigningTeacherId(
            user.id,
        );

        const nextRoleId =
            isTeacher
                ? STUDENT_ROLE_ID
                : TEACHER_ROLE_ID;

        const toastId =
            notify.loading(
                isTeacher
                    ? "Quitando docente..."
                    : "Asignando docente...",
                `${getUserFullName(
                    user,
                )} · ${getCourseName(
                    assigningCourse,
                )}`,
            );

        try {
            const userEnrollments =
                await getEnrollmentsByUser(
                    user.id,
                );

            const courseEnrollment =
                userEnrollments.find(
                    (
                        enrollment,
                    ) =>
                        enrollment.course
                            .id ===
                        assigningCourse.id,
                );

            const savedEnrollment =
                courseEnrollment
                    ? await updateEnrollment(
                        courseEnrollment.id,
                        {
                            accepted:
                                courseEnrollment.accepted ??
                                true,
                            reference_code:
                                courseEnrollment.reference_code ??
                                null,
                            comment:
                                courseEnrollment.comment ??
                                null,
                            user_id:
                                user.id,
                            course_id:
                                assigningCourse.id,
                            role_id:
                                nextRoleId,
                        },
                    )
                    : await createEnrollment({
                        accepted:
                            true,
                        reference_code:
                            null,
                        comment:
                            "Asignado como docente desde administración.",
                        user_id:
                            user.id,
                        course_id:
                            assigningCourse.id,
                        role_id:
                            TEACHER_ROLE_ID,
                        image:
                            null,
                    });

            setAssignedTeacherUserIds(
                (
                    current,
                ) => {
                    const next =
                        new Set(
                            current,
                        );

                    if (
                        nextRoleId ===
                        TEACHER_ROLE_ID
                    ) {
                        next.add(
                            savedEnrollment.user
                                .id,
                        );
                    } else {
                        next.delete(
                            savedEnrollment.user
                                .id,
                        );
                    }

                    return next;
                },
            );

            notify.dismiss(
                toastId,
            );

            notify.success(
                nextRoleId ===
                    TEACHER_ROLE_ID
                    ? "Docente asignado."
                    : "Asignación actualizada.",
                nextRoleId ===
                    TEACHER_ROLE_ID
                    ? "El usuario ya tiene acceso docente al curso."
                    : "El usuario volvió al rol de estudiante en este curso.",
            );
        } catch (
        error
        ) {
            notify.dismiss(
                toastId,
            );

            notify.error(
                isTeacher
                    ? "No se pudo quitar el docente."
                    : "No se pudo asignar el docente.",
                getErrorMessage(
                    error,
                    "No se pudo completar la operación.",
                ),
            );
        } finally {
            teacherOperationsRef.current.delete(
                user.id,
            );

            setAssigningTeacherId(
                null,
            );
        }
    }

    function handleEdit(
        course: Course,
    ) {
        if (
            !canUseMdt &&
            getCourseIsMdt(
                course,
            )
        ) {
            notify.warning(
                "Curso MDT no disponible.",
                "El plan actual no permite administrar cursos MDT.",
            );

            return;
        }

        const courseSubcategoryId =
            getCourseSubcategoryId(
                course,
            );

        const foundSubcategory =
            courseSubcategoryId !==
                null
                ? subcategoryMap.get(
                    courseSubcategoryId,
                )
                : undefined;

        const nextForm = {
            ...buildFormFromCourse(
                course,
            ),
            category_id:
                foundSubcategory
                    ? String(
                        foundSubcategory.category_id,
                    )
                    : "",
            subcategory_id:
                String(
                    courseSubcategoryId ??
                    "",
                ),
        };

        if (
            previewImageUrl.startsWith(
                "blob:",
            )
        ) {
            URL.revokeObjectURL(
                previewImageUrl,
            );
        }

        clearNotice();

        setEditingCourseId(
            course.id,
        );

        setForm(
            nextForm,
        );

        setSelectedImageFile(
            null,
        );

        setPreviewImageUrl(
            resolveImageUrl(
                getCourseImageUrl(
                    course,
                ),
            ),
        );

        setIsModalOpen(
            true,
        );
    }

    function openDeleteModal(
        course: Course,
    ) {
        if (
            isDeleting
        ) {
            return;
        }

        setDeleteCandidate(
            course,
        );
    }

    async function confirmDeleteCourse() {
        if (
            !deleteCandidate ||
            isDeleting ||
            deleteInProgressRef.current
        ) {
            return;
        }

        deleteInProgressRef.current =
            true;

        setIsDeleting(
            true,
        );

        clearNotice();

        const courseId =
            deleteCandidate.id;

        const courseName =
            getCourseName(
                deleteCandidate,
            ) ||
            `Curso #${courseId}`;

        const toastId =
            notify.loading(
                "Eliminando curso...",
                courseName,
            );

        try {
            await deleteCourse(
                courseId,
            );

            setCourses(
                (
                    current,
                ) =>
                    current.filter(
                        (
                            item,
                        ) =>
                            item.id !==
                            courseId,
                    ),
            );

            setDeleteCandidate(
                null,
            );

            notify.dismiss(
                toastId,
            );

            notify.success(
                "Curso eliminado.",
                `${courseName} fue eliminado correctamente.`,
            );
        } catch (
        error
        ) {
            const message =
                getErrorMessage(
                    error,
                    "No se pudo eliminar el curso.",
                );

            showPersistentError(
                message,
            );

            notify.dismiss(
                toastId,
            );

            notify.error(
                "No se pudo eliminar el curso.",
                message,
            );
        } finally {
            deleteInProgressRef.current =
                false;

            setIsDeleting(
                false,
            );
        }
    }

    function getFormValidationMessage() {
        const subcategoryId =
            parseNumberInput(
                form.subcategory_id,
                0,
            );

        const price =
            parseNumberInput(
                form.price,
                0,
            );

        const discountPrice =
            parseNumberInput(
                form.discount_price,
                0,
            );

        const durationHours =
            parseNumberInput(
                form.duration_hours,
                0,
            );

        if (
            !form.name.trim()
        ) {
            return "El nombre del curso es obligatorio.";
        }

        if (
            !form.description.trim()
        ) {
            return "La descripción del curso es obligatoria.";
        }

        if (
            !form.category_id
        ) {
            return "La categoría es obligatoria.";
        }

        if (
            !subcategoryId ||
            subcategoryId <=
            0
        ) {
            return "La subcategoría es obligatoria.";
        }

        if (
            !form.currency.trim()
        ) {
            return "La moneda es obligatoria.";
        }

        if (
            !form.is_free &&
            price <
            0
        ) {
            return "El precio no puede ser negativo.";
        }

        if (
            !form.is_free &&
            discountPrice <
            0
        ) {
            return "El precio con descuento no puede ser negativo.";
        }

        if (
            !form.is_free &&
            discountPrice >
            0 &&
            price >
            0 &&
            discountPrice >=
            price
        ) {
            return "El precio con descuento debe ser menor que el precio normal.";
        }

        if (
            durationHours <
            0
        ) {
            return "La duración no puede ser negativa.";
        }

        return "";
    }

    async function handleSubmit(
        event:
            FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        if (
            isSaving ||
            saveInProgressRef.current
        ) {
            return;
        }

        const validationMessage =
            getFormValidationMessage();

        if (
            validationMessage
        ) {
            notify.warning(
                "Revisa los datos del curso.",
                validationMessage,
            );

            return;
        }

        saveInProgressRef.current =
            true;

        setIsSaving(
            true,
        );

        clearNotice();

        const isEditing =
            Boolean(
                editingCourseId,
            );

        const toastId =
            notify.loading(
                isEditing
                    ? "Actualizando curso..."
                    : "Creando curso...",
                "Estamos guardando la información del curso.",
            );

        try {
            const subcategoryId =
                parseNumberInput(
                    form.subcategory_id,
                    0,
                );

            const payload = {
                name:
                    form.name.trim(),
                description:
                    form.description.trim(),
                price:
                    form.is_free
                        ? 0
                        : parseNumberInput(
                            form.price,
                            0,
                        ),
                is_free:
                    form.is_free,
                level:
                    form.level,
                is_published:
                    form.is_published,
                open_enrollment:
                    form.open_enrollment,
                duration_hours:
                    parseNumberInput(
                        form.duration_hours,
                        0,
                    ),
                total_lessons:
                    parseNumberInput(
                        form.total_lessons,
                        0,
                    ),
                subcategory_id:
                    subcategoryId,
                is_mdt:
                    canUseMdt
                        ? form.is_mdt
                        : false,
                image:
                    selectedImageFile ??
                    undefined,
                discount_price:
                    form.is_free
                        ? 0
                        : parseNumberInput(
                            form.discount_price,
                            0,
                        ),
            };

            if (
                editingCourseId
            ) {
                const updatedCourse =
                    await updateCourse(
                        editingCourseId,
                        payload,
                    );

                setCourses(
                    (
                        current,
                    ) =>
                        current.map(
                            (
                                item,
                            ) =>
                                item.id ===
                                    editingCourseId
                                    ? updatedCourse
                                    : item,
                        ),
                );
            } else {
                const createdCourse =
                    await createCourse(
                        payload,
                    );

                setCourses(
                    (
                        current,
                    ) => [
                            createdCourse,
                            ...current,
                        ],
                );
            }

            setIsModalOpen(
                false,
            );

            resetForm();

            notify.dismiss(
                toastId,
            );

            notify.success(
                isEditing
                    ? "Curso actualizado."
                    : "Curso creado.",
                isEditing
                    ? "La información del curso se actualizó correctamente."
                    : "El nuevo curso fue registrado correctamente.",
            );
        } catch (
        error
        ) {
            const message =
                getErrorMessage(
                    error,
                    "No se pudo guardar el curso.",
                );

            showPersistentError(
                message,
            );

            notify.dismiss(
                toastId,
            );

            notify.error(
                isEditing
                    ? "No se pudo actualizar el curso."
                    : "No se pudo crear el curso.",
                message,
            );
        } finally {
            saveInProgressRef.current =
                false;

            setIsSaving(
                false,
            );
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
        canUseMdt,
        businessPlansLoading,
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

        deleteCandidate,
        isDeleting,
        openDeleteModal,
        closeDeleteModal,
        confirmDeleteCourse,

        stats,
        loadCoursesData,
    };
}

function getCourseNameSafe(
    course: Course,
) {
    return String(
        course.name ??
        "",
    ).toLowerCase();
}
