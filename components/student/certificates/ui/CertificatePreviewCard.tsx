"use client";

import {
    Award,
    Building2,
    FileBadge2,
    Sparkles,
} from "lucide-react";
import type { CertificateWithExtraFields } from "../types";
import {
    getCertificateType,
    getCertificateTypeLabel,
    getCourseName,
} from "../utils";

type CertificatePreviewCardProps = {
    certificate: CertificateWithExtraFields;
};

export function CertificatePreviewCard({
    certificate,
}: CertificatePreviewCardProps) {
    const certificateType = getCertificateType(certificate);
    const certificateTypeLabel = getCertificateTypeLabel(certificate);
    const courseName = getCourseName(certificate);

    const isMdt = certificateType === "mdt";

    const accentClasses = isMdt
        ? {
            panel: "from-blue-50 via-white to-indigo-50",
            line: "bg-blue-600",
            softLine: "bg-blue-200",
            text: "text-blue-700",
            iconBackground: "bg-blue-100",
            ring: "ring-blue-200",
            seal: "bg-blue-600 text-white ring-blue-200",
            corner: "bg-blue-600",
            cornerSoft: "bg-blue-400",
        }
        : {
            panel: "from-violet-50 via-white to-purple-50",
            line: "bg-violet-600",
            softLine: "bg-violet-200",
            text: "text-violet-700",
            iconBackground: "bg-violet-100",
            ring: "ring-violet-200",
            seal: "bg-violet-600 text-white ring-violet-200",
            corner: "bg-violet-600",
            cornerSoft: "bg-violet-400",
        };

    return (
        <aside className="min-w-0 self-stretch">
            {/*
             * En dispositivos pequeños se define una altura cómoda.
             * Desde xl, la altura depende únicamente de la columna izquierda.
             */}
            <div className="relative h-[220px] overflow-hidden rounded-[18px] border border-[var(--border)] bg-[var(--muted)]/25 xl:h-full xl:min-h-0">
                {/*
                 * El bloque absoluto evita que el contenido de la vista previa
                 * aumente la altura de la fila del grid.
                 */}
                <div
                    className={`absolute inset-3 overflow-hidden rounded-[15px] border border-slate-200 bg-gradient-to-br ${accentClasses.panel} px-4 py-3 shadow-[0_10px_24px_rgba(15,23,42,0.09)]`}
                >
                    <div
                        className={`absolute -right-9 -top-12 h-24 w-36 rotate-12 rounded-[24px] ${accentClasses.corner}`}
                    />

                    <div
                        className={`absolute -right-14 -top-4 h-16 w-40 rotate-12 rounded-[24px] ${accentClasses.cornerSoft} opacity-60`}
                    />

                    <div className="absolute -bottom-14 -left-14 h-28 w-36 rounded-full border-[12px] border-white/70" />

                    <div className="absolute inset-2 rounded-[12px] border border-white/80" />

                    <div className="relative z-10 flex h-full flex-col">
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                                <div
                                    className={`flex h-7 w-7 items-center justify-center rounded-lg ${accentClasses.iconBackground} ${accentClasses.text}`}
                                >
                                    <Sparkles className="h-3.5 w-3.5" />
                                </div>

                                <div>
                                    <p className="text-[9px] font-black tracking-[0.14em] text-slate-800">
                                        GAIA
                                    </p>

                                    <p className="text-[6px] font-black tracking-[0.1em] text-slate-500">
                                        BY ATHENA
                                    </p>
                                </div>
                            </div>

                            <div
                                className={`mr-3 inline-flex max-w-[150px] items-center gap-1 truncate rounded-full bg-white/90 px-2 py-1 text-[7px] font-black shadow-sm ring-1 ${accentClasses.ring} ${accentClasses.text}`}
                            >
                                {isMdt ? (
                                    <FileBadge2 className="h-2.5 w-2.5 shrink-0" />
                                ) : (
                                    <Building2 className="h-2.5 w-2.5 shrink-0" />
                                )}

                                <span className="truncate">
                                    {certificateTypeLabel}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-1 flex-col items-center justify-center px-3 text-center">
                            <p
                                className={`text-[8px] font-black uppercase tracking-[0.22em] ${accentClasses.text}`}
                            >
                                Certificado
                            </p>

                            <p className="mt-0.5 text-[6px] font-bold uppercase tracking-[0.14em] text-slate-500">
                                Reconocimiento de finalización
                            </p>

                            <div
                                className={`mt-2 h-0.5 w-12 rounded-full ${accentClasses.line}`}
                            />

                            <p className="mt-2 text-[7px] font-semibold leading-3 text-slate-500">
                                Por haber completado satisfactoriamente el curso
                            </p>

                            <h3
                                title={courseName}
                                className={`mt-1 line-clamp-1 max-w-[260px] text-sm font-black leading-5 ${accentClasses.text}`}
                            >
                                {courseName}
                            </h3>

                            <div
                                className={`mt-2 h-1 w-20 rounded-full ${accentClasses.softLine}`}
                            />
                        </div>

                        <div className="flex items-end justify-between">
                            <div className="space-y-1">
                                <div className="h-px w-16 bg-slate-400" />

                                <p className="text-[6px] font-bold text-slate-500">
                                    Dirección Académica
                                </p>
                            </div>

                            <div
                                className={`flex h-10 w-10 items-center justify-center rounded-full shadow-md ring-4 ${accentClasses.seal}`}
                            >
                                <Award className="h-5 w-5" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
}