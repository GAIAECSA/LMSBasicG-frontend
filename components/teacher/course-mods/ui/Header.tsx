import { Layers3 } from "lucide-react";

type HeaderProps = {
    selectedCourseName: string;
    modulesCount: number;
};

export function Header({ selectedCourseName, modulesCount }: HeaderProps) {
    return (
        <div className="bg-gradient-to-br from-[#07111F] via-[#172861] via-70% to-[#F97316] px-6 py-8 text-white md:px-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-100">
                        <Layers3 className="h-3.5 w-3.5" />
                        Estructura MOOC
                    </div>

                    <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white md:text-4xl">
                        Módulos del curso
                    </h1>

                    <p className="mt-3 max-w-3xl text-sm leading-6 text-blue-50 md:text-base">
                        Curso seleccionado:{" "}
                        <span className="font-bold text-white">
                            {selectedCourseName}
                        </span>
                        . Organiza el curso por módulos, lecciones y bloques de
                        aprendizaje.
                    </p>
                </div>

                <div className="rounded-2xl bg-white/15 px-5 py-4 text-white ring-1 ring-white/20">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-100">
                        Total módulos
                    </p>

                    <p className="mt-2 text-3xl font-black">{modulesCount}</p>
                </div>
            </div>
        </div>
    );
}