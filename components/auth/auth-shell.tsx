"use client";

import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

type AuthView = "login" | "register" | "forgot";

interface AuthShellProps {
    active: AuthView;
    children: ReactNode;
}

const TOTAL_FRAMES = 24;

function buildFrames() {
    return Array.from({ length: TOTAL_FRAMES }, (_, index) => {
        const frameNumber = String(index + 1).padStart(2, "0");
        return `/images/frames/frame_${frameNumber}.png`;
    });
}

function WalkingMascot() {
    const frames = useMemo(() => buildFrames(), []);
    const [frame, setFrame] = useState(0);

    useEffect(() => {
        const interval = window.setInterval(() => {
            setFrame((prev) => (prev + 1) % frames.length);
        }, 120);

        return () => window.clearInterval(interval);
    }, [frames.length]);

    return (
        <div className="relative h-[84px] w-[84px] sm:h-[104px] sm:w-[104px] lg:h-[110px] lg:w-[110px]">
            <Image
                key={frames[frame]}
                src={frames[frame]}
                alt="Mascota animada"
                fill
                sizes="(max-width: 640px) 84px, (max-width: 1024px) 104px, 110px"
                className="object-contain drop-shadow-[0_12px_22px_rgba(15,23,42,0.22)]"
                priority
                unoptimized
            />
        </div>
    );
}

export function AuthShell({ active, children }: AuthShellProps) {
    const tabBase =
        "flex h-11 items-center justify-center rounded-2xl px-4 text-sm font-semibold transition-all sm:h-12";
    const tabActive = "bg-white text-slate-950 shadow-sm";
    const tabInactive = "text-slate-500 hover:text-slate-800";

    return (
        <main className="min-h-screen bg-[#eef4fb] lg:grid lg:grid-cols-[1.08fr_0.92fr]">
            <section className="relative hidden overflow-hidden bg-[#2b5fbe] lg:block">
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: "url('/images/login-hero.jpg')" }}
                />

                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(20,45,100,0.56),rgba(42,95,190,0.36))]" />

                <div className="absolute -left-28 bottom-[-110px] h-[430px] w-[430px] rounded-full border border-white/20 bg-[rgba(27,78,180,0.22)]" />
                <div className="absolute left-10 top-24 h-40 w-40 rounded-full border border-white/20 bg-white/10" />
                <div className="absolute right-[-120px] top-[-40px] h-[420px] w-[420px] rounded-full bg-white/20" />
                <div className="absolute right-20 top-16 h-[320px] w-[320px] rounded-full bg-white/10" />
                <div className="absolute right-28 bottom-20 h-[240px] w-[240px] rounded-full border border-white/15 bg-white/10" />

                <div className="relative z-10 flex h-full flex-col justify-between p-10 text-white xl:p-14">
                    <div>
                        <span className="inline-flex rounded-full border border-white/20 bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/95 backdrop-blur-sm">
                            Plataforma educativa
                        </span>

                        <h1 className="mt-6 max-w-[480px] text-4xl font-bold leading-[1.08] xl:text-[52px]">
                            Administra cursos, tareas y aprendizaje en un solo
                            lugar.
                        </h1>
                    </div>
                </div>
            </section>

            <section className="relative flex min-h-screen items-start justify-center overflow-hidden px-4 py-6 sm:px-6 sm:py-8 lg:items-center lg:px-10 lg:py-10">
                <div className="absolute inset-0 bg-[linear-gradient(180deg,#eef4fb_0%,#e6eff8_100%)]" />
                <div className="absolute -right-16 top-[-40px] h-48 w-48 rounded-full bg-white/80 sm:h-64 sm:w-64 lg:h-72 lg:w-72" />
                <div className="absolute left-[-60px] top-20 h-44 w-44 rounded-full bg-[rgba(247,216,216,0.8)] sm:h-56 sm:w-56 lg:h-64 lg:w-64" />
                <div className="absolute bottom-[-60px] left-1/4 h-56 w-56 rounded-full bg-[rgba(247,216,215,0.92)] sm:h-72 sm:w-72 lg:h-80 lg:w-80" />
                <div className="absolute right-4 top-1/3 hidden h-56 w-56 rounded-full bg-[rgba(246,233,233,0.95)] sm:block lg:right-10 lg:h-72 lg:w-72" />
                <div className="absolute left-1/3 top-12 hidden h-40 w-40 rounded-full bg-[rgba(247,216,215,0.95)] sm:block lg:h-56 lg:w-56" />

                <div className="relative z-10 w-full max-w-[560px] lg:max-w-[470px]">
                    <div className="mb-6 lg:hidden">
                        <span className="inline-flex rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#3a5ea8] shadow-sm">
                            Plataforma educativa
                        </span>

                        <h1 className="mt-4 max-w-[420px] text-3xl font-bold leading-tight text-slate-900 sm:text-4xl">
                            Administra cursos, tareas y aprendizaje en un solo
                            lugar.
                        </h1>

                        <p className="mt-3 max-w-[420px] text-sm leading-6 text-slate-600">
                            Un acceso claro, moderno y profesional para tu LMS.
                        </p>
                    </div>

                    <div className="mb-5 flex flex-col items-center gap-3 sm:mb-6 sm:gap-4">
                        <div className="relative flex h-28 w-28 items-center justify-center sm:h-36 sm:w-36 lg:h-40 lg:w-40">
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Image
                                    src="/images/gaia.png"
                                    alt="Logo de fondo"
                                    width={260}
                                    height={260}
                                    className="h-full w-full object-contain opacity-95"
                                    priority
                                />
                            </div>

                            <div className="relative z-10">
                                <WalkingMascot />
                            </div>
                        </div>

                        <div className="w-full rounded-[24px] border border-white/70 bg-white/70 p-1.5 shadow-[0_12px_40px_rgba(15,23,42,0.08)] backdrop-blur-sm sm:rounded-[28px] sm:p-2">
                            <div className="grid grid-cols-2 gap-1">
                                <Link
                                    href="/login"
                                    className={`${tabBase} ${active === "login"
                                            ? tabActive
                                            : tabInactive
                                        }`}
                                >
                                    Iniciar sesión
                                </Link>

                                <Link
                                    href="/register"
                                    className={`${tabBase} ${active === "register"
                                            ? tabActive
                                            : tabInactive
                                        }`}
                                >
                                    Registro
                                </Link>
                            </div>
                        </div>
                    </div>

                    {active === "forgot" ? (
                        <div className="mb-4 text-right">
                            <Link
                                href="/login"
                                className="text-sm font-medium text-[#3a63c8] transition hover:text-[#244aab]"
                            >
                                Volver al inicio de sesión
                            </Link>
                        </div>
                    ) : null}

                    {children}
                </div>
            </section>
        </main>
    );
}