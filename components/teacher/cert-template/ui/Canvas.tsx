import type {
    PointerEvent as ReactPointerEvent,
    RefObject,
} from "react";
import { BadgeCheck } from "lucide-react";
import type { CertificateTemplate } from "@/services/certificates.service";
import { normalizeQrConfig, toCssImageUrl } from "../utils";
import { FieldItem } from "./FieldItem";
import { QrBox } from "./QrBox";

type CanvasProps = {
    certificateRef: RefObject<HTMLDivElement | null>;
    template: CertificateTemplate;
    selectedFieldId: string | null;
    isDraggingQr: boolean;
    onPointerMove: (event: ReactPointerEvent<HTMLDivElement>) => void;
    onPointerUp: () => void;
    onFieldPointerDown: (
        event: ReactPointerEvent<HTMLDivElement>,
        fieldId: string,
    ) => void;
    onQrPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
};

export function Canvas({
    certificateRef,
    template,
    selectedFieldId,
    isDraggingQr,
    onPointerMove,
    onPointerUp,
    onFieldPointerDown,
    onQrPointerDown,
}: CanvasProps) {
    const qrConfig = normalizeQrConfig(template.qrConfig);

    return (
        <div className="rounded-3xl border border-[var(--border)] bg-white p-4 shadow-sm">
            <div className="mb-4 flex flex-col gap-1 px-1">
                <h1 className="text-xl font-bold text-slate-950">
                    Área de diseño
                </h1>
                <p className="text-sm text-[var(--muted-foreground)]">
                    Arrastra los campos dentro del certificado para ubicarlos en
                    la posición deseada.
                </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-100 p-3 shadow-inner">
                <div
                    ref={certificateRef}
                    className="relative mx-auto aspect-[297/210] w-full max-w-6xl overflow-hidden rounded-2xl bg-white shadow-sm"
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    onPointerLeave={onPointerUp}
                >
                    {template.backgroundImage ? (
                        <div
                            className="pointer-events-none absolute inset-0 select-none bg-cover bg-center bg-no-repeat"
                            style={{
                                backgroundImage: toCssImageUrl(
                                    template.backgroundImage,
                                ),
                            }}
                        />
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-orange-50 text-center">
                            <BadgeCheck className="h-16 w-16 text-[#172861]" />

                            <h2 className="mt-4 text-3xl font-bold text-slate-950">
                                Certificado de finalización
                            </h2>

                            <p className="mt-2 max-w-xl text-sm text-slate-500">
                                Sube una imagen de fondo para empezar a diseñar
                                tu plantilla.
                            </p>
                        </div>
                    )}

                    {template.fields.map((field) => (
                        <FieldItem
                            key={field.id}
                            field={field}
                            isSelected={selectedFieldId === field.id}
                            onPointerDown={onFieldPointerDown}
                        />
                    ))}

                    <QrBox
                        qrConfig={qrConfig}
                        isDraggingQr={isDraggingQr}
                        onPointerDown={onQrPointerDown}
                    />
                </div>
            </div>
        </div>
    );
}