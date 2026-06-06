import {
    BookOpen,
    Loader2,
    Search,
    UserRound,
    X,
} from "lucide-react";

import type {
    FormEvent,
    ReactNode,
} from "react";

import type {
    EnrollmentsAdminPanelState,
} from "../hook";

import {
    getCourseName,
    getUserInitials,
    getUserName,
} from "../utils";

type EnrollmentFormModalProps = {
    panel: EnrollmentsAdminPanelState;
    onSubmit: (
        event: FormEvent<HTMLFormElement>,
    ) => void;
};

export function EnrollmentFormModal({
    panel,
    onSubmit,
}: EnrollmentFormModalProps) {
    if (!panel.enrollmentModalOpen) {
        return null;
    }

    function handleBackdropClick() {
        panel.closeEnrollmentModal();
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
            onClick={handleBackdropClick}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="enrollment-modal-title"
                className="flex max-h-[96dvh] w-full max-w-4xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-h-[92vh] sm:rounded-3xl"
                onClick={(event) =>
                    event.stopPropagation()
                }
            >
                <div className="shrink-0 bg-gradient-to-br from-[#07111F] via-[#172861] to-[#F97316] px-4 py-4 text-white sm:px-5 sm:py-5 lg:px-6 [@media(max-height:760px)]:py-4">
                    <div className="flex items-start justify-between gap-3 sm:gap-4">
                        <div className="min-w-0">
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-100 sm:text-xs sm:tracking-[0.25em]">
                                Matrícula
                            </p>

                            <h3
                                id="enrollment-modal-title"
                                className="mt-1.5 break-words text-lg font-bold leading-6 text-white [overflow-wrap:anywhere] sm:mt-2 sm:text-xl"
                            >
                                Matricular estudiante
                            </h3>

                            <p className="mt-1 break-words text-xs leading-5 text-blue-50 [overflow-wrap:anywhere] sm:text-sm sm:leading-6">
                                Busca el curso y el usuario.
                                La matrícula se registrará sin
                                referencia ni comprobante.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() =>
                                panel.closeEnrollmentModal()
                            }
                            disabled={panel.isSaving}
                            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white ring-1 ring-white/20 transition hover:bg-white/25 active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-60 sm:h-10 sm:w-10 sm:rounded-2xl"
                            aria-label="Cerrar modal"
                        >
                            <X className="h-4 w-4 sm:h-5 sm:w-5" />
                        </button>
                    </div>
                </div>

                <form
                    onSubmit={onSubmit}
                    className="flex min-h-0 flex-1 flex-col"
                >
                    <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4 sm:space-y-4 sm:p-5 lg:p-6 [@media(max-height:760px)]:space-y-3 [@media(max-height:760px)]:p-4">
                        {panel.error ? (
                            <div className="break-words rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-bold leading-5 text-red-700 [overflow-wrap:anywhere] sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm">
                                {panel.error}
                            </div>
                        ) : null}

                        <div className="rounded-xl border border-orange-100 bg-orange-50 px-3 py-2.5 text-xs font-semibold leading-5 text-orange-800 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm">
                            Estado inicial:{" "}
                            <span className="font-bold">
                                Aprobado
                            </span>
                            . Referencia:{" "}
                            <span className="font-bold">
                                Sin referencia
                            </span>
                            . Comprobante:{" "}
                            <span className="font-bold">
                                Sin archivo
                            </span>
                            .
                        </div>

                        <div className="grid gap-3 lg:grid-cols-2 lg:gap-4">
                            <SelectionPanel
                                icon={
                                    <BookOpen className="h-4 w-4" />
                                }
                                title="Seleccionar curso"
                                searchValue={
                                    panel.courseSearch
                                }
                                onSearchChange={
                                    panel.setCourseSearch
                                }
                                placeholder="Escribe el nombre del curso..."
                            >
                                <div className="max-h-[220px] space-y-2 overflow-y-auto pr-1 sm:max-h-72 [@media(max-height:760px)]:max-h-[170px]">
                                    {panel.filteredCourses.map(
                                        (course) => {
                                            const selected =
                                                panel.courseId ===
                                                String(
                                                    course.id,
                                                );

                                            return (
                                                <button
                                                    key={
                                                        course.id
                                                    }
                                                    type="button"
                                                    onClick={() =>
                                                        panel.setCourseId(
                                                            String(
                                                                course.id,
                                                            ),
                                                        )
                                                    }
                                                    className={`w-full min-w-0 rounded-xl border px-3 py-2.5 text-left transition active:scale-[0.99] sm:rounded-2xl sm:px-4 sm:py-3 ${
                                                        selected
                                                            ? "border-blue-300 bg-blue-50 ring-2 ring-blue-100"
                                                            : "border-slate-200 bg-white hover:bg-slate-50"
                                                    }`}
                                                >
                                                    <p
                                                        title={getCourseName(
                                                            course,
                                                        )}
                                                        className="break-words text-xs font-bold leading-5 text-slate-950 [overflow-wrap:anywhere] sm:text-sm"
                                                    >
                                                        {getCourseName(
                                                            course,
                                                        )}
                                                    </p>
                                                </button>
                                            );
                                        },
                                    )}

                                    {panel
                                        .filteredCourses
                                        .length ===
                                    0 ? (
                                        <EmptySelectionMessage label="No se encontraron cursos." />
                                    ) : null}
                                </div>
                            </SelectionPanel>

                            <SelectionPanel
                                icon={
                                    <UserRound className="h-4 w-4" />
                                }
                                title="Seleccionar usuario"
                                searchValue={
                                    panel.userSearch
                                }
                                onSearchChange={
                                    panel.setUserSearch
                                }
                                placeholder="Nombre, usuario o correo..."
                            >
                                <div className="max-h-[220px] space-y-2 overflow-y-auto pr-1 sm:max-h-72 [@media(max-height:760px)]:max-h-[170px]">
                                    {panel.filteredUsers.map(
                                        (user) => {
                                            const selected =
                                                panel.studentId ===
                                                String(
                                                    user.id,
                                                );

                                            return (
                                                <button
                                                    key={
                                                        user.id
                                                    }
                                                    type="button"
                                                    onClick={() =>
                                                        panel.setStudentId(
                                                            String(
                                                                user.id,
                                                            ),
                                                        )
                                                    }
                                                    className={`w-full min-w-0 rounded-xl border px-3 py-2.5 text-left transition active:scale-[0.99] sm:rounded-2xl sm:px-4 sm:py-3 ${
                                                        selected
                                                            ? "border-blue-300 bg-blue-50 ring-2 ring-blue-100"
                                                            : "border-slate-200 bg-white hover:bg-slate-50"
                                                    }`}
                                                >
                                                    <div className="flex min-w-0 items-start gap-2.5 sm:gap-3">
                                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#172861] text-[10px] font-bold uppercase text-white sm:h-10 sm:w-10 sm:rounded-2xl sm:text-xs">
                                                            {getUserInitials(
                                                                user,
                                                            )}
                                                        </div>

                                                        <div className="min-w-0">
                                                            <p
                                                                title={getUserName(
                                                                    user,
                                                                )}
                                                                className="break-words text-xs font-bold leading-5 text-slate-950 [overflow-wrap:anywhere] sm:text-sm"
                                                            >
                                                                {getUserName(
                                                                    user,
                                                                )}
                                                            </p>

                                                            <p
                                                                title={
                                                                    user.email ||
                                                                    ""
                                                                }
                                                                className="mt-0.5 truncate text-[10px] font-medium text-slate-500 sm:text-xs"
                                                            >
                                                                {
                                                                    user.email
                                                                }
                                                            </p>
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        },
                                    )}

                                    {panel.filteredUsers
                                        .length ===
                                    0 ? (
                                        <EmptySelectionMessage label="No se encontraron usuarios." />
                                    ) : null}
                                </div>
                            </SelectionPanel>
                        </div>

                        <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-3 text-xs sm:rounded-2xl sm:p-4 sm:text-sm md:grid-cols-2">
                            <SelectedValue
                                label="Curso seleccionado"
                                value={
                                    panel.selectedCourse
                                        ? getCourseName(
                                              panel.selectedCourse,
                                          )
                                        : "Ninguno"
                                }
                            />

                            <SelectedValue
                                label="Usuario seleccionado"
                                value={
                                    panel.selectedUser
                                        ? getUserName(
                                              panel.selectedUser,
                                          )
                                        : "Ninguno"
                                }
                            />
                        </div>
                    </div>

                    <div className="grid shrink-0 grid-cols-1 gap-2 border-t border-slate-100 bg-white p-4 xs:grid-cols-2 sm:gap-3 sm:px-5 lg:flex lg:justify-end lg:px-6 [@media(max-height:760px)]:py-3">
                        <button
                            type="button"
                            onClick={() =>
                                panel.closeEnrollmentModal()
                            }
                            disabled={panel.isSaving}
                            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 px-4 text-xs font-bold text-slate-700 transition hover:bg-slate-50 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 sm:h-11 sm:px-5 sm:text-sm"
                        >
                            Cancelar
                        </button>

                        <button
                            type="submit"
                            disabled={
                                panel.isSaving ||
                                !panel.courseId ||
                                !panel.studentId
                            }
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#172861] px-4 text-xs font-bold text-white shadow-sm transition hover:bg-[#0B163F] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 sm:h-11 sm:px-5 sm:text-sm"
                        >
                            {panel.isSaving ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : null}

                            {panel.isSaving
                                ? "Guardando..."
                                : "Matricular"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function SelectionPanel({
    icon,
    title,
    searchValue,
    onSearchChange,
    placeholder,
    children,
}: {
    icon: ReactNode;
    title: string;
    searchValue: string;
    onSearchChange: (value: string) => void;
    placeholder: string;
    children: ReactNode;
}) {
    return (
        <div className="min-w-0 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:rounded-2xl sm:p-4">
            <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-[#172861] shadow-sm">
                    {icon}
                </div>

                <p className="text-xs font-black text-slate-700 sm:text-[13px]">
                    {title}
                </p>
            </div>

            <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />

                <input
                    value={searchValue}
                    onChange={(event) =>
                        onSearchChange(
                            event.target.value,
                        )
                    }
                    placeholder={placeholder}
                    className="h-10 w-full min-w-0 rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:h-11 sm:rounded-2xl sm:pl-10 sm:text-sm"
                />
            </div>

            {children}
        </div>
    );
}

function EmptySelectionMessage({
    label,
}: {
    label: string;
}) {
    return (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-3 py-5 text-center text-xs text-slate-500 sm:rounded-2xl sm:px-4 sm:py-6 sm:text-sm">
            {label}
        </div>
    );
}

function SelectedValue({
    label,
    value,
}: {
    label: string;
    value: string;
}) {
    return (
        <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 sm:text-xs sm:tracking-[0.16em]">
                {label}
            </p>

            <p className="mt-1 break-words font-bold leading-5 text-slate-950 [overflow-wrap:anywhere]">
                {value}
            </p>
        </div>
    );
}
