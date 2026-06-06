import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type CourseNotFoundProps = {
    backHref: string;
    backLabel: string;
};

export function CourseNotFound({
    backHref,
    backLabel,
}: CourseNotFoundProps) {
    return (
        <section className="min-h-screen w-full bg-slate-50 px-3 py-4 sm:px-5 sm:py-5 lg:px-6">
            <div className="mx-auto w-full max-w-[1500px] space-y-4">
                <Link
                    href={backHref}
                    className="inline-flex h-10 w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.97] sm:h-11 sm:rounded-2xl sm:px-4 sm:text-sm"
                >
                    <ArrowLeft className="h-4 w-4" />
                    {backLabel}
                </Link>

                <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-center shadow-sm sm:rounded-[2rem] sm:p-8">
                    <h1 className="text-xl font-black text-red-700 sm:text-2xl">
                        Curso no encontrado
                    </h1>

                    <p className="mt-2 text-xs font-semibold leading-5 text-red-600 sm:text-sm sm:leading-6">
                        No se pudo cargar la
                        información del curso
                        seleccionado.
                    </p>
                </div>
            </div>
        </section>
    );
}

export default CourseNotFound;
