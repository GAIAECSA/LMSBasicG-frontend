"use client";

import type {
    ChangeEvent,
    ReactNode,
} from "react";
import {
    AlignCenter,
    AlignLeft,
    AlignRight,
    Bold,
    ImagePlus,
    Trash2,
} from "lucide-react";
import type {
    CertificateFieldType,
    CertificateTextAlign,
} from "@/services/certificates.service";
import {
    fieldTypeOptions,
    fontFamilyOptions,
} from "../constants";
import type {
    CertificateFieldWithFormat,
    CertificateTextCase,
} from "../types";
import {
    getFieldFontFamily,
    getFieldTextCase,
    isSignatureField,
    toCssImageUrl,
} from "../utils";

type FieldPanelProps = {
    selectedField: CertificateFieldWithFormat | null;
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

type TextCaseButton = {
    value: CertificateTextCase;
    label: string;
    title: string;
};

const TEXT_CASE_BUTTONS: TextCaseButton[] = [
    {
        value: "none",
        label: "Aa",
        title: "Mantener el texto como está escrito",
    },
    {
        value: "uppercase",
        label: "AA",
        title: "Convertir el texto a MAYÚSCULAS",
    },
    {
        value: "lowercase",
        label: "aa",
        title: "Convertir el texto a minúsculas",
    },
    {
        value: "sentence",
        label: "A.",
        title: "Aplicar formato tipo oración",
    },
];

export function FieldPanel({
    selectedField,
    onUpdateField,
    onChangeFieldType,
    onSignatureUpload,
    onDeleteField,
}: FieldPanelProps) {

    if (!selectedField) {
        return (
            <div className="border-t border-slate-100 bg-white px-3 py-2.5 sm:px-4 sm:py-3">
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-2.5 text-xs font-bold leading-5 text-slate-500 sm:rounded-2xl sm:px-4 sm:text-sm">
                    Selecciona un campo dentro del certificado para mostrar sus herramientas de edición.
                </div>
            </div>
        );
    }

    const selectedLabel =
        fieldTypeOptions.find(
            (option) => option.value === selectedField.type,
        )?.label ?? "Campo seleccionado";

    const currentTextCase = getFieldTextCase(selectedField);
    const isBold = selectedField.fontWeight === "bold";

    return (
        <div className="min-w-0 border-t border-slate-100 bg-white px-3 py-2.5 sm:px-4 sm:py-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-blue-700 sm:text-[10px]">
                        Campo seleccionado
                    </p>

                    <h3
                        title={selectedLabel}
                        className="truncate text-xs font-black text-slate-950 sm:text-sm"
                    >
                        {selectedLabel}
                    </h3>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {isSignatureField(selectedField) ? (
                        <label className="inline-flex h-8 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2.5 text-[11px] font-black text-blue-700 transition hover:bg-blue-100 active:scale-[0.97] sm:h-9 sm:rounded-xl sm:px-3 sm:text-xs">
                            <ImagePlus className="h-4 w-4 shrink-0" />
                            Subir firma

                            <input
                                type="file"
                                accept="image/*"
                                onChange={(event) =>
                                    onSignatureUpload(
                                        event,
                                        selectedField.id,
                                    )
                                }
                                className="hidden"
                            />
                        </label>
                    ) : null}

                    <button
                        type="button"
                        onClick={() =>
                            onDeleteField(selectedField.id)
                        }
                        className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2.5 text-[11px] font-black text-red-700 transition hover:bg-red-100 active:scale-[0.97] sm:h-9 sm:rounded-xl sm:px-3 sm:text-xs"
                    >
                        <Trash2 className="h-4 w-4 shrink-0" />
                        Eliminar
                    </button>
                </div>
            </div>

            <div className="mt-2.5 flex min-w-0 flex-wrap items-end gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2 sm:rounded-2xl sm:p-2.5">
                <ToolbarGroup label="Variable">
                    <select
                        value={selectedField.type}
                        onChange={(event) =>
                            onChangeFieldType(
                                selectedField.id,
                                event.target
                                    .value as CertificateFieldType,
                            )
                        }
                        className="h-9 w-[148px] min-w-0 rounded-lg border border-slate-200 bg-white px-2 text-xs font-bold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:w-[170px]"
                    >
                        {fieldTypeOptions.map((option) => (
                            <option
                                key={option.value}
                                value={option.value}
                            >
                                {option.label}
                            </option>
                        ))}
                    </select>
                </ToolbarGroup>

                <ToolbarGroup
                    label="Texto"
                    className="min-w-[190px] flex-1"
                >
                    <input
                        value={selectedField.value}
                        onChange={(event) =>
                            onUpdateField(selectedField.id, {
                                value: event.target.value,
                            })
                        }
                        className="h-9 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                </ToolbarGroup>

                <ToolbarGroup label="Fuente">
                    <select
                        value={getFieldFontFamily(selectedField)}
                        onChange={(event) =>
                            onUpdateField(selectedField.id, {
                                fontFamily: event.target.value,
                            })
                        }
                        className="h-9 w-[118px] rounded-lg border border-slate-200 bg-white px-2 text-xs font-bold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    >
                        {fontFamilyOptions.map((option) => (
                            <option
                                key={option.value}
                                value={option.value}
                            >
                                {option.label}
                            </option>
                        ))}
                    </select>
                </ToolbarGroup>

                <ToolbarGroup label="Tamaño">
                    <NumberInput
                        value={selectedField.fontSize}
                        min={8}
                        max={80}
                        className="w-[66px]"
                        onChange={(value) =>
                            onUpdateField(selectedField.id, {
                                fontSize: value,
                            })
                        }
                    />
                </ToolbarGroup>

                <ToolbarGroup label="Estilo">
                    <ToolbarButton
                        active={isBold}
                        title="Negrita"
                        onClick={() =>
                            onUpdateField(selectedField.id, {
                                fontWeight: isBold
                                    ? "normal"
                                    : "bold",
                            })
                        }
                    >
                        <Bold className="h-4 w-4" />
                    </ToolbarButton>
                </ToolbarGroup>

                <ToolbarGroup label="Formato">
                    <div className="flex overflow-hidden rounded-lg border border-slate-200 bg-white">
                        {TEXT_CASE_BUTTONS.map((option) => (
                            <CompactTextButton
                                key={option.value}
                                title={option.title}
                                active={
                                    currentTextCase === option.value
                                }
                                label={option.label}
                                onClick={() =>
                                    onUpdateField(
                                        selectedField.id,
                                        {
                                            textCase:
                                                option.value,
                                        },
                                    )
                                }
                            />
                        ))}
                    </div>
                </ToolbarGroup>

                <ToolbarGroup label="Alineación">
                    <div className="flex overflow-hidden rounded-lg border border-slate-200 bg-white">
                        <AlignmentButton
                            title="Alinear a la izquierda"
                            active={
                                selectedField.textAlign === "left"
                            }
                            onClick={() =>
                                onUpdateField(selectedField.id, {
                                    textAlign:
                                        "left" as CertificateTextAlign,
                                })
                            }
                        >
                            <AlignLeft className="h-4 w-4" />
                        </AlignmentButton>

                        <AlignmentButton
                            title="Centrar"
                            active={
                                selectedField.textAlign === "center"
                            }
                            onClick={() =>
                                onUpdateField(selectedField.id, {
                                    textAlign:
                                        "center" as CertificateTextAlign,
                                })
                            }
                        >
                            <AlignCenter className="h-4 w-4" />
                        </AlignmentButton>

                        <AlignmentButton
                            title="Alinear a la derecha"
                            active={
                                selectedField.textAlign === "right"
                            }
                            onClick={() =>
                                onUpdateField(selectedField.id, {
                                    textAlign:
                                        "right" as CertificateTextAlign,
                                })
                            }
                        >
                            <AlignRight className="h-4 w-4" />
                        </AlignmentButton>
                    </div>
                </ToolbarGroup>

                <ToolbarGroup label="Color">
                    <input
                        type="color"
                        value={selectedField.color}
                        onChange={(event) =>
                            onUpdateField(selectedField.id, {
                                color: event.target.value,
                            })
                        }
                        className="h-9 w-11 cursor-pointer rounded-lg border border-slate-200 bg-white p-1"
                    />
                </ToolbarGroup>
            </div>

            {isSignatureField(selectedField) &&
                selectedField.signatureImage ? (
                <div className="mt-2 rounded-xl border border-blue-100 bg-blue-50 p-2">
                    <div
                        className="h-12 w-full bg-contain bg-center bg-no-repeat"
                        style={{
                            backgroundImage: toCssImageUrl(
                                selectedField.signatureImage,
                            ),
                        }}
                    />
                </div>
            ) : null}
        </div>
    );
}

function ToolbarGroup({
    label,
    className = "",
    children,
}: {
    label: string;
    className?: string;
    children: ReactNode;
}) {
    return (
        <div className={`min-w-0 ${className}`}>
            <p className="mb-1 text-[9px] font-black uppercase tracking-wide text-slate-500">
                {label}
            </p>

            {children}
        </div>
    );
}

function ToolbarButton({
    active,
    title,
    children,
    onClick,
}: {
    active: boolean;
    title: string;
    children: ReactNode;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            title={title}
            aria-label={title}
            onClick={onClick}
            className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border transition active:scale-[0.96] ${active
                    ? "border-blue-200 bg-blue-100 text-[#172861]"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                }`}
        >
            {children}
        </button>
    );
}

function CompactTextButton({
    active,
    title,
    label,
    onClick,
}: {
    active: boolean;
    title: string;
    label: string;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            title={title}
            aria-label={title}
            onClick={onClick}
            className={`inline-flex h-9 min-w-9 items-center justify-center border-r border-slate-200 px-1.5 text-xs font-black transition last:border-r-0 active:scale-[0.96] ${active
                    ? "bg-blue-100 text-[#172861]"
                    : "bg-white text-slate-600 hover:bg-slate-100"
                }`}
        >
            {label}
        </button>
    );
}

function AlignmentButton({
    active,
    title,
    children,
    onClick,
}: {
    active: boolean;
    title: string;
    children: ReactNode;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            title={title}
            aria-label={title}
            onClick={onClick}
            className={`inline-flex h-9 w-9 items-center justify-center border-r border-slate-200 transition last:border-r-0 active:scale-[0.96] ${active
                    ? "bg-blue-100 text-[#172861]"
                    : "bg-white text-slate-600 hover:bg-slate-100"
                }`}
        >
            {children}
        </button>
    );
}

function NumberInput({
    value,
    min,
    max,
    className = "",
    onChange,
}: {
    value: number;
    min: number;
    max: number;
    className?: string;
    onChange: (value: number) => void;
}) {
    return (
        <input
            type="number"
            value={value}
            min={min}
            max={max}
            onChange={(event) => {
                const parsedValue = Number(event.target.value);

                if (!Number.isFinite(parsedValue)) return;

                onChange(parsedValue);
            }}
            className={`h-9 rounded-lg border border-slate-200 bg-white px-2 text-xs font-bold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 ${className}`}
        />
    );
}

function AdvancedNumberField({
    label,
    value,
    min,
    max,
    onChange,
}: {
    label: string;
    value: number;
    min: number;
    max: number;
    onChange: (value: number) => void;
}) {
    return (
        <label className="block min-w-0">
            <span className="mb-1 block text-[10px] font-black text-slate-700">
                {label}
            </span>

            <NumberInput
                value={value}
                min={min}
                max={max}
                className="w-full"
                onChange={onChange}
            />
        </label>
    );
}
