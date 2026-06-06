import type { ChangeEvent } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { fieldTypeOptions } from "../constants";
import type { CertificateFieldWithFormat } from "../types";
import { isSignatureField } from "../utils";

type FieldPanelHeaderProps = {
    selectedField: CertificateFieldWithFormat;
    onSignatureUpload: (
        event: ChangeEvent<HTMLInputElement>,
        fieldId: string,
    ) => void;
    onDeleteField: (fieldId: string) => void;
};

export function FieldPanelHeader({
    selectedField,
    onSignatureUpload,
    onDeleteField,
}: FieldPanelHeaderProps) {
    const selectedLabel =
        fieldTypeOptions.find(
            (option) => option.value === selectedField.type,
        )?.label ?? "Campo seleccionado";

    return (
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-blue-700 sm:text-[10px] sm:tracking-[0.22em]">
                    Editando campo
                </p>

                <h3 className="truncate text-sm font-black text-slate-950">
                    {selectedLabel}
                </h3>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0 sm:flex-wrap sm:items-center">
                {isSignatureField(selectedField) ? (
                    <label className="inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 text-xs font-black text-blue-700 transition hover:bg-blue-100 active:scale-[0.97]">
                        <ImagePlus className="h-4 w-4 shrink-0" />
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
                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 text-xs font-black text-red-700 transition hover:bg-red-100 active:scale-[0.97]"
                >
                    <Trash2 className="h-4 w-4 shrink-0" />
                    Eliminar
                </button>
            </div>
        </div>
    );
}
