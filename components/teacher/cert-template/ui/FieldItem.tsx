import type { PointerEvent as ReactPointerEvent } from "react";
import type { CertificateField } from "@/services/certificates.service";
import {
    getCssFontFamily,
    getFieldFontFamily,
    getFormattedFieldPreviewValue,
    getJustifyContentByAlign,
    isSignatureField,
    toCssImageUrl,
} from "../utils";

export type FieldResizeHandle =
    | "top-left"
    | "top"
    | "top-right"
    | "right"
    | "bottom-right"
    | "bottom"
    | "bottom-left"
    | "left";

type FieldItemProps = {
    field: CertificateField;
    isSelected: boolean;
    onPointerDown: (
        event: ReactPointerEvent<HTMLDivElement>,
        fieldId: string,
    ) => void;
    onResizePointerDown: (
        event: ReactPointerEvent<HTMLButtonElement>,
        field: CertificateField,
        handle: FieldResizeHandle,
    ) => void;
};

type HandleConfig = {
    handle: FieldResizeHandle;
    label: string;
    className: string;
};

const HANDLE_CONFIGS: HandleConfig[] = [
    {
        handle: "top-left",
        label: "Redimensionar desde la esquina superior izquierda",
        className:
            "-left-1.5 -top-1.5 cursor-nwse-resize",
    },
    {
        handle: "top",
        label: "Redimensionar desde el borde superior",
        className:
            "left-1/2 -top-1.5 -translate-x-1/2 cursor-ns-resize",
    },
    {
        handle: "top-right",
        label: "Redimensionar desde la esquina superior derecha",
        className:
            "-right-1.5 -top-1.5 cursor-nesw-resize",
    },
    {
        handle: "right",
        label: "Redimensionar desde el borde derecho",
        className:
            "-right-1.5 top-1/2 -translate-y-1/2 cursor-ew-resize",
    },
    {
        handle: "bottom-right",
        label: "Redimensionar desde la esquina inferior derecha",
        className:
            "-bottom-1.5 -right-1.5 cursor-nwse-resize",
    },
    {
        handle: "bottom",
        label: "Redimensionar desde el borde inferior",
        className:
            "-bottom-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize",
    },
    {
        handle: "bottom-left",
        label: "Redimensionar desde la esquina inferior izquierda",
        className:
            "-bottom-1.5 -left-1.5 cursor-nesw-resize",
    },
    {
        handle: "left",
        label: "Redimensionar desde el borde izquierdo",
        className:
            "-left-1.5 top-1/2 -translate-y-1/2 cursor-ew-resize",
    },
];

export function FieldItem({
    field,
    isSelected,
    onPointerDown,
    onResizePointerDown,
}: FieldItemProps) {
    const isSignature = isSignatureField(field);
    const currentFontFamily = getFieldFontFamily(field);
    const formattedText = getFormattedFieldPreviewValue(field);

    return (
        <div
            role="button"
            tabIndex={0}
            onPointerDown={(event) =>
                onPointerDown(event, field.id)
            }
            className={`absolute touch-none select-none -translate-x-1/2 -translate-y-1/2 cursor-move rounded-lg px-1.5 py-1 transition sm:rounded-xl sm:px-2 ${
                isSelected
                    ? "z-20 ring-2 ring-[#172861] ring-offset-1 sm:ring-offset-2"
                    : "hover:ring-2 hover:ring-blue-200"
            }`}
            style={{
                left: `${field.x}%`,
                top: `${field.y}%`,
                width: `${field.width}%`,
                height: `${field.height ?? 8}%`,
                color: field.color,
                fontSize: `${field.fontSize}px`,
                fontWeight: field.fontWeight,
                textAlign: field.textAlign,
                fontFamily: getCssFontFamily(currentFontFamily),
            }}
        >
            {isSignature ? (
                <div
                    className="flex h-full w-full min-w-0 flex-col items-center"
                    style={{
                        color: field.color,
                        textAlign: "center",
                        fontFamily: getCssFontFamily(
                            currentFontFamily,
                        ),
                    }}
                >
                    <div className="relative flex h-[66%] w-full items-center justify-center">
                        {field.signatureImage ? (
                            <div
                                className="h-full w-full bg-contain bg-center bg-no-repeat"
                                style={{
                                    backgroundImage:
                                        toCssImageUrl(
                                            field.signatureImage,
                                        ),
                                }}
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center rounded-md border border-dashed border-slate-400 bg-white/60 px-1 text-center text-[8px] font-bold leading-3 text-slate-500 sm:rounded-lg sm:text-[10px]">
                                Sin firma
                            </div>
                        )}
                    </div>

                    <div className="mt-1 h-px w-[96%] bg-current opacity-70" />

                    <p
                        className="mt-1 w-full truncate text-center"
                        style={{
                            fontSize: `${field.fontSize}px`,
                            fontWeight: field.fontWeight,
                            fontFamily: getCssFontFamily(
                                currentFontFamily,
                            ),
                        }}
                    >
                        {formattedText}
                    </p>
                </div>
            ) : (
                <div
                    className="flex h-full w-full min-w-0 items-center overflow-hidden"
                    style={{
                        justifyContent:
                            getJustifyContentByAlign(
                                field.textAlign,
                            ),
                        fontFamily: getCssFontFamily(
                            currentFontFamily,
                        ),
                    }}
                >
                    <p
                        className="w-full whitespace-pre-wrap break-words leading-[1.1] [overflow-wrap:anywhere]"
                        style={{
                            fontSize: `${field.fontSize}px`,
                            fontWeight: field.fontWeight,
                            color: field.color,
                            textAlign: field.textAlign,
                            fontFamily: getCssFontFamily(
                                currentFontFamily,
                            ),
                        }}
                    >
                        {formattedText}
                    </p>
                </div>
            )}

            {isSelected
                ? HANDLE_CONFIGS.map((config) => (
                      <button
                          key={config.handle}
                          type="button"
                          title={config.label}
                          aria-label={config.label}
                          onPointerDown={(event) =>
                              onResizePointerDown(
                                  event,
                                  field,
                                  config.handle,
                              )
                          }
                          className={`absolute z-30 h-3 w-3 rounded-full border-2 border-white bg-[#172861] shadow-sm transition hover:scale-125 focus:outline-none focus:ring-2 focus:ring-blue-300 ${config.className}`}
                      />
                  ))
                : null}
        </div>
    );
}
