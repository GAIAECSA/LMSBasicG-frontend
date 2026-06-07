"use client";

import type {
    ChangeEvent,
    PointerEvent as ReactPointerEvent,
} from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { notify } from "@/lib/notify";
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

const BACKGROUND_REQUIRED_MESSAGE =
    "Primero sube una imagen de fondo para comenzar a diseñar el certificado.";

function createLoadingToast(message: string) {
    const toastId = notify.loading(message);
    let dismissed = false;

    return () => {
        if (dismissed) return;

        notify.dismiss(toastId);
        dismissed = true;
    };
}

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

    const [error, setError] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSavingTemplate, setIsSavingTemplate] = useState(false);
    const [isLoadingTemplate, setIsLoadingTemplate] = useState(true);
    const [isAddFieldsOpen, setIsAddFieldsOpen] = useState(false);

    const loadRequestRef = useRef<{
        courseId: number;
        sequence: number;
        promise: Promise<void>;
    } | null>(null);
    const loadRequestSequenceRef = useRef(0);
    const activeActionRef = useRef<"save" | "pdf" | null>(null);
    const backgroundUploadRef = useRef(false);
    const signatureUploadsRef = useRef<Set<string>>(new Set());

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

    const hasBackgroundImage = Boolean(
        String(template?.backgroundImage ?? "").trim(),
    );

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
        const requestedCourseId = numericCourseId;
        const activeRequest = loadRequestRef.current;

        if (activeRequest?.courseId === requestedCourseId) {
            return activeRequest.promise;
        }

        const requestSequence = ++loadRequestSequenceRef.current;

        const promise = (async () => {
            try {
                setIsLoadingTemplate(true);
                setError("");

                const coursesData = await getAllCourses();

                if (requestSequence !== loadRequestSequenceRef.current) {
                    return;
                }

                setCourses(Array.isArray(coursesData) ? coursesData : []);

                if (!requestedCourseId || Number.isNaN(requestedCourseId)) {
                    setTemplate(null);
                    setBackgroundImageFile(null);
                    setSignatureFiles({});
                    setSelectedFieldId(null);
                    return;
                }

                const currentTemplate =
                    await getCertificateTemplate(requestedCourseId);

                if (requestSequence !== loadRequestSequenceRef.current) {
                    return;
                }

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
                            ...createEmptyCertificateTemplate(
                                requestedCourseId,
                            ),
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
                if (requestSequence !== loadRequestSequenceRef.current) {
                    return;
                }

                if (!requestedCourseId || Number.isNaN(requestedCourseId)) {
                    setTemplate(null);
                    setBackgroundImageFile(null);
                    setSignatureFiles({});
                    setSelectedFieldId(null);
                    setError("No se pudieron cargar los cursos disponibles.");
                    return;
                }

                const emptyTemplate =
                    createEmptyCertificateTemplate(requestedCourseId);

                setTemplate({
                    ...emptyTemplate,
                    qrConfig: normalizeQrConfig(emptyTemplate.qrConfig),
                });
                setBackgroundImageFile(null);
                setSignatureFiles({});
                setSelectedFieldId(emptyTemplate.fields[0]?.id ?? null);
                setError("");
            } finally {
                if (requestSequence === loadRequestSequenceRef.current) {
                    setIsLoadingTemplate(false);

                    if (
                        loadRequestRef.current?.sequence === requestSequence
                    ) {
                        loadRequestRef.current = null;
                    }
                }
            }
        })();

        loadRequestRef.current = {
            courseId: requestedCourseId,
            sequence: requestSequence,
            promise,
        };

        return promise;
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
        setError("");
    }

    function showBackgroundRequiredError() {
        notify.warning(BACKGROUND_REQUIRED_MESSAGE);
    }

    function canEditCertificate() {
        if (!hasBackgroundImage) {
            showBackgroundRequiredError();
            return false;
        }

        if (activeActionRef.current) {
            notify.warning(
                "Espera a que termine el proceso actual antes de continuar.",
            );
            return false;
        }

        return true;
    }

    function updateTemplate(nextTemplate: CertificateTemplate) {
        setTemplate(nextTemplate);
    }

    function updateQrConfig(changes: Partial<CertificateQrConfig>) {
        if (!template || !canEditCertificate()) return;

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
        if (!template || !canEditCertificate()) return;

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

        if (backgroundUploadRef.current) {
            notify.warning("La imagen de fondo ya se está procesando.");
            event.target.value = "";
            return;
        }

        if (activeActionRef.current) {
            notify.warning(
                "Espera a que termine el proceso actual antes de cambiar el fondo.",
            );
            event.target.value = "";
            return;
        }

        backgroundUploadRef.current = true;
        const dismissLoadingToast = createLoadingToast(
            "Procesando imagen de fondo...",
        );

        try {
            if (!file.type.startsWith("image/")) {
                throw new Error("Selecciona un archivo de imagen válido.");
            }

            const dataUrl = await readFileAsDataUrl(file);

            setBackgroundImageFile(file);

            updateTemplate({
                ...template,
                backgroundImage: dataUrl,
            });

            setIsAddFieldsOpen(true);
            setError("");
            notify.success(
                "Imagen de fondo cargada correctamente. Ya puedes diseñar el certificado.",
            );
        } catch (err) {
            notify.error(
                err instanceof Error
                    ? err.message
                    : "No se pudo cargar la imagen de fondo.",
            );
        } finally {
            dismissLoadingToast();
            backgroundUploadRef.current = false;
            event.target.value = "";
        }
    }

    async function handleSignatureUpload(
        event: ChangeEvent<HTMLInputElement>,
        fieldId: string,
    ) {
        const file = event.target.files?.[0];

        if (!file || !template) return;

        if (!canEditCertificate()) {
            event.target.value = "";
            return;
        }

        if (signatureUploadsRef.current.has(fieldId)) {
            notify.warning("La firma seleccionada ya se está procesando.");
            event.target.value = "";
            return;
        }

        signatureUploadsRef.current.add(fieldId);
        const dismissLoadingToast = createLoadingToast("Procesando firma...");

        try {
            if (!file.type.startsWith("image/")) {
                throw new Error("Selecciona un archivo de imagen válido.");
            }

            const dataUrl = await readFileAsDataUrl(file);

            setSignatureFiles((current) => ({
                ...current,
                [fieldId]: file,
            }));

            updateField(fieldId, {
                signatureImage: dataUrl,
                fieldMode: "signature",
            });

            setError("");
            notify.success("Firma cargada correctamente.");
        } catch (err) {
            notify.error(
                err instanceof Error
                    ? err.message
                    : "No se pudo cargar la firma.",
            );
        } finally {
            dismissLoadingToast();
            signatureUploadsRef.current.delete(fieldId);
            event.target.value = "";
        }
    }

    function handleAddField(type: CertificateFieldType) {
        if (!template || !canEditCertificate()) return;

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
        setError("");
        notify.success("Campo agregado correctamente.");
    }

    function handleDeleteField(fieldId: string) {
        if (!template || !canEditCertificate()) return;

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

        setError("");
        notify.success(
            "Campo eliminado del diseño. Guarda la plantilla para aplicar el cambio.",
        );
    }

    function handleFieldTypeChange(
        fieldId: string,
        nextType: CertificateFieldType,
    ) {
        if (!template || !canEditCertificate()) return;

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

        if (!canEditCertificate()) return;

        setSelectedFieldId(fieldId);
        setDraggingFieldId(fieldId);
        setIsDraggingQr(false);

        event.currentTarget.setPointerCapture(event.pointerId);
    }

    function handleQrPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
        event.preventDefault();
        event.stopPropagation();

        if (!canEditCertificate()) return;

        setSelectedFieldId(null);
        setDraggingFieldId(null);
        setIsDraggingQr(true);

        event.currentTarget.setPointerCapture(event.pointerId);
    }

    function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
        if (!certificateRef.current || !hasBackgroundImage) return;

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
        if (!template || !canEditCertificate()) return;

        activeActionRef.current = "save";
        setIsSavingTemplate(true);
        setError("");

        const dismissLoadingToast = createLoadingToast(
            "Guardando plantilla del certificado...",
        );

        try {
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

            notify.success("Plantilla guardada correctamente.");
        } catch (err) {
            const message =
                err instanceof Error
                    ? err.message
                    : "No se pudo guardar la plantilla del certificado.";

            const safeMessage =
                message.includes("403") ||
                message.toLowerCase().includes("forbidden") ||
                message.toLowerCase().includes("not authenticated")
                    ? "No tienes permiso para guardar esta plantilla. Inicia sesión nuevamente con un usuario ADMIN o DOCENTE."
                    : message;

            notify.error(safeMessage);
        } finally {
            dismissLoadingToast();
            activeActionRef.current = null;
            setIsSavingTemplate(false);
        }
    }

    async function handleGeneratePdf() {
        if (!template || !canEditCertificate()) return;

        activeActionRef.current = "pdf";
        setIsGenerating(true);
        setError("");

        const dismissLoadingToast = createLoadingToast(
            "Generando certificado PDF...",
        );

        try {
            await generateCertificatePdf({
                template,
                numericCourseId,
            });

            notify.success("Certificado PDF generado correctamente.");
        } catch (err) {
            console.error("Error al generar certificado PDF:", err);

            notify.error(
                err instanceof Error
                    ? `No se pudo generar el PDF: ${err.message}`
                    : "No se pudo generar el PDF del certificado.",
            );
        } finally {
            dismissLoadingToast();
            activeActionRef.current = null;
            setIsGenerating(false);
        }
    }

    function toggleAddFields() {
        if (!canEditCertificate()) return;

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
        hasBackgroundImage,

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
