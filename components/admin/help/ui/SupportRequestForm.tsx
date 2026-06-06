import {
    CircleHelp,
    Clipboard,
    Send,
} from "lucide-react";
import { SUPPORT_CATEGORIES } from "../constants";
import type { HelpPageState } from "../hook";
import { FormAlerts } from "./FormAlerts";

type SupportRequestFormProps = {
    help: HelpPageState;
};

export function SupportRequestForm({
    help,
}: SupportRequestFormProps) {
    return (
        <form
            onSubmit={help.handleSubmit}
            className="min-w-0 rounded-2xl border border-[var(--border)] p-3 shadow-sm sm:rounded-3xl sm:p-4 lg:p-5"
            style={{
                background:
                    "var(--gradient-card)",
            }}
        >
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--secondary)] text-[var(--secondary-foreground)] sm:h-10 sm:w-10 sm:rounded-2xl">
                        <CircleHelp className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>

                    <div className="min-w-0">
                        <h2 className="text-sm font-black text-[var(--foreground)] sm:text-base lg:text-lg">
                            Solicitar asistencia
                        </h2>

                        <p className="mt-0.5 text-[11px] font-semibold leading-5 text-[var(--muted-foreground)] sm:text-xs">
                            Completa los datos para generar tu solicitud.
                        </p>
                    </div>
                </div>

                <div className="w-fit max-w-full rounded-xl bg-[var(--muted)] px-3 py-1.5 text-[10px] font-black text-[var(--muted-foreground)] sm:rounded-2xl sm:text-xs">
                    Usuario:{" "}
                    <span
                        title={
                            help.userName
                        }
                        className="break-words text-[var(--foreground)] [overflow-wrap:anywhere]"
                    >
                        {help.userName}
                    </span>
                </div>
            </div>

            <FormAlerts
                error={help.error}
                copied={help.copied}
            />

            <div className="mt-3 grid gap-3 md:grid-cols-2 sm:mt-4">
                <label className="block min-w-0">
                    <span className="text-[11px] font-black text-[var(--foreground)] sm:text-xs">
                        Categoría
                    </span>

                    <select
                        value={
                            help.form.category
                        }
                        onChange={(event) =>
                            help.handleCategoryChange(
                                event.target.value,
                            )
                        }
                        className="mt-1.5 h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 text-xs font-semibold text-[var(--foreground)] outline-none transition focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--ring)]/30 sm:h-11 sm:rounded-2xl sm:px-4 sm:text-sm"
                    >
                        {SUPPORT_CATEGORIES.map(
                            (category) => (
                                <option
                                    key={
                                        category
                                    }
                                >
                                    {
                                        category
                                    }
                                </option>
                            ),
                        )}
                    </select>
                </label>

                <label className="block min-w-0">
                    <span className="text-[11px] font-black text-[var(--foreground)] sm:text-xs">
                        Asunto
                    </span>

                    <input
                        value={
                            help.form.subject
                        }
                        onChange={(event) =>
                            help.handleChange(
                                "subject",
                                event.target.value,
                            )
                        }
                        className="mt-1.5 h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 text-xs font-semibold text-[var(--foreground)] outline-none transition focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--ring)]/30 sm:h-11 sm:rounded-2xl sm:px-4 sm:text-sm"
                        placeholder="Ejemplo: No puedo ver mi curso"
                    />
                </label>

                <label className="block min-w-0 md:col-span-2">
                    <span className="text-[11px] font-black text-[var(--foreground)] sm:text-xs">
                        Detalle del problema
                    </span>

                    <textarea
                        value={
                            help.form.message
                        }
                        onChange={(event) =>
                            help.handleChange(
                                "message",
                                event.target.value,
                            )
                        }
                        className="mt-1.5 min-h-[96px] w-full resize-y rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2.5 text-xs font-semibold leading-5 text-[var(--foreground)] outline-none transition focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--ring)]/30 sm:min-h-[108px] sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm sm:leading-6"
                        placeholder="Describe qué necesitas o cuál es el problema."
                    />
                </label>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-2 sm:mt-4 sm:grid-cols-2 sm:gap-3">
                <button
                    type="button"
                    onClick={() =>
                        void help.handleCopy()
                    }
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 text-xs font-black text-[var(--foreground)] shadow-sm transition hover:bg-[var(--muted)] active:scale-[0.97] sm:h-11 sm:rounded-2xl sm:px-4 sm:text-sm"
                >
                    <Clipboard className="h-4 w-4" />
                    Copiar solicitud
                </button>

                <button
                    type="submit"
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-3 text-xs font-black text-[var(--primary-foreground)] shadow-sm transition hover:opacity-90 active:scale-[0.97] sm:h-11 sm:rounded-2xl sm:px-4 sm:text-sm"
                >
                    <Send className="h-4 w-4" />
                    Enviar por correo
                </button>
            </div>
        </form>
    );
}

export default SupportRequestForm;
