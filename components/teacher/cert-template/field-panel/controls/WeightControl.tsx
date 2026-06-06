type WeightControlProps = {
    value: "normal" | "bold";
    onChange: (value: "normal" | "bold") => void;
};

export function WeightControl({
    value,
    onChange,
}: WeightControlProps) {
    const active = value === "bold";

    return (
        <div className="min-w-0">
            <span className="mb-1 block truncate text-[10px] font-black uppercase tracking-wide text-slate-500">
                Estilo
            </span>

            <button
                type="button"
                onClick={() =>
                    onChange(active ? "normal" : "bold")
                }
                title={
                    active
                        ? "Quitar negrita"
                        : "Aplicar negrita"
                }
                aria-pressed={active}
                className={`inline-flex h-9 w-full items-center justify-center rounded-lg border text-base font-black transition sm:rounded-xl ${
                    active
                        ? "border-blue-200 bg-blue-100 text-blue-800"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
            >
                B
            </button>
        </div>
    );
}
