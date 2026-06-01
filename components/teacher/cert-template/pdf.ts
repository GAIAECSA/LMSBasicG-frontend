import type {
    CertificateField,
    CertificateQrConfig,
    CertificateTemplate,
} from "@/services/certificates.service";
import { QR_CELLS } from "./constants";
import type { JsPdfConstructor, PdfDocument, PdfQrPreviewParams } from "./types";
import {
    compressImageToDataUrl,
    getFieldFontFamily,
    getFormattedFieldPreviewValue,
    getImageNaturalSize,
    getPdfFontFamily,
    getPdfImageFormat,
    hexToRgb,
    isSignatureField,
    normalizeQrConfig,
    ptToMm,
    pxToPt,
} from "./utils";

export function drawQrPreviewInPdf(params: PdfQrPreviewParams) {
    const { pdf, qrConfig, pageWidth, pageHeight } = params;

    const safeQr = normalizeQrConfig(qrConfig);

    if (!safeQr.enabled) return;

    const qrSizeMm = (safeQr.size / 100) * pageWidth;
    const qrCenterX = (safeQr.x / 100) * pageWidth;
    const qrCenterY = (safeQr.y / 100) * pageHeight;
    const qrX = qrCenterX - qrSizeMm / 2;
    const qrY = qrCenterY - qrSizeMm / 2;

    pdf.setDrawColor(15, 23, 42);
    pdf.setFillColor(255, 255, 255);
    pdf.setLineWidth(0.35);
    pdf.rect(qrX, qrY, qrSizeMm, qrSizeMm, "F");
    pdf.rect(qrX, qrY, qrSizeMm, qrSizeMm);

    const cell = qrSizeMm / 7;

    pdf.setFillColor(15, 23, 42);

    QR_CELLS.forEach(([col, row]) => {
        pdf.rect(
            qrX + col * cell + cell * 0.12,
            qrY + row * cell + cell * 0.12,
            cell * 0.76,
            cell * 0.76,
            "F",
        );
    });

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(6);
    pdf.text("QR", qrCenterX, qrY + qrSizeMm + 3, {
        align: "center",
    });
}

type GenerateCertificatePdfParams = {
    template: CertificateTemplate;
    numericCourseId: number;
};

export async function generateCertificatePdf({
    template,
    numericCourseId,
}: GenerateCertificatePdfParams) {
    const jsPdfModule = await import("jspdf");
    const JsPDF = jsPdfModule.default as unknown as JsPdfConstructor;

    const pdf: PdfDocument = new JsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
        compress: true,
    });

    const pageWidth = 297;
    const pageHeight = 210;

    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, pageWidth, pageHeight, "F");

    if (template.backgroundImage) {
        const backgroundImage = await compressImageToDataUrl(
            template.backgroundImage,
            {
                maxWidth: 1600,
                maxHeight: 1200,
                quality: 0.72,
                output: "image/jpeg",
                backgroundColor: "#ffffff",
            },
        );

        pdf.addImage(
            backgroundImage,
            "JPEG",
            0,
            0,
            pageWidth,
            pageHeight,
            undefined,
            "FAST",
        );
    }

    for (const field of template.fields) {
        await drawCertificateField({
            pdf,
            field,
            pageWidth,
            pageHeight,
        });
    }

    drawQrPreviewInPdf({
        pdf,
        qrConfig: normalizeQrConfig(template.qrConfig),
        pageWidth,
        pageHeight,
    });

    pdf.save(`certificado-curso-${numericCourseId}.pdf`);
}

async function drawCertificateField(params: {
    pdf: PdfDocument;
    field: CertificateField;
    pageWidth: number;
    pageHeight: number;
}) {
    const { pdf, field, pageWidth, pageHeight } = params;

    const fieldWidthMm = (field.width / 100) * pageWidth;
    const fieldHeightMm = ((field.height ?? 8) / 100) * pageHeight;

    const centerX = (field.x / 100) * pageWidth;
    const centerY = (field.y / 100) * pageHeight;

    const leftX = centerX - fieldWidthMm / 2;
    const topY = centerY - fieldHeightMm / 2;

    const isSignature = isSignatureField(field);

    const align: "left" | "center" | "right" =
        field.textAlign === "left"
            ? "left"
            : field.textAlign === "right"
                ? "right"
                : "center";

    const textX =
        align === "left"
            ? leftX
            : align === "right"
                ? leftX + fieldWidthMm
                : centerX;

    const [r, g, b] = hexToRgb(field.color || "#111827");

    pdf.setTextColor(r, g, b);
    pdf.setFont(
        getPdfFontFamily(getFieldFontFamily(field)),
        field.fontWeight === "bold" ? "bold" : "normal",
    );

    const fontSizePt = Math.max(6, pxToPt(field.fontSize));
    pdf.setFontSize(fontSizePt);

    if (isSignature) {
        await drawSignatureField({
            pdf,
            field,
            fieldWidthMm,
            fieldHeightMm,
            centerX,
            topY,
            leftX,
            r,
            g,
            b,
        });

        return;
    }

    const safeText = getFormattedFieldPreviewValue(field);

    const lines = safeText
        .split("\n")
        .flatMap((line) => pdf.splitTextToSize(line || " ", fieldWidthMm));

    const lineHeightMm = ptToMm(fontSizePt) * 1.15;
    const totalTextHeight = lines.length * lineHeightMm;

    const firstLineY = centerY - totalTextHeight / 2 + lineHeightMm * 0.8;

    pdf.text(lines, textX, firstLineY, {
        align,
        maxWidth: fieldWidthMm,
        lineHeightFactor: 1.15,
    });
}

async function drawSignatureField(params: {
    pdf: PdfDocument;
    field: CertificateField;
    fieldWidthMm: number;
    fieldHeightMm: number;
    centerX: number;
    topY: number;
    leftX: number;
    r: number;
    g: number;
    b: number;
}) {
    const {
        pdf,
        field,
        fieldWidthMm,
        fieldHeightMm,
        centerX,
        topY,
        leftX,
        r,
        g,
        b,
    } = params;

    const signatureZoneHeight = fieldHeightMm * 0.66;
    const linePadding = 2;

    if (field.signatureImage) {
        const signatureImage = await compressImageToDataUrl(
            field.signatureImage,
            {
                maxWidth: 500,
                maxHeight: 220,
                quality: 0.78,
                output: "image/png",
            },
        );

        const { width: naturalWidth, height: naturalHeight } =
            await getImageNaturalSize(signatureImage);

        const maxImageWidth = Math.max(1, fieldWidthMm - 4);
        const maxImageHeight = Math.max(1, signatureZoneHeight - 2);

        const widthRatio = maxImageWidth / naturalWidth;
        const heightRatio = maxImageHeight / naturalHeight;
        const scale = Math.min(widthRatio, heightRatio);

        const renderWidth = naturalWidth * scale;
        const renderHeight = naturalHeight * scale;

        const imageX = centerX - renderWidth / 2;
        const imageY = topY + (signatureZoneHeight - renderHeight) / 2;

        pdf.addImage(
            signatureImage,
            getPdfImageFormat(signatureImage),
            imageX,
            imageY,
            renderWidth,
            renderHeight,
            undefined,
            "FAST",
        );
    }

    const lineY = topY + signatureZoneHeight;

    pdf.setDrawColor(r, g, b);
    pdf.setLineWidth(0.25);
    pdf.line(leftX + linePadding, lineY, leftX + fieldWidthMm - linePadding, lineY);

    const labelFontPt = Math.max(6, pxToPt(field.fontSize));

    pdf.setFont(
        getPdfFontFamily(getFieldFontFamily(field)),
        field.fontWeight === "bold" ? "bold" : "normal",
    );
    pdf.setFontSize(labelFontPt);
    pdf.setTextColor(r, g, b);

    const labelMm = ptToMm(labelFontPt);
    const labelY = lineY + labelMm * 1.15;

    const signatureText = getFormattedFieldPreviewValue(field);

    pdf.text(signatureText, centerX, labelY, {
        align: "center",
        maxWidth: fieldWidthMm,
    });
}