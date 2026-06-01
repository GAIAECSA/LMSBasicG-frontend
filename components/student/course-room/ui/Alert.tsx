import { AlertCircle } from "lucide-react";

type AlertProps = { message: string };

export function Alert({ message }: AlertProps) {
    return <div className="mb-5 flex items-start gap-3 rounded-2xl border border-[var(--danger)] bg-[var(--danger-soft)] px-4 py-3 text-sm font-bold text-[var(--danger)]"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0" /><span>{message}</span></div>;
}
