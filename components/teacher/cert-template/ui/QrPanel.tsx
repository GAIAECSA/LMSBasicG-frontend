import type { CertificateQrConfig } from "@/services/certificates.service";

type QrPanelProps = {
    qrConfig: CertificateQrConfig;
    onUpdateQrConfig: (changes: Partial<CertificateQrConfig>) => void;
};

export function QrPanel({ qrConfig, onUpdateQrConfig }: QrPanelProps) {
    return (
        <div className="rounded-3xl border border-blue-200 bg-white p-5 shadow-sm">
            <div className="space-y-4">
                <label className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <span>
                        <span className="block text-sm font-bold text-slate-800">
                            Mostrar QR
                        </span>
                        <span className="block text-xs font-semibold text-slate-500">
                            Se guarda como qr_config.enabled.
                        </span>
                    </span>

                    <input
                        type="checkbox"
                        checked={Boolean(qrConfig.enabled)}
                        onChange={(event) =>
                            onUpdateQrConfig({
                                enabled: event.target.checked,
                            })
                        }
                        className="h-5 w-5 accent-[#172861]"
                    />
                </label>
            </div>
        </div>
    );
}