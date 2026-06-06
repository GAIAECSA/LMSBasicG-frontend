import type {
    Dispatch,
    SetStateAction,
} from "react";
import type {
    BlockFormState,
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
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:space-y-4 sm:rounded-3xl sm:p-4">
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

            <div
                className={`grid gap-2 sm:gap-3 ${
                    showFinalGradeOption
                        ? "sm:grid-cols-2"
                        : "sm:grid-cols-1"
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
        <div>
            <label className="block text-xs font-black text-slate-700 sm:text-[13px]">
                {label}
            </label>

            <input
                type={type}
                value={value}
                placeholder={placeholder}
                onChange={(event) => onChange(event.target.value)}
                className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:mt-2 sm:h-11 sm:rounded-2xl sm:px-4 sm:text-sm"
            />

            {description ? (
                <p className="mt-1.5 text-[10px] font-semibold leading-4 text-slate-500 sm:text-xs">
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
        <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50/40 sm:gap-3 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm">
            <input
                type="checkbox"
                checked={checked}
                onChange={(event) => onChange(event.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-blue-700 sm:mt-1"
            />

            <span>
                <span className="block font-black text-slate-700">
                    {label}
                </span>

                {description ? (
                    <span className="mt-1 block text-[10px] font-semibold leading-4 text-slate-500 sm:text-xs sm:leading-5">
                        {description}
                    </span>
                ) : null}
            </span>
        </label>
    );
}
