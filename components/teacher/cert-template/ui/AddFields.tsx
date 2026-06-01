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
                className="flex w-full items-center justify-between gap-3 bg-gradient-to-br from-[#07111F] via-[#172861] to-[#F97316] px-5 py-4 text-left text-white"
            >
                <div>
                    <h2 className="text-lg font-bold">Agregar campos</h2>

                    <p className="mt-1 text-sm leading-6 text-blue-50">
                        Agrega textos, variables y firmas.
                    </p>
                </div>

                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white ring-1 ring-white/20">
                    <ChevronDown
                        className={`h-5 w-5 transition ${isOpen ? "" : "-rotate-90"
                            }`}
                    />
                </span>
            </button>

            {isOpen ? (
                <div className="px-5 py-4">
                    <div className="max-h-[260px] overflow-y-auto pr-1">
                        <div className="grid gap-2">
                            {fieldTypeOptions.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => onAddField(option.value)}
                                    className="inline-flex h-10 items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#172861]"
                                >
                                    {option.label}
                                    <Plus className="h-4 w-4" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="px-5 py-4">
                    <p className="rounded-2xl bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-500">
                        Panel minimizado. Presiona el encabezado para agregar
                        más campos.
                    </p>
                </div>
            )}
        </div>
    );
}