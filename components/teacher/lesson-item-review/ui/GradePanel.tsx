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

export function GradePanel({ review }: GradePanelProps) {
    const canGrade = review.itemType === "homework" || review.itemType === "quiz";
    const isForum = review.itemType === "forum";

    const selectedEnrollmentId =
        review.selectedRow?.enrollmentId ?? review.selectedEnrollmentId;

    const selectedIndex = review.rows.findIndex(
        (row) => row.enrollmentId === selectedEnrollmentId,
    );

    const totalStudents = review.rows.length;
    const currentPosition = selectedIndex >= 0 ? selectedIndex + 1 : 0;

    const previousRow = selectedIndex > 0 ? review.rows[selectedIndex - 1] : null;

    const nextRow =
        selectedIndex >= 0 && selectedIndex < review.rows.length - 1
            ? review.rows[selectedIndex + 1]
            : null;

    const handlePrevious = () => {
        if (!previousRow) return;
        review.setSelectedEnrollmentId(previousRow.enrollmentId);
    };

    const handleNext = () => {
        if (!nextRow) return;
        review.setSelectedEnrollmentId(nextRow.enrollmentId);
    };

    return (
        <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#172861]">
                    <UserCheck className="h-6 w-6" />
                </div>

                <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-700">
                        Revisión
                    </p>

                    <h2 className="mt-1 text-xl font-black text-slate-950">
                        {isForum ? "Participaciones del foro" : "Calificar entrega"}
                    </h2>

                    <p className="mt-1 text-sm font-semibold text-slate-500">
                        {isForum
                            ? "Avanza entre estudiantes y revisa sus participaciones."
                            : "Avanza entre estudiantes y registra la nota."}
                    </p>
                </div>
            </div>

            <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                            Estudiante
                        </p>

                        <h3 className="mt-2 text-base font-black text-slate-950">
                            {review.selectedRow?.studentName ?? "Sin estudiante seleccionado"}
                        </h3>

                        <p className="mt-1 text-sm font-semibold text-slate-500">
                            {currentPosition > 0
                                ? `${currentPosition} de ${totalStudents}`
                                : `${totalStudents} estudiantes`}
                        </p>
                    </div>

                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-slate-500 shadow-sm">
                        <Users className="h-5 w-5" />
                    </div>
                </div>

                <label className="mt-4 block">
                    <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                        Cambiar estudiante
                    </span>

                    <select
                        value={selectedEnrollmentId ?? ""}
                        onChange={(event) => {
                            const value = Number(event.target.value);
                            review.setSelectedEnrollmentId(Number.isNaN(value) ? null : value);
                        }}
                        className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    >
                        {review.rows.map((row, index) => (
                            <option key={row.id} value={row.enrollmentId}>
                                {index + 1}. {row.studentName} - {row.statusLabel}
                            </option>
                        ))}
                    </select>
                </label>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                    type="button"
                    disabled={!previousRow}
                    onClick={handlePrevious}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45"
                >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                </button>

                <button
                    type="button"
                    disabled={!nextRow}
                    onClick={handleNext}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45"
                >
                    Siguiente
                    <ChevronRight className="h-4 w-4" />
                </button>
            </div>

            {canGrade ? (
                <div className="mt-5 border-t border-slate-100 pt-5">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-700">
                        Nota
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-500">
                        Ingresa una nota entre 0 y 10.
                    </p>

                    <label className="mt-4 block">
                        <span className="text-sm font-black text-slate-700">
                            Calificación
                        </span>

                        <input
                            type="number"
                            min="0"
                            max="10"
                            step="0.01"
                            disabled={!review.selectedRow?.responseId}
                            value={review.gradeForm.score}
                            onChange={(event) =>
                                review.setGradeForm((current) => ({
                                    ...current,
                                    score: event.target.value,
                                }))
                            }
                            className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                            placeholder="Ej: 9.5"
                        />
                    </label>

                    <button
                        type="button"
                        disabled={!review.selectedRow?.responseId || review.savingGrade}
                        onClick={() => void review.handleSaveGrade()}
                        className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(180deg,#4176ea_0%,#2f63d8_100%)] px-5 text-sm font-black text-white shadow-[0_8px_20px_rgba(47,99,216,0.25)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <Save className="h-4 w-4" />
                        {review.savingGrade ? "Guardando..." : "Guardar calificación"}
                    </button>
                </div>
            ) : null}
        </div>
    );
}

export default GradePanel;