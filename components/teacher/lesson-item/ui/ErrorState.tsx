import Link from "next/link";
import { AlertCircle } from "lucide-react";

type ErrorStateProps = {
    error: string;
    backHref: string;
};

export function ErrorState({ error, backHref }: ErrorStateProps) {
    return (
        <section className="mx-auto w-full max-w-[1480px] min-w-0">
            <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-center shadow-sm sm:rounded-[28px] sm:p-8 [@media(max-height:760px)]:p-5">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-red-700 sm:h-14 sm:w-14 sm:rounded-2xl">
                    <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>

                <h2 className="mt-3 text-lg font-black text-red-800 sm:mt-4 sm:text-xl">
                    No se pudo abrir el contenido
                </h2>

                <p className="mx-auto mt-2 max-w-2xl text-xs leading-5 text-red-700 sm:text-sm sm:leading-6">
                    {error}
                </p>

                <Link
                    href={backHref}
                    className="mt-5 inline-flex h-10 items-center justify-center rounded-xl bg-red-600 px-4 text-xs font-bold text-white transition hover:bg-red-700 sm:mt-6 sm:h-11 sm:rounded-2xl sm:px-5 sm:text-sm"
                >
                    Volver a módulos
                </Link>
            </div>
        </section>
    );
}
