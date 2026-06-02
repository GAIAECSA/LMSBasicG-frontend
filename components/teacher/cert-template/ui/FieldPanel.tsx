import type { ChangeEvent } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import type {
    CertificateFieldType,
    CertificateTextAlign,
} from "@/services/certificates.service";
import {
    alignOptions,
    fieldTypeOptions,
    fontFamilyOptions,
    textCaseOptions,
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

export function FieldPanel({
    selectedField,
    onUpdateField,
    onChangeFieldType,
    onSignatureUpload,
    onDeleteField,
}: FieldPanelProps) {
    if (!selectedField) {
        return (
            <div className="border-t border-slate-100 bg-white px-4 py-3">
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-500">
                    Selecciona un campo dentro del certificado para editarlo rápidamente.
                </div>
            </div>
        );
    }

    const selectedLabel =
        fieldTypeOptions.find((option) => option.value === selectedField.type)
            ?.label ?? "Campo seleccionado";

    return (
        <div className="border-t border-slate-100 bg-white px-4 py-3">
            <div className="mb-3 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-blue-700">
                        Editando campo
                    </p>
                    <h3 className="truncate text-sm font-black text-slate-950">
                        {selectedLabel}
                    </h3>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {isSignatureField(selectedField) ? (
                        <label className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 text-xs font-black text-blue-700 transition hover:bg-blue-100">
                            <ImagePlus className="h-4 w-4" />
                            Firma
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(event) =>
                                    onSignatureUpload(event, selectedField.id)
                                }
                                className="hidden"
                            />
                        </label>
                    ) : null}

                    <button
                        type="button"
                        onClick={() => onDeleteField(selectedField.id)}
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 text-xs font-black text-red-700 transition hover:bg-red-100"
                    >
                        <Trash2 className="h-4 w-4" />
                        Eliminar
                    </button>
                </div>
            </div>

            <div className="grid gap-2 xl:grid-cols-[180px_minmax(220px,1fr)_150px_150px_130px_130px_130px_130px_150px]">
                <SelectField
                    label="Variable"
                    value={selectedField.type}
                    onChange={(value) =>
                        onChangeFieldType(
                            selectedField.id,
                            value as CertificateFieldType,
                        )
                    }
                    options={fieldTypeOptions}
                />

                <InputField
                    label="Texto"
                    value={selectedField.value}
                    onChange={(value) =>
                        onUpdateField(selectedField.id, {
                            value,
                        })
                    }
                />

                <SelectField
                    label="Fuente"
                    value={getFieldFontFamily(selectedField)}
                    onChange={(value) =>
                        onUpdateField(selectedField.id, {
                            fontFamily: value,
                        })
                    }
                    options={fontFamilyOptions}
                />

                <SelectField
                    label="Formato"
                    value={getFieldTextCase(selectedField)}
                    onChange={(value) =>
                        onUpdateField(selectedField.id, {
                            textCase: value as CertificateTextCase,
                        })
                    }
                    options={textCaseOptions}
                />

                <SelectField
                    label="Peso"
                    value={selectedField.fontWeight}
                    onChange={(value) =>
                        onUpdateField(selectedField.id, {
                            fontWeight: value as "normal" | "bold",
                        })
                    }
                    options={[
                        { value: "normal", label: "Normal" },
                        { value: "bold", label: "Negrita" },
                    ]}
                />

                <SelectField
                    label="Alineación"
                    value={selectedField.textAlign}
                    onChange={(value) =>
                        onUpdateField(selectedField.id, {
                            textAlign: value as CertificateTextAlign,
                        })
                    }
                    options={alignOptions}
                />

                <NumberInput
                    label="Tamaño"
                    min={8}
                    max={80}
                    value={selectedField.fontSize}
                    onChange={(value) =>
                        onUpdateField(selectedField.id, {
                            fontSize: value,
                        })
                    }
                />

                <NumberInput
                    label="Ancho %"
                    min={10}
                    max={100}
                    value={selectedField.width}
                    onChange={(value) =>
                        onUpdateField(selectedField.id, {
                            width: value,
                        })
                    }
                />

                <div className="grid grid-cols-[1fr_52px] gap-2">
                    <NumberInput
                        label="Alto %"
                        min={4}
                        max={40}
                        value={selectedField.height ?? 8}
                        onChange={(value) =>
                            onUpdateField(selectedField.id, {
                                height: value,
                            })
                        }
                    />

                    <ColorInput
                        label="Color"
                        value={selectedField.color}
                        onChange={(value) =>
                            onUpdateField(selectedField.id, {
                                color: value,
                            })
                        }
                    />
                </div>
            </div>

            {isSignatureField(selectedField) && selectedField.signatureImage ? (
                <div className="mt-3 rounded-2xl border border-blue-100 bg-blue-50 p-2">
                    <div
                        className="h-14 w-full bg-contain bg-center bg-no-repeat"
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

type Option = {
    value: string;
    label: string;
};

function SelectField({
    label,
    value,
    options,
    onChange,
}: {
    label: string;
    value: string;
    options: Option[];
    onChange: (value: string) => void;
}) {
    return (
        <label className="block min-w-0">
            <span className="mb-1 block text-[11px] font-black text-slate-700">
                {label}
            </span>

            <select
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            >
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </label>
    );
}

function InputField({
    label,
    value,
    onChange,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
}) {
    return (
        <label className="block min-w-0">
            <span className="mb-1 block text-[11px] font-black text-slate-700">
                {label}
            </span>

            <input
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
        </label>
    );
}

function NumberInput({
    label,
    min,
    max,
    value,
    onChange,
}: {
    label: string;
    min: number;
    max: number;
    value: number;
    onChange: (value: number) => void;
}) {
    return (
        <label className="block min-w-0">
            <span className="mb-1 block text-[11px] font-black text-slate-700">
                {label}
            </span>

            <input
                type="number"
                min={min}
                max={max}
                value={value}
                onChange={(event) => onChange(Number(event.target.value))}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
        </label>
    );
}

function ColorInput({
    label,
    value,
    onChange,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
}) {
    return (
        <label className="block min-w-0">
            <span className="mb-1 block text-[11px] font-black text-slate-700">
                {label}
            </span>

            <input
                type="color"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-2"
            />
        </label>
    );
}
