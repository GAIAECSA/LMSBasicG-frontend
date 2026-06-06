import {
    AlertCircle,
} from "lucide-react";

type CoursesAlertProps = {
    errorMessage: string;
};

export function CoursesAlert({
    errorMessage,
}: CoursesAlertProps) {
    if (!errorMessage) {
        return null;
    }

    return (
        <div className="flex items-start gap-2 rounded-xl border border-[var(--danger)] bg-[var(--danger-soft)] px-3 py-2.5 text-xs font-semibold leading-5 text-[var(--danger)] shadow-sm sm:gap-3 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 sm:h-5 sm:w-5" />

            <div>
                <p className="font-black">
                    No se pudieron cargar tus cursos.
                </p>

                <p className="mt-0.5">
                    {errorMessage}
                </p>
            </div>
        </div>
    );
}

export default CoursesAlert;
