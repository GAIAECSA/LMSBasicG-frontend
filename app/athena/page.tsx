import Image from "next/image";
import Link from "next/link";
import {
    ArrowLeft,
    ArrowRight,
    BookOpenCheck,
    CheckCircle2,
    GraduationCap,
    Laptop,
    LogIn,
    ShieldCheck,
    Sparkles,
    UsersRound,
} from "lucide-react";

const benefits = [
    {
        title: "Cursos disponibles",
        description:
            "Explora capacitaciones organizadas para fortalecer tus habilidades personales y profesionales.",
        icon: BookOpenCheck,
    },
    {
        title: "Aprendizaje flexible",
        description:
            "Accede a los contenidos desde cualquier dispositivo y avanza según tu disponibilidad.",
        icon: Laptop,
    },
    {
        title: "Certificados verificables",
        description:
            "Obtén certificados digitales que pueden validarse mediante un código único y un código QR.",
        icon: ShieldCheck,
    },
];

const steps = [
    "Selecciona un curso disponible dentro del catálogo.",
    "Regístrate o inicia sesión en la plataforma.",
    "Completa las actividades asignadas por el docente.",
    "Obtén tu certificado digital al aprobar el curso.",
];

export default function AthenaPage() {
    return (
        <main className="min-h-screen overflow-x-hidden bg-[var(--background)] text-[var(--foreground)]">
            <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--card)]/95 shadow-sm backdrop-blur-xl">
                <div className="mx-auto flex h-[68px] max-w-[1360px] items-center justify-between gap-3 px-4 sm:h-[74px] sm:px-5 lg:h-[82px] lg:px-6 xl:px-8 2xl:px-0">
                    <Link
                        href="/"
                        className="flex min-w-0 items-center gap-2.5 sm:gap-3"
                    >
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] p-1.5 shadow-sm sm:h-12 sm:w-12 sm:rounded-2xl lg:h-14 lg:w-14 lg:p-2">
                            <Image
                                src="/images/athena.png"
                                alt="Logo ATHENA"
                                width={64}
                                height={64}
                                priority
                                className="h-full w-full object-contain"
                            />
                        </div>

                        <p className="text-lg font-black leading-none tracking-tight text-[var(--foreground)] sm:text-xl lg:text-2xl">
                            ATHENA
                        </p>
                    </Link>

                    <div className="flex items-center gap-2 sm:gap-3">
                        <Link
                            href="/"
                            className="hidden h-10 items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 text-xs font-black text-[var(--foreground)] transition hover:bg-[var(--secondary)] hover:text-[var(--primary)] sm:inline-flex lg:h-11 lg:px-5 lg:text-sm"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Catálogo
                        </Link>

                        <Link
                            href="/login"
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 text-xs font-black !text-white shadow-lg transition hover:-translate-y-0.5 hover:opacity-95 sm:h-11 sm:px-5 sm:text-sm"
                        >
                            <span className="hidden xs:inline">
                                Iniciar sesión
                            </span>

                            <span className="xs:hidden">Entrar</span>

                            <LogIn className="h-4 w-4" />
                        </Link>
                    </div>
                </div>
            </header>

            <section className="relative isolate overflow-hidden">
                <div className="pointer-events-none absolute inset-0 -z-10">
                    <div className="absolute left-[-160px] top-[80px] h-[420px] w-[420px] rounded-full bg-blue-200/40 blur-3xl" />
                    <div className="absolute right-[-190px] top-[40px] h-[520px] w-[520px] rounded-full bg-indigo-200/35 blur-3xl" />

                    <Image
                        src="/images/athena.png"
                        alt=""
                        width={620}
                        height={620}
                        aria-hidden="true"
                        className="absolute right-[-40px] top-1/2 hidden w-[390px] -translate-y-1/2 select-none object-contain opacity-[0.045] md:block lg:right-[3%] lg:w-[520px]"
                    />
                </div>

                <div className="mx-auto grid max-w-[1360px] gap-8 px-4 py-12 sm:px-5 sm:py-16 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:gap-12 lg:px-6 lg:py-20 xl:px-8 2xl:px-0">
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-full bg-[var(--secondary)] px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--primary)] sm:text-xs">
                            <Sparkles className="h-4 w-4" />
                            Sistema virtual de aprendizaje
                        </div>

                        <h1 className="mt-5 max-w-3xl text-[43px] font-black leading-[0.96] tracking-[-0.045em] text-[var(--foreground)] sm:text-[58px] lg:text-[68px] xl:text-[74px]">
                            Formación digital para{" "}
                            <span className="text-[var(--primary)]">
                                crecer y aprender
                            </span>
                        </h1>

                        <p className="mt-6 max-w-2xl text-sm font-medium leading-7 text-[var(--muted-foreground)] sm:text-base sm:leading-8">
                            ATHENA es una plataforma virtual de aprendizaje
                            diseñada para facilitar el acceso a cursos,
                            contenidos educativos, actividades académicas y
                            certificados digitales verificables.
                        </p>

                        <div className="mt-7 flex flex-wrap gap-3 sm:mt-8 sm:gap-4">
                            <Link
                                href="/"
                                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-5 text-xs font-black !text-white shadow-lg transition hover:-translate-y-0.5 hover:opacity-95 sm:h-14 sm:px-7 sm:text-sm"
                            >
                                Explorar cursos
                                <ArrowRight className="h-4 w-4" />
                            </Link>

                            <Link
                                href="/login"
                                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--card)] px-5 text-xs font-black text-[var(--foreground)] shadow-sm transition hover:-translate-y-0.5 hover:bg-[var(--secondary)] hover:text-[var(--primary)] sm:h-14 sm:px-7 sm:text-sm"
                            >
                                Acceder a ATHENA
                                <LogIn className="h-4 w-4" />
                            </Link>
                        </div>
                    </div>

                    <div className="relative mx-auto w-full max-w-[520px]">
                        <div
                            className="relative overflow-hidden rounded-[30px] p-[1px] shadow-[0_24px_75px_rgba(0,61,143,0.20)]"
                            style={{
                                background: "var(--gradient-primary)",
                            }}
                        >
                            <div className="relative overflow-hidden rounded-[29px] bg-[var(--card)] px-5 py-7 sm:px-7 sm:py-8">
                                <div className="absolute -right-12 -top-10 h-44 w-44 rounded-full bg-blue-100/70 blur-2xl" />
                                <div className="absolute -bottom-16 -left-12 h-40 w-40 rounded-full bg-indigo-100/60 blur-2xl" />

                                <div className="relative">
                                    <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[26px] border border-[var(--border)] bg-[var(--card)] p-3 shadow-sm sm:h-28 sm:w-28">
                                        <Image
                                            src="/images/athena.png"
                                            alt="Logo ATHENA"
                                            width={112}
                                            height={112}
                                            priority
                                            className="h-full w-full object-contain"
                                        />
                                    </div>

                                    <div className="mt-5 text-center">
                                        <h2 className="text-3xl font-black tracking-[-0.03em] text-[var(--foreground)]">
                                            ATHENA
                                        </h2>

                                        <p className="mt-2 text-sm font-semibold leading-6 text-[var(--muted-foreground)]">
                                            Conocimiento accesible, aprendizaje
                                            continuo y certificación digital.
                                        </p>
                                    </div>

                                    <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-3">
                                        <div className="rounded-2xl bg-[var(--secondary)] px-2 py-4 text-center">
                                            <BookOpenCheck className="mx-auto h-5 w-5 text-[var(--primary)]" />

                                            <p className="mt-2 text-[10px] font-black uppercase tracking-wide text-[var(--primary)]">
                                                Cursos
                                            </p>
                                        </div>

                                        <div className="rounded-2xl bg-[var(--secondary)] px-2 py-4 text-center">
                                            <UsersRound className="mx-auto h-5 w-5 text-[var(--primary)]" />

                                            <p className="mt-2 text-[10px] font-black uppercase tracking-wide text-[var(--primary)]">
                                                Comunidad
                                            </p>
                                        </div>

                                        <div className="rounded-2xl bg-[var(--secondary)] px-2 py-4 text-center">
                                            <ShieldCheck className="mx-auto h-5 w-5 text-[var(--primary)]" />

                                            <p className="mt-2 text-[10px] font-black uppercase tracking-wide text-[var(--primary)]">
                                                Certificados
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="border-y border-[var(--border)] bg-[var(--card)]">
                <div className="mx-auto max-w-[1360px] px-4 py-12 sm:px-5 sm:py-16 lg:px-6 xl:px-8 2xl:px-0">
                    <div className="mx-auto max-w-3xl text-center">
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--primary)]">
                            Nuestra plataforma
                        </p>

                        <h2 className="mt-3 text-3xl font-black tracking-[-0.035em] text-[var(--foreground)] sm:text-4xl">
                            Aprende de forma sencilla con ATHENA
                        </h2>

                        <p className="mt-4 text-sm font-medium leading-7 text-[var(--muted-foreground)] sm:text-base">
                            La plataforma reúne las herramientas necesarias
                            para que estudiantes y docentes gestionen el proceso
                            de aprendizaje desde un mismo lugar.
                        </p>
                    </div>

                    <div className="mt-8 grid gap-4 md:grid-cols-3 lg:mt-10 lg:gap-5">
                        {benefits.map((benefit) => {
                            const Icon = benefit.icon;

                            return (
                                <article
                                    key={benefit.title}
                                    className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg sm:p-6"
                                >
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--secondary)] text-[var(--primary)]">
                                        <Icon className="h-6 w-6" />
                                    </div>

                                    <h3 className="mt-5 text-lg font-black text-[var(--foreground)]">
                                        {benefit.title}
                                    </h3>

                                    <p className="mt-2 text-sm font-medium leading-6 text-[var(--muted-foreground)]">
                                        {benefit.description}
                                    </p>
                                </article>
                            );
                        })}
                    </div>
                </div>
            </section>

            <section className="relative overflow-hidden">
                <div className="mx-auto grid max-w-[1360px] gap-8 px-4 py-12 sm:px-5 sm:py-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-12 lg:px-6 xl:px-8 2xl:px-0">
                    <div>
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--secondary)] text-[var(--primary)]">
                            <GraduationCap className="h-7 w-7" />
                        </div>

                        <p className="mt-5 text-xs font-black uppercase tracking-[0.2em] text-[var(--primary)]">
                            Proceso de aprendizaje
                        </p>

                        <h2 className="mt-3 text-3xl font-black tracking-[-0.035em] text-[var(--foreground)] sm:text-4xl">
                            Empieza tu capacitación en pocos pasos
                        </h2>

                        <p className="mt-4 text-sm font-medium leading-7 text-[var(--muted-foreground)] sm:text-base">
                            Explora el catálogo público, selecciona la
                            capacitación que necesitas y completa tu proceso
                            académico dentro de la plataforma.
                        </p>
                    </div>

                    <div className="grid gap-3 sm:gap-4">
                        {steps.map((step, index) => (
                            <div
                                key={step}
                                className="flex items-start gap-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-4 shadow-sm sm:px-5"
                            >
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)] text-sm font-black text-[var(--primary-foreground)]">
                                    {index + 1}
                                </div>

                                <div className="flex min-w-0 items-start gap-2 pt-1">
                                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--success)]" />

                                    <p className="text-sm font-semibold leading-6 text-[var(--foreground)]">
                                        {step}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="px-4 pb-12 sm:px-5 sm:pb-16 lg:px-6 xl:px-8">
                <div
                    className="mx-auto flex max-w-[1360px] flex-col items-start justify-between gap-5 overflow-hidden rounded-[28px] px-5 py-7 shadow-lg sm:px-7 sm:py-8 md:flex-row md:items-center lg:px-9"
                    style={{
                        background: "var(--gradient-primary)",
                    }}
                >
                    <div>
                        <h2 className="text-2xl font-black tracking-[-0.025em] text-white sm:text-3xl">
                            Comienza a aprender con ATHENA
                        </h2>

                        <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-blue-100">
                            Revisa nuestro catálogo de cursos y accede a nuevas
                            oportunidades de capacitación.
                        </p>
                    </div>

                    <Link
                        href="/"
                        className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-black text-[var(--primary)] shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-50"
                    >
                        Ver cursos disponibles
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>
            </section>

            <footer className="border-t border-[var(--border)] bg-[var(--card)]">
                <div className="mx-auto flex max-w-[1360px] flex-col gap-2 px-4 py-5 text-center text-xs font-semibold text-[var(--muted-foreground)] sm:px-5 md:flex-row md:items-center md:justify-between md:text-left lg:px-6 xl:px-8 2xl:px-0">
                    <p>ATHENA · Sistema virtual de aprendizaje</p>

                    <p>Formación digital y certificación verificable</p>
                </div>
            </footer>
        </main>
    );
}