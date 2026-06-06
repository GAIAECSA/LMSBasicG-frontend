import { ChevronDown, Plus } from "lucide-react";
import type { CertificateFieldType } from "@/services/certificates.service";
import { fieldTypeOptions } from "../constants";

type AddFieldsProps = {
    isOpen: boolean;
    onToggle: () => void;
    onAddField: (type: CertificateFieldType) => void;
};

export function AddFields({
    isOpen,
    onToggle,
    onAddField,
}: AddFieldsProps) {
    return (
        <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm sm:rounded-3xl">
            <button
                type="button"
                onClick={onToggle}
                className="flex w-full items-center justify-between gap-3 border-b border-slate-100 bg-slate-50 px-3 py-3 text-left transition hover:bg-blue-50 sm:px-4 sm:py-4 lg:px-5 [@media(max-height:760px)]:py-3"
            >
                <div className="min-w-0">
                    <h2 className="text-sm font-bold text-slate-950 sm:text-base">
                        Agregar campos
                    </h2>

                    <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                        Inserta textos, variables y firmas en el certificado.
                    </p>
                </div>

                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-[#172861] ring-1 ring-blue-100 sm:h-9 sm:w-9 sm:rounded-2xl">
                    <ChevronDown
                        className={`h-4 w-4 transition sm:h-5 sm:w-5 ${
                            isOpen ? "" : "-rotate-90"
                        }`}
                    />
                </span>
            </button>

            {isOpen ? (
                <div className="p-3 sm:p-4">
                    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                        {fieldTypeOptions.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => onAddField(option.value)}
                                className="inline-flex min-h-9 items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-xs font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#172861] active:scale-[0.98] sm:min-h-10 sm:rounded-2xl sm:px-4 sm:text-sm"
                            >
                                <span className="min-w-0 truncate">
                                    {option.label}
                                </span>

                                <Plus className="h-4 w-4 shrink-0" />
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="px-3 py-3 sm:px-4 sm:py-4 lg:px-5 [@media(max-height:760px)]:py-3">
                    <p className="rounded-xl bg-slate-50 px-3 py-2.5 text-xs font-semibold leading-5 text-slate-500 sm:rounded-2xl sm:px-4 sm:py-3">
                        Presiona el encabezado para mostrar los campos disponibles.
                    </p>
                </div>
            )}
        </div>
    );
}
