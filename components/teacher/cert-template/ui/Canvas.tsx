import {
    useState,
    type ChangeEvent,
    type PointerEvent as ReactPointerEvent,
    type RefObject,
} from "react";
import { BadgeCheck, ImagePlus } from "lucide-react";
import type {
    CertificateField,
    CertificateTemplate,
} from "@/services/certificates.service";
import { normalizeQrConfig, toCssImageUrl } from "../utils";
import {
    FieldItem,
    type FieldResizeHandle,
} from "./FieldItem";
import { QrBox } from "./QrBox";

type CanvasProps = {
    certificateRef: RefObject<HTMLDivElement | null>;
    template: CertificateTemplate;
    selectedFieldId: string | null;
    isDraggingQr: boolean;
    onBackgroundUpload: (
        event: ChangeEvent<HTMLInputElement>,
    ) => void;
    onPointerMove: (
        event: ReactPointerEvent<HTMLDivElement>,
    ) => void;
    onPointerUp: () => void;
    onFieldPointerDown: (
        event: ReactPointerEvent<HTMLDivElement>,
        fieldId: string,
    ) => void;
    onQrPointerDown: (
        event: ReactPointerEvent<HTMLDivElement>,
    ) => void;
    onUpdateField: (
        fieldId: string,
        changes: Partial<CertificateField>,
    ) => void;
};

type FieldResizeState = {
    fieldId: string;
    handle: FieldResizeHandle;
    startClientX: number;
    startClientY: number;
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
};

const MIN_FIELD_WIDTH = 10;
const MIN_FIELD_HEIGHT = 4;
const MAX_FIELD_HEIGHT = 60;

function clamp(
    value: number,
    min: number,
    max: number,
) {
    return Math.min(Math.max(value, min), max);
}

function roundPercentage(value: number) {
    return Math.round(value * 100) / 100;
}

function containsHorizontalHandle(
    handle: FieldResizeHandle,
    direction: "left" | "right",
) {
    return (
        handle === direction ||
        handle === `top-${direction}` ||
        handle === `bottom-${direction}`
    );
}

function containsVerticalHandle(
    handle: FieldResizeHandle,
    direction: "top" | "bottom",
) {
    return (
        handle === direction ||
        handle === `${direction}-left` ||
        handle === `${direction}-right`
    );
}

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
    onUpdateField,
}: CanvasProps) {
    const [resizeState, setResizeState] =
        useState<FieldResizeState | null>(null);

    const qrConfig = normalizeQrConfig(template.qrConfig);

    const hasBackgroundImage = Boolean(
        String(template.backgroundImage ?? "").trim(),
    );

    function handleResizePointerDown(
        event: ReactPointerEvent<HTMLButtonElement>,
        field: CertificateField,
        handle: FieldResizeHandle,
    ) {
        event.preventDefault();
        event.stopPropagation();

        event.currentTarget.setPointerCapture?.(
            event.pointerId,
        );

        setResizeState({
            fieldId: field.id,
            handle,
            startClientX: event.clientX,
            startClientY: event.clientY,
            startX: field.x,
            startY: field.y,
            startWidth: field.width,
            startHeight: field.height ?? 8,
        });
    }

    function handleResizePointerMove(
        event: ReactPointerEvent<HTMLDivElement>,
    ) {
        if (!resizeState) return false;

        const canvasElement = certificateRef.current;

        if (!canvasElement) return false;

        const canvasRect =
            canvasElement.getBoundingClientRect();

        if (
            canvasRect.width <= 0 ||
            canvasRect.height <= 0
        ) {
            return false;
        }

        const deltaX =
            ((event.clientX -
                resizeState.startClientX) /
                canvasRect.width) *
            100;

        const deltaY =
            ((event.clientY -
                resizeState.startClientY) /
                canvasRect.height) *
            100;

        let left =
            resizeState.startX -
            resizeState.startWidth / 2;

        let right =
            resizeState.startX +
            resizeState.startWidth / 2;

        let top =
            resizeState.startY -
            resizeState.startHeight / 2;

        let bottom =
            resizeState.startY +
            resizeState.startHeight / 2;

        if (
            containsHorizontalHandle(
                resizeState.handle,
                "left",
            )
        ) {
            left = clamp(
                left + deltaX,
                0,
                right - MIN_FIELD_WIDTH,
            );
        }

        if (
            containsHorizontalHandle(
                resizeState.handle,
                "right",
            )
        ) {
            right = clamp(
                right + deltaX,
                left + MIN_FIELD_WIDTH,
                100,
            );
        }

        if (
            containsVerticalHandle(
                resizeState.handle,
                "top",
            )
        ) {
            top = clamp(
                top + deltaY,
                Math.max(
                    0,
                    bottom - MAX_FIELD_HEIGHT,
                ),
                bottom - MIN_FIELD_HEIGHT,
            );
        }

        if (
            containsVerticalHandle(
                resizeState.handle,
                "bottom",
            )
        ) {
            bottom = clamp(
                bottom + deltaY,
                top + MIN_FIELD_HEIGHT,
                Math.min(
                    100,
                    top + MAX_FIELD_HEIGHT,
                ),
            );
        }

        const width = roundPercentage(right - left);
        const height = roundPercentage(bottom - top);

        onUpdateField(resizeState.fieldId, {
            x: roundPercentage(left + width / 2),
            y: roundPercentage(top + height / 2),
            width,
            height,
        });

        return true;
    }

    function handleCanvasPointerMove(
        event: ReactPointerEvent<HTMLDivElement>,
    ) {
        if (handleResizePointerMove(event)) return;

        onPointerMove(event);
    }

    function handleCanvasPointerUp() {
        setResizeState(null);
        onPointerUp();
    }

    return (
        <section className="min-w-0 rounded-2xl border border-[var(--border)] bg-white p-3 shadow-sm sm:rounded-[2rem] sm:p-4 lg:p-5 [@media(max-height:760px)]:p-3">
            <div className="mb-3 flex min-w-0 flex-col gap-1 px-1 sm:mb-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-700 sm:text-xs sm:tracking-[0.18em]">
                    Vista previa editable
                </p>

                <h1 className="text-lg font-bold text-slate-950 sm:text-xl">
                    Área de diseño
                </h1>

                <p className="text-xs leading-5 text-[var(--muted-foreground)] sm:text-sm">
                    Arrastra el centro de un campo para moverlo.
                    Cuando esté seleccionado, arrastra sus puntos
                    de control para ajustar el ancho y el alto.
                </p>
            </div>

            <div className="min-w-0 overflow-x-auto rounded-2xl border border-slate-200 bg-slate-100 p-2.5 shadow-inner sm:rounded-3xl sm:p-3">
                <div
                    ref={certificateRef}
                    className="relative mx-auto aspect-[297/210] w-full min-w-[720px] max-w-6xl touch-none overflow-hidden rounded-xl bg-white shadow-sm sm:min-w-[820px] sm:rounded-2xl lg:min-w-0"
                    onPointerMove={handleCanvasPointerMove}
                    onPointerUp={handleCanvasPointerUp}
                    onPointerCancel={handleCanvasPointerUp}
                    onPointerLeave={handleCanvasPointerUp}
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
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-orange-50 px-4 text-center sm:px-6">
                            <BadgeCheck className="h-10 w-10 text-[#172861] sm:h-14 sm:w-14 lg:h-16 lg:w-16" />

                            <h2 className="mt-3 text-lg font-bold text-slate-950 sm:mt-4 sm:text-2xl lg:text-3xl">
                                Comienza con la imagen de fondo
                            </h2>

                            <p className="mt-2 max-w-xl text-xs font-medium leading-5 text-slate-500 sm:text-sm sm:leading-6">
                                Sube la plantilla base antes de agregar
                                campos, firmas o código QR.
                            </p>

                            <label className="mt-4 inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#172861] px-4 text-xs font-bold text-white shadow-sm transition hover:bg-[#0B163F] active:scale-[0.97] sm:mt-5 sm:h-11 sm:rounded-2xl sm:px-5 sm:text-sm">
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
                                  isSelected={
                                      selectedFieldId ===
                                      field.id
                                  }
                                  onPointerDown={
                                      onFieldPointerDown
                                  }
                                  onResizePointerDown={
                                      handleResizePointerDown
                                  }
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
