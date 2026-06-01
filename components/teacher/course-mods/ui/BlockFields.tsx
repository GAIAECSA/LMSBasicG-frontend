import type { Dispatch, SetStateAction } from "react";
import { DEFAULT_LESSON_BLOCK_TYPE_IDS } from "../constants";
import type {
    BlockFormState,
    LessonCompletionType,
    LessonItemType,
} from "../types";
import { getItemLabel } from "../utils";

type BlockFieldsProps = {
    itemType: LessonItemType;
    blockForm: BlockFormState;
    setBlockForm: Dispatch<SetStateAction<BlockFormState>>;
};

function getCompletionTypeLabel(value: LessonCompletionType) {
    if (value === "VER") return "Solo visualizar";
    if (value === "RESPONDER") return "Responder actividad";
    if (value === "SUBIR") return "Subir archivo";

    return value;
}

export function BlockFields({
    itemType,
    blockForm,
    setBlockForm,
}: BlockFieldsProps) {
    return (
        <div className="space-y-5 rounded-3xl border border-slate-200 bg-slate-50 p-4">

            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <label className="block text-[13px] font-black text-slate-700">
                        Tipo de finalización
                    </label>

                    <select
                        value={blockForm.completion_type}
                        onChange={(event) =>
                            setBlockForm((current) => ({
                                ...current,
                                completion_type: event.target
                                    .value as LessonCompletionType,
                            }))
                        }
                        className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    >
                        <option value="VER">Solo visualizar el contenido</option>
                        <option value="RESPONDER">Responder una actividad</option>
                        <option value="SUBIR">Subir un archivo</option>
                    </select>
                </div>


                <TextInput
                    label="Fecha disponible"
                    type="datetime-local"
                    placeholder=""
                    value={blockForm.date_available}
                    onChange={(value) =>
                        setBlockForm((current) => ({
                            ...current,
                            date_available: value,
                        }))
                    }
                />
            </div>

            <div className="grid gap-3 md:grid-cols-3">
                {/*  <CheckInput
                    label="Bloque principal"
                    checked={blockForm.default}
                    onChange={(checked) =>
                        setBlockForm((current) => ({
                            ...current,
                            default: checked,
                        }))
                    }
                /> */}

                {/* <CheckInput
                    label="Obligatorio"
                    checked={blockForm.is_required}
                    onChange={(checked) =>
                        setBlockForm((current) => ({
                            ...current,
                            is_required: checked,
                        }))
                    }
                /> */}

                <CheckInput
                    label="Activo"
                    checked={blockForm.is_active}
                    onChange={(checked) =>
                        setBlockForm((current) => ({
                            ...current,
                            is_active: checked,
                        }))
                    }
                />

                <CheckInput
                    label="Cuenta para la nota final"
                    checked={blockForm.counts_toward_grade}
                    onChange={(checked) =>
                        setBlockForm((current) => ({
                            ...current,
                            counts_toward_grade: checked,
                        }))
                    }
                />
            </div>

            <div className="space-y-2">
                <label className="block text-[13px] font-black text-slate-700">
                    Archivo adjunto
                </label>

                <p className="text-xs font-semibold text-slate-500">
                    Sube un archivo si este bloque requiere material, recurso o
                    evidencia. Puedes dejarlo vacío si no aplica.
                </p>

                <input
                    type="file"
                    onChange={(event) =>
                        setBlockForm((current) => ({
                            ...current,
                            file: event.target.files?.[0] ?? null,
                        }))
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 file:mr-4 file:rounded-xl file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-black file:text-blue-700 hover:file:bg-blue-100"
                />

                {blockForm.file ? (
                    <p className="rounded-xl bg-white px-3 py-2 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
                        Archivo seleccionado: {blockForm.file.name}
                    </p>
                ) : (
                    <p className="text-xs font-semibold text-slate-400">
                        No se ha seleccionado ningún archivo.
                    </p>
                )}
            </div>
        </div>
    );
}

function TextInput({
    label,
    description,
    type,
    value,
    placeholder,
    onChange,
}: {
    label: string;
    description?: string;
    type: string;
    value: string;
    placeholder?: string;
    onChange: (value: string) => void;
}) {
    return (
        <div className="space-y-2">
            <label className="block text-[13px] font-black text-slate-700">
                {label}
            </label>

            <input
                type={type}
                value={value}
                placeholder={placeholder}
                onChange={(event) => onChange(event.target.value)}
                className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />

            {description ? (
                <p className="text-xs font-semibold text-slate-500">
                    {description}
                </p>
            ) : null}
        </div>
    );
}

function CheckInput({
    label,
    description,
    checked,
    onChange,
}: {
    label: string;
    description?: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}) {
    return (
        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50/40">
            <input
                type="checkbox"
                checked={checked}
                onChange={(event) => onChange(event.target.checked)}
                className="mt-1 h-4 w-4 accent-blue-700"
            />

            <span>
                <span className="block font-black text-slate-700">
                    {label}
                </span>

                {description ? (
                    <span className="mt-1 block text-xs font-semibold leading-5 text-slate-500">
                        {description}
                    </span>
                ) : null}
            </span>
        </label>
    );
}