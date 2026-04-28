"use client";

import { useEffect, useMemo, useState } from "react";

import { getAllCourses, type Course } from "@/services/courses.service";
import { getAllUsers, type User } from "@/services/users.service";

import {
    createEnrollment,
    deleteEnrollment,
    getEnrollmentsByRole,
    resolveEnrollmentVoucherUrl,
    updateEnrollment,
    type Enrollment,
} from "@/services/enrollments.service";

const STUDENT_ROLE_ID = 4;

export function EnrollmentsAdminPanel() {

    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [courseId, setCourseId] = useState("");
    const [studentId, setStudentId] = useState("");
    const [accepted, setAccepted] = useState<boolean | null>(null);
    const [referenceCode, setReferenceCode] = useState("");
    const [voucherFile, setVoucherFile] = useState<File | null>(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const [enrollmentModalOpen, setEnrollmentModalOpen] = useState(false);
    const [voucherModalUrl, setVoucherModalUrl] = useState<string | null>(null);
    const [voucherModalTitle, setVoucherModalTitle] = useState("Comprobante");

    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null);

    const [courses, setCourses] = useState<Course[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [courseSearch, setCourseSearch] = useState("");
    const [userSearch, setUserSearch] = useState("");

    async function loadEnrollments() {
        try {
            setError("");

            const [enrollmentsData, coursesData, usersData] = await Promise.all([
                getEnrollmentsByRole(STUDENT_ROLE_ID),
                getAllCourses(),
                getAllUsers(),
            ]);

            setEnrollments(enrollmentsData);
            setCourses(coursesData);
            setUsers(usersData);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "No se pudieron cargar las matrículas.",
            );
        }
    }

    useEffect(() => {
        let isMounted = true;

        const timer = window.setTimeout(() => {
            async function fetchEnrollments() {
                try {
                    const [enrollmentsData, coursesData, usersData] = await Promise.all([
                        getEnrollmentsByRole(STUDENT_ROLE_ID),
                        getAllCourses(),
                        getAllUsers(),
                    ]);

                    if (!isMounted) return;

                    setEnrollments(enrollmentsData);
                    setCourses(coursesData);
                    setUsers(usersData);
                    setError("");
                } catch (err) {
                    if (!isMounted) return;

                    setError(
                        err instanceof Error
                            ? err.message
                            : "No se pudieron cargar las matrículas.",
                    );
                } finally {
                    if (!isMounted) return;
                    setLoading(false);
                }
            }

            void fetchEnrollments();
        }, 0);

        return () => {
            isMounted = false;
            window.clearTimeout(timer);
        };
    }, []);

    function getCourseName(course: Course): string {
        const item = course as Course & { name?: string; title?: string };
        return item.name || item.title || `Curso #${course.id}`;
    }

    function getUserName(user: User): string {
        return `${user.firstname || ""} ${user.lastname || ""}`.trim() || user.username;
    }

    const filteredCourses = useMemo(() => {
        const query = courseSearch.trim().toLowerCase();

        if (!query) return courses;

        return courses.filter((course) =>
            getCourseName(course).toLowerCase().includes(query),
        );
    }, [courses, courseSearch]);

    const filteredUsers = useMemo(() => {
        const query = userSearch.trim().toLowerCase();

        return users
            .filter((user) => user.role_id === 2 || user.role_id === 4)
            .filter((user) => {
                if (!query) return true;

                const fullName = getUserName(user).toLowerCase();
                const email = user.email?.toLowerCase() || "";
                const username = user.username?.toLowerCase() || "";

                return (
                    fullName.includes(query) ||
                    email.includes(query) ||
                    username.includes(query)
                );
            });
    }, [users, userSearch]);

    function openEnrollmentModal() {
        setCourseId("");
        setStudentId("");
        setAccepted(true);
        setReferenceCode("");
        setVoucherFile(null);
        setCourseSearch("");
        setUserSearch("");
        setError("");
        setEnrollmentModalOpen(true);
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError("");

        if (!courseId || !studentId) {
            setError("Debes seleccionar el curso y el usuario.");
            return;
        }

        try {
            setSaving(true);

            await createEnrollment({
                accepted: true,
                reference_code: undefined,
                comment: "",
                user_id: Number(studentId),
                course_id: Number(courseId),
                role_id: STUDENT_ROLE_ID,
                image: null,
            });

            setCourseId("");
            setStudentId("");
            setAccepted(true);
            setReferenceCode("");
            setVoucherFile(null);
            setCourseSearch("");
            setUserSearch("");
            setEnrollmentModalOpen(false);

            await loadEnrollments();
        } catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo matricular.");
        } finally {
            setSaving(false);
        }
    }

    async function handleApprove(enrollment: Enrollment) {
        try {
            setError("");

            const updated = await updateEnrollment(enrollment.id, {
                accepted: true,
                reference_code: enrollment.reference_code,
                comment: enrollment.comment,
                user_id: enrollment.user.id,
                course_id: enrollment.course.id,
                role_id: enrollment.role.id,
            });

            setEnrollments((current) =>
                current.map((item) => (item.id === updated.id ? updated : item)),
            );
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "No se pudo aprobar la matrícula.",
            );
        }
    }

    async function handleRevision(enrollment: Enrollment) {
        try {
            setError("");

            const updated = await updateEnrollment(enrollment.id, {
                accepted: null,
                reference_code: enrollment.reference_code,
                comment: enrollment.comment,
                user_id: enrollment.user.id,
                course_id: enrollment.course.id,
                role_id: enrollment.role.id,
            });

            setEnrollments((current) =>
                current.map((item) => (item.id === updated.id ? updated : item)),
            );
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "No se pudo pasar la matrícula a revisión.",
            );
        }
    }

    async function handleNoApprove() {
        if (!selectedEnrollment) return;

        if (!rejectReason.trim()) {
            setError("Debes ingresar el motivo de no aprobación.");
            return;
        }

        try {
            setError("");

            const updated = await updateEnrollment(selectedEnrollment.id, {
                accepted: false,
                reference_code: selectedEnrollment.reference_code,
                comment: rejectReason.trim(),
                user_id: selectedEnrollment.user.id,
                course_id: selectedEnrollment.course.id,
                role_id: selectedEnrollment.role.id,
            });

            setEnrollments((current) =>
                current.map((item) => (item.id === updated.id ? updated : item)),
            );

            setRejectModalOpen(false);
            setSelectedEnrollment(null);
            setRejectReason("");
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "No se pudo no aprobar la matrícula.",
            );
        }
    }

    async function handleDelete(enrollmentId: number) {
        try {
            setError("");
            await deleteEnrollment(enrollmentId);

            setEnrollments((current) =>
                current.filter((item) => item.id !== enrollmentId),
            );
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "No se pudo eliminar la matrícula.",
            );
        }
    }

    return (
        <section className="space-y-6">
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-slate-950 px-6 py-7">
                    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-200">
                                Administración
                            </p>

                            <h2 className="mt-2 text-2xl font-black text-white md:text-3xl">
                                Gestión de matrículas
                            </h2>

                            <p className="mt-2 max-w-2xl text-sm text-slate-300">
                                Administra matrículas, comprobantes y estados de aprobación.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={openEnrollmentModal}
                            className="inline-flex h-11 items-center justify-center rounded-2xl bg-white px-5 text-sm font-black text-blue-900 shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-50"
                        >
                            Matricular estudiante
                        </button>
                    </div>
                </div>

                <div className="grid gap-4 p-6 md:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                        <p className="text-sm font-semibold text-slate-500">
                            Total matrículas
                        </p>
                        <p className="mt-2 text-3xl font-black text-slate-950">
                            {enrollments.length}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                        <p className="text-sm font-semibold text-emerald-700">
                            Aprobadas
                        </p>
                        <p className="mt-2 text-3xl font-black text-emerald-700">
                            {enrollments.filter((item) => item.accepted).length}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                        <p className="text-sm font-semibold text-amber-700">
                            Pendientes
                        </p>
                        <p className="mt-2 text-3xl font-black text-amber-700">
                            {enrollments.filter((item) => !item.accepted).length}
                        </p>
                    </div>
                </div>
            </div>

            {error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {error}
                </div>
            ) : null}

            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-6 py-5">
                    <h3 className="text-lg font-black text-slate-950">
                        Matrículas registradas
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                        Lista general de estudiantes matriculados.
                    </p>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-5 py-4 text-left font-bold text-slate-700">
                                    Curso
                                </th>
                                <th className="px-5 py-4 text-left font-bold text-slate-700">
                                    Estudiante
                                </th>
                                <th className="px-5 py-4 text-left font-bold text-slate-700">
                                    Código
                                </th>
                                <th className="px-5 py-4 text-left font-bold text-slate-700">
                                    Estado
                                </th>
                                <th className="px-5 py-4 text-left font-bold text-slate-700">
                                    Comprobante
                                </th>
                                <th className="px-5 py-4 text-right font-bold text-slate-700">
                                    Acciones
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading ? (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="px-5 py-10 text-center text-slate-500"
                                    >
                                        Cargando matrículas...
                                    </td>
                                </tr>
                            ) : null}

                            {!loading &&
                                enrollments.map((enrollment) => {
                                    const voucherUrl = resolveEnrollmentVoucherUrl(
                                        enrollment.voucher_url,
                                    );

                                    return (
                                        <tr
                                            key={enrollment.id}
                                            className="border-t border-slate-100 transition hover:bg-slate-50"
                                        >
                                            <td className="px-5 py-4 font-semibold text-slate-800">
                                                {enrollment.course.name}
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-sm font-black text-blue-700 ring-1 ring-blue-100">
                                                        {enrollment.user.firstname?.charAt(0)}
                                                        {enrollment.user.lastname?.charAt(0)}
                                                    </div>

                                                    <div>
                                                        <p className="font-bold text-slate-900">
                                                            {enrollment.user.firstname}{" "}
                                                            {enrollment.user.lastname}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-5 py-4 text-slate-700">
                                                {enrollment.reference_code || "—"}
                                            </td>

                                            <td className="px-5 py-4">
                                                <span
                                                    className={`inline-flex rounded-full px-3 py-1 text-xs font-black ring-1 ${enrollment.accepted === true
                                                        ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                                                        : enrollment.accepted === false
                                                            ? "bg-red-50 text-red-700 ring-red-200"
                                                            : "bg-amber-50 text-amber-700 ring-amber-200"
                                                        }`}
                                                >
                                                    {enrollment.accepted === true
                                                        ? "Aprobado"
                                                        : enrollment.accepted === false
                                                            ? "No aprobado"
                                                            : "Pendiente"}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4">
                                                {voucherUrl ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setVoucherModalUrl(voucherUrl);
                                                            setVoucherModalTitle(
                                                                `Comprobante - ${enrollment.user.firstname} ${enrollment.user.lastname}`,
                                                            );
                                                        }}
                                                        className="inline-flex h-9 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 px-4 text-xs font-bold text-blue-700 transition hover:bg-blue-100"
                                                    >
                                                        Ver comprobante
                                                    </button>
                                                ) : (
                                                    <span className="text-sm text-slate-400">
                                                        Sin comprobante
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="flex justify-end gap-2">
                                                    {enrollment.accepted ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRevision(enrollment)}
                                                            className="inline-flex h-9 items-center justify-center rounded-xl border border-amber-200 px-4 text-xs font-bold text-amber-700 transition hover:bg-amber-50"
                                                        >
                                                            Pasar a revisión
                                                        </button>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleApprove(enrollment)
                                                            }
                                                            className="inline-flex h-9 items-center justify-center rounded-xl border border-emerald-200 px-4 text-xs font-bold text-emerald-700 transition hover:bg-emerald-50"
                                                        >
                                                            Aprobar
                                                        </button>
                                                    )}

                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedEnrollment(enrollment);
                                                            setRejectReason("");
                                                            setRejectModalOpen(true);
                                                        }}
                                                        className="inline-flex h-9 items-center justify-center rounded-xl border border-red-200 px-4 text-xs font-bold text-red-700 transition hover:bg-red-50"
                                                    >
                                                        No aprobar
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}

                            {!loading && enrollments.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-5 py-12 text-center">
                                        No hay matrículas registradas.
                                    </td>
                                </tr>
                            ) : null}
                        </tbody>
                    </table>
                </div>
            </div>

            {enrollmentModalOpen ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
                    <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                            <div>
                                <h3 className="text-xl font-black text-slate-950">
                                    Matricular estudiante
                                </h3>
                                <p className="mt-1 text-sm text-slate-500">
                                    Busca el curso y el usuario. La matrícula se registrará sin referencia ni comprobante.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setEnrollmentModalOpen(false)}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-xl font-bold text-slate-700 transition hover:bg-slate-200"
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
                            <div className="space-y-5 overflow-y-auto p-6">
                                <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                                    Estado inicial: <span className="font-bold">En revisión</span>.
                                    Referencia: <span className="font-bold">Sin referencia</span>.
                                    Comprobante: <span className="font-bold">Sin archivo</span>.
                                </div>

                                <div className="grid gap-5 lg:grid-cols-2">
                                    <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                        <div>
                                            <label className="block text-[13px] font-bold text-slate-700">
                                                Buscar curso
                                            </label>
                                            <input
                                                value={courseSearch}
                                                onChange={(event) => setCourseSearch(event.target.value)}
                                                placeholder="Escribe el nombre del curso..."
                                                className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                            />
                                        </div>

                                        <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                                            {filteredCourses.map((course) => {
                                                const selected = courseId === String(course.id);

                                                return (
                                                    <button
                                                        key={course.id}
                                                        type="button"
                                                        onClick={() => setCourseId(String(course.id))}
                                                        className={`w-full rounded-2xl border px-4 py-3 text-left transition ${selected
                                                            ? "border-blue-300 bg-blue-50 ring-2 ring-blue-100"
                                                            : "border-slate-200 bg-white hover:bg-slate-50"
                                                            }`}
                                                    >
                                                        <p className="text-sm font-black text-slate-900">
                                                            {getCourseName(course)}
                                                        </p>
                                                    </button>
                                                );
                                            })}

                                            {filteredCourses.length === 0 ? (
                                                <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm text-slate-500">
                                                    No se encontraron cursos.
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>

                                    <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                        <div>
                                            <label className="block text-[13px] font-bold text-slate-700">
                                                Buscar usuario
                                            </label>
                                            <input
                                                value={userSearch}
                                                onChange={(event) => setUserSearch(event.target.value)}
                                                placeholder="Nombre, usuario o correo..."
                                                className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                            />
                                        </div>

                                        <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                                            {filteredUsers.map((user) => {
                                                const selected = studentId === String(user.id);

                                                return (
                                                    <button
                                                        key={user.id}
                                                        type="button"
                                                        onClick={() => setStudentId(String(user.id))}
                                                        className={`w-full rounded-2xl border px-4 py-3 text-left transition ${selected
                                                            ? "border-blue-300 bg-blue-50 ring-2 ring-blue-100"
                                                            : "border-slate-200 bg-white hover:bg-slate-50"
                                                            }`}
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-sm font-black text-blue-700 ring-1 ring-blue-100">
                                                                {user.firstname?.charAt(0)}
                                                                {user.lastname?.charAt(0)}
                                                            </div>

                                                            <div className="min-w-0">
                                                                <p className="truncate text-sm font-black text-slate-900">
                                                                    {getUserName(user)}
                                                                </p>
                                                                <p className="truncate text-xs text-slate-500">
                                                                    {user.email}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </button>
                                                );
                                            })}

                                            {filteredUsers.length === 0 ? (
                                                <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm text-slate-500">
                                                    No se encontraron usuarios.
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm md:grid-cols-2">
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                                            Curso seleccionado
                                        </p>
                                        <p className="mt-1 font-black text-slate-900">
                                            {courses.find((course) => String(course.id) === courseId)
                                                ? getCourseName(
                                                    courses.find(
                                                        (course) => String(course.id) === courseId,
                                                    ) as Course,
                                                )
                                                : "Ninguno"}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                                            Usuario seleccionado
                                        </p>
                                        <p className="mt-1 font-black text-slate-900">
                                            {users.find((user) => String(user.id) === studentId)
                                                ? getUserName(
                                                    users.find(
                                                        (user) => String(user.id) === studentId,
                                                    ) as User,
                                                )
                                                : "Ninguno"}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 border-t border-slate-100 bg-white px-6 py-5">
                                <button
                                    type="button"
                                    onClick={() => setEnrollmentModalOpen(false)}
                                    className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="submit"
                                    disabled={saving || !courseId || !studentId}
                                    className="inline-flex h-11 items-center justify-center rounded-xl bg-blue-600 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {saving ? "Guardando..." : "Matricular"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}

            {voucherModalUrl ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
                    <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                            <div>
                                <h3 className="text-lg font-black text-slate-950">
                                    {voucherModalTitle}
                                </h3>
                                <p className="text-sm text-slate-500">
                                    Vista previa del comprobante registrado.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setVoucherModalUrl(null)}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-xl font-bold text-slate-700 transition hover:bg-slate-200"
                            >
                                ×
                            </button>
                        </div>

                        <div className="h-[75vh] bg-slate-100 p-4">
                            {voucherModalUrl.toLowerCase().includes(".pdf") ? (
                                <iframe
                                    src={voucherModalUrl}
                                    title={voucherModalTitle}
                                    className="h-full w-full rounded-2xl border border-slate-200 bg-white"
                                />
                            ) : (
                                <div className="flex h-full items-center justify-center">
                                    <img
                                        src={voucherModalUrl}
                                        alt={voucherModalTitle}
                                        className="max-h-full max-w-full rounded-2xl object-contain shadow-sm"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 border-t border-slate-200 px-5 py-4">
                            <a
                                href={voucherModalUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                            >
                                Abrir en otra pestaña
                            </a>

                            <button
                                type="button"
                                onClick={() => setVoucherModalUrl(null)}
                                className="inline-flex h-10 items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-bold text-white transition hover:bg-slate-800"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}

            {rejectModalOpen ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
                    <div className="w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                            <div>
                                <h3 className="text-xl font-black text-slate-950">
                                    No aprobar matrícula
                                </h3>
                                <p className="mt-1 text-sm text-slate-500">
                                    Agrega el motivo por el cual esta matrícula no será aprobada.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    setRejectModalOpen(false);
                                    setSelectedEnrollment(null);
                                    setRejectReason("");
                                }}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-xl font-bold text-slate-700 transition hover:bg-slate-200"
                            >
                                ×
                            </button>
                        </div>

                        <div className="space-y-4 p-6">
                            <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                                Estudiante:{" "}
                                <span className="font-bold">
                                    {selectedEnrollment?.user.firstname}{" "}
                                    {selectedEnrollment?.user.lastname}
                                </span>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[13px] font-bold text-slate-700">
                                    Motivo
                                </label>

                                <textarea
                                    value={rejectReason}
                                    onChange={(event) => setRejectReason(event.target.value)}
                                    rows={4}
                                    placeholder="Ej: Comprobante ilegible, datos incorrectos, pago no identificado..."
                                    className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-red-500 focus:ring-4 focus:ring-red-100"
                                />
                            </div>

                            <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setRejectModalOpen(false);
                                        setSelectedEnrollment(null);
                                        setRejectReason("");
                                    }}
                                    className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="button"
                                    onClick={handleNoApprove}
                                    className="inline-flex h-11 items-center justify-center rounded-xl bg-red-600 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-red-700"
                                >
                                    Confirmar no aprobación
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}
        </section>
    );
}   
