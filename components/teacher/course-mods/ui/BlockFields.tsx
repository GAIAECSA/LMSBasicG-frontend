import type { Dispatch, SetStateAction } from "react";
import type {
    BlockFormState,
    LessonCompletionType,
    LessonItemType,
} from "../types";

type BlockFieldsProps = {
    itemType: LessonItemType;
    blockForm: BlockFormState;
    setBlockForm: Dispatch<SetStateAction<BlockFormState>>;
};

export function BlockFields({
    itemType,
    blockForm,
    setBlockForm,
}: BlockFieldsProps) {
    const showFinalGradeOption =
        itemType === "quiz" || itemType === "homework";

    return (
        <div className="space-y-5 rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <div className="grid gap-4 md:grid-cols-2">

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

            <div
                className={`grid gap-3 ${showFinalGradeOption
                        ? "md:grid-cols-2"
                        : "md:grid-cols-1"
                    }`}
            >
                <CheckInput
                    label="Mostrar"
                    checked={blockForm.is_active}
                    onChange={(checked) =>
                        setBlockForm((current) => ({
                            ...current,
                            is_active: checked,
                        }))
                    }
                />

                {showFinalGradeOption ? (
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
                ) : null}
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