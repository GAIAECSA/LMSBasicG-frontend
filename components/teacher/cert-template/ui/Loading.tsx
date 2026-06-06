type LoadingProps = {
    numericCourseId: number;
};

export function Loading({
    numericCourseId,
}: LoadingProps) {
    return (
        <section className="space-y-3 sm:space-y-4">
            <div className="rounded-2xl border border-[var(--border)] bg-white p-6 text-center shadow-sm sm:rounded-3xl sm:p-8 [@media(max-height:760px)]:p-5">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-100 border-t-[#172861] sm:h-10 sm:w-10" />

                <p className="mt-3 text-xs font-semibold leading-5 text-slate-600 sm:mt-4 sm:text-sm">
                    {numericCourseId > 0
                        ? "Cargando plantilla del certificado..."
                        : "Cargando cursos disponibles..."}
                </p>
            </div>
        </section>
    );
}
