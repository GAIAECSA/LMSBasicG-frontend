import {
    AlertCircle,
} from "lucide-react";

type CatalogAlertProps = {
    message: string;
};

export function CatalogAlert({
    message,
}: CatalogAlertProps) {
    if (!message) {
        return null;
    }

    return (
        <div
            role="alert"
            aria-live="assertive"
            className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-bold leading-5 text-red-700 shadow-sm sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm"
        >
            <AlertCircle
                aria-hidden="true"
                className="mt-0.5 h-4 w-4 shrink-0 sm:h-5 sm:w-5"
            />

            <div className="min-w-0">
                <p className="font-black">
                    No se pudo cargar el catálogo.
                </p>

                <p className="mt-0.5 break-words">
                    {message}
                </p>
            </div>
        </div>
    );
}

export default CatalogAlert;