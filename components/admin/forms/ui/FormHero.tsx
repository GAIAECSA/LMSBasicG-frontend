import Link from "next/link";

import { ArrowLeft } from "lucide-react";

export function FormHero({
    title,
    description,
}: {
    title: string;
    description: string;
}) {
    return (
        <div className="no-print relative overflow-hidden rounded-[28px] bg-gradient-to-r from-[#071a3c] via-[#17316c] to-[#f17935] px-7 py-7 text-white">

            <div className="flex items-center justify-between gap-5">

                <div>
                    <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em]">
                        Administración / Formularios
                    </p>

                    <h1 className="text-2xl font-black sm:text-3xl">
                        {title}
                    </h1>

                    <p className="mt-2 text-sm text-white/80">
                        {description}
                    </p>
                </div>

                <Link
                    href="/admin/forms"
                    className="flex shrink-0 items-center gap-2 rounded-xl border border-white/20 bg-white/15 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/25"
                >
                    <ArrowLeft
                        size={18}
                    />

                    Volver a formularios
                </Link>

            </div>
        </div>
    );
}