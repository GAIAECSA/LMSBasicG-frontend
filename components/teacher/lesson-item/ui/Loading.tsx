export function Loading() {
    return (
        <section className="mx-auto w-full max-w-[1480px] min-w-0">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:rounded-[28px] sm:p-8 [@media(max-height:760px)]:p-5">
                <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-blue-100 border-t-blue-700 sm:h-10 sm:w-10" />

                <p className="mt-4 text-xs font-semibold text-slate-600 sm:text-sm">
                    Cargando información...
                </p>
            </div>
        </section>
    );
}
