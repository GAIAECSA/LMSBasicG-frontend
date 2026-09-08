import Link from "next/link";

import {
    Award,
    CalendarCheck,
    ClipboardCheck,
    ClipboardList,
    GraduationCap,
    Percent,
    UserCheck,
} from "lucide-react";

const FORM_OPTIONS = [
    {
        label: "Registro de inscripción con pagos",
        href: "/admin/forms/registration-payments",
        icon: ClipboardList,
    },
    {
        label: "Acta de entrega de certificados",
        href: "/admin/forms/certificate-delivery",
        icon: Award,
    },
    {
        label: "Asistencia de estudiantes",
        href: "/admin/forms/student-attendance",
        icon: CalendarCheck,
    },
    {
        label: "Asistencia del instructor",
        href: "/admin/forms/teacher-attendance",
        icon: UserCheck,
    },
    {
        label: "Notas diagnósticas",
        href: "/admin/forms/diagnostic-grades",
        icon: ClipboardCheck,
    },
    {
        label: "Notas finales",
        href: "/admin/forms/final-grades",
        icon: GraduationCap,
    },
    {
        label: "Porcentaje de asistencia",
        href: "/admin/forms/attendance-percentage",
        icon: Percent,
    },
];

export default function FormsPage() {
    return (
        <section className="min-h-screen bg-slate-50 px-3 py-3 text-slate-950 sm:px-4 sm:py-4 lg:px-5 xl:px-6 [@media(max-height:760px)]:py-3">
            <div className="mx-auto w-full max-w-[1450px] space-y-3 sm:space-y-4 [@media(max-height:760px)]:space-y-3">

                {/* HERO */}
                <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-r from-[#071a3c] via-[#17316c] to-[#f17935] px-6 py-7 text-white shadow-sm sm:px-7">
                    <div>
                        <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em]">
                            Administración
                        </p>

                        <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
                            Formularios
                        </h1>

                        <p className="mt-1 text-sm text-white/90">
                            Selecciona el formulario que deseas completar y generar.
                        </p>
                    </div>
                </div>

                {/* CONTENEDOR */}
                <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                    <div className="mb-4">
                        <h2 className="text-xl font-black text-slate-950">
                            Tipos de formularios
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Presiona una opción para seleccionar el formulario.
                        </p>
                    </div>

                    {/* GRID */}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                        {FORM_OPTIONS.map((form) => {
                            const Icon = form.icon;

                            return (
                                <Link
                                    key={form.href}
                                    href={form.href}
                                    className="
                                        group
                                        flex
                                        min-h-[138px]
                                        flex-col
                                        items-center
                                        justify-center
                                        rounded-2xl
                                        border
                                        border-slate-200
                                        bg-white
                                        px-4
                                        py-5
                                        text-center
                                        shadow-sm
                                        transition-all
                                        duration-200
                                        hover:-translate-y-0.5
                                        hover:border-blue-300
                                        hover:shadow-md
                                    "
                                >
                                    <div
                                        className="
                                            mb-4
                                            flex
                                            h-11
                                            w-11
                                            items-center
                                            justify-center
                                            rounded-xl
                                            bg-blue-50
                                            text-blue-900
                                            transition-colors
                                            group-hover:bg-blue-100
                                        "
                                    >
                                        <Icon
                                            size={21}
                                            strokeWidth={1.8}
                                        />
                                    </div>

                                    <span className="text-sm font-extrabold leading-snug text-slate-950">
                                        {form.label}
                                    </span>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
}