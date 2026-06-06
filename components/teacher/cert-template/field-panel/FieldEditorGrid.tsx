import type {
    CertificateFieldType,
    CertificateTextAlign,
} from "@/services/certificates.service";
import {
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
} from "../utils";
import { AlignmentControl } from "./controls/AlignmentControl";
import { ColorControl } from "./controls/ColorControl";
import { NumberControl } from "./controls/NumberControl";
import { SelectControl } from "./controls/SelectControl";
import { TextControl } from "./controls/TextControl";
import { WeightControl } from "./controls/WeightControl";

type FieldEditorGridProps = {
    selectedField: CertificateFieldWithFormat;
    onUpdateField: (
        fieldId: string,
        changes: Partial<CertificateFieldWithFormat>,
    ) => void;
    onChangeFieldType: (
        fieldId: string,
        nextType: CertificateFieldType,
    ) => void;
};

export function FieldEditorGrid({
    selectedField,
    onUpdateField,
    onChangeFieldType,
}: FieldEditorGridProps) {
    return (
        <div className="min-w-0 space-y-3">
            <div className="grid min-w-0 gap-2 md:grid-cols-[minmax(150px,190px)_minmax(0,1fr)]">
                <SelectControl
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

                <TextControl
                    label="Texto"
                    value={selectedField.value}
                    onChange={(value) =>
                        onUpdateField(selectedField.id, {
                            value,
                        })
                    }
                />
            </div>

            <div className="grid min-w-0 grid-cols-2 gap-2 min-[520px]:grid-cols-3 lg:grid-cols-[minmax(130px,1.15fr)_minmax(125px,1fr)_76px_minmax(128px,1fr)_72px_58px]">
                <SelectControl
                    label="Fuente"
                    value={getFieldFontFamily(selectedField)}
                    onChange={(value) =>
                        onUpdateField(selectedField.id, {
                            fontFamily: value,
                        })
                    }
                    options={fontFamilyOptions}
                />

                <SelectControl
                    label="Formato"
                    value={getFieldTextCase(selectedField)}
                    onChange={(value) =>
                        onUpdateField(selectedField.id, {
                            textCase: value as CertificateTextCase,
                        })
                    }
                    options={textCaseOptions}
                />

                <NumberControl
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

                <AlignmentControl
                    value={selectedField.textAlign}
                    onChange={(value: CertificateTextAlign) =>
                        onUpdateField(selectedField.id, {
                            textAlign: value,
                        })
                    }
                />

                <WeightControl
                    value={selectedField.fontWeight}
                    onChange={(value) =>
                        onUpdateField(selectedField.id, {
                            fontWeight: value,
                        })
                    }
                />

                <ColorControl
                    label="Color"
                    value={selectedField.color}
                    onChange={(value) =>
                        onUpdateField(selectedField.id, {
                            color: value,
                        })
                    }
                />
            </div>

            <details className="group rounded-xl border border-slate-200 bg-slate-50 sm:rounded-2xl">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2.5 text-xs font-black text-slate-700 marker:hidden sm:px-4 sm:text-sm">
                    <span>Opciones avanzadas de tamaño</span>

                    <span className="rounded-full bg-white px-2 py-1 text-[10px] font-black text-blue-700 ring-1 ring-blue-100 transition group-open:bg-blue-50">
                        Ancho y alto
                    </span>
                </summary>

                <div className="grid gap-2 border-t border-slate-200 px-3 py-3 sm:grid-cols-[140px_140px_minmax(0,1fr)] sm:px-4">
                    <NumberControl
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

                    <NumberControl
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

                    <div className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2.5 text-[11px] font-semibold leading-5 text-blue-800">
                        Puedes ajustar el ancho y el alto del campo para adaptar el contenido dentro del certificado.
                    </div>
                </div>
            </details>
        </div>
    );
}
