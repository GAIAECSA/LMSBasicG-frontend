"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";

type ToolbarProps = {
    backHref: string;
    editorHref: string;
    refreshing: boolean;
    onRefresh: () => Promise<void>;
};

export function Toolbar({ backHref }: ToolbarProps) {
    const pathname = usePathname();

    const isAdminRoute = pathname.startsWith("/admin/modules");

    const adminCourseIdMatch = pathname.match(
        /^\/admin\/modules\/([^/]+)/,
    );

    const adminBackHref = adminCourseIdMatch?.[1]
        ? `/admin/modules/${adminCourseIdMatch[1]}`
        : "/admin/modules";

    const finalBackHref = isAdminRoute
        ? adminBackHref
        : backHref;

    return (
        <div className="flex min-w-0 flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:rounded-[2rem] sm:p-4 [@media(max-height:760px)]:p-3">
            <Link
                href={finalBackHref}
                className="inline-flex h-10 w-fit max-w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.97] sm:rounded-2xl sm:px-4 sm:text-sm"
            >
                <ArrowLeft className="h-4 w-4 shrink-0" />

                <span className="truncate">
                    Volver a módulos
                </span>
            </Link>
        </div>
    );
}

export default Toolbar;
