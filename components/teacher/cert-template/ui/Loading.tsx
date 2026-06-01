type LoadingProps = {
    numericCourseId: number;
};

export function Loading({ numericCourseId }: LoadingProps) {
    return (
        <section className="space-y-6">
            <div className="rounded-3xl border border-[var(--border)] bg-white p-8 text-center shadow-sm">
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-[#172861]" />

                <p className="mt-4 text-sm font-semibold text-slate-600">
                    {numericCourseId > 0
                        ? "Cargando plantilla del certificado..."
                        : "Cargando cursos disponibles..."}
                </p>
            </div>
        </section>
    );
}