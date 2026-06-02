import type { ChangeEvent } from "react";
import {
    ChevronDown,
    ImagePlus,
    Plus,
    QrCode,
    SlidersHorizontal,
} from "lucide-react";
import type {
    CertificateFieldType,
    CertificateQrConfig,
} from "@/services/certificates.service";
import { fieldTypeOptions } from "../constants";
import type { CertificateFieldWithFormat } from "../types";
import { FieldPanel } from "./FieldPanel";

type SidePanelProps = {
    disabled: boolean;
    isAddFieldsOpen: boolean;
    selectedField: CertificateFieldWithFormat | null;
    qrConfig: CertificateQrConfig;
    onToggleAddFields: () => void;
    onAddField: (type: CertificateFieldType) => void;
    onUpdateQrConfig: (changes: Partial<CertificateQrConfig>) => void;
    onUpdateField: (
        fieldId: string,
        changes: Partial<CertificateFieldWithFormat>,
    ) => void;
    onChangeFieldType: (
        fieldId: string,
        nextType: CertificateFieldType,
    ) => void;
    onSignatureUpload: (
        event: ChangeEvent<HTMLInputElement>,
        fieldId: string,
    ) => void;
    onDeleteField: (fieldId: string) => void;
};

export function SidePanel({
    disabled,
    isAddFieldsOpen,
    selectedField,
    qrConfig,
    onToggleAddFields,
    onAddField,
    onUpdateQrConfig,
    onUpdateField,
    onChangeFieldType,
    onSignatureUpload,
    onDeleteField,
}: SidePanelProps) {
    if (disabled) {
        return (
            <section className="rounded-[2rem] border border-amber-200 bg-amber-50 p-4 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                            <ImagePlus className="h-5 w-5" />
                        </span>

                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">
                                Fondo obligatorio
                            </p>
                            <h2 className="text-base font-black text-amber-950">
                                Sube primero la imagen del certificado
                            </h2>
                            <p className="mt-1 text-sm font-medium text-amber-800">
                                Después podrás agregar campos, firmas y código QR.
                            </p>
                        </div>
                    </div>

                    <span className="inline-flex w-fit rounded-full bg-amber-200 px-3 py-1 text-xs font-black text-amber-950">
                        Herramientas bloqueadas
                    </span>
                </div>
            </section>
        );
    }

    return (
        <section className="sticky top-3 z-20 overflow-hidden rounded-[2rem] border border-[var(--border)] bg-white shadow-sm">
            <div className="flex flex-col gap-3 bg-gradient-to-r from-[#07111F] via-[#172861] to-[#F97316] px-4 py-3 text-white lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20">
                        <SlidersHorizontal className="h-5 w-5" />
                    </span>

                    <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-blue-100">
                            Barra rápida de edición
                        </p>
                        <h2 className="truncate text-lg font-black">
                            Modelar certificado
                        </h2>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={onToggleAddFields}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-white px-4 text-sm font-black text-[#172861] shadow-sm transition hover:bg-blue-50"
                    >
                        <Plus className="h-4 w-4" />
                        Agregar campo
                        <ChevronDown
                            className={`h-4 w-4 transition ${isAddFieldsOpen ? "rotate-180" : ""
                                }`}
                        />
                    </button>

                    <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-2xl bg-white/15 px-4 text-sm font-black text-white ring-1 ring-white/20 transition hover:bg-white/25">
                        <QrCode className="h-4 w-4" />
                        QR
                        <input
                            type="checkbox"
                            checked={Boolean(qrConfig.enabled)}
                            onChange={(event) =>
                                onUpdateQrConfig({
                                    enabled: event.target.checked,
                                })
                            }
                            className="h-4 w-4 accent-white"
                        />
                    </label>

                    <span className="inline-flex h-10 items-center rounded-2xl bg-blue-950 px-4 text-xs font-black text-white-950">
                        Habilitado
                    </span>
                </div>
            </div>

            {isAddFieldsOpen ? (
                <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="flex gap-2 overflow-x-auto pb-1">
                        {fieldTypeOptions.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => onAddField(option.value)}
                                className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#172861]"
                            >
                                <Plus className="h-4 w-4" />
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>
            ) : null}

            <FieldPanel
                selectedField={selectedField}
                onUpdateField={onUpdateField}
                onChangeFieldType={onChangeFieldType}
                onSignatureUpload={onSignatureUpload}
                onDeleteField={onDeleteField}
            />
        </section>
    );
}
