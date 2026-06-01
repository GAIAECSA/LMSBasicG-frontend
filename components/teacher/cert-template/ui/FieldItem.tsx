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

type FieldItemProps = {
    field: CertificateField;
    isSelected: boolean;
    onPointerDown: (
        event: ReactPointerEvent<HTMLDivElement>,
        fieldId: string,
    ) => void;
};

export function FieldItem({
    field,
    isSelected,
    onPointerDown,
}: FieldItemProps) {
    const isSignature = isSignatureField(field);
    const currentFontFamily = getFieldFontFamily(field);
    const formattedText = getFormattedFieldPreviewValue(field);

    return (
        <div
            role="button"
            tabIndex={0}
            onPointerDown={(event) => onPointerDown(event, field.id)}
            className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-move rounded-xl px-2 py-1 transition ${isSelected
                    ? "ring-2 ring-[#172861] ring-offset-2"
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
                    className="flex h-full w-full flex-col items-center"
                    style={{
                        color: field.color,
                        textAlign: "center",
                        fontFamily: getCssFontFamily(currentFontFamily),
                    }}
                >
                    <div className="relative flex h-[66%] w-full items-center justify-center">
                        {field.signatureImage ? (
                            <div
                                className="h-full w-full bg-contain bg-center bg-no-repeat"
                                style={{
                                    backgroundImage: toCssImageUrl(
                                        field.signatureImage,
                                    ),
                                }}
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center rounded-lg border border-dashed border-slate-400 bg-white/60 text-[10px] font-bold text-slate-500">
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
                            fontFamily: getCssFontFamily(currentFontFamily),
                        }}
                    >
                        {formattedText}
                    </p>
                </div>
            ) : (
                <div
                    className="flex h-full w-full items-center"
                    style={{
                        justifyContent: getJustifyContentByAlign(
                            field.textAlign,
                        ),
                        fontFamily: getCssFontFamily(currentFontFamily),
                    }}
                >
                    <p
                        className="w-full whitespace-pre-wrap break-words leading-[1.15]"
                        style={{
                            fontSize: `${field.fontSize}px`,
                            fontWeight: field.fontWeight,
                            color: field.color,
                            textAlign: field.textAlign,
                            fontFamily: getCssFontFamily(currentFontFamily),
                        }}
                    >
                        {formattedText}
                    </p>
                </div>
            )}
        </div>
    );
}