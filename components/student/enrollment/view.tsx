"use client";

import { useStudentEnrollment } from "./hook";
import type { StudentEnrollmentViewProps } from "./types";
import { CourseOverviewCard } from "./ui/CourseOverviewCard";
import { EnrollmentFlowCard } from "./ui/EnrollmentFlowCard";
import { EnrollmentMethodCard } from "./ui/EnrollmentMethodCard";
import { ExistingEnrollmentBanner } from "./ui/ExistingEnrollmentBanner";
import { PageHeader } from "./ui/PageHeader";
import { PaymentSummaryCard } from "./ui/PaymentSummaryCard";
import { StatePanel } from "./ui/StatePanel";
import { VoucherModal } from "./ui/VoucherModal";

export function StudentEnrollmentView({
    courseId,
}: StudentEnrollmentViewProps) {
    const enrollment = useStudentEnrollment(courseId);

    if (!enrollment.isValidCourseId) {
        return (
            <StatePanel
                type="error"
                message="El identificador del curso no es válido."
            />
        );
    }

    if (enrollment.loading) {
        return (
            <StatePanel
                type="loading"
                message="Cargando proceso de matrícula..."
            />
        );
    }

    if (enrollment.error || !enrollment.course) {
        return (
            <StatePanel
                type="error"
                message={
                    enrollment.error ||
                    "No se encontró el curso."
                }
            />
        );
    }

    const { course } = enrollment;

    return (
        <>
            <section className="min-h-screen overflow-x-hidden bg-[var(--background)] px-3 py-4 pt-16 text-[var(--foreground)] sm:px-5 sm:py-5 md:px-6 md:pt-6 lg:px-8 xl:px-10 [@media(max-height:760px)]:lg:py-4">
                <div className="mx-auto w-full min-w-0 max-w-[1500px] space-y-4 sm:space-y-5">
                    <PageHeader initials={enrollment.initials} />

                    <ExistingEnrollmentBanner
                        state={enrollment.existingEnrollmentState}
                        course={course}
                    />

                    {/*
                     * El resumen principal del curso ocupa todo el ancho.
                     * Así evitamos que la imagen y los datos se vean apretados
                     * en pantallas de 1280 x 720.
                     */}
                    <CourseOverviewCard course={course} />

                    {/*
                     * Las dos columnas aparecen debajo del resumen principal.
                     * En celulares y tabletas se apilan verticalmente.
                     */}
                    <div className="grid min-w-0 items-start gap-4 sm:gap-5 xl:grid-cols-[minmax(0,1fr)_350px] 2xl:grid-cols-[minmax(0,1fr)_390px]">
                        <div className="min-w-0 space-y-4 sm:space-y-5">
                            <PaymentSummaryCard
                                course={course}
                                discountAmount={
                                    enrollment.discountAmount
                                }
                                totalPayable={
                                    enrollment.totalPayable
                                }
                            />

                            <EnrollmentFlowCard
                                course={course}
                                hasVoucher={Boolean(
                                    enrollment.voucherFile,
                                )}
                            />
                        </div>

                        <aside className="min-w-0 xl:sticky xl:top-4">
                            <EnrollmentMethodCard
                                enrollment={enrollment}
                            />
                        </aside>
                    </div>
                </div>
            </section>

            <VoucherModal enrollment={enrollment} />
        </>
    );
}

export default StudentEnrollmentView;