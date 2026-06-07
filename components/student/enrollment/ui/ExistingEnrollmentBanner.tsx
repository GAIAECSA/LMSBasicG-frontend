import Link from "next/link";
import {
    CheckCircle2,
    Clock3,
    XCircle,
} from "lucide-react";

import {
    STUDENT_ENROLLMENT_LINKS,
} from "../constants";
import type {
    CourseEnrollmentItem,
    ExistingEnrollmentState,
} from "../types";

type ExistingEnrollmentBannerProps = {
    state: ExistingEnrollmentState;
    course: CourseEnrollmentItem;
};

export function ExistingEnrollmentBanner({
    state,
    course,
}: ExistingEnrollmentBannerProps) {
    if (
        state.type === "none"
    ) {
        return null;
    }

    const isApproved =
        state.type ===
        "approved";

    const isRejected =
        state.type ===
        "rejected";

    const title =
        isApproved
            ? "Tu matrícula ya está aprobada"
            : isRejected
                ? "Tu matrícula fue rechazada"
                : "Tu matrícula está pendiente de validación";

    const description =
        isApproved
            ? "El acceso al curso ya está habilitado. Puedes ingresar directamente al aula."
            : isRejected
                ? "Corrige la información del comprobante y envía nuevamente la solicitud."
                : "Cuando administración apruebe el comprobante, el curso aparecerá en Mis cursos.";

    return (
        <section
            role="status"
            className={`rounded-2xl border p-3 shadow-sm sm:rounded-[24px] sm:p-4 ${isApproved
                    ? "border-[var(--success)]/30 bg-[var(--success-soft)] text-[var(--success)]"
                    : isRejected
                        ? "border-red-200 bg-red-50 text-red-700"
                        : "border-[var(--warning)]/30 bg-[var(--warning-soft)] text-[var(--warning)]"
                }`}
        >
            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                    {isApproved ? (
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                    ) : isRejected ? (
                        <XCircle className="mt-0.5 h-5 w-5 shrink-0" />
                    ) : (
                        <Clock3 className="mt-0.5 h-5 w-5 shrink-0" />
                    )}

                    <div className="min-w-0">
                        <p className="break-words text-sm font-black sm:text-base">
                            {title}
                        </p>

                        <p className="mt-1 break-words text-xs font-semibold leading-5 opacity-80 sm:text-sm sm:leading-6">
                            {description}
                        </p>
                    </div>
                </div>

                {isRejected ? (
                    <a
                        href="#enrollment-method"
                        className="inline-flex h-10 w-full shrink-0 items-center justify-center rounded-xl bg-white px-4 text-xs font-black text-[var(--primary)] shadow-sm transition hover:bg-white/90 active:scale-[0.97] sm:w-auto sm:rounded-2xl sm:text-sm"
                    >
                        Corregir solicitud
                    </a>
                ) : (
                    <Link
                        href={
                            isApproved
                                ? `/student/courses/${course.id}`
                                : STUDENT_ENROLLMENT_LINKS.catalog
                        }
                        className="inline-flex h-10 w-full shrink-0 items-center justify-center rounded-xl bg-white px-4 text-xs font-black text-[var(--primary)] shadow-sm transition hover:bg-white/90 active:scale-[0.97] sm:w-auto sm:rounded-2xl sm:text-sm"
                    >
                        {isApproved
                            ? "Entrar al aula"
                            : "Volver al catálogo"}
                    </Link>
                )}
            </div>
        </section>
    );
}

export default ExistingEnrollmentBanner;