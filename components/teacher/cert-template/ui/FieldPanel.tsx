import type { ChangeEvent } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import type {
    CertificateFieldType,
    CertificateTextAlign,
} from "@/services/certificates.service";
import { alignOptions, fieldTypeOptions, fontFamilyOptions, textCaseOptions } from "../constants";
import type { CertificateFieldWithFormat, CertificateTextCase } from "../types";
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
    return (
        <div className="rounded-3xl border border-[var(--border)] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-950">
                Campo seleccionado
            </h2>

            {!selectedField ? (
                <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-sm text-slate-500">
                    Selecciona un campo del certificado para editarlo. Para
                    editar el QR, usa el panel de Código QR.
                </div>
            ) : (
                <div className="mt-5 max-h-[calc(100vh-260px)] space-y-4 overflow-y-auto pr-1">
                    <div className="space-y-2">
                        <label className="block text-[13px] font-bold text-slate-700">
                            Variable del certificado
                        </label>

                        <select
                            value={selectedField.type}
                            onChange={(event) =>
                                onChangeFieldType(
                                    selectedField.id,
                                    event.target.value as CertificateFieldType,
                                )
                            }
                            className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        >
                            {fieldTypeOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {isSignatureField(selectedField) ? (
                        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
                            <p className="text-sm font-bold text-blue-950">
                                Imagen de la firma
                            </p>

                            <p className="mt-1 text-xs leading-5 text-blue-700">
                                La firma se muestra como vista previa, pero se
                                guarda como archivo separado.
                            </p>

                            <label className="mt-3 inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#172861] px-4 text-sm font-bold text-white transition hover:bg-[#0B163F]">
                                <ImagePlus className="h-4 w-4" />
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

                            {selectedField.signatureImage ? (
                                <div className="mt-4 rounded-2xl border border-blue-100 bg-white p-3">
                                    <div
                                        className="mx-auto h-20 w-full bg-contain bg-center bg-no-repeat"
                                        style={{
                                            backgroundImage: toCssImageUrl(
                                                selectedField.signatureImage,
                                            ),
                                        }}
                                    />
                                </div>
                            ) : null}
                        </div>
                    ) : null}

                    <div className="space-y-2">
                        <label className="block text-[13px] font-bold text-slate-700">
                            Texto visible / variable
                        </label>

                        <textarea
                            value={selectedField.value}
                            onChange={(event) =>
                                onUpdateField(selectedField.id, {
                                    value: event.target.value,
                                })
                            }
                            className="min-h-[90px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-[13px] font-bold text-slate-700">
                            Tipografía
                        </label>

                        <select
                            value={getFieldFontFamily(selectedField)}
                            onChange={(event) =>
                                onUpdateField(selectedField.id, {
                                    fontFamily: event.target.value,
                                })
                            }
                            className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        >
                            {fontFamilyOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-[13px] font-bold text-slate-700">
                            Formato del texto
                        </label>

                        <select
                            value={getFieldTextCase(selectedField)}
                            onChange={(event) =>
                                onUpdateField(selectedField.id, {
                                    textCase: event.target
                                        .value as CertificateTextCase,
                                })
                            }
                            className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        >
                            {textCaseOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
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
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-2">
                            <label className="block text-[13px] font-bold text-slate-700">
                                Color
                            </label>

                            <input
                                type="color"
                                value={selectedField.color}
                                onChange={(event) =>
                                    onUpdateField(selectedField.id, {
                                        color: event.target.value,
                                    })
                                }
                                className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-[13px] font-bold text-slate-700">
                                Peso
                            </label>

                            <select
                                value={selectedField.fontWeight}
                                onChange={(event) =>
                                    onUpdateField(selectedField.id, {
                                        fontWeight: event.target.value as
                                            | "normal"
                                            | "bold",
                                    })
                                }
                                className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                            >
                                <option value="normal">Normal</option>
                                <option value="bold">Negrita</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-[13px] font-bold text-slate-700">
                            Alineación
                        </label>

                        <select
                            value={selectedField.textAlign}
                            onChange={(event) =>
                                onUpdateField(selectedField.id, {
                                    textAlign: event.target
                                        .value as CertificateTextAlign,
                                })
                            }
                            className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        >
                            {alignOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        type="button"
                        onClick={() => onDeleteField(selectedField.id)}
                        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-5 text-sm font-bold text-red-700 transition hover:bg-red-100"
                    >
                        <Trash2 className="h-4 w-4" />
                        Eliminar campo
                    </button>
                </div>
            )}
        </div>
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
        <div className="space-y-2">
            <label className="block text-[13px] font-bold text-slate-700">
                {label}
            </label>

            <input
                type="number"
                min={min}
                max={max}
                value={value}
                onChange={(event) => onChange(Number(event.target.value))}
                className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
        </div>
    );
}