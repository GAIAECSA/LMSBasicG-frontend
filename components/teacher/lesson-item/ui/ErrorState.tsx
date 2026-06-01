import Link from "next/link";
import { AlertCircle } from "lucide-react";

type ErrorStateProps = {
    error: string;
    backHref: string;
};

export function ErrorState({ error, backHref }: ErrorStateProps) {
    return (
        <section className="space-y-6">
            <div className="rounded-[28px] border border-red-200 bg-red-50 p-8 text-center shadow-sm">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-700">
                    <AlertCircle className="h-6 w-6" />
                </div>

                <h2 className="mt-4 text-xl font-black text-red-800">
                    No se pudo abrir el contenido
                </h2>

                <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-red-700">
                    {error}
                </p>

                <Link
                    href={backHref}
                    className="mt-6 inline-flex h-11 items-center justify-center rounded-2xl bg-red-600 px-5 text-sm font-bold text-white transition hover:bg-red-700"
                >
                    Volver a módulos
                </Link>
            </div>
        </section>
    );
}