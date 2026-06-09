import {
    CalendarDays,
    CirclePlay,
    Video,
} from "lucide-react";
import {
    ZoomLtiLauncher,
} from "./ZoomLtiLauncher";
import type {
    ZoomLtiCoursePanelProps,
} from "@/types/live-classes";

export function ZoomLtiCoursePanel({
    courseId,
    audience,
}: ZoomLtiCoursePanelProps) {
    const isTeacher =
        audience === "teacher";

    return (
        <section className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 bg-slate-50 px-5 py-5 sm:px-7">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                            <Video className="h-7 w-7" />
                        </div>

                        <div>
                            <p className="text-sm font-semibold text-blue-700">
                                Curso #{courseId}
                            </p>

                            <h1 className="mt-1 text-2xl font-bold text-slate-900">
                                Clases en vivo
                            </h1>

                            <p className="mt-1 text-sm leading-6 text-slate-600">
                                Reuniones virtuales y grabaciones mediante Zoom LTI Pro.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid gap-5 p-5 sm:p-7 lg:grid-cols-[1fr_auto] lg:items-center">
                    <div className="space-y-4">
                        <div className="flex gap-3">
                            <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-[#172861]" />

                            <div>
                                <h2 className="font-semibold text-slate-900">
                                    {isTeacher
                                        ? "Gestione las reuniones del curso"
                                        : "Consulte sus próximas clases"}
                                </h2>

                                <p className="mt-1 text-sm leading-6 text-slate-600">
                                    {isTeacher
                                        ? "Desde Zoom podrá programar, iniciar, editar y consultar las reuniones asociadas con este curso."
                                        : "Desde Zoom podrá revisar las reuniones disponibles e ingresar cuando el docente habilite la clase."}
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <CirclePlay className="mt-0.5 h-5 w-5 shrink-0 text-[#172861]" />

                            <div>
                                <h2 className="font-semibold text-slate-900">
                                    {isTeacher
                                        ? "Administre las clases grabadas"
                                        : "Visualice grabaciones publicadas"}
                                </h2>

                                <p className="mt-1 text-sm leading-6 text-slate-600">
                                    {isTeacher
                                        ? "Revise las grabaciones procesadas y publique solamente las que deban estar disponibles para los estudiantes."
                                        : "Las grabaciones aparecerán cuando hayan sido procesadas y publicadas por el docente."}
                                </p>
                            </div>
                        </div>
                    </div>

                    <ZoomLtiLauncher
                        courseId={courseId}
                        audience={audience}
                        className="lg:min-w-[260px]"
                    />
                </div>
            </div>
        </section>
    );
}