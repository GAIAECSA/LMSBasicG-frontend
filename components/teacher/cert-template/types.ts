import type {
    CertificateField,
    CertificateQrConfig,
} from "@/services/certificates.service";

export type CertificateTemplateWorkspaceProps = {
    courseId?: string;
};

export type CertificateTextCase =
    | "none"
    | "uppercase"
    | "lowercase"
    | "sentence";

export type CertificateFieldWithFormat = CertificateField & {
    fontFamily?: string;
    textCase?: CertificateTextCase;
};

export type CompressImageOptions = {
    maxWidth: number;
    maxHeight: number;
    quality?: number;
    output?: "image/jpeg" | "image/png";
    backgroundColor?: string;
};

export type PdfTextOptions = {
    align?: "left" | "center" | "right";
    maxWidth?: number;
    lineHeightFactor?: number;
};

export type PdfDocument = {
    setDrawColor: (...args: number[]) => void;
    setFillColor: (...args: number[]) => void;
    setLineWidth: (width: number) => void;
    rect: (
        x: number,
        y: number,
        width: number,
        height: number,
        style?: string,
    ) => void;
    setFont: (fontName: string, fontStyle?: string) => void;
    setFontSize: (fontSize: number) => void;
    setTextColor: (...args: number[]) => void;
    line: (x1: number, y1: number, x2: number, y2: number) => void;
    text: (
        text: string | string[],
        x: number,
        y: number,
        options?: PdfTextOptions,
    ) => void;
    splitTextToSize: (text: string, maxWidth: number) => string[];
    addImage: (
        imageData: string,
        format: string,
        x: number,
        y: number,
        width: number,
        height: number,
        alias?: string,
        compression?: "FAST" | "MEDIUM" | "SLOW" | "NONE",
    ) => void;
    save: (fileName: string) => void;
};

export type PdfQrPreviewParams = {
    pdf: PdfDocument;
    qrConfig: CertificateQrConfig;
    pageWidth: number;
    pageHeight: number;
};

export type JsPdfConstructor = new (options: {
    orientation: "landscape" | "portrait";
    unit: "mm";
    format: "a4";
    compress: boolean;
}) => PdfDocument;