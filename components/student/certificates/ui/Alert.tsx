import { AlertCircle } from "lucide-react";

type AlertProps = {
    message: string;
};

export function Alert({ message }: AlertProps) {
    if (!message) return null;

    return (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-[var(--danger)] bg-[var(--danger-soft)] p-4 text-sm font-semibold text-[var(--danger)]">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

            <div>
                <p className="font-black">
                    No se pudieron cargar los certificados.
                </p>

                <p className="mt-1">{message}</p>
            </div>
        </div>
    );
}
