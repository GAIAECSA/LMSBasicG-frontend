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
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 shadow-sm sm:rounded-[2rem] sm:p-6 lg:p-8 [@media(max-height:760px)]:p-4">
            <div className="flex items-start gap-3 sm:gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-700 sm:h-12 sm:w-12 sm:rounded-2xl">
                    <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>

                <div className="min-w-0">
                    <h2 className="break-words text-base font-black leading-6 text-red-900 [overflow-wrap:anywhere] sm:text-lg">
                        {title}
                    </h2>

                    <p className="mt-1 break-words text-xs font-semibold leading-5 text-red-700 [overflow-wrap:anywhere] sm:text-sm sm:leading-6">
                        {message}
                    </p>
                </div>
            </div>
        </div>
    );
}

export default ErrorState;
