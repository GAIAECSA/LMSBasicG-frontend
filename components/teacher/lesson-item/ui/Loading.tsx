export function Loading() {
    return (
        <section className="space-y-6">
            <div className="rounded-[28px] border border-slate-200 bg-white p-8 text-center shadow-sm">
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-700" />
                <p className="mt-4 text-sm font-semibold text-slate-600">
                    Cargando información...
                </p>
            </div>
        </section>
    );
}