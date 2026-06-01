import {
    getCertificateFieldPreviewValue,
    type CertificateField,
    type CertificateQrConfig,
    type CertificateTextAlign,
} from "@/services/certificates.service";
import { DEFAULT_QR_CONFIG } from "./constants";
import type {
    CertificateFieldWithFormat,
    CertificateTextCase,
    CompressImageOptions,
} from "./types";

export function getCourseIdFromPathname(pathname: string) {
    const teacherMatch = pathname.match(
        /^\/teacher\/courses\/([^/]+)\/certificates/,
    );
    const adminMatch = pathname.match(
        /^\/admin\/courses\/([^/]+)\/certificates/,
    );

    return teacherMatch?.[1] ?? adminMatch?.[1] ?? "";
}

export function pxToPt(px: number) {
    return px * 0.75;
}

export function ptToMm(pt: number) {
    return pt * 0.352778;
}

export function hexToRgb(color: string): [number, number, number] {
    const fallback: [number, number, number] = [17, 24, 39];

    if (!color || !color.startsWith("#")) return fallback;

    const clean = color.replace("#", "");

    if (clean.length === 3) {
        return [
            parseInt(clean[0] + clean[0], 16),
            parseInt(clean[1] + clean[1], 16),
            parseInt(clean[2] + clean[2], 16),
        ];
    }

    if (clean.length === 6) {
        return [
            parseInt(clean.slice(0, 2), 16),
            parseInt(clean.slice(2, 4), 16),
            parseInt(clean.slice(4, 6), 16),
        ];
    }

    return fallback;
}

export function getFieldFontFamily(
    field: CertificateField | CertificateFieldWithFormat,
) {
    return (field as CertificateFieldWithFormat).fontFamily || "helvetica";
}

export function getFieldTextCase(
    field: CertificateField | CertificateFieldWithFormat,
) {
    return (field as CertificateFieldWithFormat).textCase || "none";
}

export function getCssFontFamily(fontFamily: string) {
    if (fontFamily === "helvetica") return "Helvetica, Arial, sans-serif";
    if (fontFamily === "Arial") return "Arial, Helvetica, sans-serif";
    if (fontFamily === "Roboto") return "Roboto, Arial, sans-serif";
    if (fontFamily === "Georgia") return "Georgia, serif";
    if (fontFamily === "Times New Roman") {
        return '"Times New Roman", Times, serif';
    }
    if (fontFamily === "Courier New") {
        return '"Courier New", Courier, monospace';
    }
    if (fontFamily === "Verdana") return "Verdana, Geneva, sans-serif";
    if (fontFamily === "Montserrat") return "Montserrat, Arial, sans-serif";

    return "Helvetica, Arial, sans-serif";
}

export function getPdfFontFamily(fontFamily: string) {
    if (fontFamily === "Georgia" || fontFamily === "Times New Roman") {
        return "times";
    }

    if (fontFamily === "Courier New") {
        return "courier";
    }

    return "helvetica";
}

export function applySentenceCase(text: string) {
    const lowerText = text.toLowerCase();

    return lowerText.replace(
        /(^\s*[a-záéíóúñü])|([.!?]\s+[a-záéíóúñü])|(\n\s*[a-záéíóúñü])/g,
        (match) => match.toUpperCase(),
    );
}

export function applyTextCase(text: string, textCase: CertificateTextCase) {
    if (textCase === "uppercase") return text.toUpperCase();
    if (textCase === "lowercase") return text.toLowerCase();
    if (textCase === "sentence") return applySentenceCase(text);

    return text;
}

export function getFormattedFieldPreviewValue(
    field: CertificateField | CertificateFieldWithFormat,
) {
    const rawValue = getCertificateFieldPreviewValue(field);

    return applyTextCase(rawValue, getFieldTextCase(field));
}

export function getPdfImageFormat(image: string) {
    const normalizedImage = image.toLowerCase();

    if (
        normalizedImage.startsWith("data:image/jpeg") ||
        normalizedImage.startsWith("data:image/jpg") ||
        normalizedImage.endsWith(".jpg") ||
        normalizedImage.endsWith(".jpeg")
    ) {
        return "JPEG";
    }

    return "PNG";
}

export function toCssImageUrl(image: string) {
    return `url("${image.replace(/"/g, '\\"')}")`;
}

export function blobToDataUrl(blob: Blob) {
    return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
            resolve(String(reader.result || ""));
        };

        reader.onerror = () => {
            reject(new Error("No se pudo procesar la imagen."));
        };

        reader.readAsDataURL(blob);
    });
}

export async function imageToDataUrl(image: string) {
    if (image.startsWith("data:image/")) {
        return image;
    }

    const response = await fetch(image);

    if (!response.ok) {
        throw new Error("No se pudo cargar una imagen del certificado.");
    }

    const blob = await response.blob();

    return blobToDataUrl(blob);
}

export function loadImageElement(src: string) {
    return new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new window.Image();

        image.onload = () => resolve(image);
        image.onerror = () =>
            reject(new Error("No se pudo leer la imagen del certificado."));

        image.src = src;
    });
}

export async function compressImageToDataUrl(
    image: string,
    options: CompressImageOptions,
) {
    const dataUrl = await imageToDataUrl(image);
    const imageElement = await loadImageElement(dataUrl);

    const naturalWidth = imageElement.naturalWidth || imageElement.width;
    const naturalHeight = imageElement.naturalHeight || imageElement.height;

    const scale = Math.min(
        options.maxWidth / naturalWidth,
        options.maxHeight / naturalHeight,
        1,
    );

    const canvas = document.createElement("canvas");

    canvas.width = Math.max(1, Math.round(naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(naturalHeight * scale));

    const context = canvas.getContext("2d");

    if (!context) {
        throw new Error("No se pudo comprimir la imagen del certificado.");
    }

    if (options.output === "image/jpeg") {
        context.fillStyle = options.backgroundColor ?? "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
    }

    context.drawImage(imageElement, 0, 0, canvas.width, canvas.height);

    return canvas.toDataURL(
        options.output ?? "image/jpeg",
        options.quality ?? 0.72,
    );
}

export function getImageNaturalSize(src: string) {
    return new Promise<{ width: number; height: number }>((resolve, reject) => {
        const image = new window.Image();

        image.onload = () => {
            resolve({
                width: image.naturalWidth || image.width,
                height: image.naturalHeight || image.height,
            });
        };

        image.onerror = () => {
            reject(new Error("No se pudo leer la imagen."));
        };

        image.src = src;
    });
}

export function getJustifyContentByAlign(align: CertificateTextAlign) {
    if (align === "left") return "flex-start";
    if (align === "right") return "flex-end";

    return "center";
}

export function isSignatureField(
    field: CertificateField | CertificateFieldWithFormat | null | undefined,
) {
    return (
        field?.fieldMode === "signature" ||
        field?.type === "signature_instructor" ||
        field?.type === "signature_director"
    );
}

export function normalizeQrConfig(
    qrConfig?: CertificateQrConfig | null,
): CertificateQrConfig {
    return {
        ...qrConfig,
        enabled:
            typeof qrConfig?.enabled === "boolean"
                ? qrConfig.enabled
                : DEFAULT_QR_CONFIG.enabled,
        x: Number.isFinite(Number(qrConfig?.x))
            ? Number(qrConfig?.x)
            : DEFAULT_QR_CONFIG.x,
        y: Number.isFinite(Number(qrConfig?.y))
            ? Number(qrConfig?.y)
            : DEFAULT_QR_CONFIG.y,
        size: Number.isFinite(Number(qrConfig?.size))
            ? Number(qrConfig?.size)
            : DEFAULT_QR_CONFIG.size,
    };
}

export function clampNumber(value: number, min: number, max: number) {
    if (!Number.isFinite(value)) return min;

    return Math.min(max, Math.max(min, value));
}

export function readFileAsDataUrl(file: File) {
    return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
            resolve(String(reader.result || ""));
        };

        reader.onerror = () => {
            reject(new Error("No se pudo leer el archivo."));
        };

        reader.readAsDataURL(file);
    });
}