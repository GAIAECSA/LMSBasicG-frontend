import type { CourseEnrollmentItem } from "../types";
import { StepItem } from "./StepItem";

type EnrollmentFlowCardProps = {
    course: CourseEnrollmentItem;
    hasVoucher: boolean;
};

export function EnrollmentFlowCard({
    course,
    hasVoucher,
}: EnrollmentFlowCardProps) {
    return (
        <article className="min-w-0 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-3 shadow-sm sm:rounded-[24px] sm:p-4 lg:p-5 [@media(max-height:760px)]:lg:p-4">
            <h2 className="text-base font-black text-[var(--foreground)] sm:text-lg">
                Flujo de matrícula
            </h2>

            <div className="mt-3 space-y-3 sm:mt-4 sm:space-y-4">
                <StepItem
                    number={1}
                    title="Revisar curso"
                    description="Verifica la información académica y el costo del curso."
                    done
                />

                <StepItem
                    number={2}
                    title={
                        course.isFree
                            ? "Confirmar acceso"
                            : "Subir comprobante"
                    }
                    description={
                        course.isFree
                            ? "El curso gratuito no requiere comprobante."
                            : "Carga una imagen o PDF del pago realizado."
                    }
                    active={
                        !hasVoucher &&
                        !course.isFree
                    }
                    done={
                        course.isFree ||
                        hasVoucher
                    }
                />

                <StepItem
                    number={3}
                    title={
                        course.isFree
                            ? "Acceso habilitado"
                            : "Validación"
                    }
                    description={
                        course.isFree
                            ? "El curso gratuito se aprueba automáticamente y se habilita en Mis cursos."
                            : "Administración revisa tu solicitud y habilita el aula."
                    }
                    active={
                        hasVoucher ||
                        course.isFree
                    }
                    done={course.isFree}
                />
            </div>
        </article>
    );
}

export default EnrollmentFlowCard;
