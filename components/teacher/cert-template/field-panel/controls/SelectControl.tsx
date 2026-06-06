export type SelectOption = {
    value: string;
    label: string;
};

type SelectControlProps = {
    label: string;
    value: string;
    options: SelectOption[];
    onChange: (value: string) => void;
};

export function SelectControl({
    label,
    value,
    options,
    onChange,
}: SelectControlProps) {
    return (
        <label className="block min-w-0">
            <span className="mb-1 block truncate text-[10px] font-black uppercase tracking-wide text-slate-500">
                {label}
            </span>

            <select
                value={value}
                onChange={(event) =>
                    onChange(event.target.value)
                }
                className="h-9 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:rounded-xl"
            >
                {options.map((option) => (
                    <option
                        key={option.value}
                        value={option.value}
                    >
                        {option.label}
                    </option>
                ))}
            </select>
        </label>
    );
}
