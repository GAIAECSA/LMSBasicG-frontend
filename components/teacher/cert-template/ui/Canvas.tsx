import type {
    ChangeEvent,
    PointerEvent as ReactPointerEvent,
    RefObject,
} from "react";
import { BadgeCheck, ImagePlus } from "lucide-react";
import type { CertificateTemplate } from "@/services/certificates.service";
import { normalizeQrConfig, toCssImageUrl } from "../utils";
import { FieldItem } from "./FieldItem";
import { QrBox } from "./QrBox";

type CanvasProps = {
    certificateRef: RefObject<HTMLDivElement | null>;
    template: CertificateTemplate;
    selectedFieldId: string | null;
    isDraggingQr: boolean;
    onBackgroundUpload: (event: ChangeEvent<HTMLInputElement>) => void;
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
    onBackgroundUpload,
    onPointerMove,
    onPointerUp,
    onFieldPointerDown,
    onQrPointerDown,
}: CanvasProps) {
    const qrConfig = normalizeQrConfig(template.qrConfig);
    const hasBackgroundImage = Boolean(
        String(template.backgroundImage ?? "").trim(),
    );

    return (
        <section className="rounded-[2rem] border border-[var(--border)] bg-white p-4 shadow-sm sm:p-5 md:p-6">
            <div className="mb-4 flex flex-col gap-1 px-1">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
                    Vista previa editable
                </p>
                <h1 className="text-xl font-bold text-slate-950">
                    Área de diseño
                </h1>
                <p className="text-sm text-[var(--muted-foreground)]">
                    Arrastra los campos dentro del certificado para ubicarlos en la posición deseada.
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
                    {hasBackgroundImage ? (
                        <div
                            className="pointer-events-none absolute inset-0 select-none bg-cover bg-center bg-no-repeat"
                            style={{
                                backgroundImage: toCssImageUrl(
                                    template.backgroundImage,
                                ),
                            }}
                        />
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-orange-50 px-6 text-center">
                            <BadgeCheck className="h-16 w-16 text-[#172861]" />

                            <h2 className="mt-4 text-2xl font-bold text-slate-950 sm:text-3xl">
                                Comienza con la imagen de fondo
                            </h2>

                            <p className="mt-2 max-w-xl text-sm font-medium leading-6 text-slate-500">
                                Sube la plantilla base antes de agregar campos, firmas o código QR.
                            </p>

                            <label className="mt-5 inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#172861] px-5 text-sm font-bold text-white shadow-sm transition hover:bg-[#0B163F]">
                                <ImagePlus className="h-4 w-4" />
                                Subir imagen de fondo
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={onBackgroundUpload}
                                    className="hidden"
                                />
                            </label>
                        </div>
                    )}

                    {hasBackgroundImage
                        ? template.fields.map((field) => (
                            <FieldItem
                                key={field.id}
                                field={field}
                                isSelected={selectedFieldId === field.id}
                                onPointerDown={onFieldPointerDown}
                            />
                        ))
                        : null}

                    {hasBackgroundImage ? (
                        <QrBox
                            qrConfig={qrConfig}
                            isDraggingQr={isDraggingQr}
                            onPointerDown={onQrPointerDown}
                        />
                    ) : null}
                </div>
            </div>
        </section>
    );
}
