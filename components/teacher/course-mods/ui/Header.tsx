import { Layers3 } from "lucide-react";

type HeaderProps = {
    selectedCourseName: string;
    modulesCount: number;
};

export function Header({
    selectedCourseName,
    modulesCount,
}: HeaderProps) {
    return (
        <div className="bg-gradient-to-br from-[#07111F] via-[#172861] via-70% to-[#F97316] px-4 py-5 text-white sm:px-5 sm:py-6 lg:px-6 [@media(max-height:760px)]:py-4">
            <div className="grid min-w-0 gap-4 sm:grid-cols-[minmax(0,1fr)_112px] sm:items-center lg:grid-cols-[minmax(0,1fr)_132px]">
                <div className="min-w-0">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-blue-100 sm:px-3 sm:text-[10px] lg:text-xs">
                        <Layers3 className="h-3.5 w-3.5 shrink-0" />
                        Estructura MOOC
                    </div>

                    <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-white sm:text-3xl lg:text-4xl [@media(max-height:760px)]:text-2xl">
                        Módulos del curso
                    </h1>

                    <p className="mt-2 max-w-3xl text-xs leading-5 text-blue-50 sm:text-sm sm:leading-6 lg:text-base [@media(max-height:760px)]:text-xs [@media(max-height:760px)]:leading-5">
                        Curso seleccionado:{" "}
                        <span className="font-bold text-white">
                            {selectedCourseName}
                        </span>
                        . Organiza el curso por módulos, lecciones y bloques de
                        aprendizaje.
                    </p>
                </div>

                <div className="w-fit rounded-xl bg-white/15 px-4 py-3 text-white ring-1 ring-white/20 sm:w-full sm:rounded-2xl sm:px-4 sm:py-4 [@media(max-height:760px)]:py-3">
                    <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-blue-100 sm:text-[10px] lg:text-xs">
                        Total módulos
                    </p>

                    <p className="mt-1 text-2xl font-black sm:mt-2 sm:text-3xl">
                        {modulesCount}
                    </p>
                </div>
            </div>
        </div>
    );
}
