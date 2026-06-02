"use client";

import {
    useCallback,
    useEffect,
    useMemo,
    useState,
    type FormEvent,
} from "react";
import {
    createEnrollment,
    deleteEnrollment,
    getEnrollmentsByRole,
    getEnrollmentsByUser,
    updateEnrollment,
    type Enrollment,
} from "@/services/enrollments.service";
import { getAllCourses, type Course } from "@/services/courses.service";
import { getAllUsers, type User } from "@/services/users.service";

type Notice =
    | { type: "success"; text: string }
    | { type: "error"; text: string }
    | null;

type EditAssignmentForm = {
    courseId: string;
    status: "accepted" | "pending";
    comment: string;
};

const TEACHER_ROLE_ID = 3;
const ITEMS_PER_PAGE = 7;
const USERS_PER_PAGE = 6;

const initialEditAssignmentForm: EditAssignmentForm = {
    courseId: "",
    status: "accepted",
    comment: "",
};

function getErrorMessage(error: unknown, fallback: string): string {
    return error instanceof Error ? error.message : fallback;
}

function getTeacherName(item: Enrollment): string {
    const fullName = `${item.user.firstname ?? ""} ${item.user.lastname ?? ""}`.trim();

    return fullName || `Usuario #${item.user.id}`;
}

function getUserName(user: User): string {
    const fullName = `${user.firstname ?? ""} ${user.lastname ?? ""}`.trim();

    return fullName || user.username || `Usuario #${user.id}`;
}

function getAcceptedBadgeClass(accepted: boolean | null): string {
    if (accepted === true) {
        return "bg-emerald-100 text-emerald-700";
    }

    return "bg-orange-100 text-orange-700";
}

export default function TeachersPage() {
    const [teacherEnrollments, setTeacherEnrollments] = useState<Enrollment[]>(
        [],
    );
    const [courses, setCourses] = useState<Course[]>([]);
    const [users, setUsers] = useState<User[]>([]);

    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [notice, setNotice] = useState<Notice>(null);

    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [selectedCourseId, setSelectedCourseId] = useState("");
    const [userSearch, setUserSearch] = useState("");
    const [userCurrentPage, setUserCurrentPage] = useState(1);
    const [assigningUserId, setAssigningUserId] = useState<number | null>(null);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingEnrollment, setEditingEnrollment] =
        useState<Enrollment | null>(null);
    const [editForm, setEditForm] = useState<EditAssignmentForm>(
        initialEditAssignmentForm,
    );
    const [isSavingEdit, setIsSavingEdit] = useState(false);

    const [deletingEnrollmentId, setDeletingEnrollmentId] = useState<
        number | null
    >(null);

    const showNotice = useCallback((type: "success" | "error", text: string) => {
        setNotice({ type, text });

        window.setTimeout(() => {
            setNotice((current) => (current?.text === text ? null : current));
        }, 2800);
    }, []);

    const loadData = useCallback(
        async (showSuccess = false) => {
            try {
                if (showSuccess) {
                    setIsRefreshing(true);
                } else {
                    setIsLoading(true);
                }

                const [teachersResult, coursesResult, usersResult] =
                    await Promise.allSettled([
                        getEnrollmentsByRole(TEACHER_ROLE_ID),
                        getAllCourses(),
                        getAllUsers(),
                    ]);

                const errors: string[] = [];

                if (teachersResult.status === "fulfilled") {
                    setTeacherEnrollments(
                        Array.isArray(teachersResult.value)
                            ? teachersResult.value
                            : [],
                    );
                } else {
                    setTeacherEnrollments([]);
                    errors.push(
                        getErrorMessage(
                            teachersResult.reason,
                            "No se pudieron cargar los docentes.",
                        ),
                    );
                }

                if (coursesResult.status === "fulfilled") {
                    const loadedCourses = Array.isArray(coursesResult.value)
                        ? coursesResult.value
                        : [];

                    setCourses(loadedCourses);
                    setSelectedCourseId((current) => {
                        if (
                            current &&
                            loadedCourses.some(
                                (course) => String(course.id) === current,
                            )
                        ) {
                            return current;
                        }

                        return loadedCourses[0]
                            ? String(loadedCourses[0].id)
                            : "";
                    });
                } else {
                    setCourses([]);
                    setSelectedCourseId("");
                    errors.push(
                        getErrorMessage(
                            coursesResult.reason,
                            "No se pudieron cargar los cursos.",
                        ),
                    );
                }

                if (usersResult.status === "fulfilled") {
                    setUsers(
                        Array.isArray(usersResult.value)
                            ? usersResult.value
                            : [],
                    );
                } else {
                    setUsers([]);
                    errors.push(
                        getErrorMessage(
                            usersResult.reason,
                            "No se pudieron cargar los usuarios.",
                        ),
                    );
                }

                if (errors.length > 0) {
                    showNotice("error", errors.join(" "));
                } else if (showSuccess) {
                    showNotice(
                        "success",
                        "Lista de docentes actualizada correctamente.",
                    );
                }
            } finally {
                setIsLoading(false);
                setIsRefreshing(false);
            }
        },
        [showNotice],
    );

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void loadData();
        }, 0);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [loadData]);

    const filteredTeachers = useMemo(() => {
        const term = search.trim().toLowerCase();

        if (!term) return teacherEnrollments;

        return teacherEnrollments.filter((item) => {
            const teacherName = getTeacherName(item).toLowerCase();
            const courseName = item.course.name.toLowerCase();
            const roleName = item.role.name.toLowerCase();

            return (
                teacherName.includes(term) ||
                courseName.includes(term) ||
                roleName.includes(term) ||
                String(item.user.id).includes(term) ||
                String(item.course.id).includes(term) ||
                String(item.id).includes(term)
            );
        });
    }, [teacherEnrollments, search]);

    const totalPages = Math.max(
        1,
        Math.ceil(filteredTeachers.length / ITEMS_PER_PAGE),
    );

    const activePage = Math.min(currentPage, totalPages);

    const paginatedTeachers = useMemo(() => {
        const startIndex = (activePage - 1) * ITEMS_PER_PAGE;

        return filteredTeachers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredTeachers, activePage]);

    const assignedTeacherUserIds = useMemo(() => {
        const courseId = Number(selectedCourseId);

        return new Set(
            teacherEnrollments
                .filter((item) => item.course.id === courseId)
                .map((item) => item.user.id),
        );
    }, [teacherEnrollments, selectedCourseId]);

    const filteredUsers = useMemo(() => {
        const term = userSearch.trim().toLowerCase();

        if (!term) return users;

        return users.filter((user) => {
            const fullName = getUserName(user).toLowerCase();

            return (
                fullName.includes(term) ||
                user.username.toLowerCase().includes(term) ||
                user.email.toLowerCase().includes(term) ||
                (user.phone_number ?? "").toLowerCase().includes(term) ||
                (user.departament ?? "").toLowerCase().includes(term) ||
                String(user.id).includes(term)
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
        const uniqueTeachers = new Set(
            teacherEnrollments.map((item) => item.user.id),
        ).size;

        const assignedCourses = new Set(
            teacherEnrollments.map((item) => item.course.id),
        ).size;

        const acceptedEnrollments = teacherEnrollments.filter(
            (item) => item.accepted === true,
        ).length;

        return {
            total: teacherEnrollments.length,
            uniqueTeachers,
            assignedCourses,
            acceptedEnrollments,
        };
    }, [teacherEnrollments]);

    function openAssignModal() {
        if (!selectedCourseId && courses[0]) {
            setSelectedCourseId(String(courses[0].id));
        }

        setUserSearch("");
        setUserCurrentPage(1);
        setIsAssignModalOpen(true);
    }

    function closeAssignModal() {
        setIsAssignModalOpen(false);
        setAssigningUserId(null);
        setUserSearch("");
        setUserCurrentPage(1);
    }

    function openEditModal(item: Enrollment) {
        setEditingEnrollment(item);
        setEditForm({
            courseId: String(item.course.id),
            status: item.accepted === true ? "accepted" : "pending",
            comment: item.comment ?? "",
        });
        setIsEditModalOpen(true);
    }

    function closeEditModal() {
        setIsEditModalOpen(false);
        setEditingEnrollment(null);
        setEditForm(initialEditAssignmentForm);
        setIsSavingEdit(false);
    }

    async function handleAssignTeacher(user: User) {
        const courseId = Number(selectedCourseId);

        if (!courseId || courseId <= 0) {
            showNotice("error", "Selecciona primero el curso.");
            return;
        }

        if (assignedTeacherUserIds.has(user.id)) {
            showNotice(
                "error",
                "El usuario ya está asignado como docente en este curso.",
            );
            return;
        }

        try {
            setAssigningUserId(user.id);

            const userEnrollments = await getEnrollmentsByUser(user.id);
            const existingEnrollment = userEnrollments.find(
                (item) => item.course.id === courseId,
            );

            const savedEnrollment = existingEnrollment
                ? await updateEnrollment(existingEnrollment.id, {
                    accepted: true,
                    reference_code: existingEnrollment.reference_code ?? null,
                    comment:
                        existingEnrollment.comment ??
                        "Asignado como docente desde administración.",
                    user_id: user.id,
                    course_id: courseId,
                    role_id: TEACHER_ROLE_ID,
                })
                : await createEnrollment({
                    accepted: true,
                    reference_code: null,
                    comment: "Asignado como docente desde administración.",
                    user_id: user.id,
                    course_id: courseId,
                    role_id: TEACHER_ROLE_ID,
                    image: null,
                });

            setTeacherEnrollments((current) => [
                savedEnrollment,
                ...current.filter((item) => item.id !== savedEnrollment.id),
            ]);

            showNotice("success", "Docente asignado al curso correctamente.");
        } catch (error) {
            showNotice(
                "error",
                getErrorMessage(error, "No se pudo asignar el docente."),
            );
        } finally {
            setAssigningUserId(null);
        }
    }

    async function handleUpdateAssignment(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!editingEnrollment) {
            showNotice("error", "No se encontró la asignación seleccionada.");
            return;
        }

        const courseId = Number(editForm.courseId);

        if (!courseId || courseId <= 0) {
            showNotice("error", "Selecciona el curso del docente.");
            return;
        }

        const duplicatedAssignment = teacherEnrollments.some(
            (item) =>
                item.id !== editingEnrollment.id &&
                item.user.id === editingEnrollment.user.id &&
                item.course.id === courseId,
        );

        if (duplicatedAssignment) {
            showNotice(
                "error",
                "El docente ya tiene una asignación registrada en ese curso.",
            );
            return;
        }

        try {
            setIsSavingEdit(true);

            const updatedEnrollment = await updateEnrollment(
                editingEnrollment.id,
                {
                    accepted: editForm.status === "accepted",
                    reference_code: editingEnrollment.reference_code ?? null,
                    comment: editForm.comment.trim() || null,
                    user_id: editingEnrollment.user.id,
                    course_id: courseId,
                    role_id: TEACHER_ROLE_ID,
                },
            );

            setTeacherEnrollments((current) =>
                current.map((item) =>
                    item.id === updatedEnrollment.id ? updatedEnrollment : item,
                ),
            );

            closeEditModal();
            showNotice("success", "Asignación actualizada correctamente.");
        } catch (error) {
            showNotice(
                "error",
                getErrorMessage(error, "No se pudo actualizar la asignación."),
            );
        } finally {
            setIsSavingEdit(false);
        }
    }

    async function handleDeleteAssignment(item: Enrollment) {
        const confirmed = window.confirm(
            `¿Seguro que deseas quitar a ${getTeacherName(item)} del curso ${item.course.name}?`,
        );

        if (!confirmed) return;

        try {
            setDeletingEnrollmentId(item.id);
            await deleteEnrollment(item.id);

            setTeacherEnrollments((current) =>
                current.filter((currentItem) => currentItem.id !== item.id),
            );

            showNotice("success", "Asignación eliminada correctamente.");
        } catch (error) {
            showNotice(
                "error",
                getErrorMessage(error, "No se pudo eliminar la asignación."),
            );
        } finally {
            setDeletingEnrollmentId(null);
        }
    }

    return (
        <>
            <section className="space-y-6">
                <div className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#07111F] via-[#172861] via-70% to-[#F97316] p-6 text-white shadow-lg">
                    <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                        <div>
                            <p className="text-sm font-medium uppercase tracking-[0.25em] text-blue-100">
                                Gestión de docentes
                            </p>

                            <h2 className="mt-3 text-2xl font-bold md:text-3xl">
                                Docentes asignados
                            </h2>

                            <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-50">
                                Selecciona un curso, asigna sus docentes y
                                administra las relaciones existentes sin
                                eliminar las cuentas de usuario.
                            </p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:min-w-[620px]">
                            <div className="rounded-2xl bg-white/15 p-4 ring-1 ring-white/20">
                                <p className="text-xs font-bold uppercase tracking-wide text-white/75">
                                    Asignaciones
                                </p>
                                <p className="mt-2 text-3xl font-bold">
                                    {isLoading ? "..." : stats.total}
                                </p>
                            </div>

                            <div className="rounded-2xl bg-white/15 p-4 ring-1 ring-white/20">
                                <p className="text-xs font-bold uppercase tracking-wide text-white/75">
                                    Docentes
                                </p>
                                <p className="mt-2 text-3xl font-bold">
                                    {isLoading ? "..." : stats.uniqueTeachers}
                                </p>
                            </div>

                            <div className="rounded-2xl bg-white/15 p-4 ring-1 ring-white/20">
                                <p className="text-xs font-bold uppercase tracking-wide text-white/75">
                                    Cursos
                                </p>
                                <p className="mt-2 text-3xl font-bold">
                                    {isLoading ? "..." : stats.assignedCourses}
                                </p>
                            </div>

                            <div className="rounded-2xl bg-white/15 p-4 ring-1 ring-white/20">
                                <p className="text-xs font-bold uppercase tracking-wide text-white/75">
                                    Aceptados
                                </p>
                                <p className="mt-2 text-3xl font-bold">
                                    {isLoading
                                        ? "..."
                                        : stats.acceptedEnrollments}
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
                                Lista de docentes
                            </h3>

                            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                                Busca por docente, curso, rol o identificador de
                                la asignación.
                            </p>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row">
                            <button
                                type="button"
                                onClick={openAssignModal}
                                className="h-12 rounded-2xl bg-[#172861] px-5 text-sm font-bold text-white shadow-sm transition hover:bg-[#0B163F]"
                            >
                                Asignar docente
                            </button>

                            <button
                                type="button"
                                onClick={() => void loadData(true)}
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
                            placeholder="Buscar por docente, curso, rol o ID"
                            className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 lg:max-w-[440px]"
                        />
                    </div>
                </div>

                <div className="overflow-hidden rounded-3xl border border-[var(--border)] bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                                        Docente
                                    </th>
                                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                                        Curso asignado
                                    </th>
                                    <th className="px-5 py-4 text-center text-xs font-bold uppercase tracking-wide text-slate-600">
                                        Rol
                                    </th>
                                    <th className="px-5 py-4 text-center text-xs font-bold uppercase tracking-wide text-slate-600">
                                        Estado
                                    </th>
                                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                                        Comentario
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
                                            colSpan={6}
                                            className="px-5 py-12 text-center text-sm font-semibold text-slate-500"
                                        >
                                            Cargando docentes, cursos y
                                            usuarios...
                                        </td>
                                    </tr>
                                ) : filteredTeachers.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="px-5 py-12 text-center"
                                        >
                                            <p className="text-sm font-bold text-slate-800">
                                                No hay docentes para mostrar.
                                            </p>
                                            <p className="mt-1 text-sm text-slate-500">
                                                Presiona Asignar docente para
                                                registrar al primer profesor de
                                                un curso.
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedTeachers.map((item) => (
                                        <tr
                                            key={item.id}
                                            className="align-top transition hover:bg-blue-50/40"
                                        >
                                            <td className="px-5 py-4">
                                                <div className="flex min-w-[220px] items-center gap-3">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#172861] text-sm font-bold text-white">
                                                        {getTeacherName(item)
                                                            .charAt(0)
                                                            .toUpperCase()}
                                                    </div>

                                                    <div>
                                                        <p className="text-sm font-bold text-slate-950">
                                                            {getTeacherName(item)}
                                                        </p>

                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="min-w-[230px]">
                                                    <p className="text-sm font-semibold text-slate-800">
                                                        {item.course.name}
                                                    </p>
                                                </div>
                                            </td>

                                            <td className="px-5 py-4 text-center">
                                                <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                                                    {item.role.name}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4 text-center">
                                                <span
                                                    className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${getAcceptedBadgeClass(
                                                        item.accepted,
                                                    )}`}
                                                >
                                                    {item.accepted === true
                                                        ? "Aceptado"
                                                        : "Pendiente"}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4 text-sm font-medium text-slate-500">
                                                <p className="max-w-[260px]">
                                                    {item.comment ||
                                                        "Sin comentario"}
                                                </p>
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="flex min-w-[190px] justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            openEditModal(item)
                                                        }
                                                        className="rounded-xl border border-blue-200 px-3 py-2 text-xs font-bold text-blue-700 transition hover:bg-blue-50"
                                                    >
                                                        Editar
                                                    </button>

                                                    <button
                                                        type="button"
                                                        disabled={
                                                            deletingEnrollmentId ===
                                                            item.id
                                                        }
                                                        onClick={() =>
                                                            void handleDeleteAssignment(
                                                                item,
                                                            )
                                                        }
                                                        className="rounded-xl border border-red-200 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                                                    >
                                                        {deletingEnrollmentId ===
                                                            item.id
                                                            ? "Quitando..."
                                                            : "Quitar"}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm font-semibold text-slate-500">
                            Mostrando {paginatedTeachers.length} de{" "}
                            {filteredTeachers.length} asignaciones
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
            </section>

            {isAssignModalOpen ? (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
                    onClick={closeAssignModal}
                >
                    <div
                        className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="bg-gradient-to-br from-[#07111F] via-[#172861] to-[#F97316] px-6 py-5 text-white">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-100">
                                        Nueva asignación
                                    </p>
                                    <h2 className="mt-2 text-2xl font-bold">
                                        Asignar docente a un curso
                                    </h2>
                                    <p className="mt-1 text-sm text-blue-50">
                                        Primero selecciona el curso y luego el
                                        usuario que actuará como profesor.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={closeAssignModal}
                                    className="rounded-2xl bg-white/15 px-4 py-2 text-sm font-bold text-white ring-1 ring-white/20 transition hover:bg-white/25"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>

                        <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 p-5">
                            <div className="space-y-4">
                                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                    <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
                                        <div>
                                            <label className="mb-2 block text-sm font-bold text-slate-700">
                                                Curso
                                            </label>
                                            <select
                                                value={selectedCourseId}
                                                onChange={(event) => {
                                                    setSelectedCourseId(
                                                        event.target.value,
                                                    );
                                                    setUserCurrentPage(1);
                                                }}
                                                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                            >
                                                <option value="">
                                                    Selecciona un curso
                                                </option>
                                                {courses.map((course) => (
                                                    <option
                                                        key={course.id}
                                                        value={course.id}
                                                    >
                                                        {course.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-sm font-bold text-slate-700">
                                                Buscar usuario
                                            </label>
                                            <input
                                                value={userSearch}
                                                onChange={(event) => {
                                                    setUserSearch(
                                                        event.target.value,
                                                    );
                                                    setUserCurrentPage(1);
                                                }}
                                                placeholder="Nombre, correo, usuario o departamento"
                                                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                            />
                                        </div>
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
                                                {paginatedUsers.map((user) => {
                                                    const fullName =
                                                        getUserName(user);
                                                    const isAssigned =
                                                        assignedTeacherUserIds.has(
                                                            user.id,
                                                        );
                                                    const isAssigning =
                                                        assigningUserId ===
                                                        user.id;

                                                    return (
                                                        <tr
                                                            key={user.id}
                                                            className="transition hover:bg-blue-50/40"
                                                        >
                                                            <td className="px-5 py-4">
                                                                <div className="flex min-w-[220px] items-center gap-3">
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
                                                                {user.email}
                                                            </td>

                                                            <td className="px-5 py-4 font-semibold text-slate-500">
                                                                {user.departament ||
                                                                    "Sin departamento"}
                                                            </td>

                                                            <td className="px-5 py-4 text-center">
                                                                <span
                                                                    className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${isAssigned
                                                                        ? "bg-blue-100 text-blue-700"
                                                                        : "bg-slate-100 text-slate-700"
                                                                        }`}
                                                                >
                                                                    {isAssigned
                                                                        ? "Docente del curso"
                                                                        : "Disponible"}
                                                                </span>
                                                            </td>

                                                            <td className="px-5 py-4 text-center">
                                                                <button
                                                                    type="button"
                                                                    disabled={
                                                                        !selectedCourseId ||
                                                                        isAssigned ||
                                                                        isAssigning
                                                                    }
                                                                    onClick={() =>
                                                                        void handleAssignTeacher(
                                                                            user,
                                                                        )
                                                                    }
                                                                    className="rounded-xl bg-[#172861] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#0B163F] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                                                                >
                                                                    {isAssigning
                                                                        ? "Asignando..."
                                                                        : isAssigned
                                                                            ? "Asignado"
                                                                            : "Seleccionar"}
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}

                                                {paginatedUsers.length === 0 ? (
                                                    <tr>
                                                        <td
                                                            colSpan={5}
                                                            className="px-5 py-8 text-center text-sm font-semibold text-slate-500"
                                                        >
                                                            No se encontraron
                                                            usuarios con esa
                                                            búsqueda.
                                                        </td>
                                                    </tr>
                                                ) : null}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                                        <p className="text-sm font-semibold text-slate-500">
                                            Mostrando {paginatedUsers.length} de{" "}
                                            {filteredUsers.length} usuarios
                                        </p>

                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setUserCurrentPage((page) =>
                                                        Math.max(1, page - 1),
                                                    )
                                                }
                                                disabled={activeUserPage === 1}
                                                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                Anterior
                                            </button>

                                            <span className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700">
                                                Página {activeUserPage} de{" "}
                                                {userTotalPages}
                                            </span>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setUserCurrentPage((page) =>
                                                        Math.min(
                                                            userTotalPages,
                                                            page + 1,
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
                        </div>
                    </div>
                </div>
            ) : null}

            {isEditModalOpen && editingEnrollment ? (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
                    onClick={closeEditModal}
                >
                    <div
                        className="w-full max-w-xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="bg-gradient-to-br from-[#07111F] via-[#172861] to-[#F97316] px-6 py-5 text-white">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-100">
                                        Editar asignación
                                    </p>
                                    <h2 className="mt-2 text-2xl font-bold">
                                        Actualizar docente
                                    </h2>
                                    <p className="mt-1 text-sm text-blue-50">
                                        {getTeacherName(editingEnrollment)}
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={closeEditModal}
                                    className="rounded-2xl bg-white/15 px-4 py-2 text-sm font-bold text-white ring-1 ring-white/20 transition hover:bg-white/25"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleUpdateAssignment}>
                            <div className="space-y-4 p-6">
                                <div>
                                    <label className="mb-2 block text-sm font-bold text-slate-700">
                                        Curso asignado
                                    </label>
                                    <select
                                        value={editForm.courseId}
                                        onChange={(event) =>
                                            setEditForm((current) => ({
                                                ...current,
                                                courseId: event.target.value,
                                            }))
                                        }
                                        className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                    >
                                        <option value="">
                                            Selecciona un curso
                                        </option>
                                        {courses.map((course) => (
                                            <option
                                                key={course.id}
                                                value={course.id}
                                            >
                                                {course.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-bold text-slate-700">
                                        Estado
                                    </label>
                                    <select
                                        value={editForm.status}
                                        onChange={(event) =>
                                            setEditForm((current) => ({
                                                ...current,
                                                status: event.target.value as
                                                    | "accepted"
                                                    | "pending",
                                            }))
                                        }
                                        className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                    >
                                        <option value="accepted">
                                            Aceptado
                                        </option>
                                        <option value="pending">
                                            Pendiente
                                        </option>
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-bold text-slate-700">
                                        Comentario
                                    </label>
                                    <textarea
                                        rows={4}
                                        value={editForm.comment}
                                        onChange={(event) =>
                                            setEditForm((current) => ({
                                                ...current,
                                                comment: event.target.value,
                                            }))
                                        }
                                        placeholder="Comentario opcional"
                                        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
                                <button
                                    type="button"
                                    onClick={closeEditModal}
                                    className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSavingEdit}
                                    className="rounded-2xl bg-[#172861] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#0B163F] disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {isSavingEdit
                                        ? "Guardando..."
                                        : "Guardar cambios"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}
        </>
    );
}
