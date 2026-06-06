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

import type {
    CertificateFieldWithFormat,
} from "../types";

import { FieldPanel } from "./FieldPanel";

type SidePanelProps = {
    disabled: boolean;
    isAddFieldsOpen: boolean;
    selectedField: CertificateFieldWithFormat | null;
    qrConfig: CertificateQrConfig;
    onToggleAddFields: () => void;
    onAddField: (type: CertificateFieldType) => void;
    onUpdateQrConfig: (
        changes: Partial<CertificateQrConfig>,
    ) => void;
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
            <section className="rounded-2xl border border-amber-200 bg-amber-50 p-3 shadow-sm sm:rounded-[2rem] sm:p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 sm:h-10 sm:w-10 sm:rounded-2xl">
                            <ImagePlus className="h-4 w-4 sm:h-5 sm:w-5" />
                        </span>

                        <div className="min-w-0">
                            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-700 sm:text-xs">
                                Fondo obligatorio
                            </p>

                            <h2 className="break-words text-sm font-black leading-5 text-amber-950 [overflow-wrap:anywhere] sm:text-base">
                                Sube primero la imagen del certificado
                            </h2>

                            <p className="mt-1 text-xs font-medium leading-5 text-amber-800 sm:text-sm">
                                Después podrás agregar campos, firmas y código QR.
                            </p>
                        </div>
                    </div>

                    <span className="inline-flex w-fit shrink-0 rounded-full bg-amber-200 px-3 py-1 text-[10px] font-black text-amber-950 sm:text-xs">
                        Herramientas bloqueadas
                    </span>
                </div>
            </section>
        );
    }

    return (
        <section className="sticky top-2 z-20 min-w-0 overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm sm:rounded-[2rem]">
            <div className="flex flex-col gap-2 bg-gradient-to-r from-[#07111F] via-[#172861] to-[#F97316] px-3 py-2.5 text-white sm:px-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 items-center gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
                        <SlidersHorizontal className="h-4 w-4" />
                    </span>

                    <div className="min-w-0">
                        <p className="truncate text-[9px] font-black uppercase tracking-[0.18em] text-blue-100 sm:text-[10px]">
                            Barra de herramientas
                        </p>

                        <h2 className="truncate text-base font-black sm:text-lg">
                            Modelar certificado
                        </h2>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2 xs:flex xs:flex-wrap xs:items-center xs:justify-end">
                    <button
                        type="button"
                        onClick={onToggleAddFields}
                        className="inline-flex h-9 min-w-0 items-center justify-center gap-1.5 rounded-xl bg-white px-3 text-xs font-black text-[#172861] shadow-sm transition hover:bg-blue-50 active:scale-[0.97] sm:h-10 sm:rounded-2xl sm:px-4 sm:text-sm"
                    >
                        <Plus className="h-4 w-4 shrink-0" />

                        <span className="truncate">
                            Agregar campo
                        </span>

                        <ChevronDown
                            className={`h-4 w-4 shrink-0 transition ${isAddFieldsOpen
                                    ? "rotate-180"
                                    : ""
                                }`}
                        />
                    </button>

                    <label
                        className={`inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-xl px-3 text-xs font-black transition active:scale-[0.97] sm:h-10 sm:rounded-2xl sm:px-4 sm:text-sm ${qrConfig.enabled
                                ? "bg-blue-950 text-white ring-1 ring-white/20"
                                : "bg-white/15 text-white ring-1 ring-white/20 hover:bg-white/25"
                            }`}
                    >
                        <QrCode className="h-4 w-4 shrink-0" />

                        <span>
                            QR
                        </span>

                        <input
                            type="checkbox"
                            checked={Boolean(
                                qrConfig.enabled,
                            )}
                            onChange={(event) =>
                                onUpdateQrConfig({
                                    enabled:
                                        event.target
                                            .checked,
                                })
                            }
                            className="h-4 w-4 accent-white"
                        />
                    </label>
                </div>
            </div>

            {isAddFieldsOpen ? (
                <div className="border-b border-slate-200 bg-slate-50 px-3 py-2.5 sm:px-4">
                    <div className="flex gap-2 overflow-x-auto pb-1">
                        {fieldTypeOptions.map(
                            (option) => (
                                <button
                                    key={
                                        option.value
                                    }
                                    type="button"
                                    onClick={() =>
                                        onAddField(
                                            option.value,
                                        )
                                    }
                                    className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#172861] active:scale-[0.97]"
                                >
                                    <Plus className="h-4 w-4 shrink-0" />

                                    {
                                        option.label
                                    }
                                </button>
                            ),
                        )}
                    </div>
                </div>
            ) : null}

            <FieldPanel
                selectedField={selectedField}
                onUpdateField={onUpdateField}
                onChangeFieldType={
                    onChangeFieldType
                }
                onSignatureUpload={
                    onSignatureUpload
                }
                onDeleteField={onDeleteField}
            />
        </section>
    );
}