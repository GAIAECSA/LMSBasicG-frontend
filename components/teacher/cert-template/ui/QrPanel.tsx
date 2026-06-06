import type { CertificateQrConfig } from "@/services/certificates.service";

type QrPanelProps = {
    qrConfig: CertificateQrConfig;
    onUpdateQrConfig: (changes: Partial<CertificateQrConfig>) => void;
};

export function QrPanel({
    qrConfig,
    onUpdateQrConfig,
}: QrPanelProps) {
    return (
        <div className="rounded-2xl border border-blue-200 bg-white p-3 shadow-sm sm:rounded-3xl sm:p-4 lg:p-5 [@media(max-height:760px)]:p-3">
            <div className="space-y-3 sm:space-y-4">
                <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 transition hover:border-blue-200 hover:bg-blue-50/50 sm:rounded-2xl sm:px-4 sm:py-3">
                    <span className="min-w-0">
                        <span className="block text-xs font-bold text-slate-800 sm:text-sm">
                            Mostrar QR
                        </span>

                        <span className="mt-0.5 block text-[10px] font-semibold leading-4 text-slate-500 sm:text-xs sm:leading-5">
                            Activa o desactiva el código QR del certificado.
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
                        className="h-4 w-4 shrink-0 accent-[#172861] sm:h-5 sm:w-5"
                    />
                </label>
            </div>
        </div>
    );
}
