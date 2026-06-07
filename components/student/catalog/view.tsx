"use client";

import { useStudentCatalog } from "./hook";
import { CatalogAlert } from "./ui/CatalogAlert";
import { CatalogCoursesGrid } from "./ui/CatalogCoursesGrid";
import { CatalogHeader } from "./ui/CatalogHeader";
import { CatalogToolbar } from "./ui/CatalogToolbar";
import { LoadingState } from "./ui/LoadingState";

export function StudentCatalogView() {
    const catalog =
        useStudentCatalog();

    if (catalog.loading) {
        return (
            <section className="min-h-screen overflow-x-hidden bg-slate-50 text-slate-950">
                <LoadingState />
            </section>
        );
    }

    return (
        <section className="min-h-screen overflow-x-hidden bg-slate-50 px-3 py-4 text-slate-950 sm:px-5 md:px-6 lg:px-8 [@media(max-height:760px)]:py-3">
            <div className="mx-auto w-full min-w-0 max-w-[1500px] space-y-4 sm:space-y-5">
                <CatalogHeader
                    catalog={
                        catalog
                    }
                />

                <CatalogAlert
                    message={
                        catalog.error
                    }
                />

                <CatalogToolbar
                    catalog={
                        catalog
                    }
                />

                <CatalogCoursesGrid
                    catalog={
                        catalog
                    }
                />
            </div>
        </section>
    );
}

export default StudentCatalogView;