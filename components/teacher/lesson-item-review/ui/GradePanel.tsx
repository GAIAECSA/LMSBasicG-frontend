import {
    ChevronLeft,
    ChevronRight,
    Save,
    UserCheck,
    Users,
} from "lucide-react";
import type { LessonItemReviewState } from "../hook";

type GradePanelProps = {
    review: LessonItemReviewState;
};

export function GradePanel({
    review,
}: GradePanelProps) {
    const canGrade =
        review.itemType === "homework" ||
        review.itemType === "quiz";

    const isForum =
        review.itemType === "forum";

    const selectedEnrollmentId =
        review.selectedRow?.enrollmentId ??
        review.selectedEnrollmentId;

    const selectedIndex = review.rows.findIndex(
        (row) =>
            row.enrollmentId ===
            selectedEnrollmentId,
    );

    const totalStudents = review.rows.length;

    const currentPosition =
        selectedIndex >= 0
            ? selectedIndex + 1
            : 0;

    const previousRow =
        selectedIndex > 0
            ? review.rows[selectedIndex - 1]
            : null;

    const nextRow =
        selectedIndex >= 0 &&
        selectedIndex < review.rows.length - 1
            ? review.rows[selectedIndex + 1]
            : null;

    function handlePrevious() {
        if (!previousRow) return;

        review.setSelectedEnrollmentId(
            previousRow.enrollmentId,
        );
    }

    function handleNext() {
        if (!nextRow) return;

        review.setSelectedEnrollmentId(
            nextRow.enrollmentId,
        );
    }

    return (
        <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-[30px] sm:p-5 2xl:p-6 [@media(max-height:760px)]:p-4">
            <div className="flex items-start gap-3 sm:gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#172861] sm:h-12 sm:w-12 sm:rounded-2xl">
                    <UserCheck className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>

                <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-700 sm:text-xs sm:tracking-[0.16em]">
                        Revisión
                    </p>

                    <h2 className="mt-1 break-words text-base font-black leading-5 text-slate-950 [overflow-wrap:anywhere] sm:text-lg sm:leading-6 2xl:text-xl">
                        {isForum
                            ? "Participaciones del foro"
                            : "Calificar entrega"}
                    </h2>

                    <p className="mt-1 text-xs font-semibold leading-5 text-slate-500 sm:text-sm">
                        {isForum
                            ? "Avanza entre estudiantes y revisa sus participaciones."
                            : "Avanza entre estudiantes y registra la nota."}
                    </p>
                </div>
            </div>

            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:mt-5 sm:rounded-3xl sm:p-4 [@media(max-height:760px)]:mt-3">
                <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500 sm:text-xs sm:tracking-[0.14em]">
                            Estudiante
                        </p>

                        <h3
                            title={
                                review.selectedRow?.studentName ??
                                "Sin estudiante seleccionado"
                            }
                            className="mt-1.5 break-words text-sm font-black leading-5 text-slate-950 [overflow-wrap:anywhere] sm:mt-2 sm:text-base"
                        >
                            {review.selectedRow?.studentName ??
                                "Sin estudiante seleccionado"}
                        </h3>

                        <p className="mt-1 text-xs font-semibold text-slate-500 sm:text-sm">
                            {currentPosition > 0
                                ? `${currentPosition} de ${totalStudents}`
                                : `${totalStudents} estudiantes`}
                        </p>
                    </div>

                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm sm:h-11 sm:w-11 sm:rounded-2xl">
                        <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                </div>

                <label className="mt-3 block sm:mt-4">
                    <span className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-500 sm:text-xs sm:tracking-[0.12em]">
                        Cambiar estudiante
                    </span>

                    <select
                        value={
                            selectedEnrollmentId ?? ""
                        }
                        onChange={(event) => {
                            const value = Number(
                                event.target.value,
                            );

                            review.setSelectedEnrollmentId(
                                Number.isNaN(value)
                                    ? null
                                    : value,
                            );
                        }}
                        className="mt-1.5 h-10 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:mt-2 sm:h-12 sm:rounded-2xl sm:px-4 sm:text-sm [@media(max-height:760px)]:h-10"
                    >
                        {review.rows.map(
                            (row, index) => (
                                <option
                                    key={row.id}
                                    value={
                                        row.enrollmentId
                                    }
                                >
                                    {index + 1}.{" "}
                                    {row.studentName} -{" "}
                                    {row.statusLabel}
                                </option>
                            ),
                        )}
                    </select>
                </label>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 sm:mt-4 sm:gap-3">
                <button
                    type="button"
                    disabled={!previousRow}
                    onClick={handlePrevious}
                    className="inline-flex h-10 min-w-0 items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-2 text-[10px] font-black text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-45 sm:h-11 sm:gap-2 sm:rounded-2xl sm:px-4 sm:text-xs"
                >
                    <ChevronLeft className="h-4 w-4 shrink-0" />

                    <span className="truncate">
                        Anterior
                    </span>
                </button>

                <button
                    type="button"
                    disabled={!nextRow}
                    onClick={handleNext}
                    className="inline-flex h-10 min-w-0 items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-2 text-[10px] font-black text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-45 sm:h-11 sm:gap-2 sm:rounded-2xl sm:px-4 sm:text-xs"
                >
                    <span className="truncate">
                        Siguiente
                    </span>

                    <ChevronRight className="h-4 w-4 shrink-0" />
                </button>
            </div>

            {canGrade ? (
                <div className="mt-4 border-t border-slate-100 pt-4 sm:mt-5 sm:pt-5 [@media(max-height:760px)]:mt-3 [@media(max-height:760px)]:pt-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-700 sm:text-xs sm:tracking-[0.16em]">
                        Nota
                    </p>

                    <p className="mt-1 text-xs font-semibold leading-5 text-slate-500 sm:text-sm">
                        Ingresa una nota entre 0 y 10.
                    </p>

                    <label className="mt-3 block sm:mt-4">
                        <span className="text-xs font-black text-slate-700 sm:text-sm">
                            Calificación
                        </span>

                        <input
                            type="number"
                            min="0"
                            max="10"
                            step="0.01"
                            disabled={
                                !review.selectedRow
                                    ?.responseId
                            }
                            value={
                                review.gradeForm.score
                            }
                            onChange={(event) =>
                                review.setGradeForm(
                                    (current) => ({
                                        ...current,
                                        score: event
                                            .target
                                            .value,
                                    }),
                                )
                            }
                            className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 sm:mt-2 sm:h-12 sm:rounded-2xl sm:px-4 sm:text-sm [@media(max-height:760px)]:h-10"
                            placeholder="Ej: 9.5"
                        />
                    </label>

                    <button
                        type="button"
                        disabled={
                            !review.selectedRow
                                ?.responseId ||
                            review.savingGrade
                        }
                        onClick={() =>
                            void review.handleSaveGrade()
                        }
                        className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[linear-gradient(180deg,#4176ea_0%,#2f63d8_100%)] px-4 text-xs font-black text-white shadow-[0_8px_20px_rgba(47,99,216,0.25)] transition hover:brightness-105 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 sm:mt-4 sm:h-12 sm:rounded-2xl sm:px-5 sm:text-sm [@media(max-height:760px)]:h-10"
                    >
                        <Save className="h-4 w-4 shrink-0" />

                        <span className="truncate">
                            {review.savingGrade
                                ? "Guardando..."
                                : "Guardar calificación"}
                        </span>
                    </button>
                </div>
            ) : null}
        </div>
    );
}

export default GradePanel;
