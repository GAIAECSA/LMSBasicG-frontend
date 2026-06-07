import Link from "next/link";
import {
    AlertCircle,
    Loader2,
} from "lucide-react";

import {
    AthenaLoadingBackground,
} from "@/components/ui/AthenaLoadingBackground";

import {
    STUDENT_ENROLLMENT_LINKS,
} from "../constants";

type StatePanelProps = {
    type: "loading" | "error";
    message: string;
};

export function StatePanel({
    type,
    message,
}: StatePanelProps) {
    const loading =
        type === "loading";

    if (loading) {
        return (
            <section className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
                <AthenaLoadingBackground
                    contentClassName="flex min-h-[calc(100dvh-150px)] items-center justify-center"
                >
                    <div
                        role="status"
                        aria-live="polite"
                        aria-label={message}
                        className="flex min-h-[260px] w-full max-w-xl flex-col items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--card)]/80 p-5 text-center shadow-sm backdrop-blur-[3px] sm:min-h-[340px] sm:rounded-[28px] sm:p-8"
                    >
                        <Loader2
                            aria-hidden="true"
                            className="h-8 w-8 animate-spin text-[var(--primary)] sm:h-9 sm:w-9"
                        />

                        <p className="mt-4 break-words text-xs font-black leading-5 text-[var(--muted-foreground)] sm:text-sm">
                            {message}
                        </p>
                    </div>
                </AthenaLoadingBackground>
            </section>
        );
    }

    return (
        <section className="min-h-screen bg-[var(--background)] px-3 py-4 pt-16 text-[var(--foreground)] sm:px-5 sm:py-5 md:px-6 md:pt-6 lg:px-8">
            <div className="mx-auto w-full max-w-[1500px]">
                <div
                    role="alert"
                    aria-live="assertive"
                    className="flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-[var(--danger)] bg-[var(--danger-soft)] p-5 text-center shadow-sm sm:min-h-[340px] sm:rounded-[28px] sm:p-8"
                >
                    <AlertCircle
                        aria-hidden="true"
                        className="h-8 w-8 text-[var(--danger)] sm:h-9 sm:w-9"
                    />

                    <p className="mt-4 break-words text-xs font-black leading-5 text-[var(--danger)] sm:text-sm">
                        {message}
                    </p>

                    <Link
                        href={
                            STUDENT_ENROLLMENT_LINKS.catalog
                        }
                        className="mt-4 inline-flex h-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 text-xs font-black text-[var(--foreground)] transition hover:bg-[var(--muted)] active:scale-[0.97] sm:h-11 sm:rounded-2xl sm:px-5 sm:text-sm"
                    >
                        Volver al catálogo
                    </Link>
                </div>
            </div>
        </section>
    );
}

export default StatePanel;