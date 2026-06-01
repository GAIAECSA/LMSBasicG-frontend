import { AlertTriangle } from "lucide-react";

type ErrorStateProps = {
    title?: string;
    message: string;
};

export function ErrorState({
    title = "Ocurrió un problema",
    message,
}: ErrorStateProps) {
    return (
        <div className="rounded-[2rem] border border-red-200 bg-red-50 p-8 shadow-sm">
            <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-red-700">
                    <AlertTriangle className="h-6 w-6" />
                </div>

                <div>
                    <h2 className="text-lg font-black text-red-900">
                        {title}
                    </h2>

                    <p className="mt-1 text-sm font-semibold leading-6 text-red-700">
                        {message}
                    </p>
                </div>
            </div>
        </div>
    );
}

export default ErrorState;