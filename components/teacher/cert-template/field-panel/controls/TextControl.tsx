type TextControlProps = {
    label: string;
    value: string;
    onChange: (value: string) => void;
};

export function TextControl({
    label,
    value,
    onChange,
}: TextControlProps) {
    return (
        <label className="block min-w-0">
            <span className="mb-1 block truncate text-[10px] font-black uppercase tracking-wide text-slate-500">
                {label}
            </span>

            <input
                value={value}
                onChange={(event) =>
                    onChange(event.target.value)
                }
                className="h-9 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:rounded-xl"
            />
        </label>
    );
}
