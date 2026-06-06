import {
    AlignCenter,
    AlignLeft,
    AlignRight,
} from "lucide-react";
import type { CertificateTextAlign } from "@/services/certificates.service";

type AlignmentControlProps = {
    value: CertificateTextAlign;
    onChange: (value: CertificateTextAlign) => void;
};

const alignmentOptions: Array<{
    value: CertificateTextAlign;
    label: string;
    icon: typeof AlignLeft;
}> = [
    {
        value: "left",
        label: "Alinear a la izquierda",
        icon: AlignLeft,
    },
    {
        value: "center",
        label: "Centrar",
        icon: AlignCenter,
    },
    {
        value: "right",
        label: "Alinear a la derecha",
        icon: AlignRight,
    },
];

export function AlignmentControl({
    value,
    onChange,
}: AlignmentControlProps) {
    return (
        <div className="min-w-0">
            <span className="mb-1 block truncate text-[10px] font-black uppercase tracking-wide text-slate-500">
                Alineación
            </span>

            <div className="grid h-9 grid-cols-3 overflow-hidden rounded-lg border border-slate-200 bg-white sm:rounded-xl">
                {alignmentOptions.map((option) => {
                    const Icon = option.icon;
                    const active = value === option.value;

                    return (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() =>
                                onChange(option.value)
                            }
                            title={option.label}
                            aria-label={option.label}
                            className={`inline-flex items-center justify-center border-r border-slate-200 transition last:border-r-0 ${
                                active
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                            }`}
                        >
                            <Icon className="h-4 w-4" />
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
