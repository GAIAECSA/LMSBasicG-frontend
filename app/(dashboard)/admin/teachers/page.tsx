"use client";

import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type FormEvent,
} from "react";
import {
    AlertTriangle,
    Check,
    ChevronLeft,
    ChevronRight,
    LoaderCircle,
    Pencil,
    Plus,
    RefreshCw,
    Search,
    Trash2,
    UserPlus,
    X,
} from "lucide-react";

import { AthenaLoadingBackground } from "@/components/ui/AthenaLoadingBackground";
import { notify } from "@/lib/notify";
import { getAllCourses, type Course } from "@/services/courses.service";
import {
    createEnrollment,
    deleteEnrollment,
    getEnrollmentsByRole,
    getEnrollmentsByUser,
    updateEnrollment,
    type Enrollment,
} from "@/services/enrollments.service";
import { getAllUsers, type User } from "@/services/users.service";

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
    const fullName = `${item.user.firstname ?? ""} ${item.user.lastname ?? ""
        }`.trim();

    return fullName || `Usuario #${item.user.id}`;
}

function getUserName(user: User): string {
    const fullName = `${user.firstname ?? ""} ${user.lastname ?? ""
        }`.trim();

    return fullName || user.username || `Usuario #${user.id}`;
}

function getAcceptedBadgeClass(accepted: boolean | null): string {
    return accepted === true
        ? "bg-emerald-100 text-emerald-700"
        : "bg-orange-100 text-orange-700";
}

export default function TeachersPage() {
    const [teacherEnrollments, setTeacherEnrollments] = useState<Enrollment[]>(
        [],
    );
    const [courses, setCourses] = useState<Course[]>([]);
    const [users, setUsers] = useState<User[]>([]);

    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

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

    const [removeCandidate, setRemoveCandidate] = useState<Enrollment | null>(
        null,
    );
    const [isRemoving, setIsRemoving] = useState(false);

    const refreshInProgressRef = useRef(false);
    const assignInProgressRef = useRef(false);
    const editInProgressRef = useRef(false);
    const removeInProgressRef = useRef(false);

    const loadData = useCallback(async (manualRefresh = false) => {
        if (manualRefresh && refreshInProgressRef.current) return;

        if (manualRefresh) {
            refreshInProgressRef.current = true;
            setIsRefreshing(true);
        } else {
            setIsLoading(true);
        }

        setErrorMessage("");

        const toastId = manualRefresh
            ? notify.loading(
                "Actualizando docentes...",
                "Estamos consultando asignaciones, cursos y usuarios.",
            )
            : null;

        try {
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

                    return loadedCourses[0] ? String(loadedCourses[0].id) : "";
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
                setUsers(Array.isArray(usersResult.value) ? usersResult.value : []);
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
                const message = errors.join(" ");

                setErrorMessage(message);

                if (toastId !== null) notify.dismiss(toastId);

                notify.error(
                    manualRefresh
                        ? "No se pudo actualizar la lista."
                        : "No se pudo cargar la gestión de docentes.",
                    message,
                );

                return;
            }

            if (toastId !== null) {
                notify.dismiss(toastId);
                notify.success(
                    "Docentes actualizados.",
                    "La lista de asignaciones se encuentra al día.",
                );
            }
        } catch (error) {
            const message = getErrorMessage(
                error,
                "No se pudo cargar la información de docentes.",
            );

            setErrorMessage(message);

            if (toastId !== null) notify.dismiss(toastId);

            notify.error(
                manualRefresh
                    ? "No se pudo actualizar la lista."
                    : "No se pudo cargar la gestión de docentes.",
                message,
            );
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
            refreshInProgressRef.current = false;
        }
    }, []);

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
                (user.username ?? "").toLowerCase().includes(term) ||
                (user.email ?? "").toLowerCase().includes(term) ||
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
        setErrorMessage("");
        setIsAssignModalOpen(true);
    }

    function closeAssignModal() {
        if (assigningUserId !== null) return;

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
        setErrorMessage("");
        setIsEditModalOpen(true);
    }

    function resetEditModal() {
        setIsEditModalOpen(false);
        setEditingEnrollment(null);
        setEditForm(initialEditAssignmentForm);
    }

    function closeEditModal() {
        if (isSavingEdit) return;

        resetEditModal();
    }

    async function handleAssignTeacher(user: User) {
        const courseId = Number(selectedCourseId);

        if (assignInProgressRef.current || assigningUserId !== null) return;

        if (!courseId || courseId <= 0) {
            notify.warning(
                "Selecciona un curso.",
                "Debes elegir el curso antes de asignar un docente.",
            );
            return;
        }

        if (assignedTeacherUserIds.has(user.id)) {
            notify.warning(
                "Asignación existente.",
                "El usuario ya está asignado como docente en este curso.",
            );
            return;
        }

        assignInProgressRef.current = true;
        setAssigningUserId(user.id);
        setErrorMessage("");

        const toastId = notify.loading(
            "Asignando docente...",
            `Estamos registrando a ${getUserName(user)} en el curso seleccionado.`,
        );

        try {
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

            notify.dismiss(toastId);
            notify.success(
                "Docente asignado.",
                `${getUserName(user)} fue asignado correctamente al curso.`,
            );
        } catch (error) {
            const message = getErrorMessage(
                error,
                "No se pudo asignar el docente.",
            );

            setErrorMessage(message);
            notify.dismiss(toastId);
            notify.error("No se pudo asignar el docente.", message);
        } finally {
            assignInProgressRef.current = false;
            setAssigningUserId(null);
        }
    }

    async function handleUpdateAssignment(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (editInProgressRef.current || isSavingEdit) return;

        if (!editingEnrollment) {
            notify.error(
                "No se encontró la asignación.",
                "Cierra el formulario e intenta nuevamente.",
            );
            return;
        }

        const courseId = Number(editForm.courseId);

        if (!courseId || courseId <= 0) {
            notify.warning(
                "Selecciona un curso.",
                "Debes elegir el curso asignado al docente.",
            );
            return;
        }

        const duplicatedAssignment = teacherEnrollments.some(
            (item) =>
                item.id !== editingEnrollment.id &&
                item.user.id === editingEnrollment.user.id &&
                item.course.id === courseId,
        );

        if (duplicatedAssignment) {
            notify.warning(
                "Asignación duplicada.",
                "El docente ya tiene una asignación registrada en ese curso.",
            );
            return;
        }

        editInProgressRef.current = true;
        setIsSavingEdit(true);
        setErrorMessage("");

        const toastId = notify.loading(
            "Actualizando asignación...",
            "Estamos guardando los cambios del docente.",
        );

        try {
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

            resetEditModal();
            notify.dismiss(toastId);
            notify.success(
                "Asignación actualizada.",
                "Los cambios del docente se guardaron correctamente.",
            );
        } catch (error) {
            const message = getErrorMessage(
                error,
                "No se pudo actualizar la asignación.",
            );

            setErrorMessage(message);
            notify.dismiss(toastId);
            notify.error("No se pudo actualizar la asignación.", message);
        } finally {
            editInProgressRef.current = false;
            setIsSavingEdit(false);
        }
    }

    function openRemoveModal(item: Enrollment) {
        if (isRemoving) return;

        setRemoveCandidate(item);
    }

    function closeRemoveModal() {
        if (isRemoving) return;

        setRemoveCandidate(null);
    }

    async function confirmRemoveAssignment() {
        if (
            !removeCandidate ||
            isRemoving ||
            removeInProgressRef.current
        ) {
            return;
        }

        removeInProgressRef.current = true;
        setIsRemoving(true);
        setErrorMessage("");

        const teacherName = getTeacherName(removeCandidate);
        const courseName = removeCandidate.course.name;

        const toastId = notify.loading(
            "Quitando asignación...",
            `Estamos quitando a ${teacherName} del curso ${courseName}.`,
        );

        try {
            await deleteEnrollment(removeCandidate.id);

            setTeacherEnrollments((current) =>
                current.filter((item) => item.id !== removeCandidate.id),
            );

            setRemoveCandidate(null);
            notify.dismiss(toastId);
            notify.success(
                "Asignación eliminada.",
                `${teacherName} ya no está asignado al curso ${courseName}.`,
            );
        } catch (error) {
            const message = getErrorMessage(
                error,
                "No se pudo quitar la asignación del docente.",
            );

            setErrorMessage(message);
            notify.dismiss(toastId);
            notify.error("No se pudo quitar la asignación.", message);
        } finally {
            removeInProgressRef.current = false;
            setIsRemoving(false);
        }
    }

    if (isLoading) {
        return (
            <AthenaLoadingBackground
                className="max-w-[1450px]"
                contentClassName="flex min-h-[calc(100dvh-150px)] items-center justify-center"
            >
                <div
                    role="status"
                    aria-live="polite"
                    aria-label="Cargando docentes"
                    className="flex min-h-[240px] w-full max-w-xl flex-col items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--card)]/80 px-5 py-6 text-center shadow-sm backdrop-blur-[3px] sm:min-h-[300px] sm:rounded-[28px] sm:px-7 sm:py-8"
                >
                    <LoaderCircle className="h-8 w-8 animate-spin text-[var(--primary)] sm:h-9 sm:w-9" />

                    <p className="mt-4 text-sm font-black text-[var(--foreground)] sm:text-base">
                        Cargando docentes asignados
                    </p>

                    <p className="mt-1.5 text-xs font-semibold leading-5 text-[var(--muted-foreground)] sm:text-sm">
                        Estamos preparando asignaciones, cursos y usuarios...
                    </p>
                </div>
            </AthenaLoadingBackground>
        );
    }

    return (
        <>
            <section className="min-w-0 space-y-4 sm:space-y-5 lg:space-y-6 [@media(max-height:760px)]:space-y-4 [&_button:not(:disabled)]:cursor-pointer [&_button:not(:disabled)]:select-none [&_button:not(:disabled)]:transition-all [&_button:not(:disabled)]:duration-150 [&_button:not(:disabled)]:ease-out [&_button:not(:disabled):active]:translate-y-px [&_button:not(:disabled):active]:scale-[0.97] [&_button:not(:disabled):active]:brightness-95 [&_button:not(:disabled):active]:shadow-inner">
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#07111F] via-[#172861] via-70% to-[#F97316] p-4 text-white shadow-lg sm:rounded-3xl sm:p-5 lg:p-6 [@media(max-height:760px)]:p-4">
                    <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-start 2xl:justify-between">
                        <div className="min-w-0">
                            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-blue-100 sm:text-xs sm:tracking-[0.22em] lg:text-sm lg:tracking-[0.25em]">
                                Gestión de docentes
                            </p>

                            <h2 className="mt-2 text-xl font-bold leading-tight sm:text-2xl lg:mt-3 lg:text-3xl [@media(max-height:760px)]:text-xl">
                                Docentes asignados
                            </h2>

                            <p className="mt-2 max-w-2xl text-xs leading-5 text-blue-50 sm:text-sm sm:leading-6">
                                Selecciona un curso, asigna sus docentes y
                                administra las relaciones existentes sin
                                eliminar las cuentas de usuario.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3 2xl:min-w-[620px]">
                            <StatsCard label="Asignaciones" value={stats.total} />
                            <StatsCard label="Docentes" value={stats.uniqueTeachers} />
                            <StatsCard label="Cursos" value={stats.assignedCourses} />
                            <StatsCard
                                label="Aceptados"
                                value={stats.acceptedEnrollments}
                            />
                        </div>
                    </div>
                </div>

                {errorMessage ? (
                    <div
                        role="alert"
                        aria-live="assertive"
                        className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold leading-5 text-red-700 shadow-sm sm:rounded-2xl sm:px-5 sm:py-4 sm:text-sm"
                    >
                        <p className="font-black">
                            No se pudo completar la operación.
                        </p>

                        <p className="mt-0.5 break-words">{errorMessage}</p>
                    </div>
                ) : null}

                <div className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm sm:rounded-3xl sm:p-5 [@media(max-height:760px)]:p-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="min-w-0">
                            <h3 className="text-base font-bold text-slate-950 sm:text-lg">
                                Lista de docentes
                            </h3>

                            <p className="mt-1 text-xs leading-5 text-[var(--muted-foreground)] sm:text-sm">
                                Busca por docente, curso, rol o identificador
                                de la asignación.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-2 xs:grid-cols-2 sm:gap-3">
                            <button
                                type="button"
                                onClick={openAssignModal}
                                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#172861] px-3 text-xs font-bold text-white shadow-sm hover:bg-[#0B163F] sm:h-11 sm:px-4 sm:text-sm lg:px-5"
                            >
                                <UserPlus className="h-4 w-4" aria-hidden="true" />
                                Asignar docente
                            </button>

                            <button
                                type="button"
                                onClick={() => void loadData(true)}
                                disabled={isRefreshing}
                                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-3 text-xs font-bold text-white shadow-sm hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60 sm:h-11 sm:px-4 sm:text-sm lg:px-5"
                            >
                                <RefreshCw
                                    className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""
                                        }`}
                                    aria-hidden="true"
                                />
                                {isRefreshing ? "Actualizando..." : "Actualizar"}
                            </button>
                        </div>
                    </div>

                    <label className="relative mt-4 block w-full lg:max-w-[520px] sm:mt-5 [@media(max-height:760px)]:mt-3">
                        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                        <input
                            value={search}
                            onChange={(event) => {
                                setSearch(event.target.value);
                                setCurrentPage(1);
                            }}
                            placeholder="Buscar por docente, curso, rol o ID"
                            className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-xs font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:h-11 sm:pr-4 sm:text-sm"
                        />
                    </label>
                </div>

                <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm sm:rounded-3xl">
                    <div className="xl:hidden">
                        {filteredTeachers.length === 0 ? (
                            <EmptyTeachersState />
                        ) : (
                            <div className="grid gap-px bg-slate-100 sm:grid-cols-2">
                                {paginatedTeachers.map((item) => (
                                    <article
                                        key={item.id}
                                        className="min-w-0 space-y-3 bg-white p-4"
                                    >
                                        <TeacherIdentity item={item} showCourse />

                                        <div className="flex flex-wrap gap-2">
                                            <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-[11px] font-bold text-blue-700">
                                                {item.role.name}
                                            </span>

                                            <AcceptedBadge accepted={item.accepted} />
                                        </div>

                                        <div className="rounded-xl bg-slate-50 px-3 py-2.5">
                                            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                                Comentario
                                            </p>

                                            <p className="mt-1 line-clamp-2 break-words text-xs font-medium leading-5 text-slate-600 sm:text-sm">
                                                {item.comment || "Sin comentario"}
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                type="button"
                                                onClick={() => openEditModal(item)}
                                                className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-blue-200 px-3 text-xs font-bold text-blue-700 hover:bg-blue-50"
                                            >
                                                <Pencil className="h-4 w-4" aria-hidden="true" />
                                                Editar
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => openRemoveModal(item)}
                                                className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-red-200 px-3 text-xs font-bold text-red-600 hover:bg-red-50"
                                            >
                                                <Trash2 className="h-4 w-4" aria-hidden="true" />
                                                Quitar
                                            </button>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="hidden overflow-x-auto xl:block">
                        <table className="w-full min-w-[940px] table-fixed divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <TableHeader className="w-[24%]">Docente</TableHeader>
                                    <TableHeader className="w-[27%] 2xl:w-[24%]">
                                        Curso asignado
                                    </TableHeader>
                                    <TableHeader className="w-[12%] text-center">
                                        Rol
                                    </TableHeader>
                                    <TableHeader className="w-[13%] text-center">
                                        Estado
                                    </TableHeader>
                                    <TableHeader className="hidden 2xl:table-cell 2xl:w-[19%]">
                                        Comentario
                                    </TableHeader>
                                    <TableHeader className="w-[24%] text-right 2xl:w-[17%]">
                                        Acciones
                                    </TableHeader>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">
                                {filteredTeachers.length === 0 ? (
                                    <tr>
                                        <td colSpan={6}>
                                            <EmptyTeachersState />
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedTeachers.map((item) => (
                                        <tr
                                            key={item.id}
                                            className="transition hover:bg-blue-50/40"
                                        >
                                            <td className="px-4 py-3">
                                                <TeacherIdentity item={item} />
                                            </td>

                                            <td className="px-4 py-3">
                                                <p
                                                    className="line-clamp-2 text-sm font-semibold text-slate-800"
                                                    title={item.course.name}
                                                >
                                                    {item.course.name}
                                                </p>

                                                <p className="mt-1 line-clamp-1 text-xs font-medium text-slate-500 2xl:hidden">
                                                    {item.comment || "Sin comentario"}
                                                </p>
                                            </td>

                                            <td className="px-4 py-3 text-center">
                                                <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                                                    {item.role.name}
                                                </span>
                                            </td>

                                            <td className="px-4 py-3 text-center">
                                                <AcceptedBadge accepted={item.accepted} />
                                            </td>

                                            <td className="hidden px-4 py-3 text-sm font-medium text-slate-500 2xl:table-cell">
                                                <p
                                                    className="line-clamp-2 break-words"
                                                    title={item.comment || "Sin comentario"}
                                                >
                                                    {item.comment || "Sin comentario"}
                                                </p>
                                            </td>

                                            <td className="px-4 py-3">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        title="Editar asignación"
                                                        aria-label={`Editar asignación de ${getTeacherName(
                                                            item,
                                                        )}`}
                                                        onClick={() => openEditModal(item)}
                                                        className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-blue-200 px-3 text-xs font-bold text-blue-700 hover:bg-blue-50 2xl:px-4"
                                                    >
                                                        <Pencil className="h-4 w-4" aria-hidden="true" />
                                                        <span className="hidden 2xl:inline">
                                                            Editar
                                                        </span>
                                                    </button>

                                                    <button
                                                        type="button"
                                                        title="Quitar docente"
                                                        aria-label={`Quitar a ${getTeacherName(
                                                            item,
                                                        )} del curso`}
                                                        onClick={() => openRemoveModal(item)}
                                                        className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-red-200 px-3 text-xs font-bold text-red-600 hover:bg-red-50 2xl:px-4"
                                                    >
                                                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                                                        <span className="hidden 2xl:inline">
                                                            Quitar
                                                        </span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <Pager
                        label={`${paginatedTeachers.length} de ${filteredTeachers.length} asignaciones`}
                        page={activePage}
                        totalPages={totalPages}
                        onPrevious={() =>
                            setCurrentPage((page) => Math.max(1, page - 1))
                        }
                        onNext={() =>
                            setCurrentPage((page) =>
                                Math.min(totalPages, page + 1),
                            )
                        }
                    />
                </div>
            </section>

            {isAssignModalOpen ? (
                <div
                    className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 backdrop-blur-sm sm:items-center sm:p-3 lg:p-4"
                    onClick={closeAssignModal}
                >
                    <div
                        className="flex max-h-[96dvh] w-full max-w-6xl flex-col overflow-hidden rounded-t-3xl border border-slate-200 bg-white shadow-2xl sm:max-h-[92dvh] sm:rounded-3xl [@media(max-height:760px)]:max-h-[97dvh]"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <ModalHeader
                            eyebrow="Nueva asignación"
                            title="Asignar docente a un curso"
                            description="Primero selecciona el curso y luego el usuario que actuará como profesor."
                            onClose={closeAssignModal}
                            closeDisabled={assigningUserId !== null}
                        />

                        <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 p-3 sm:p-4 lg:p-5 [@media(max-height:760px)]:p-3">
                            <div className="space-y-3 sm:space-y-4">
                                <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:rounded-2xl sm:p-4">
                                    <div className="grid gap-3 md:grid-cols-2 md:gap-4">
                                        <div>
                                            <label className="mb-1.5 block text-xs font-bold text-slate-700 sm:mb-2 sm:text-sm">
                                                Curso
                                                {!selectedCourseId ? (
                                                    <span className="ml-1 text-red-600">*</span>
                                                ) : null}
                                            </label>

                                            <select
                                                value={selectedCourseId}
                                                onChange={(event) => {
                                                    setSelectedCourseId(event.target.value);
                                                    setUserCurrentPage(1);
                                                }}
                                                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:h-11 sm:text-sm"
                                            >
                                                <option value="">Selecciona un curso</option>
                                                {courses.map((course) => (
                                                    <option key={course.id} value={course.id}>
                                                        {course.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="mb-1.5 block text-xs font-bold text-slate-700 sm:mb-2 sm:text-sm">
                                                Buscar usuario
                                            </label>

                                            <label className="relative block">
                                                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                                                <input
                                                    value={userSearch}
                                                    onChange={(event) => {
                                                        setUserSearch(event.target.value);
                                                        setUserCurrentPage(1);
                                                    }}
                                                    placeholder="Nombre, correo, usuario o departamento"
                                                    className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-xs font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:h-11 sm:pr-4 sm:text-sm"
                                                />
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm sm:rounded-2xl">
                                    <div className="md:hidden">
                                        {paginatedUsers.length === 0 ? (
                                            <EmptyUsersState />
                                        ) : (
                                            <div className="divide-y divide-slate-100">
                                                {paginatedUsers.map((user) => (
                                                    <UserAssignCard
                                                        key={user.id}
                                                        user={user}
                                                        isAssigned={assignedTeacherUserIds.has(
                                                            user.id,
                                                        )}
                                                        isAssigning={
                                                            assigningUserId === user.id
                                                        }
                                                        courseSelected={Boolean(
                                                            selectedCourseId,
                                                        )}
                                                        onAssign={() =>
                                                            void handleAssignTeacher(user)
                                                        }
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="hidden overflow-x-auto md:block">
                                        <table className="w-full min-w-[760px] table-fixed divide-y divide-slate-200 text-sm">
                                            <thead className="bg-slate-50">
                                                <tr>
                                                    <TableHeader className="w-[29%] lg:w-[26%]">
                                                        Usuario
                                                    </TableHeader>
                                                    <TableHeader className="w-[30%] lg:w-[28%]">
                                                        Correo
                                                    </TableHeader>
                                                    <TableHeader className="hidden w-[18%] lg:table-cell">
                                                        Departamento
                                                    </TableHeader>
                                                    <TableHeader className="w-[21%] text-center lg:w-[15%]">
                                                        Estado
                                                    </TableHeader>
                                                    <TableHeader className="w-[20%] text-center lg:w-[15%]">
                                                        Acción
                                                    </TableHeader>
                                                </tr>
                                            </thead>

                                            <tbody className="divide-y divide-slate-100">
                                                {paginatedUsers.map((user) => {
                                                    const fullName = getUserName(user);
                                                    const isAssigned =
                                                        assignedTeacherUserIds.has(
                                                            user.id,
                                                        );
                                                    const isAssigning =
                                                        assigningUserId === user.id;

                                                    return (
                                                        <tr
                                                            key={user.id}
                                                            className="transition hover:bg-blue-50/40"
                                                        >
                                                            <td className="px-4 py-3">
                                                                <UserIdentity user={user} />
                                                            </td>

                                                            <td className="px-4 py-3">
                                                                <p
                                                                    className="truncate font-semibold text-slate-700"
                                                                    title={user.email}
                                                                >
                                                                    {user.email}
                                                                </p>
                                                                <p className="mt-0.5 truncate text-xs font-medium text-slate-500 lg:hidden">
                                                                    {user.departament ||
                                                                        "Sin departamento"}
                                                                </p>
                                                            </td>

                                                            <td className="hidden px-4 py-3 font-semibold text-slate-500 lg:table-cell">
                                                                <p className="truncate">
                                                                    {user.departament ||
                                                                        "Sin departamento"}
                                                                </p>
                                                            </td>

                                                            <td className="px-4 py-3 text-center">
                                                                <AvailabilityBadge
                                                                    isAssigned={isAssigned}
                                                                />
                                                            </td>

                                                            <td className="px-4 py-3 text-center">
                                                                <AssignButton
                                                                    isAssigned={isAssigned}
                                                                    isAssigning={isAssigning}
                                                                    courseSelected={Boolean(
                                                                        selectedCourseId,
                                                                    )}
                                                                    onAssign={() =>
                                                                        void handleAssignTeacher(
                                                                            user,
                                                                        )
                                                                    }
                                                                    compact
                                                                />
                                                            </td>
                                                        </tr>
                                                    );
                                                })}

                                                {paginatedUsers.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={5}>
                                                            <EmptyUsersState />
                                                        </td>
                                                    </tr>
                                                ) : null}
                                            </tbody>
                                        </table>
                                    </div>

                                    <Pager
                                        label={`${paginatedUsers.length} de ${filteredUsers.length} usuarios`}
                                        page={activeUserPage}
                                        totalPages={userTotalPages}
                                        onPrevious={() =>
                                            setUserCurrentPage((page) =>
                                                Math.max(1, page - 1),
                                            )
                                        }
                                        onNext={() =>
                                            setUserCurrentPage((page) =>
                                                Math.min(userTotalPages, page + 1),
                                            )
                                        }
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}

            {isEditModalOpen && editingEnrollment ? (
                <div
                    className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 backdrop-blur-sm sm:items-center sm:p-4"
                    onClick={closeEditModal}
                >
                    <div
                        className="flex max-h-[96dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl border border-slate-200 bg-white shadow-2xl sm:max-h-[92dvh] sm:rounded-3xl [@media(max-height:760px)]:max-h-[97dvh]"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <ModalHeader
                            eyebrow="Editar asignación"
                            title="Actualizar docente"
                            description={getTeacherName(editingEnrollment)}
                            onClose={closeEditModal}
                            closeDisabled={isSavingEdit}
                        />

                        <form
                            onSubmit={handleUpdateAssignment}
                            className="flex min-h-0 flex-1 flex-col"
                        >
                            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4 sm:space-y-4 sm:p-6 [@media(max-height:760px)]:p-4">
                                <div>
                                    <label className="mb-1.5 block text-xs font-bold text-slate-700 sm:mb-2 sm:text-sm">
                                        Curso asignado
                                        {!editForm.courseId ? (
                                            <span className="ml-1 text-red-600">*</span>
                                        ) : null}
                                    </label>

                                    <select
                                        value={editForm.courseId}
                                        onChange={(event) =>
                                            setEditForm((current) => ({
                                                ...current,
                                                courseId: event.target.value,
                                            }))
                                        }
                                        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:h-11 sm:text-sm"
                                    >
                                        <option value="">Selecciona un curso</option>
                                        {courses.map((course) => (
                                            <option key={course.id} value={course.id}>
                                                {course.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-xs font-bold text-slate-700 sm:mb-2 sm:text-sm">
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
                                        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:h-11 sm:text-sm"
                                    >
                                        <option value="accepted">Aceptado</option>
                                        <option value="pending">Pendiente</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-xs font-bold text-slate-700 sm:mb-2 sm:text-sm">
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
                                        className="w-full resize-y rounded-xl border border-slate-200 px-3 py-3 text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:px-4 sm:text-sm"
                                    />
                                </div>
                            </div>

                            <div className="grid shrink-0 grid-cols-1 gap-2 border-t border-slate-200 bg-slate-50 px-4 py-3 sm:grid-cols-2 sm:px-6 sm:py-4">
                                <button
                                    type="button"
                                    onClick={closeEditModal}
                                    disabled={isSavingEdit}
                                    className="h-10 rounded-xl border border-slate-200 bg-white px-5 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 sm:h-11 sm:text-sm"
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="submit"
                                    disabled={isSavingEdit}
                                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#172861] px-5 text-xs font-bold text-white hover:bg-[#0B163F] disabled:cursor-not-allowed disabled:opacity-60 sm:h-11 sm:text-sm"
                                >
                                    {isSavingEdit ? (
                                        <LoaderCircle
                                            className="h-4 w-4 animate-spin"
                                            aria-hidden="true"
                                        />
                                    ) : null}

                                    {isSavingEdit ? "Guardando..." : "Guardar cambios"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}

            {removeCandidate ? (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="remove-teacher-title"
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-[2px]"
                >
                    <div className="w-full max-w-md overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-2xl">
                        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
                            <div className="flex min-w-0 items-start gap-3">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                                    <AlertTriangle className="h-5 w-5" />
                                </div>

                                <div className="min-w-0">
                                    <h2
                                        id="remove-teacher-title"
                                        className="text-base font-black text-slate-950 sm:text-lg"
                                    >
                                        Quitar asignación
                                    </h2>

                                    <p className="mt-1 text-xs font-semibold leading-5 text-slate-500 sm:text-sm">
                                        La cuenta del usuario no será eliminada.
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={closeRemoveModal}
                                disabled={isRemoving}
                                aria-label="Cerrar confirmación"
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="px-5 py-5 sm:px-6">
                            <p className="text-sm font-semibold leading-6 text-slate-600">
                                ¿Seguro que deseas quitar a{" "}
                                <span className="font-black text-slate-950">
                                    {getTeacherName(removeCandidate)}
                                </span>{" "}
                                del curso{" "}
                                <span className="font-black text-slate-950">
                                    {removeCandidate.course.name}
                                </span>
                                ?
                            </p>

                            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={closeRemoveModal}
                                    disabled={isRemoving}
                                    className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 sm:h-11 sm:px-5 sm:text-sm"
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="button"
                                    onClick={() => void confirmRemoveAssignment()}
                                    disabled={isRemoving}
                                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-xs font-black text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60 sm:h-11 sm:px-5 sm:text-sm"
                                >
                                    {isRemoving ? (
                                        <LoaderCircle className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Trash2 className="h-4 w-4" />
                                    )}

                                    {isRemoving ? "Quitando..." : "Quitar docente"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}
        </>
    );
}

function StatsCard({ label, value }: { label: string; value: number }) {
    return (
        <div className="rounded-xl bg-white/15 p-3 ring-1 ring-white/20 sm:rounded-2xl sm:p-4 [@media(max-height:760px)]:p-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-white/75 sm:text-xs">
                {label}
            </p>

            <p className="mt-1 text-2xl font-bold sm:mt-2 sm:text-3xl [@media(max-height:760px)]:text-2xl">
                {value}
            </p>
        </div>
    );
}

function TableHeader({
    children,
    className = "",
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <th
            className={`${className} px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-600`}
        >
            {children}
        </th>
    );
}

function TeacherIdentity({
    item,
    showCourse = false,
}: {
    item: Enrollment;
    showCourse?: boolean;
}) {
    const teacherName = getTeacherName(item);

    return (
        <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#172861] text-sm font-bold text-white">
                {teacherName.charAt(0).toUpperCase()}
            </div>

            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-slate-950" title={teacherName}>
                    {teacherName}
                </p>

                {showCourse ? (
                    <p
                        className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-slate-700 sm:text-sm"
                        title={item.course.name}
                    >
                        {item.course.name}
                    </p>
                ) : null}
            </div>
        </div>
    );
}

function UserIdentity({ user }: { user: User }) {
    const fullName = getUserName(user);

    return (
        <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#172861] text-sm font-bold text-white">
                {fullName.charAt(0).toUpperCase()}
            </div>

            <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-950" title={fullName}>
                    {fullName}
                </p>

                <p className="mt-0.5 truncate text-xs font-medium text-slate-500">
                    @{user.username}
                </p>
            </div>
        </div>
    );
}

function AcceptedBadge({ accepted }: { accepted: boolean | null }) {
    return (
        <span
            className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold sm:text-xs ${getAcceptedBadgeClass(
                accepted,
            )}`}
        >
            {accepted === true ? "Aceptado" : "Pendiente"}
        </span>
    );
}

function AvailabilityBadge({ isAssigned }: { isAssigned: boolean }) {
    return (
        <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${isAssigned
                    ? "bg-blue-100 text-blue-700"
                    : "bg-slate-100 text-slate-700"
                }`}
        >
            {isAssigned ? "Docente del curso" : "Disponible"}
        </span>
    );
}

function AssignButton({
    isAssigned,
    isAssigning,
    courseSelected,
    onAssign,
    compact = false,
}: {
    isAssigned: boolean;
    isAssigning: boolean;
    courseSelected: boolean;
    onAssign: () => void;
    compact?: boolean;
}) {
    return (
        <button
            type="button"
            disabled={!courseSelected || isAssigned || isAssigning}
            onClick={onAssign}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-[#172861] px-3 text-xs font-bold text-white hover:bg-[#0B163F] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 xl:px-4"
        >
            {isAssigning ? (
                <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : isAssigned ? (
                <Check className="h-4 w-4" aria-hidden="true" />
            ) : (
                <Plus className="h-4 w-4" aria-hidden="true" />
            )}

            {!compact ? (
                <span>
                    {isAssigning ? "Asignando..." : isAssigned ? "Asignado" : "Asignar"}
                </span>
            ) : (
                <span className="hidden xl:inline">
                    {isAssigning
                        ? "Asignando..."
                        : isAssigned
                            ? "Asignado"
                            : "Seleccionar"}
                </span>
            )}
        </button>
    );
}

function UserAssignCard({
    user,
    isAssigned,
    isAssigning,
    courseSelected,
    onAssign,
}: {
    user: User;
    isAssigned: boolean;
    isAssigning: boolean;
    courseSelected: boolean;
    onAssign: () => void;
}) {
    return (
        <article className="space-y-3 p-3 sm:p-4">
            <UserIdentity user={user} />

            <div className="min-w-0 rounded-xl bg-slate-50 px-3 py-2.5">
                <p className="truncate text-xs font-semibold text-slate-700 sm:text-sm">
                    {user.email}
                </p>

                <p className="mt-1 truncate text-xs font-medium text-slate-500">
                    {user.departament || "Sin departamento"}
                </p>
            </div>

            <div className="flex flex-col gap-2 xs:flex-row xs:items-center xs:justify-between">
                <AvailabilityBadge isAssigned={isAssigned} />

                <AssignButton
                    isAssigned={isAssigned}
                    isAssigning={isAssigning}
                    courseSelected={courseSelected}
                    onAssign={onAssign}
                />
            </div>
        </article>
    );
}

function Pager({
    label,
    page,
    totalPages,
    onPrevious,
    onNext,
}: {
    label: string;
    page: number;
    totalPages: number;
    onPrevious: () => void;
    onNext: () => void;
}) {
    return (
        <div className="flex flex-col gap-3 border-t border-slate-200 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-4">
            <p className="text-center text-xs font-semibold text-slate-500 sm:text-left sm:text-sm">
                Mostrando {label}
            </p>

            <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 sm:flex">
                <button
                    type="button"
                    aria-label="Página anterior"
                    onClick={onPrevious}
                    disabled={page === 1}
                    className="inline-flex h-9 items-center justify-center gap-1 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4 sm:text-sm"
                >
                    <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                    <span className="hidden sm:inline">Anterior</span>
                </button>

                <span className="flex h-9 items-center justify-center whitespace-nowrap rounded-xl bg-slate-100 px-3 text-center text-xs font-bold text-slate-700 sm:px-4 sm:text-sm">
                    Página {page} de {totalPages}
                </span>

                <button
                    type="button"
                    aria-label="Página siguiente"
                    onClick={onNext}
                    disabled={page === totalPages}
                    className="inline-flex h-9 items-center justify-center gap-1 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4 sm:text-sm"
                >
                    <span className="hidden sm:inline">Siguiente</span>
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
            </div>
        </div>
    );
}

function ModalHeader({
    eyebrow,
    title,
    description,
    onClose,
    closeDisabled = false,
}: {
    eyebrow: string;
    title: string;
    description: string;
    onClose: () => void;
    closeDisabled?: boolean;
}) {
    return (
        <div className="shrink-0 bg-gradient-to-br from-[#07111F] via-[#172861] to-[#F97316] px-4 py-3 text-white sm:px-5 sm:py-4 lg:px-6 [@media(max-height:760px)]:py-3">
            <div className="flex items-start justify-between gap-3 sm:gap-4">
                <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-100 sm:text-xs sm:tracking-[0.25em]">
                        {eyebrow}
                    </p>

                    <h2 className="mt-1.5 text-lg font-bold leading-tight sm:mt-2 sm:text-xl lg:text-2xl">
                        {title}
                    </h2>

                    <p className="mt-1 text-xs leading-5 text-blue-50 sm:text-sm">
                        {description}
                    </p>
                </div>

                <button
                    type="button"
                    aria-label="Cerrar modal"
                    onClick={onClose}
                    disabled={closeDisabled}
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white ring-1 ring-white/20 hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:gap-2 sm:px-3 lg:h-10 lg:px-4"
                >
                    <X className="h-4 w-4" aria-hidden="true" />
                    <span className="hidden text-sm font-bold sm:inline">Cerrar</span>
                </button>
            </div>
        </div>
    );
}

function EmptyTeachersState() {
    return (
        <div className="px-4 py-10 text-center">
            <p className="text-sm font-bold text-slate-800">
                No hay docentes para mostrar.
            </p>

            <p className="mt-1 text-sm text-slate-500">
                Presiona Asignar docente para registrar al primer profesor de un curso.
            </p>
        </div>
    );
}

function EmptyUsersState() {
    return (
        <div className="px-4 py-8 text-center text-sm font-semibold text-slate-500">
            No se encontraron usuarios con esa búsqueda.
        </div>
    );
}
