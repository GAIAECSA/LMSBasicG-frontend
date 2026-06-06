import type { Course } from "@/services/courses.service";

type HeaderProps = {
    isAdminRoute: boolean;
    course: Course | null;
    currentCourseId: number;
    averageScore: number;
    passedCount: number;
    failedCount: number;
    generatedCertificatesCount: number;
};

export function Header({
    isAdminRoute,
    course,
    currentCourseId,
    averageScore,
    passedCount,
    failedCount,
    generatedCertificatesCount,
}: HeaderProps) {
    return (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#07111F] via-[#172861] via-70% to-[#F97316] p-4 text-white shadow-lg sm:rounded-3xl sm:p-5 lg:p-6 [@media(max-height:760px)]:p-4">
            <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-start 2xl:justify-between">
                <div className="min-w-0">
                    <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-blue-100 sm:text-xs sm:tracking-[0.25em] lg:text-sm">
                        {isAdminRoute
                            ? "Panel del administrador"
                            : "Panel del profesor"}
                    </p>

                    <h2 className="mt-2 text-xl font-bold sm:text-2xl lg:text-3xl [@media(max-height:760px)]:text-xl">
                        Calificaciones del curso
                    </h2>

                    <p className="mt-2 max-w-3xl break-words text-xs leading-5 text-blue-50 [overflow-wrap:anywhere] sm:text-sm sm:leading-6">
                        Resumen agrupado por matrícula dentro de{" "}
                        <span className="font-bold text-white">
                            {course?.name || `curso #${currentCourseId}`}
                        </span>
                        .
                    </p>
                </div>

                <div className="grid w-full grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4 2xl:w-auto 2xl:min-w-[560px] 2xl:max-w-[640px] 2xl:shrink-0">
                    <HeaderMetric label="Promedio" value={averageScore} />
                    <HeaderMetric label="Aprobadas" value={passedCount} />
                    <HeaderMetric label="No aprobadas" value={failedCount} />
                    <HeaderMetric
                        label="Certificados"
                        value={generatedCertificatesCount}
                    />
                </div>
            </div>
        </div>
    );
}

function HeaderMetric({
    label,
    value,
}: {
    label: string;
    value: string | number;
}) {
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
