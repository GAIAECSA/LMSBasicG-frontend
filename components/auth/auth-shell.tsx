"use client";

import Image from "next/image";
import Link from "next/link";
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

function ArrowLeftIcon() {
    return (
        <svg
            aria-hidden="true"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2.2"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 19.5 8.25 12l7.5-7.5"
            />
        </svg>
    );
}

function LockIcon() {
    return (
        <svg
            aria-hidden="true"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 0 0-9 0v3.75m-.75 0h10.5A2.25 2.25 0 0 1 19.5 12.75v6A2.25 2.25 0 0 1 17.25 21H6.75A2.25 2.25 0 0 1 4.5 18.75v-6a2.25 2.25 0 0 1 2.25-2.25Z"
            />
        </svg>
    );
}

function WalkingMascot() {
    const frames = useMemo(() => buildFrames(), []);
    const [frame, setFrame] = useState(0);

    useEffect(() => {
        const interval = window.setInterval(() => {
            setFrame((previousFrame) => {
                return (previousFrame + 1) % frames.length;
            });
        }, 120);

        return () => window.clearInterval(interval);
    }, [frames.length]);

    return (
        <div className="relative h-[64px] w-[64px] sm:h-[76px] sm:w-[76px] lg:h-[82px] lg:w-[82px] 2xl:h-[92px] 2xl:w-[92px] [@media(max-height:760px)]:h-[58px] [@media(max-height:760px)]:w-[58px]">
            <Image
                key={frames[frame]}
                src={frames[frame]}
                alt="Mascota animada"
                fill
                sizes="(max-width: 640px) 64px, (max-width: 1024px) 76px, (max-width: 1536px) 82px, 92px"
                className="object-contain drop-shadow-[0_12px_22px_rgba(15,23,42,0.22)]"
                priority
                unoptimized
            />
        </div>
    );
}

export function AuthShell({
    active,
    children,
}: AuthShellProps) {
    const tabBase =
        "flex h-10 items-center justify-center rounded-xl px-3 text-xs font-semibold transition-all sm:h-11 sm:rounded-2xl sm:px-4 sm:text-sm [@media(max-height:760px)]:h-9 [@media(max-height:760px)]:text-xs";

    const tabActive =
        "bg-white text-slate-950 shadow-sm";

    const tabInactive =
        "text-slate-500 hover:bg-white/50 hover:text-slate-800";

    return (
        <main className="min-h-[100dvh] bg-[#eef4fb] lg:grid lg:h-[100dvh] lg:grid-cols-[52%_48%] lg:overflow-hidden xl:grid-cols-[54%_46%]">
            {/* Panel ilustrado */}
            <section className="relative hidden h-[100dvh] overflow-hidden bg-[#2b5fbe] lg:block">
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{
                        backgroundImage:
                            "url('/images/login-hero.jpg')",
                    }}
                />

                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(20,45,100,0.56),rgba(42,95,190,0.36))]" />

                <div className="absolute -left-28 bottom-[-110px] h-[430px] w-[430px] rounded-full border border-white/20 bg-[rgba(27,78,180,0.22)]" />

                <div className="absolute left-10 top-24 h-40 w-40 rounded-full border border-white/20 bg-white/10 [@media(max-height:760px)]:top-16 [@media(max-height:760px)]:h-32 [@media(max-height:760px)]:w-32" />

                <div className="absolute right-[-120px] top-[-40px] h-[420px] w-[420px] rounded-full bg-white/20 [@media(max-height:760px)]:h-[340px] [@media(max-height:760px)]:w-[340px]" />

                <div className="absolute right-20 top-16 h-[320px] w-[320px] rounded-full bg-white/10 [@media(max-height:760px)]:right-12 [@media(max-height:760px)]:top-10 [@media(max-height:760px)]:h-[250px] [@media(max-height:760px)]:w-[250px]" />

                <div className="absolute bottom-20 right-28 h-[240px] w-[240px] rounded-full border border-white/15 bg-white/10 [@media(max-height:760px)]:bottom-10 [@media(max-height:760px)]:right-16 [@media(max-height:760px)]:h-[180px] [@media(max-height:760px)]:w-[180px]" />

                <div className="relative z-10 flex h-full flex-col justify-between p-8 text-white xl:p-10 2xl:p-14 [@media(max-height:760px)]:p-6">
                    <div>
                        <span className="inline-flex rounded-full border border-white/20 bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/95 backdrop-blur-sm [@media(max-height:760px)]:text-[10px]">
                            Plataforma educativa
                        </span>

                        <h1 className="mt-5 max-w-[min(92%,540px)] text-[clamp(2rem,3vw,3.25rem)] font-bold leading-[1.08] tracking-[-0.02em] [@media(max-height:760px)]:mt-4 [@media(max-height:760px)]:max-w-[480px] [@media(max-height:760px)]:text-[2.15rem]">
                            Administra cursos, tareas y
                            aprendizaje en un solo lugar.
                        </h1>
                    </div>
                </div>
            </section>

            {/* Panel de autenticación */}
            <section className="relative min-h-[100dvh] overflow-x-hidden lg:h-[100dvh] lg:min-h-0 lg:overflow-y-auto">
                <div className="absolute inset-0 bg-[linear-gradient(180deg,#eef4fb_0%,#e6eff8_100%)]" />

                <div className="absolute -right-16 top-[-40px] h-48 w-48 rounded-full bg-white/80 sm:h-64 sm:w-64 lg:h-72 lg:w-72 [@media(max-height:760px)]:h-52 [@media(max-height:760px)]:w-52" />

                <div className="absolute left-[-60px] top-20 h-44 w-44 rounded-full bg-[rgba(247,216,216,0.8)] sm:h-56 sm:w-56 lg:h-64 lg:w-64 [@media(max-height:760px)]:top-12 [@media(max-height:760px)]:h-48 [@media(max-height:760px)]:w-48" />

                <div className="absolute bottom-[-60px] left-1/4 h-56 w-56 rounded-full bg-[rgba(247,216,215,0.92)] sm:h-72 sm:w-72 lg:h-80 lg:w-80 [@media(max-height:760px)]:h-56 [@media(max-height:760px)]:w-56" />

                <div className="absolute right-4 top-1/3 hidden h-56 w-56 rounded-full bg-[rgba(246,233,233,0.95)] sm:block lg:right-10 lg:h-72 lg:w-72 [@media(max-height:760px)]:h-52 [@media(max-height:760px)]:w-52" />

                <div className="absolute left-1/3 top-12 hidden h-40 w-40 rounded-full bg-[rgba(247,216,215,0.95)] sm:block lg:h-56 lg:w-56 [@media(max-height:760px)]:h-44 [@media(max-height:760px)]:w-44" />

                <div className="relative z-10 flex min-h-[100dvh] justify-center px-3 sm:px-6 lg:min-h-full lg:px-6 xl:px-8 2xl:px-10">
                    <div className="my-auto w-full max-w-[560px] py-4 sm:py-6 lg:max-w-[470px] lg:py-5 [@media(max-height:760px)]:py-3">
                        <div className="mb-4 flex flex-col items-center gap-3 sm:mb-5 sm:gap-4 [@media(max-height:760px)]:mb-3 [@media(max-height:760px)]:gap-2">
                            <div className="relative flex h-24 w-24 shrink-0 items-center justify-center sm:h-28 sm:w-28 lg:h-28 lg:w-28 2xl:h-32 2xl:w-32 [@media(max-height:760px)]:h-20 [@media(max-height:760px)]:w-20">
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

                            {active === "forgot" ? (
                                <div className="w-full rounded-[20px] border border-white/70 bg-white/70 p-1.5 shadow-[0_12px_40px_rgba(15,23,42,0.08)] backdrop-blur-sm sm:rounded-[24px] sm:p-2 [@media(max-height:760px)]:rounded-2xl [@media(max-height:760px)]:p-1">
                                    <div className="flex h-10 items-center justify-between gap-2 rounded-xl bg-white px-3 shadow-sm sm:h-11 sm:rounded-2xl sm:px-4 [@media(max-height:760px)]:h-9 [@media(max-height:760px)]:px-3">
                                        <div className="flex min-w-0 items-center gap-2 text-xs font-semibold text-slate-800 sm:text-sm [@media(max-height:760px)]:text-xs">
                                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-[#edf4ff] text-[#2457b8]">
                                                <LockIcon />
                                            </span>

                                            <span className="truncate">
                                                Recuperación de acceso
                                            </span>
                                        </div>

                                        <Link
                                            href="/login"
                                            className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-[#3a63c8] transition hover:text-[#244aab]"
                                        >
                                            <ArrowLeftIcon />
                                            Volver
                                        </Link>
                                    </div>
                                </div>
                            ) : (
                                <div className="w-full rounded-[20px] border border-white/70 bg-white/70 p-1.5 shadow-[0_12px_40px_rgba(15,23,42,0.08)] backdrop-blur-sm sm:rounded-[24px] sm:p-2 [@media(max-height:760px)]:rounded-2xl [@media(max-height:760px)]:p-1">
                                    <div className="grid grid-cols-2 gap-1">
                                        <Link
                                            href="/login"
                                            aria-current={
                                                active === "login"
                                                    ? "page"
                                                    : undefined
                                            }
                                            className={`${tabBase} ${active === "login"
                                                    ? tabActive
                                                    : tabInactive
                                                }`}
                                        >
                                            Iniciar sesión
                                        </Link>

                                        <Link
                                            href="/register"
                                            aria-current={
                                                active === "register"
                                                    ? "page"
                                                    : undefined
                                            }
                                            className={`${tabBase} ${active === "register"
                                                    ? tabActive
                                                    : tabInactive
                                                }`}
                                        >
                                            Registro
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>

                        {children}
                    </div>
                </div>
            </section>
        </main>
    );
}