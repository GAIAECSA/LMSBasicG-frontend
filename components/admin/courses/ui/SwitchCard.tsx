type SwitchCardProps = {
    checked?:
        boolean;
    label:
        string;
    onChange:
        (
            value:
                boolean,
        ) => void;
};

export function SwitchCard({
    checked =
        false,
    label,
    onChange,
}: SwitchCardProps) {
    return (
        <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-black text-slate-700 transition hover:border-blue-200 hover:bg-blue-50/40 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm [@media(max-height:760px)]:min-h-10 [@media(max-height:760px)]:py-2">
            <input
                type="checkbox"
                checked={
                    Boolean(
                        checked,
                    )
                }
                onChange={(
                    event,
                ) =>
                    onChange(
                        event.target
                            .checked,
                    )
                }
                className="h-4 w-4 shrink-0 rounded border-slate-300 accent-[#172861]"
            />

            <span>
                {label}
            </span>
        </label>
    );
}

export default SwitchCard;
