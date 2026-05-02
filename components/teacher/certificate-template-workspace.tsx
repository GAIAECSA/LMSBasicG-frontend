"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type {
    ChangeEvent,
    PointerEvent as ReactPointerEvent,
} from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    ArrowLeft,
    BadgeCheck,
    ChevronDown,
    Download,
    ImagePlus,
    Plus,
    Save,
    Trash2,
} from "lucide-react";
import { getAllCourses, type Course } from "@/services/courses.service";
import {
    createCertificateField,
    createEmptyCertificateTemplate,
    getCertificateFieldPreviewValue,
    getCertificateTemplate,
    getFieldDefaultValue,
    getFieldLabel,
    getVariableKeyByFieldType,
    saveCertificateTemplate,
    type CertificateField,
    type CertificateFieldType,
    type CertificateQrConfig,
    type CertificateTemplate,
    type CertificateTextAlign,
} from "@/services/certificates.service";

type CertificateTemplateWorkspaceProps = {
    courseId?: string;
};

type CertificateTextCase = "none" | "uppercase" | "lowercase" | "sentence";

type CertificateFieldWithFormat = CertificateField & {
    fontFamily?: string;
    textCase?: CertificateTextCase;
};

const fieldTypeOptions: {
    value: CertificateFieldType;
    label: string;
}[] = [
        { value: "student_name", label: "Nombre del estudiante" },
        { value: "course_name", label: "Nombre del curso" },
        { value: "completion_date", label: "Fecha de finalización" },
        { value: "instructor_name", label: "Nombre del instructor" },
        { value: "certificate_code", label: "Código del certificado" },
        { value: "final_grade", label: "Promedio final" },
        { value: "signature_instructor", label: "Firma del instructor" },
        { value: "signature_director", label: "Firma del director" },
        { value: "custom", label: "Texto personalizado" },
    ];

const alignOptions: {
    value: CertificateTextAlign;
    label: string;
}[] = [
        { value: "left", label: "Izquierda" },
        { value: "center", label: "Centro" },
        { value: "right", label: "Derecha" },
    ];

const fontFamilyOptions = [
    { value: "helvetica", label: "Helvetica" },
    { value: "Arial", label: "Arial" },
    { value: "Roboto", label: "Roboto" },
    { value: "Georgia", label: "Georgia" },
    { value: "Times New Roman", label: "Times New Roman" },
    { value: "Courier New", label: "Courier New" },
    { value: "Verdana", label: "Verdana" },
    { value: "Montserrat", label: "Montserrat" },
];

const textCaseOptions: {
    value: CertificateTextCase;
    label: string;
}[] = [
        { value: "none", label: "Como está escrito" },
        { value: "uppercase", label: "MAYÚSCULAS" },
        { value: "lowercase", label: "minúsculas" },
        { value: "sentence", label: "Tipo oración" },
    ];

const DEFAULT_QR_CONFIG: CertificateQrConfig = {
    enabled: true,
    x: 86,
    y: 84,
    size: 10,
};

function getCourseIdFromPathname(pathname: string) {
    const teacherMatch = pathname.match(
        /^\/teacher\/courses\/([^/]+)\/certificates/,
    );
    const adminMatch = pathname.match(
        /^\/admin\/courses\/([^/]+)\/certificates/,
    );

    return teacherMatch?.[1] ?? adminMatch?.[1] ?? "";
}

function pxToPt(px: number) {
    return px * 0.75;
}

function ptToMm(pt: number) {
    return pt * 0.352778;
}

function hexToRgb(color: string): [number, number, number] {
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

function getFieldFontFamily(field: CertificateField | CertificateFieldWithFormat) {
    return (field as CertificateFieldWithFormat).fontFamily || "helvetica";
}

function getFieldTextCase(field: CertificateField | CertificateFieldWithFormat) {
    return (field as CertificateFieldWithFormat).textCase || "none";
}

function getCssFontFamily(fontFamily: string) {
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

function getPdfFontFamily(fontFamily: string) {
    if (fontFamily === "Georgia" || fontFamily === "Times New Roman") {
        return "times";
    }

    if (fontFamily === "Courier New") {
        return "courier";
    }

    return "helvetica";
}

function applySentenceCase(text: string) {
    const lowerText = text.toLowerCase();

    return lowerText.replace(/(^\s*[a-záéíóúñü])|([.!?]\s+[a-záéíóúñü])|(\n\s*[a-záéíóúñü])/g, (match) =>
        match.toUpperCase(),
    );
}

function applyTextCase(text: string, textCase: CertificateTextCase) {
    if (textCase === "uppercase") return text.toUpperCase();
    if (textCase === "lowercase") return text.toLowerCase();
    if (textCase === "sentence") return applySentenceCase(text);

    return text;
}

function getFormattedFieldPreviewValue(field: CertificateField) {
    const rawValue = getCertificateFieldPreviewValue(field);

    return applyTextCase(rawValue, getFieldTextCase(field));
}

function getPdfImageFormat(image: string) {
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

function toCssImageUrl(image: string) {
    return `url("${image.replace(/"/g, '\\"')}")`;
}

function blobToDataUrl(blob: Blob) {
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

async function imageToDataUrl(image: string) {
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

type CompressImageOptions = {
    maxWidth: number;
    maxHeight: number;
    quality?: number;
    output?: "image/jpeg" | "image/png";
    backgroundColor?: string;
};

function loadImageElement(src: string) {
    return new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new window.Image();

        image.onload = () => resolve(image);
        image.onerror = () =>
            reject(new Error("No se pudo leer la imagen del certificado."));

        image.src = src;
    });
}

async function compressImageToDataUrl(
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

function getImageNaturalSize(src: string) {
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

function getJustifyContentByAlign(align: CertificateTextAlign) {
    if (align === "left") return "flex-start";
    if (align === "right") return "flex-end";

    return "center";
}

function isSignatureField(field: CertificateField | null | undefined) {
    return (
        field?.fieldMode === "signature" ||
        field?.type === "signature_instructor" ||
        field?.type === "signature_director"
    );
}

function normalizeQrConfig(
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

function clampNumber(value: number, min: number, max: number) {
    if (!Number.isFinite(value)) return min;

    return Math.min(max, Math.max(min, value));
}

function QrPreviewBox() {
    const cells = [
        [0, 0],
        [1, 0],
        [2, 0],
        [4, 0],
        [5, 0],
        [6, 0],
        [0, 1],
        [2, 1],
        [4, 1],
        [6, 1],
        [0, 2],
        [1, 2],
        [2, 2],
        [3, 2],
        [4, 2],
        [5, 2],
        [6, 2],
        [2, 3],
        [4, 3],
        [0, 4],
        [1, 4],
        [2, 4],
        [4, 4],
        [6, 4],
        [0, 5],
        [2, 5],
        [3, 5],
        [5, 5],
        [0, 6],
        [1, 6],
        [2, 6],
        [4, 6],
        [5, 6],
        [6, 6],
    ];

    return (
        <div className="grid h-full w-full grid-cols-7 grid-rows-7 gap-[2px] bg-white p-1">
            {Array.from({ length: 49 }).map((_, index) => {
                const row = Math.floor(index / 7);
                const col = index % 7;
                const active = cells.some(
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

function drawQrPreviewInPdf(params: {
    pdf: {
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
        text: (
            text: string,
            x: number,
            y: number,
            options?: { align?: "left" | "center" | "right" },
        ) => void;
    };
    qrConfig: CertificateQrConfig;
    pageWidth: number;
    pageHeight: number;
}) {
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

    const qrCells = [
        [0, 0],
        [1, 0],
        [2, 0],
        [4, 0],
        [5, 0],
        [6, 0],
        [0, 1],
        [2, 1],
        [4, 1],
        [6, 1],
        [0, 2],
        [1, 2],
        [2, 2],
        [3, 2],
        [4, 2],
        [5, 2],
        [6, 2],
        [2, 3],
        [4, 3],
        [0, 4],
        [1, 4],
        [2, 4],
        [4, 4],
        [6, 4],
        [0, 5],
        [2, 5],
        [3, 5],
        [5, 5],
        [0, 6],
        [1, 6],
        [2, 6],
        [4, 6],
        [5, 6],
        [6, 6],
    ];

    pdf.setFillColor(15, 23, 42);

    qrCells.forEach(([col, row]) => {
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

export function CertificateTemplateWorkspace({
    courseId,
}: CertificateTemplateWorkspaceProps) {
    const pathname = usePathname();

    const routeCourseId = useMemo(() => {
        const rawCourseId = courseId ?? getCourseIdFromPathname(pathname);
        const parsedCourseId = Number(rawCourseId);

        return Number.isFinite(parsedCourseId) && parsedCourseId > 0
            ? parsedCourseId
            : 0;
    }, [courseId, pathname]);

    const isAdminRoute = pathname.startsWith("/admin");

    const [selectedCourseId, setSelectedCourseId] = useState(0);

    const numericCourseId =
        routeCourseId > 0 ? routeCourseId : selectedCourseId;

    const certificateRef = useRef<HTMLDivElement | null>(null);

    const [courses, setCourses] = useState<Course[]>([]);
    const [template, setTemplate] = useState<CertificateTemplate | null>(null);
    const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
    const [draggingFieldId, setDraggingFieldId] = useState<string | null>(null);
    const [isDraggingQr, setIsDraggingQr] = useState(false);
    const [backgroundImageFile, setBackgroundImageFile] =
        useState<File | null>(null);
    const [signatureFiles, setSignatureFiles] = useState<Record<string, File>>(
        {},
    );

    const [notice, setNotice] = useState("");
    const [error, setError] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSavingTemplate, setIsSavingTemplate] = useState(false);
    const [isLoadingTemplate, setIsLoadingTemplate] = useState(true);
    const [isAddFieldsOpen, setIsAddFieldsOpen] = useState(true);

    const courseOptions = useMemo(
        () => [...courses].sort((a, b) => a.name.localeCompare(b.name)),
        [courses],
    );

    const selectedCourseName = useMemo(() => {
        const selectedCourse = courses.find(
            (courseItem) => Number(courseItem.id) === numericCourseId,
        );

        return selectedCourse?.name ?? `Curso #${numericCourseId}`;
    }, [courses, numericCourseId]);

    const loadTemplate = useCallback(async () => {
        try {
            setIsLoadingTemplate(true);
            setError("");
            setNotice("");

            const coursesData = await getAllCourses();

            setCourses(Array.isArray(coursesData) ? coursesData : []);

            if (!numericCourseId || Number.isNaN(numericCourseId)) {
                setTemplate(null);
                setBackgroundImageFile(null);
                setSignatureFiles({});
                setSelectedFieldId(null);
                return;
            }

            const currentTemplate =
                await getCertificateTemplate(numericCourseId);

            const safeTemplate =
                currentTemplate.fields.length > 0
                    ? {
                        ...currentTemplate,
                        qrConfig: normalizeQrConfig(
                            currentTemplate.qrConfig,
                        ),
                    }
                    : {
                        ...createEmptyCertificateTemplate(numericCourseId),
                        backgroundImage: currentTemplate.backgroundImage,
                        qrConfig: normalizeQrConfig(
                            currentTemplate.qrConfig,
                        ),
                    };

            setTemplate(safeTemplate);
            setBackgroundImageFile(null);
            setSignatureFiles({});
            setSelectedFieldId(safeTemplate.fields[0]?.id ?? null);
        } catch {
            if (!numericCourseId || Number.isNaN(numericCourseId)) {
                setTemplate(null);
                setBackgroundImageFile(null);
                setSignatureFiles({});
                setSelectedFieldId(null);
                setError("");
                setNotice("");
                return;
            }

            const emptyTemplate = createEmptyCertificateTemplate(numericCourseId);

            setTemplate({
                ...emptyTemplate,
                qrConfig: normalizeQrConfig(emptyTemplate.qrConfig),
            });
            setBackgroundImageFile(null);
            setSignatureFiles({});
            setSelectedFieldId(emptyTemplate.fields[0]?.id ?? null);
            setError("");
            setNotice("");
        } finally {
            setIsLoadingTemplate(false);
        }
    }, [numericCourseId]);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void loadTemplate();
        }, 0);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [loadTemplate]);

    const selectedField =
        template?.fields.find((field) => field.id === selectedFieldId) ?? null;

    const qrConfig = normalizeQrConfig(template?.qrConfig);

    function handleSelectCourse(value: string) {
        const parsedCourseId = Number(value);

        setSelectedCourseId(
            Number.isFinite(parsedCourseId) && parsedCourseId > 0
                ? parsedCourseId
                : 0,
        );
        setTemplate(null);
        setSelectedFieldId(null);
        setDraggingFieldId(null);
        setIsDraggingQr(false);
        setBackgroundImageFile(null);
        setSignatureFiles({});
        setNotice("");
        setError("");
    }

    function updateTemplate(nextTemplate: CertificateTemplate) {
        setTemplate(nextTemplate);
    }

    function updateQrConfig(changes: Partial<CertificateQrConfig>) {
        if (!template) return;

        const nextQrConfig = normalizeQrConfig({
            ...template.qrConfig,
            ...changes,
        });

        updateTemplate({
            ...template,
            qrConfig: nextQrConfig,
        });
    }

    function updateField(
        fieldId: string,
        changes: Partial<CertificateFieldWithFormat>,
    ) {
        if (!template) return;

        updateTemplate({
            ...template,
            fields: template.fields.map((field) =>
                field.id === fieldId
                    ? {
                        ...field,
                        ...changes,
                    }
                    : field,
            ),
        });
    }

    function handleBackgroundUpload(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];

        if (!file || !template) return;

        const reader = new FileReader();

        reader.onload = () => {
            setBackgroundImageFile(file);

            updateTemplate({
                ...template,
                backgroundImage: String(reader.result || ""),
            });

            setNotice("Imagen de fondo cargada correctamente.");
            setError("");
        };

        reader.onerror = () => {
            setError("No se pudo cargar la imagen de fondo.");
        };

        reader.readAsDataURL(file);
        event.target.value = "";
    }

    function handleSignatureUpload(
        event: ChangeEvent<HTMLInputElement>,
        fieldId: string,
    ) {
        const file = event.target.files?.[0];

        if (!file || !template) return;

        const reader = new FileReader();

        reader.onload = () => {
            setSignatureFiles((current) => ({
                ...current,
                [fieldId]: file,
            }));

            updateField(fieldId, {
                signatureImage: String(reader.result || ""),
                fieldMode: "signature",
            });

            setNotice("Firma cargada correctamente.");
            setError("");
        };

        reader.onerror = () => {
            setError("No se pudo cargar la firma.");
        };

        reader.readAsDataURL(file);
        event.target.value = "";
    }

    function handleAddField(type: CertificateFieldType) {
        if (!template) return;

        const newField: CertificateFieldWithFormat = {
            ...createCertificateField(type),
            fontFamily: "helvetica",
            textCase: "none",
        };

        updateTemplate({
            ...template,
            fields: [...template.fields, newField],
        });

        setSelectedFieldId(newField.id);
        setIsAddFieldsOpen(false);
        setNotice("Campo agregado correctamente.");
        setError("");
    }

    function handleDeleteField(fieldId: string) {
        if (!template) return;

        const nextFields = template.fields.filter(
            (field) => field.id !== fieldId,
        );

        updateTemplate({
            ...template,
            fields: nextFields,
        });

        setSignatureFiles((current) => {
            const nextFiles = { ...current };
            delete nextFiles[fieldId];

            return nextFiles;
        });

        if (selectedFieldId === fieldId) {
            setSelectedFieldId(nextFields[0]?.id ?? null);
        }

        setNotice("Campo eliminado correctamente.");
        setError("");
    }

    function handlePointerDown(
        event: ReactPointerEvent<HTMLDivElement>,
        fieldId: string,
    ) {
        event.preventDefault();
        event.stopPropagation();

        setSelectedFieldId(fieldId);
        setDraggingFieldId(fieldId);
        setIsDraggingQr(false);

        event.currentTarget.setPointerCapture(event.pointerId);
    }

    function handleQrPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
        event.preventDefault();
        event.stopPropagation();

        setSelectedFieldId(null);
        setDraggingFieldId(null);
        setIsDraggingQr(true);

        event.currentTarget.setPointerCapture(event.pointerId);
    }

    function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
        if (!certificateRef.current) return;

        if (!draggingFieldId && !isDraggingQr) return;

        const rect = certificateRef.current.getBoundingClientRect();

        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;

        const safeX = Number(clampNumber(x, 2, 98).toFixed(2));
        const safeY = Number(clampNumber(y, 2, 98).toFixed(2));

        if (isDraggingQr) {
            setTemplate((currentTemplate) => {
                if (!currentTemplate) return currentTemplate;

                return {
                    ...currentTemplate,
                    qrConfig: normalizeQrConfig({
                        ...currentTemplate.qrConfig,
                        enabled: true,
                        x: safeX,
                        y: safeY,
                    }),
                };
            });

            return;
        }

        setTemplate((currentTemplate) => {
            if (!currentTemplate) return currentTemplate;

            return {
                ...currentTemplate,
                fields: currentTemplate.fields.map((field) =>
                    field.id === draggingFieldId
                        ? {
                            ...field,
                            x: safeX,
                            y: safeY,
                        }
                        : field,
                ),
            };
        });
    }

    function handlePointerUp() {
        setDraggingFieldId(null);
        setIsDraggingQr(false);
    }

    async function handleSaveTemplate() {
        if (!template) return;

        try {
            setIsSavingTemplate(true);
            setError("");
            setNotice("");

            const safeTemplate: CertificateTemplate = {
                ...template,
                qrConfig: normalizeQrConfig(template.qrConfig),
                fields: template.fields.map((field) => ({
                    ...field,
                    fontFamily: getFieldFontFamily(field),
                    textCase: getFieldTextCase(field),
                })),
            };

            const savedTemplate = await saveCertificateTemplate(
                numericCourseId,
                safeTemplate,
                backgroundImageFile,
                signatureFiles,
            );

            const nextTemplate: CertificateTemplate = {
                ...savedTemplate,
                backgroundImage:
                    savedTemplate.backgroundImage || template.backgroundImage,
                fields:
                    savedTemplate.fields.length > 0
                        ? savedTemplate.fields
                        : template.fields,
                qrConfig: normalizeQrConfig(
                    savedTemplate.qrConfig ?? safeTemplate.qrConfig,
                ),
            };

            setTemplate(nextTemplate);
            setBackgroundImageFile(null);
            setSignatureFiles({});

            setSelectedFieldId((currentFieldId) => {
                if (
                    currentFieldId &&
                    nextTemplate.fields.some(
                        (field) => field.id === currentFieldId,
                    )
                ) {
                    return currentFieldId;
                }

                return nextTemplate.fields[0]?.id ?? null;
            });

            setNotice(
                "Plantilla guardada correctamente. El QR se envió en qr_config.",
            );
        } catch (err) {
            const message =
                err instanceof Error
                    ? err.message
                    : "No se pudo guardar la plantilla del certificado.";

            setError(
                message.includes("403") ||
                    message.toLowerCase().includes("forbidden") ||
                    message.toLowerCase().includes("not authenticated")
                    ? "No tienes permiso para guardar esta plantilla. Inicia sesión nuevamente con un usuario ADMIN o DOCENTE."
                    : message,
            );
        } finally {
            setIsSavingTemplate(false);
        }
    }

    async function handleGeneratePdf() {
        if (!template) return;

        try {
            setIsGenerating(true);
            setError("");
            setNotice("");

            const jsPdfModule = await import("jspdf");
            const JsPDF = jsPdfModule.default;

            const pdf = new JsPDF({
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
                        const maxImageHeight = Math.max(
                            1,
                            signatureZoneHeight - 2,
                        );

                        const widthRatio = maxImageWidth / naturalWidth;
                        const heightRatio = maxImageHeight / naturalHeight;
                        const scale = Math.min(widthRatio, heightRatio);

                        const renderWidth = naturalWidth * scale;
                        const renderHeight = naturalHeight * scale;

                        const imageX = centerX - renderWidth / 2;
                        const imageY =
                            topY + (signatureZoneHeight - renderHeight) / 2;

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
                    pdf.line(
                        leftX + linePadding,
                        lineY,
                        leftX + fieldWidthMm - linePadding,
                        lineY,
                    );

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

                    continue;
                }

                const safeText = getFormattedFieldPreviewValue(field);

                const lines = safeText
                    .split("\n")
                    .flatMap((line) =>
                        pdf.splitTextToSize(line || " ", fieldWidthMm),
                    );

                const lineHeightMm = ptToMm(fontSizePt) * 1.15;
                const totalTextHeight = lines.length * lineHeightMm;

                const firstLineY =
                    centerY - totalTextHeight / 2 + lineHeightMm * 0.8;

                pdf.text(lines, textX, firstLineY, {
                    align,
                    maxWidth: fieldWidthMm,
                    lineHeightFactor: 1.15,
                });
            }

            drawQrPreviewInPdf({
                pdf,
                qrConfig: normalizeQrConfig(template.qrConfig),
                pageWidth,
                pageHeight,
            });

            pdf.save(`certificado-curso-${numericCourseId}.pdf`);
            setNotice("Certificado generado correctamente con el QR visible.");
        } catch (err) {
            console.error("Error al generar certificado PDF:", err);

            setError(
                err instanceof Error
                    ? `No se pudo generar el PDF: ${err.message}`
                    : "No se pudo generar el PDF del certificado.",
            );
        } finally {
            setIsGenerating(false);
        }
    }

    if (isLoadingTemplate) {
        return (
            <section className="space-y-6">
                <div className="rounded-[28px] border border-slate-200 bg-white p-8 text-center shadow-sm">
                    <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-700" />

                    <p className="mt-4 text-sm font-semibold text-slate-600">
                        {numericCourseId > 0
                            ? "Cargando plantilla del certificado..."
                            : "Cargando cursos disponibles..."}
                    </p>
                </div>
            </section>
        );
    }

    if (numericCourseId <= 0) {
        return (
            <section className="space-y-6">
                <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
                    <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-900 px-6 py-6 md:px-7">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-100">
                                <BadgeCheck className="h-3.5 w-3.5" />
                                {isAdminRoute
                                    ? "Panel del administrador"
                                    : "Panel del profesor"}
                            </div>

                            <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-white md:text-3xl">
                                Gestión de certificados
                            </h1>

                            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
                                Selecciona primero un curso para cargar o crear
                                la plantilla del certificado.
                            </p>
                        </div>
                    </div>

                    <div className="p-5">
                        {error ? (
                            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                                {error}
                            </div>
                        ) : null}

                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                            <label className="block text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                                Curso
                            </label>

                            <select
                                value=""
                                onChange={(event) =>
                                    handleSelectCourse(event.target.value)
                                }
                                className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                            >
                                <option value="">Selecciona un curso</option>
                                {courseOptions.map((courseItem) => (
                                    <option
                                        key={courseItem.id}
                                        value={courseItem.id}
                                    >
                                        {courseItem.name}
                                    </option>
                                ))}
                            </select>

                            {courseOptions.length === 0 ? (
                                <p className="mt-3 text-sm font-semibold text-slate-500">
                                    No hay cursos registrados para mostrar.
                                </p>
                            ) : (
                                <p className="mt-3 text-sm font-semibold text-slate-500">
                                    Al seleccionar un curso se cargará su
                                    plantilla de certificado.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    if (!template) {
        return (
            <section className="space-y-6">
                <div className="rounded-[28px] border border-slate-200 bg-white p-8 text-center shadow-sm">
                    <p className="text-sm font-semibold text-slate-600">
                        No se pudo cargar la plantilla del certificado.
                    </p>
                </div>
            </section>
        );
    }

    const backHref = isAdminRoute
        ? routeCourseId > 0
            ? "/admin/courses"
            : "/admin"
        : `/teacher/courses/${numericCourseId}`;

    const backLabel = isAdminRoute
        ? routeCourseId > 0
            ? "Volver a cursos"
            : "Volver al panel"
        : "Volver al curso";

    return (
        <section className="space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Link
                    href={backHref}
                    className="inline-flex w-fit items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                    <ArrowLeft className="h-4 w-4" />
                    {backLabel}
                </Link>

                <div className="flex flex-col gap-2 sm:flex-row">
                    {isAdminRoute && routeCourseId <= 0 ? (
                        <select
                            value={numericCourseId || ""}
                            onChange={(event) =>
                                handleSelectCourse(event.target.value)
                            }
                            className="h-11 min-w-[260px] rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        >
                            <option value="">Selecciona un curso</option>
                            {courseOptions.map((courseItem) => (
                                <option
                                    key={courseItem.id}
                                    value={courseItem.id}
                                >
                                    {courseItem.name}
                                </option>
                            ))}
                        </select>
                    ) : null}

                    <label className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-white px-4 text-sm font-bold text-blue-700 shadow-sm transition hover:bg-blue-50">
                        <ImagePlus className="h-4 w-4" />
                        Subir fondo
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleBackgroundUpload}
                            className="hidden"
                        />
                    </label>

                    <button
                        type="button"
                        onClick={handleSaveTemplate}
                        disabled={isSavingTemplate}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <Save className="h-4 w-4" />
                        {isSavingTemplate ? "Guardando..." : "Guardar"}
                    </button>

                    <button
                        type="button"
                        onClick={handleGeneratePdf}
                        disabled={isGenerating}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-blue-700 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <Download className="h-4 w-4" />
                        {isGenerating ? "Generando..." : "Generar PDF"}
                    </button>
                </div>
            </div>

            {error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                    {error}
                </div>
            ) : null}

            {notice ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
                    {notice}
                </div>
            ) : null}

            <div className="rounded-[28px] border border-blue-100 bg-blue-50 px-5 py-4">
                <p className="text-sm font-black text-blue-950">
                    Curso seleccionado: {selectedCourseName}
                </p>
                <p className="mt-1 text-xs font-semibold text-blue-700">
                    Esta plantilla se guardará para el curso seleccionado y se
                    usará al emitir certificados.
                </p>
            </div>

            <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
                <div className="rounded-[30px] border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="mb-4 flex flex-col gap-1 px-1">
                        <h1 className="text-xl font-black text-slate-950">
                            Plantilla del certificado
                        </h1>
                    </div>

                    <div className="rounded-[26px] border border-slate-200 bg-slate-100 p-3 shadow-inner">
                        <div
                            ref={certificateRef}
                            className="relative mx-auto aspect-[297/210] w-full max-w-6xl overflow-hidden rounded-2xl bg-white shadow-sm"
                            onPointerMove={handlePointerMove}
                            onPointerUp={handlePointerUp}
                            onPointerLeave={handlePointerUp}
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
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-slate-100 text-center">
                                    <BadgeCheck className="h-16 w-16 text-blue-700" />

                                    <h2 className="mt-4 text-3xl font-black text-slate-950">
                                        Certificado de finalización
                                    </h2>

                                    <p className="mt-2 max-w-xl text-sm text-slate-500">
                                        Sube una imagen de fondo para empezar a
                                        diseñar tu plantilla.
                                    </p>
                                </div>
                            )}

                            {template.fields.map((field) => {
                                const isSelected = selectedFieldId === field.id;
                                const isSignature = isSignatureField(field);
                                const currentFontFamily =
                                    getFieldFontFamily(field);
                                const formattedText =
                                    getFormattedFieldPreviewValue(field);

                                return (
                                    <div
                                        key={field.id}
                                        role="button"
                                        tabIndex={0}
                                        onPointerDown={(event) =>
                                            handlePointerDown(event, field.id)
                                        }
                                        className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-move rounded-xl px-2 py-1 transition ${isSelected
                                                ? "ring-2 ring-blue-600 ring-offset-2"
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
                                            fontFamily:
                                                getCssFontFamily(
                                                    currentFontFamily,
                                                ),
                                        }}
                                    >
                                        {isSignature ? (
                                            <div
                                                className="flex h-full w-full flex-col items-center"
                                                style={{
                                                    color: field.color,
                                                    textAlign: "center",
                                                    fontFamily:
                                                        getCssFontFamily(
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
                                                        fontWeight:
                                                            field.fontWeight,
                                                        fontFamily:
                                                            getCssFontFamily(
                                                                currentFontFamily,
                                                            ),
                                                    }}
                                                >
                                                    {formattedText}
                                                </p>
                                            </div>
                                        ) : (
                                            <div
                                                className="flex h-full w-full items-center"
                                                style={{
                                                    justifyContent:
                                                        getJustifyContentByAlign(
                                                            field.textAlign,
                                                        ),
                                                    fontFamily:
                                                        getCssFontFamily(
                                                            currentFontFamily,
                                                        ),
                                                }}
                                            >
                                                <p
                                                    className="w-full whitespace-pre-wrap break-words leading-[1.15]"
                                                    style={{
                                                        fontSize: `${field.fontSize}px`,
                                                        fontWeight:
                                                            field.fontWeight,
                                                        color: field.color,
                                                        textAlign:
                                                            field.textAlign,
                                                        fontFamily:
                                                            getCssFontFamily(
                                                                currentFontFamily,
                                                            ),
                                                    }}
                                                >
                                                    {formattedText}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {qrConfig.enabled ? (
                                <div
                                    role="button"
                                    tabIndex={0}
                                    onPointerDown={handleQrPointerDown}
                                    className={`absolute flex -translate-x-1/2 -translate-y-1/2 cursor-move flex-col items-center justify-center rounded-xl border-2 bg-white p-1 shadow-sm transition ${isDraggingQr
                                            ? "border-blue-700 ring-2 ring-blue-600 ring-offset-2"
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
                                    <span className="pointer-events-none absolute -bottom-6 rounded-full bg-slate-950 px-2 py-0.5 text-[10px] font-black text-white">
                                        QR
                                    </span>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>

                <aside className="space-y-5 xl:sticky xl:top-5 xl:max-h-[calc(100vh-2rem)] xl:overflow-y-auto xl:pr-1">
                    <div className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
                        <button
                            type="button"
                            onClick={() =>
                                setIsAddFieldsOpen((current) => !current)
                            }
                            className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
                        >
                            <div>
                                <h2 className="text-lg font-black text-slate-950">
                                    Agregar campos
                                </h2>

                                <p className="mt-1 text-sm leading-6 text-slate-500">
                                    Agrega textos, variables y firmas.
                                </p>
                            </div>

                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                                <ChevronDown
                                    className={`h-5 w-5 transition ${isAddFieldsOpen ? "" : "-rotate-90"
                                        }`}
                                />
                            </span>
                        </button>

                        {isAddFieldsOpen ? (
                            <div className="border-t border-slate-100 px-5 py-4">
                                <div className="max-h-[260px] overflow-y-auto pr-1">
                                    <div className="grid gap-2">
                                        {fieldTypeOptions.map((option) => (
                                            <button
                                                key={option.value}
                                                type="button"
                                                onClick={() =>
                                                    handleAddField(option.value)
                                                }
                                                className="inline-flex h-10 items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                                            >
                                                {option.label}
                                                <Plus className="h-4 w-4" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="border-t border-slate-100 px-5 pb-4">
                                <p className="rounded-2xl bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-500">
                                    Panel minimizado. Presiona el encabezado
                                    para agregar más campos.
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="rounded-[28px] border border-blue-200 bg-white p-5 shadow-sm">
                        <div className="space-y-4">
                            <label className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                <span>
                                    <span className="block text-sm font-black text-slate-800">
                                        Mostrar QR
                                    </span>
                                    <span className="block text-xs font-semibold text-slate-500">
                                        Se guarda como qr_config.enabled.
                                    </span>
                                </span>

                                <input
                                    type="checkbox"
                                    checked={Boolean(qrConfig.enabled)}
                                    onChange={(event) =>
                                        updateQrConfig({
                                            enabled: event.target.checked,
                                        })
                                    }
                                    className="h-5 w-5 accent-blue-700"
                                />
                            </label>
                        </div>
                    </div>

                    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                        <h2 className="text-lg font-black text-slate-950">
                            Campo seleccionado
                        </h2>

                        {!selectedField ? (
                            <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-sm text-slate-500">
                                Selecciona un campo del certificado para
                                editarlo. Para editar el QR, usa el panel de
                                Código QR.
                            </div>
                        ) : (
                            <div className="mt-5 max-h-[calc(100vh-260px)] space-y-4 overflow-y-auto pr-1">
                                <div className="space-y-2">
                                    <label className="block text-[13px] font-bold text-slate-700">
                                        Variable del certificado
                                    </label>

                                    <select
                                        value={selectedField.type}
                                        onChange={(event) => {
                                            const nextType = event.target
                                                .value as CertificateFieldType;

                                            const isSignature =
                                                nextType ===
                                                "signature_instructor" ||
                                                nextType ===
                                                "signature_director";

                                            if (!isSignature) {
                                                setSignatureFiles((current) => {
                                                    const nextFiles = {
                                                        ...current,
                                                    };
                                                    delete nextFiles[
                                                        selectedField.id
                                                    ];

                                                    return nextFiles;
                                                });
                                            }

                                            updateField(selectedField.id, {
                                                name: nextType,
                                                type: nextType,
                                                variableKey:
                                                    getVariableKeyByFieldType(
                                                        nextType,
                                                    ),
                                                label: getFieldLabel(nextType),
                                                value: getFieldDefaultValue(
                                                    nextType,
                                                ),
                                                fieldMode: isSignature
                                                    ? "signature"
                                                    : "text",
                                                signatureImage: isSignature
                                                    ? selectedField.signatureImage ??
                                                    null
                                                    : null,
                                            });
                                        }}
                                        className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                    >
                                        {fieldTypeOptions.map((option) => (
                                            <option
                                                key={option.value}
                                                value={option.value}
                                            >
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {isSignatureField(selectedField) ? (
                                    <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
                                        <p className="text-sm font-black text-blue-950">
                                            Imagen de la firma
                                        </p>

                                        <p className="mt-1 text-xs leading-5 text-blue-700">
                                            La firma se muestra como vista
                                            previa, pero se guarda como archivo
                                            separado.
                                        </p>

                                        <label className="mt-3 inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-blue-700 px-4 text-sm font-bold text-white transition hover:bg-blue-800">
                                            <ImagePlus className="h-4 w-4" />
                                            Subir firma
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(event) =>
                                                    handleSignatureUpload(
                                                        event,
                                                        selectedField.id,
                                                    )
                                                }
                                                className="hidden"
                                            />
                                        </label>

                                        {selectedField.signatureImage ? (
                                            <div className="mt-4 rounded-2xl border border-blue-100 bg-white p-3">
                                                <div
                                                    className="mx-auto h-20 w-full bg-contain bg-center bg-no-repeat"
                                                    style={{
                                                        backgroundImage:
                                                            toCssImageUrl(
                                                                selectedField.signatureImage,
                                                            ),
                                                    }}
                                                />
                                            </div>
                                        ) : null}
                                    </div>
                                ) : null}

                                <div className="space-y-2">
                                    <label className="block text-[13px] font-bold text-slate-700">
                                        Texto visible / variable
                                    </label>

                                    <textarea
                                        value={selectedField.value}
                                        onChange={(event) =>
                                            updateField(selectedField.id, {
                                                value: event.target.value,
                                            })
                                        }
                                        className="min-h-[90px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-[13px] font-bold text-slate-700">
                                        Tipografía
                                    </label>

                                    <select
                                        value={getFieldFontFamily(selectedField)}
                                        onChange={(event) =>
                                            updateField(selectedField.id, {
                                                fontFamily: event.target.value,
                                            })
                                        }
                                        className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                    >
                                        {fontFamilyOptions.map((option) => (
                                            <option
                                                key={option.value}
                                                value={option.value}
                                            >
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-[13px] font-bold text-slate-700">
                                        Formato del texto
                                    </label>

                                    <select
                                        value={getFieldTextCase(selectedField)}
                                        onChange={(event) =>
                                            updateField(selectedField.id, {
                                                textCase: event.target
                                                    .value as CertificateTextCase,
                                            })
                                        }
                                        className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                    >
                                        {textCaseOptions.map((option) => (
                                            <option
                                                key={option.value}
                                                value={option.value}
                                            >
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-3">
                                    <div className="space-y-2">
                                        <label className="block text-[13px] font-bold text-slate-700">
                                            Tamaño
                                        </label>

                                        <input
                                            type="number"
                                            min="8"
                                            max="80"
                                            value={selectedField.fontSize}
                                            onChange={(event) =>
                                                updateField(selectedField.id, {
                                                    fontSize: Number(
                                                        event.target.value,
                                                    ),
                                                })
                                            }
                                            className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-[13px] font-bold text-slate-700">
                                            Ancho %
                                        </label>

                                        <input
                                            type="number"
                                            min="10"
                                            max="100"
                                            value={selectedField.width}
                                            onChange={(event) =>
                                                updateField(selectedField.id, {
                                                    width: Number(
                                                        event.target.value,
                                                    ),
                                                })
                                            }
                                            className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-[13px] font-bold text-slate-700">
                                            Alto %
                                        </label>

                                        <input
                                            type="number"
                                            min="4"
                                            max="40"
                                            value={selectedField.height ?? 8}
                                            onChange={(event) =>
                                                updateField(selectedField.id, {
                                                    height: Number(
                                                        event.target.value,
                                                    ),
                                                })
                                            }
                                            className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <label className="block text-[13px] font-bold text-slate-700">
                                            Color
                                        </label>

                                        <input
                                            type="color"
                                            value={selectedField.color}
                                            onChange={(event) =>
                                                updateField(selectedField.id, {
                                                    color: event.target.value,
                                                })
                                            }
                                            className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-[13px] font-bold text-slate-700">
                                            Peso
                                        </label>

                                        <select
                                            value={selectedField.fontWeight}
                                            onChange={(event) =>
                                                updateField(selectedField.id, {
                                                    fontWeight: event.target
                                                        .value as
                                                        | "normal"
                                                        | "bold",
                                                })
                                            }
                                            className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                        >
                                            <option value="normal">
                                                Normal
                                            </option>
                                            <option value="bold">
                                                Negrita
                                            </option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-[13px] font-bold text-slate-700">
                                        Alineación
                                    </label>

                                    <select
                                        value={selectedField.textAlign}
                                        onChange={(event) =>
                                            updateField(selectedField.id, {
                                                textAlign: event.target
                                                    .value as CertificateTextAlign,
                                            })
                                        }
                                        className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                    >
                                        {alignOptions.map((option) => (
                                            <option
                                                key={option.value}
                                                value={option.value}
                                            >
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <button
                                    type="button"
                                    onClick={() =>
                                        handleDeleteField(selectedField.id)
                                    }
                                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-5 text-sm font-bold text-red-700 transition hover:bg-red-100"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Eliminar campo
                                </button>
                            </div>
                        )}
                    </div>
                </aside>
            </div>
        </section>
    );
}

export default CertificateTemplateWorkspace;