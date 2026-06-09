import Link from "next/link";
import {
    BookOpen,
    Video,
} from "lucide-react";

export default function StudentLiveClassesPage() {
    return (
        <section className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                        <Video className="h-7 w-7" />
                    </div>

                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">
                            Clases en vivo
                        </h1>

                        <p className="mt-1 text-sm leading-6 text-slate-600">
                            Acceda a sus próximas reuniones y consulte las grabaciones publicadas por sus docentes.
                        </p>
                    </div>
                </div>

                <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-sm leading-6 text-slate-600">
                        En la siguiente fase agregaremos aquí las tarjetas de sus cursos matriculados reutilizando su servicio actual de cursos.
                    </p>

                    <Link
                        href="/student/courses"
                        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#172861] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 active:scale-[0.98]"
                    >
                        <BookOpen className="h-5 w-5" />
                        Ir a mis cursos
                    </Link>
                </div>
            </div>
        </section>
    );
}