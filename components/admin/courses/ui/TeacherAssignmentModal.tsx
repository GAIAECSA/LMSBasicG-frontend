import {
    Check,
    LoaderCircle,
    Plus,
    Search,
    X,
} from "lucide-react";
import type { Course } from "@/services/courses.service";
import type { User } from "@/services/users.service";
import { Pagination } from "./Pagination";
import { getCourseName, getUserFullName } from "../utils";

type TeacherAssignmentModalProps = {
    open: boolean;
    course: Course | null;
    users: User[];
    usersLoading: boolean;
    assignedTeacherUserIds: Set<number>;
    assigningTeacherId: number | null;
    search: string;
    activePage: number;
    totalPages: number;
    totalUsers: number;
    onClose: () => void;
    onSearchChange: (value: string) => void;
    onPrevious: () => void;
    onNext: () => void;
    onToggleTeacher: (user: User, isTeacher: boolean) => void;
};

export function TeacherAssignmentModal({
    open,
    course,
    users,
    usersLoading,
    assignedTeacherUserIds,
    assigningTeacherId,
    search,
    activePage,
    totalPages,
    totalUsers,
    onClose,
    onSearchChange,
    onPrevious,
    onNext,
    onToggleTeacher,
}: TeacherAssignmentModalProps) {
    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 backdrop-blur-sm sm:items-center sm:p-4"
            onClick={onClose}
        >
            <div
                className="flex max-h-[94dvh] w-full max-w-6xl flex-col overflow-hidden rounded-t-3xl border border-slate-200 bg-white shadow-2xl sm:max-h-[90dvh] sm:rounded-3xl [@media(max-height:760px)]:max-h-[96dvh]"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="shrink-0 bg-gradient-to-br from-[#07111F] via-[#172861] to-[#F97316] px-4 py-4 text-white sm:px-6 sm:py-5 [@media(max-height:760px)]:py-3">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-blue-100 sm:text-xs">
                                Asignación de docente
                            </p>

                            <h2 className="mt-1.5 text-xl font-bold sm:text-2xl">
                                Asignar docente
                            </h2>

                            <p className="mt-1 truncate text-xs text-blue-50 sm:text-sm">
                                Curso:{" "}
                                <span className="font-semibold">
                                    {course
                                        ? getCourseName(course)
                                        : "Sin curso seleccionado"}
                                </span>
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white ring-1 ring-white/20 transition hover:bg-white/25 active:scale-[0.97] sm:w-auto sm:gap-2 sm:px-4"
                            aria-label="Cerrar modal"
                        >
                            <X className="h-4 w-4" />
                            <span className="hidden text-sm font-bold sm:inline">
                                Cerrar
                            </span>
                        </button>
                    </div>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 p-3 sm:p-5 [@media(max-height:760px)]:p-3">
                    {usersLoading ? (
                        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm font-semibold text-slate-500">
                            <LoaderCircle className="mx-auto mb-3 h-6 w-6 animate-spin text-blue-700" />
                            Cargando usuarios...
                        </div>
                    ) : (
                        <div className="space-y-3 sm:space-y-4">
                            <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
                                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                    <div>
                                        <p className="text-sm font-bold text-slate-950">
                                            Usuarios disponibles
                                        </p>

                                        <p className="mt-1 text-xs leading-5 text-slate-500">
                                            Busca por nombre, usuario, correo,
                                            teléfono, departamento o rol.
                                        </p>
                                    </div>

                                    <div className="relative w-full md:w-80">
                                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                                        <input
                                            value={search}
                                            onChange={(event) =>
                                                onSearchChange(
                                                    event.target.value,
                                                )
                                            }
                                            placeholder="Buscar usuario..."
                                            className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-xs font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:h-11 sm:rounded-2xl sm:text-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            {users.length === 0 ? (
                                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
                                    <p className="font-bold text-slate-700">
                                        No hay usuarios para mostrar.
                                    </p>

                                    <p className="mt-1 text-sm text-slate-500">
                                        Verifica el servicio o cambia la
                                        búsqueda.
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                                    <div className="md:hidden">
                                        <div className="divide-y divide-slate-100">
                                            {users.map((user) => (
                                                <TeacherUserCard
                                                    key={user.id}
                                                    user={user}
                                                    isTeacher={assignedTeacherUserIds.has(
                                                        user.id,
                                                    )}
                                                    isAssigning={
                                                        assigningTeacherId ===
                                                        user.id
                                                    }
                                                    onToggle={onToggleTeacher}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    <div className="hidden overflow-x-auto md:block">
                                        <table className="w-full min-w-[820px] table-fixed divide-y divide-slate-200 text-sm">
                                            <thead className="bg-slate-50">
                                                <tr>
                                                    <th className="w-[27%] px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                                                        Usuario
                                                    </th>
                                                    <th className="w-[28%] px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                                                        Correo
                                                    </th>
                                                    <th className="w-[18%] px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                                                        Departamento
                                                    </th>
                                                    <th className="w-[15%] px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-slate-600">
                                                        Estado
                                                    </th>
                                                    <th className="w-[12%] px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-slate-600">
                                                        Acción
                                                    </th>
                                                </tr>
                                            </thead>

                                            <tbody className="divide-y divide-slate-100">
                                                {users.map((user) => (
                                                    <TeacherUserRow
                                                        key={user.id}
                                                        user={user}
                                                        isTeacher={assignedTeacherUserIds.has(
                                                            user.id,
                                                        )}
                                                        isAssigning={
                                                            assigningTeacherId ===
                                                            user.id
                                                        }
                                                        onToggle={
                                                            onToggleTeacher
                                                        }
                                                    />
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    <Pagination
                                        activePage={activePage}
                                        totalPages={totalPages}
                                        currentItems={users.length}
                                        totalItems={totalUsers}
                                        itemLabel="usuarios"
                                        onPrevious={onPrevious}
                                        onNext={onNext}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function TeacherUserCard({
    user,
    isTeacher,
    isAssigning,
    onToggle,
}: {
    user: User;
    isTeacher: boolean;
    isAssigning: boolean;
    onToggle: (user: User, isTeacher: boolean) => void;
}) {
    const fullName = getUserFullName(user);

    return (
        <article className="space-y-3 p-4">
            <div className="flex min-w-0 items-center gap-3">
                <UserAvatar name={fullName} />

                <div className="min-w-0 flex-1">
                    <p
                        className="truncate text-sm font-bold text-slate-950"
                        title={fullName}
                    >
                        {fullName}
                    </p>

                    <p className="mt-0.5 truncate text-xs font-medium text-slate-500">
                        @{user.username}
                    </p>
                </div>
            </div>

            <div className="rounded-xl bg-slate-50 px-3 py-2.5">
                <p className="truncate text-sm font-semibold text-slate-700">
                    {user.email}
                </p>

                <p className="mt-1 truncate text-xs text-slate-500">
                    {user.departament || "Sin departamento"}
                </p>
            </div>

            <div className="flex items-center justify-between gap-2">
                <TeacherStatus isTeacher={isTeacher} />

                <TeacherToggleButton
                    user={user}
                    isTeacher={isTeacher}
                    isAssigning={isAssigning}
                    onToggle={onToggle}
                />
            </div>
        </article>
    );
}

function TeacherUserRow({
    user,
    isTeacher,
    isAssigning,
    onToggle,
}: {
    user: User;
    isTeacher: boolean;
    isAssigning: boolean;
    onToggle: (user: User, isTeacher: boolean) => void;
}) {
    const fullName = getUserFullName(user);

    return (
        <tr className="transition hover:bg-blue-50/40">
            <td className="px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                    <UserAvatar name={fullName} />

                    <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-950">
                            {fullName}
                        </p>

                        <p className="mt-0.5 truncate text-xs font-medium text-slate-500">
                            @{user.username}
                        </p>
                    </div>
                </div>
            </td>

            <td className="px-4 py-3">
                <p className="truncate text-xs font-semibold text-slate-700">
                    {user.email}
                </p>
            </td>

            <td className="px-4 py-3">
                <p className="truncate text-xs font-semibold text-slate-500">
                    {user.departament || "Sin departamento"}
                </p>
            </td>

            <td className="px-4 py-3 text-center">
                <TeacherStatus isTeacher={isTeacher} />
            </td>

            <td className="px-4 py-3 text-center">
                <TeacherToggleButton
                    user={user}
                    isTeacher={isTeacher}
                    isAssigning={isAssigning}
                    onToggle={onToggle}
                />
            </td>
        </tr>
    );
}

function UserAvatar({ name }: { name: string }) {
    return (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#172861] text-sm font-bold text-white">
            {name.charAt(0).toUpperCase()}
        </div>
    );
}

function TeacherStatus({ isTeacher }: { isTeacher: boolean }) {
    return (
        <span
            className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold sm:text-xs ${
                isTeacher
                    ? "bg-blue-100 text-blue-700"
                    : "bg-slate-100 text-slate-700"
            }`}
        >
            {isTeacher ? "Docente del curso" : "Disponible"}
        </span>
    );
}

function TeacherToggleButton({
    user,
    isTeacher,
    isAssigning,
    onToggle,
}: {
    user: User;
    isTeacher: boolean;
    isAssigning: boolean;
    onToggle: (user: User, isTeacher: boolean) => void;
}) {
    return (
        <button
            type="button"
            disabled={isAssigning}
            onClick={() => onToggle(user, isTeacher)}
            className={`inline-flex h-9 items-center justify-center gap-1 rounded-xl px-3 text-xs font-bold transition active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-70 ${
                isTeacher
                    ? "bg-orange-100 text-orange-700 hover:bg-orange-200"
                    : "bg-[#172861] text-white hover:bg-[#0B163F]"
            }`}
        >
            {isAssigning ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : isTeacher ? (
                <Check className="h-4 w-4" />
            ) : (
                <Plus className="h-4 w-4" />
            )}

            <span className="hidden lg:inline">
                {isAssigning
                    ? isTeacher
                        ? "Quitando..."
                        : "Asignando..."
                    : isTeacher
                      ? "Volver"
                      : "Seleccionar"}
            </span>
        </button>
    );
}
