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
        <div className="overflow-hidden rounded-3xl border border-[var(--border)] bg-white shadow-sm">
            <button
                type="button"
                onClick={onToggle}
                className="flex w-full items-center justify-between gap-3 border-b border-slate-100 bg-slate-50 px-5 py-4 text-left transition hover:bg-blue-50"
            >
                <div>
                    <h2 className="text-base font-bold text-slate-950">
                        Agregar campos
                    </h2>

                    <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                        Inserta textos, variables y firmas en el certificado.
                    </p>
                </div>

                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white text-[#172861] ring-1 ring-blue-100">
                    <ChevronDown
                        className={`h-5 w-5 transition ${isOpen ? "" : "-rotate-90"
                            }`}
                    />
                </span>
            </button>

            {isOpen ? (
                <div className="p-4">
                    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                        {fieldTypeOptions.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => onAddField(option.value)}
                                className="inline-flex min-h-10 items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-left text-sm font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#172861]"
                            >
                                <span>{option.label}</span>
                                <Plus className="h-4 w-4 shrink-0" />
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="px-5 py-4">
                    <p className="rounded-2xl bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-500">
                        Presiona el encabezado para mostrar los campos disponibles.
                    </p>
                </div>
            )}
        </div>
    );
}
