import type {
    CourseStats,
} from "../types";

type CoursesHeroProps = {
    isLoading:
        boolean;
    stats:
        CourseStats;
};

const statItems: Array<{
    key:
        keyof Pick<
            CourseStats,
            | "total"
            | "published"
            | "free"
            | "mdt"
        >;
    label:
        string;
}> = [
    {
        key: "total",
        label: "Total",
    },
    {
        key: "published",
        label: "Publicados",
    },
    {
        key: "free",
        label: "Gratis",
    },
    {
        key: "mdt",
        label: "MDT",
    },
];

export function CoursesHero({
    isLoading,
    stats,
}: CoursesHeroProps) {
    return (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#07111F] via-[#172861] via-70% to-[#F97316] p-4 text-white shadow-lg sm:rounded-3xl sm:p-5 lg:p-6 [@media(max-height:760px)]:p-4">
            <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(500px,620px)] xl:items-start xl:gap-6">
                <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-100 sm:text-xs sm:tracking-[0.25em] lg:text-sm">
                        Gestión de cursos
                    </p>

                    <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl lg:text-[34px] [@media(max-height:760px)]:text-2xl">
                        Cursos
                    </h1>

                    <p className="mt-2 max-w-3xl text-xs font-semibold leading-5 text-blue-50 sm:text-sm sm:leading-6 [@media(max-height:760px)]:text-xs [@media(max-height:760px)]:leading-5">
                        Administra, crea, edita y publica cursos. También
                        puedes asignar docentes y organizar cada curso por
                        categoría y subcategoría.
                    </p>
                </div>

                <div className="grid w-full grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
                    {statItems.map(
                        (
                            item,
                        ) => (
                            <div
                                key={
                                    item.key
                                }
                                className="min-w-0 rounded-xl bg-white/15 p-3 ring-1 ring-white/20 sm:rounded-2xl sm:p-4 [@media(max-height:760px)]:p-3"
                            >
                                <p className="truncate text-[10px] font-black uppercase tracking-wide text-white/75 sm:text-xs">
                                    {
                                        item.label
                                    }
                                </p>

                                <p className="mt-1.5 text-2xl font-black sm:mt-2 sm:text-3xl [@media(max-height:760px)]:text-2xl">
                                    {isLoading
                                        ? "..."
                                        : stats[
                                              item.key
                                          ]}
                                </p>
                            </div>
                        ),
                    )}
                </div>
            </div>
        </div>
    );
}

export default CoursesHero;
