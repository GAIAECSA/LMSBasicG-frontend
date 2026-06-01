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

    const adminCourseIdMatch = pathname.match(/^\/admin\/modules\/([^/]+)/);

    const adminBackHref = adminCourseIdMatch?.[1]
        ? `/admin/modules/${adminCourseIdMatch[1]}`
        : "/admin/modules";

    const finalBackHref = isAdminRoute ? adminBackHref : backHref;

    return (
        <div className="flex flex-col gap-3 rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <Link
                href={finalBackHref}
                className="inline-flex w-fit items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
                <ArrowLeft className="h-4 w-4" />
                Volver a módulos
            </Link>
        </div>
    );
}

export default Toolbar;