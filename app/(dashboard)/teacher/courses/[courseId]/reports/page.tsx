import Link from "next/link";
import {
    ArrowLeft,
    BarChart3,
    BookOpen,
    CalendarCheck,
    CheckCircle2,
    ClipboardList,
    Download,
    FileBarChart,
    FileCheck2,
    FileSpreadsheet,
    GraduationCap,
    Layers3,
    RefreshCcw,
    ShieldCheck,
    TrendingUp,
    Users,
} from "lucide-react";

type TeacherCourseReportsPageProps = {
    params: Promise<{
        courseId: string;
    }>;
};

const reportCards = [
    {
        title: "Reporte general del curso",
        description:
            "Resumen del curso, estudiantes matriculados, módulos, actividades y avance académico.",
        icon: FileBarChart,
        tag: "Curso",
        status: "Disponible",
    },
    {
        title: "Reporte de calificaciones",
        description:
            "Promedios, tareas, foros, cuestionarios revisados y actividades pendientes de calificación.",
        icon: GraduationCap,
        tag: "Notas",
        status: "Disponible",
    },
    {
        title: "Reporte de asistencia",
        description:
            "Sesiones registradas, estudiantes presentes, ausentes y porcentaje de asistencia del curso.",
        icon: CalendarCheck,
        tag: "Asistencia",
        status: "Disponible",
    },
    {
        title: "Reporte de contenidos",
        description:
            "Módulos, lecciones, tareas, foros, cuestionarios y recursos creados dentro del curso.",
        icon: Layers3,
        tag: "Contenido",
        status: "Próximamente",
    },
    {
        title: "Reporte de archivos MDT",
        description:
            "Archivos solicitados, entregas realizadas, estudiantes pendientes y documentos revisados.",
        icon: FileSpreadsheet,
        tag: "MDT",
        status: "Próximamente",
    },
    {
        title: "Reporte de certificados MDT",
        description:
            "Certificados generados, estudiantes habilitados y registros relacionados con el curso.",
        icon: FileCheck2,
        tag: "Certificados",
        status: "Próximamente",
    },
];

const summaryCards = [
    {
        label: "Estudiantes",
        value: "32",
        description: "Matriculados",
        icon: Users,
    },
    {
        label: "Módulos",
        value: "8",
        description: "Creados",
        icon: BookOpen,
    },
    {
        label: "Asistencia",
        value: "91%",
        description: "Promedio",
        icon: CalendarCheck,
    },
];

export default async function TeacherCourseReportsPage({
    params,
}: TeacherCourseReportsPageProps) {
    const { courseId } = await params;

    return (
        <section className="min-h-screen bg-slate-50 px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-[1500px] space-y-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <Link
                        href={`/teacher/courses/${courseId}/modules`}
                        className="inline-flex w-fit items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Volver al curso
                    </Link>

                    <button
                        type="button"
                        className="inline-flex h-11 w-fit items-center justify-center gap-2 rounded-2xl bg-[#172861] px-4 text-sm font-black text-white shadow-sm transition hover:bg-[#0f1d48]"
                    >
                        <RefreshCcw className="h-4 w-4" />
                        Actualizar reportes
                    </button>
                </div>

                <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#07111F] via-[#172861] via-70% to-[#F97316] p-6 text-white shadow-lg">
                    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
                        <div>
                            <p className="text-sm font-black uppercase tracking-[0.28em] text-blue-100">
                                Panel del profesor
                            </p>

                            <h1 className="mt-3 text-3xl font-black md:text-4xl">
                                Reportes del curso
                            </h1>

                            <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-blue-50">
                                Consulta reportes generados únicamente con la
                                información de este curso: calificaciones,
                                asistencia, contenidos, archivos MDT y
                                certificados.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:min-w-[620px]">
                            {summaryCards.map((item) => {
                                const Icon = item.icon;

                                return (
                                    <div
                                        key={item.label}
                                        className="rounded-2xl bg-white/15 p-4 shadow-sm backdrop-blur"
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-white/75">
                                                {item.label}
                                            </p>

                                            <Icon className="h-5 w-5 text-white/80" />
                                        </div>

                                        <p className="mt-2 text-3xl font-black">
                                            {item.value}
                                        </p>

                                        <p className="text-xs font-bold text-white/80">
                                            {item.description}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
                        <div>
                            <h2 className="text-xl font-black text-slate-950">
                                Reportes disponibles
                            </h2>

                            <p className="mt-1 text-sm font-semibold text-slate-500">
                                Esta vista corresponde solo al curso seleccionado.
                                El administrador tendrá una vista general de todos
                                los cursos.
                            </p>
                        </div>

                    </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {reportCards.map((report) => {
                        const Icon = report.icon;
                        const isAvailable = report.status === "Disponible";

                        return (
                            <article
                                key={report.title}
                                className="group overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                            >
                                <div className="p-5">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-[#172861]">
                                            <Icon className="h-7 w-7" />
                                        </div>

                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-black ${isAvailable
                                                    ? "bg-emerald-50 text-emerald-700"
                                                    : "bg-orange-50 text-orange-700"
                                                }`}
                                        >
                                            {report.status}
                                        </span>
                                    </div>

                                    <div className="mt-5">
                                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                                            {report.tag}
                                        </span>

                                        <h3 className="mt-4 text-xl font-black text-slate-950">
                                            {report.title}
                                        </h3>

                                        <p className="mt-2 min-h-[72px] text-sm font-semibold leading-6 text-slate-500">
                                            {report.description}
                                        </p>
                                    </div>

                                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                                        <button
                                            type="button"
                                            disabled={!isAvailable}
                                            className={`inline-flex h-11 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-black shadow-sm transition ${isAvailable
                                                    ? "bg-[#172861] text-white hover:bg-[#0f1d48]"
                                                    : "cursor-not-allowed bg-slate-100 text-slate-400"
                                                }`}
                                        >
                                            <BarChart3 className="h-4 w-4" />
                                            Ver reporte
                                        </button>

                                        <button
                                            type="button"
                                            disabled={!isAvailable}
                                            className={`inline-flex h-11 items-center justify-center gap-2 rounded-2xl border px-4 text-sm font-black transition ${isAvailable
                                                    ? "border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100"
                                                    : "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400"
                                                }`}
                                        >
                                            <Download className="h-4 w-4" />
                                            Descargar
                                        </button>
                                    </div>
                                </div>

                                <div className="border-t border-slate-100 bg-slate-50 px-5 py-4">
                                    <div className="flex items-center justify-between gap-3 text-xs font-black text-slate-500">
                                        <span className="inline-flex items-center gap-2">
                                            <ShieldCheck className="h-4 w-4 text-[#172861]" />
                                            Solo este curso
                                        </span>

                                        <span className="inline-flex items-center gap-2">
                                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                            Vista previa
                                        </span>
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </div>

            </div>
        </section>
    );
}