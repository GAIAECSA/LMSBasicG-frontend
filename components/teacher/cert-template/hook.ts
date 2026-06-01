"use client";

import type {
    ChangeEvent,
    PointerEvent as ReactPointerEvent,
} from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { getAllCourses, type Course } from "@/services/courses.service";
import {
    createCertificateField,
    createEmptyCertificateTemplate,
    getCertificateTemplate,
    getFieldDefaultValue,
    getFieldLabel,
    getVariableKeyByFieldType,
    saveCertificateTemplate,
    type CertificateField,
    type CertificateFieldType,
    type CertificateQrConfig,
    type CertificateTemplate,
} from "@/services/certificates.service";
import type {
    CertificateFieldWithFormat,
    CertificateTemplateWorkspaceProps,
} from "./types";
import {
    clampNumber,
    getCourseIdFromPathname,
    getFieldFontFamily,
    getFieldTextCase,
    normalizeQrConfig,
    readFileAsDataUrl,
} from "./utils";
import { generateCertificatePdf } from "./pdf";

export function useCertTemplate({
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
        () =>
            [...courses].sort((a: Course, b: Course) =>
                a.name.localeCompare(b.name),
            ),
        [courses],
    );

    const selectedCourseName = useMemo(() => {
        const selectedCourse = courses.find(
            (courseItem: Course) =>
                Number(courseItem.id) === numericCourseId,
        );

        return selectedCourse?.name ?? `Curso #${numericCourseId}`;
    }, [courses, numericCourseId]);

    const selectedField =
        (template?.fields.find(
            (field: CertificateField) => field.id === selectedFieldId,
        ) as CertificateFieldWithFormat | undefined) ?? null;

    const qrConfig = normalizeQrConfig(template?.qrConfig);

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

            const safeFields = Array.isArray(currentTemplate.fields)
                ? currentTemplate.fields
                : [];

            const safeTemplate =
                safeFields.length > 0
                    ? {
                        ...currentTemplate,
                        fields: safeFields,
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

            const emptyTemplate =
                createEmptyCertificateTemplate(numericCourseId);

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
            fields: template.fields.map((field: CertificateField) =>
                field.id === fieldId
                    ? {
                        ...field,
                        ...changes,
                    }
                    : field,
            ),
        });
    }

    async function handleBackgroundUpload(
        event: ChangeEvent<HTMLInputElement>,
    ) {
        const file = event.target.files?.[0];

        if (!file || !template) return;

        try {
            const dataUrl = await readFileAsDataUrl(file);

            setBackgroundImageFile(file);

            updateTemplate({
                ...template,
                backgroundImage: dataUrl,
            });

            setNotice("Imagen de fondo cargada correctamente.");
            setError("");
        } catch {
            setError("No se pudo cargar la imagen de fondo.");
        } finally {
            event.target.value = "";
        }
    }

    async function handleSignatureUpload(
        event: ChangeEvent<HTMLInputElement>,
        fieldId: string,
    ) {
        const file = event.target.files?.[0];

        if (!file || !template) return;

        try {
            const dataUrl = await readFileAsDataUrl(file);

            setSignatureFiles((current) => ({
                ...current,
                [fieldId]: file,
            }));

            updateField(fieldId, {
                signatureImage: dataUrl,
                fieldMode: "signature",
            });

            setNotice("Firma cargada correctamente.");
            setError("");
        } catch {
            setError("No se pudo cargar la firma.");
        } finally {
            event.target.value = "";
        }
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
            (field: CertificateField) => field.id !== fieldId,
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

    function handleFieldTypeChange(
        fieldId: string,
        nextType: CertificateFieldType,
    ) {
        if (!template) return;

        const currentField = template.fields.find(
            (field: CertificateField) => field.id === fieldId,
        );

        if (!currentField) return;

        const isSignature =
            nextType === "signature_instructor" ||
            nextType === "signature_director";

        if (!isSignature) {
            setSignatureFiles((current) => {
                const nextFiles = { ...current };
                delete nextFiles[fieldId];

                return nextFiles;
            });
        }

        updateField(fieldId, {
            name: nextType,
            type: nextType,
            variableKey: getVariableKeyByFieldType(nextType),
            label: getFieldLabel(nextType),
            value: getFieldDefaultValue(nextType),
            fieldMode: isSignature ? "signature" : "text",
            signatureImage: isSignature
                ? currentField.signatureImage ?? null
                : null,
        });
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
                fields: currentTemplate.fields.map((field: CertificateField) =>
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
                fields: template.fields.map((field: CertificateField) => ({
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
                        (field: CertificateField) =>
                            field.id === currentFieldId,
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

            await generateCertificatePdf({
                template,
                numericCourseId,
            });

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

    function toggleAddFields() {
        setIsAddFieldsOpen((current) => !current);
    }

    return {
        routeCourseId,
        isAdminRoute,
        selectedCourseId,
        numericCourseId,
        certificateRef,

        courses,
        courseOptions,
        selectedCourseName,
        template,
        selectedField,
        selectedFieldId,
        draggingFieldId,
        isDraggingQr,
        qrConfig,

        notice,
        error,
        isGenerating,
        isSavingTemplate,
        isLoadingTemplate,
        isAddFieldsOpen,

        backHref,
        backLabel,

        handleSelectCourse,
        updateQrConfig,
        updateField,
        handleBackgroundUpload,
        handleSignatureUpload,
        handleAddField,
        handleDeleteField,
        handleFieldTypeChange,
        handlePointerDown,
        handleQrPointerDown,
        handlePointerMove,
        handlePointerUp,
        handleSaveTemplate,
        handleGeneratePdf,
        toggleAddFields,
    };
}