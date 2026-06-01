import type { PointerEvent as ReactPointerEvent } from "react";
import type { CertificateQrConfig } from "@/services/certificates.service";
import { QR_CELLS } from "../constants";

type QrBoxProps = {
    qrConfig: CertificateQrConfig;
    isDraggingQr: boolean;
    onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
};

export function QrBox({
    qrConfig,
    isDraggingQr,
    onPointerDown,
}: QrBoxProps) {
    if (!qrConfig.enabled) return null;

    return (
        <div
            role="button"
            tabIndex={0}
            onPointerDown={onPointerDown}
            className={`absolute flex -translate-x-1/2 -translate-y-1/2 cursor-move flex-col items-center justify-center rounded-xl border-2 bg-white p-1 shadow-sm transition ${isDraggingQr
                    ? "border-[#172861] ring-2 ring-[#172861] ring-offset-2"
                    : "border-slate-900 hover:ring-2 hover:ring-blue-200"
                }`}
            style={{
                left: `${qrConfig.x}%`,
                top: `${qrConfig.y}%`,
                width: `${qrConfig.size}%`,
                aspectRatio: "1 / 1",
            }}
        >
            <QrPreviewBox />

            <span className="pointer-events-none absolute -bottom-6 rounded-full bg-slate-950 px-2 py-0.5 text-[10px] font-bold text-white">
                QR
            </span>
        </div>
    );
}

export function QrPreviewBox() {
    return (
        <div className="grid h-full w-full grid-cols-7 grid-rows-7 gap-[2px] bg-white p-1">
            {Array.from({ length: 49 }).map((_, index) => {
                const row = Math.floor(index / 7);
                const col = index % 7;
                const active = QR_CELLS.some(
                    ([cellCol, cellRow]) => cellCol === col && cellRow === row,
                );

                return (
                    <div
                        key={`${col}-${row}`}
                        className={active ? "bg-slate-950" : "bg-transparent"}
                    />
                );
            })}
        </div>
    );
}