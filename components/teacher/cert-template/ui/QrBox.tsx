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
            className={`absolute flex touch-none select-none -translate-x-1/2 -translate-y-1/2 cursor-move flex-col items-center justify-center rounded-lg border-2 bg-white p-0.5 shadow-sm transition sm:rounded-xl sm:p-1 ${
                isDraggingQr
                    ? "border-[#172861] ring-2 ring-[#172861] ring-offset-1 sm:ring-offset-2"
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

            <span className="pointer-events-none absolute -bottom-5 rounded-full bg-slate-950 px-1.5 py-0.5 text-[8px] font-bold text-white sm:-bottom-6 sm:px-2 sm:text-[10px]">
                QR
            </span>
        </div>
    );
}

export function QrPreviewBox() {
    return (
        <div className="grid h-full w-full grid-cols-7 grid-rows-7 gap-[1px] bg-white p-0.5 sm:gap-[2px] sm:p-1">
            {Array.from({ length: 49 }).map((_, index) => {
                const row = Math.floor(index / 7);
                const col = index % 7;

                const active = QR_CELLS.some(
                    ([cellCol, cellRow]) =>
                        cellCol === col && cellRow === row,
                );

                return (
                    <div
                        key={`${col}-${row}`}
                        className={
                            active
                                ? "bg-slate-950"
                                : "bg-transparent"
                        }
                    />
                );
            })}
        </div>
    );
}
