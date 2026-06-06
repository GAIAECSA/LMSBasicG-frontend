import {
    Eye,
    FileText,
    Loader2,
    Plus,
} from "lucide-react";
import type { PrivacyPolicy } from "@/services/privacy-policy.service";
import {
    formatDate,
    getPolicyStatusClass,
    getPolicyStatusLabel,
    normalizeResourceUrl,
} from "../utils";

type PoliciesListProps = {
    loading: boolean;
    policies: PrivacyPolicy[];
    onCreate: () => void;
};

export function PoliciesList({
    loading,
    policies,
    onCreate,
}: PoliciesListProps) {
    return (
        <section className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm sm:rounded-3xl">
            <div className="border-b border-slate-200 px-3 py-3 sm:px-4 sm:py-4">
                <h2 className="text-base font-black text-slate-950 sm:text-lg">
                    Políticas registradas
                </h2>

                <p className="mt-1 text-xs font-semibold leading-5 text-slate-500 sm:text-sm">
                    Historial de políticas de privacidad.
                </p>
            </div>

            {loading ? (
                <div className="flex min-h-[190px] items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-[#172861]" />
                </div>
            ) : policies.length === 0 ? (
                <div className="p-6 text-center sm:p-8">
                    <FileText className="mx-auto h-9 w-9 text-slate-400 sm:h-10 sm:w-10" />

                    <h3 className="mt-3 text-sm font-black text-slate-900 sm:mt-4 sm:text-base">
                        No existen políticas
                    </h3>

                    <p className="mt-2 text-xs font-semibold leading-5 text-slate-500 sm:text-sm">
                        Crea la primera política para comenzar.
                    </p>

                    <button
                        type="button"
                        onClick={onCreate}
                        className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#172861] px-4 text-xs font-black text-white transition hover:bg-[#0B163F] active:scale-[0.97] sm:rounded-2xl sm:text-sm"
                    >
                        <Plus className="h-4 w-4" />
                        Nueva política
                    </button>
                </div>
            ) : (
                <div className="divide-y divide-slate-100">
                    {policies.map(
                        (policy) => (
                            <PolicyRow
                                key={policy.id}
                                policy={policy}
                            />
                        ),
                    )}
                </div>
            )}
        </section>
    );
}

function PolicyRow({
    policy,
}: {
    policy: PrivacyPolicy;
}) {
    const fileUrl =
        normalizeResourceUrl(
            policy.file_url,
        );

    return (
        <article className="px-3 py-3 transition hover:bg-slate-50 sm:px-4 sm:py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#172861] sm:h-10 sm:w-10 sm:rounded-2xl">
                        <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>

                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                            <h3
                                title={policy.title}
                                className="max-w-full truncate text-xs font-black text-slate-950 sm:text-sm"
                            >
                                {policy.title}
                            </h3>

                            <span
                                className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-black sm:px-2.5 sm:py-1 sm:text-[11px] ${getPolicyStatusClass(
                                    policy,
                                )}`}
                            >
                                {getPolicyStatusLabel(
                                    policy,
                                )}
                            </span>
                        </div>

                        <p className="mt-1.5 text-[11px] font-semibold leading-5 text-slate-500 sm:mt-2 sm:text-xs">
                            Versión {policy.version} ·{" "}
                            {formatDate(
                                policy.effective_date,
                            )}
                        </p>
                    </div>
                </div>

                {fileUrl ? (
                    <a
                        href={fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-9 w-full shrink-0 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 transition hover:bg-slate-50 active:scale-[0.97] sm:w-auto"
                    >
                        <Eye className="h-4 w-4" />
                        Ver archivo
                    </a>
                ) : null}
            </div>
        </article>
    );
}

export default PoliciesList;
