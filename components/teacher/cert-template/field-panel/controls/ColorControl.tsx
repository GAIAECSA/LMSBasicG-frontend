type ColorControlProps = {
    label: string;
    value: string;
    onChange: (value: string) => void;
};

export function ColorControl({
    label,
    value,
    onChange,
}: ColorControlProps) {
    return (
        <label className="block min-w-0">
            <span className="mb-1 block truncate text-[10px] font-black uppercase tracking-wide text-slate-500">
                {label}
            </span>

            <input
                type="color"
                value={value}
                onChange={(event) =>
                    onChange(event.target.value)
                }
                className="h-9 w-full min-w-0 cursor-pointer rounded-lg border border-slate-200 bg-white px-1.5 sm:rounded-xl"
            />
        </label>
    );
}
