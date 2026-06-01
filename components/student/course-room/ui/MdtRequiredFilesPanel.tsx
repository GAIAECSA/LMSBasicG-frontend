"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import {
    AlertCircle,
    CheckCircle2,
    Eye,
    FileUp,
    FolderCheck,
    Loader2,
    RefreshCcw,
    Upload,
    XCircle,
} from "lucide-react";
import {
    createHomeworkResponse,
    getHomeworkResponsesByCourse,
    updateHomeworkResponse,
    type HomeworkResponse,
} from "@/services/homework-response.service";

import { getModulesByCourse } from "@/services/modules.service";
import {
    getLessonBlocksByLesson,
    getLessonsByModule,
} from "@/services/lessons.service";
import {
    API_URL,
    getJsonHeaders,
    handleApiResponse,
} from "@/services/api-client.service";

type AnyRecord = Record<string, unknown>;

type LessonBlockDefault = {
    id: number;
    content?: AnyRecord | string | null;
    counts_toward_grade?: boolean | null;
    completion_type?: string | null;
    completion_value?: number | null;
    order?: number | null;
    default?: boolean | null;
    lesson_id?: number | null;
    block_type_id?: number | null;
    date_available?: string | null;
    is_active?: boolean | null;
    deleted?: boolean | null;
    created_at?: string | null;
    updated_at?: string | null;
    lesson_block_type?: {
        id?: number | null;
        key?: string | null;
    } | null;
};

type MdtRequiredFile = {
    id: number;
    lesson_block_id: number;
    title: string;
    description: string;
    accepted_file_types?: string | null;
    max_file_size_mb?: number | string | null;
    template_url?: string | null;
    is_required: boolean;
    is_active: boolean;
};

type MdtRequiredFilesPanelProps = {
    enabled?: boolean;
    room?: AnyRecord | null;
    courseId?: number | string | null;
    enrollmentId?: number | string | null;
    studentIdNumber?: string | null;
};

type PanelState = {
    isLoading: boolean;
    error: string;
    warning: string;
    requiredFiles: MdtRequiredFile[];
    submissions: HomeworkResponse[];
};

const REQUIRED_FILE_BLOCK_TYPE_ID = 6;

const RAW_API_URL =
    API_URL || process.env.NEXT_PUBLIC_API_URL || "http://213.165.74.184:9000";

function normalizeApiOrigin(url: string) {
    const cleanUrl = url.trim().replace(/\/+$/, "");

    if (cleanUrl.endsWith("/api/v1")) {
        return cleanUrl.replace(/\/api\/v1$/, "");
    }

    return cleanUrl;
}

const API_ORIGIN = normalizeApiOrigin(RAW_API_URL);

function toRecord(value: unknown): AnyRecord | null {
    if (!value || typeof value !== "object") return null;

    return value as AnyRecord;
}

function cleanText(value: unknown) {
    if (typeof value !== "string" && typeof value !== "number") return "";

    return String(value).trim();
}

function readNumber(value: unknown, fallback = 0) {
    const numericValue = Number(value);

    return Number.isFinite(numericValue) ? numericValue : fallback;
}

function readBoolean(value: unknown, fallback = false) {
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value === 1;

    if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();

        if (["true", "1", "yes", "si", "sí"].includes(normalized)) {
            return true;
        }

        if (["false", "0", "no"].includes(normalized)) {
            return false;
        }
    }

    return fallback;
}

function getValue(record: unknown, keys: string[]) {
    const currentRecord = toRecord(record);

    if (!currentRecord) return null;

    for (const key of keys) {
        const value = currentRecord[key];

        if (
            typeof value === "string" ||
            typeof value === "number" ||
            typeof value === "boolean"
        ) {
            return value;
        }
    }

    return null;
}

function getContentRecord(value: unknown): AnyRecord {
    if (!value) return {};

    if (typeof value === "object") {
        return value as AnyRecord;
    }

    if (typeof value === "string") {
        try {
            const parsed = JSON.parse(value);

            return parsed && typeof parsed === "object"
                ? (parsed as AnyRecord)
                : {};
        } catch {
            return {};
        }
    }

    return {};
}

function getCourseIdFromPathname(pathname: string | null) {
    if (!pathname) return 0;

    const parts = pathname.split("/").filter(Boolean);

    const coursesIndex = parts.findIndex(
        (part) => part === "courses" || part === "course",
    );

    if (coursesIndex < 0) return 0;

    return readNumber(parts[coursesIndex + 1], 0);
}

function getCourseId(props: MdtRequiredFilesPanelProps, pathname: string | null) {
    const room = toRecord(props.room);
    const course = toRecord(room?.course);

    return (
        readNumber(props.courseId, 0) ||
        readNumber(
            getValue(room, [
                "numericCourseId",
                "currentCourseId",
                "courseId",
                "course_id",
            ]),
            0,
        ) ||
        readNumber(getValue(course, ["id", "courseId", "course_id"]), 0) ||
        getCourseIdFromPathname(pathname)
    );
}

function getEnrollmentId(props: MdtRequiredFilesPanelProps) {
    const room = toRecord(props.room);
    const enrollment = toRecord(room?.enrollment);

    return (
        readNumber(props.enrollmentId, 0) ||
        readNumber(
            getValue(room, [
                "enrollmentId",
                "enrollment_id",
                "currentEnrollmentId",
            ]),
            0,
        ) ||
        readNumber(
            getValue(enrollment, ["id", "enrollmentId", "enrollment_id"]),
            0,
        )
    );
}

function buildFileUrl(fileUrl: string | null | undefined) {
    const cleanUrl = cleanText(fileUrl);

    if (!cleanUrl) return "";

    if (
        cleanUrl.startsWith("http://") ||
        cleanUrl.startsWith("https://") ||
        cleanUrl.startsWith("blob:") ||
        cleanUrl.startsWith("data:")
    ) {
        return cleanUrl;
    }

    if (cleanUrl.startsWith("/")) {
        return `${API_ORIGIN}${cleanUrl}`;
    }

    return `${API_ORIGIN}/${cleanUrl}`;
}

async function getDefaultLessonBlocksByCourseAndBlockType(
    courseId: number,
    blockTypeId: number,
): Promise<LessonBlockDefault[]> {
    const validCourseId = readNumber(courseId, 0);
    const validBlockTypeId = readNumber(blockTypeId, 0);

    if (!validCourseId) {
        throw new Error("El ID del curso es obligatorio para cargar los archivos.");
    }

    if (!validBlockTypeId) {
        throw new Error(
            "El ID del tipo de bloque es obligatorio para cargar los archivos.",
        );
    }

    const params = new URLSearchParams({
        block_type_id: String(validBlockTypeId),
        course_id: String(validCourseId),
    });

    const response = await fetch(
        `${API_ORIGIN}/api/v1/lesson-blocks/lesson-blocks/default/?${params.toString()}`,
        {
            method: "GET",
            headers: getJsonHeaders(),
            cache: "no-store",
        },
    );

    const data = await handleApiResponse<LessonBlockDefault[]>(response);

    return Array.isArray(data) ? data : [];
}

function mapDefaultBlockToRequiredFile(block: LessonBlockDefault): MdtRequiredFile {
    const content = getContentRecord(block.content);

    const blockId = readNumber(block.id, 0);

    return {
        id: blockId,
        lesson_block_id: blockId,
        title:
            cleanText(content.title) ||
            cleanText(content.name) ||
            cleanText(content.label) ||
            cleanText(content.titulo) ||
            `Archivo obligatorio #${blockId}`,
        description:
            cleanText(content.description) ||
            cleanText(content.instructions) ||
            cleanText(content.descripcion) ||
            "Documento requerido para completar el proceso del curso.",
        accepted_file_types:
            cleanText(content.accepted_file_types) ||
            cleanText(content.acceptedFileTypes) ||
            cleanText(content.accept) ||
            cleanText(content.file_types) ||
            null,
        max_file_size_mb:
            cleanText(content.max_file_size_mb) ||
            cleanText(content.maxFileSizeMb) ||
            cleanText(content.max_size_mb) ||
            cleanText(content.maxSizeMb) ||
            null,
        template_url:
            cleanText(content.template_url) ||
            cleanText(content.templateUrl) ||
            cleanText(content.file_url) ||
            cleanText(content.fileUrl) ||
            cleanText(content.url) ||
            null,
        is_required: true,
        is_active: readBoolean(block.is_active, true),
    };
}

async function getRequiredFilesFromDefaultBlocks(courseId: number) {
    const blocks = await getDefaultLessonBlocksByCourseAndBlockType(
        courseId,
        REQUIRED_FILE_BLOCK_TYPE_ID,
    );

    return blocks
        .filter((block) => block.deleted !== true)
        .filter((block) => readBoolean(block.is_active, true))
        .map(mapDefaultBlockToRequiredFile)
        .filter((item) => item.id > 0)
        .sort((a, b) => a.id - b.id);
}

function getLessonBlockTypeId(block: unknown) {
    const blockRecord = toRecord(block);

    if (!blockRecord) return 0;

    const lessonBlockType = toRecord(
        blockRecord.lesson_block_type ??
        blockRecord.lessonBlockType ??
        blockRecord.block_type ??
        blockRecord.blockType,
    );

    return (
        readNumber(
            getValue(blockRecord, [
                "block_type_id",
                "blockTypeId",
                "lesson_block_type_id",
                "lessonBlockTypeId",
            ]),
            0,
        ) || readNumber(getValue(lessonBlockType, ["id"]), 0)
    );
}

async function getRequiredFilesFromCourseBlocks(courseId: number) {
    const modules = await getModulesByCourse(courseId);

    const allBlocks: LessonBlockDefault[] = [];

    for (const moduleItem of modules) {
        const moduleId = readNumber(
            getValue(moduleItem, ["id", "module_id", "moduleId"]),
            0,
        );

        if (!moduleId) continue;

        const lessons = await getLessonsByModule(moduleId);

        for (const lesson of lessons) {
            const lessonId = readNumber(
                getValue(lesson, ["id", "lesson_id", "lessonId"]),
                0,
            );

            if (!lessonId) continue;

            const blocks = await getLessonBlocksByLesson(lessonId);

            allBlocks.push(...(blocks as LessonBlockDefault[]));
        }
    }

    return allBlocks
        .filter((block) => getLessonBlockTypeId(block) === REQUIRED_FILE_BLOCK_TYPE_ID)
        .filter((block) => block.deleted !== true)
        .filter((block) => readBoolean(block.is_active, true))
        .map(mapDefaultBlockToRequiredFile)
        .filter((item) => item.id > 0)
        .sort((a, b) => a.id - b.id);
}

function getSubmissionForRequiredFile(
    requiredFileId: number,
    submissions: HomeworkResponse[],
) {
    return (
        submissions
            .filter((item) => {
                const lessonBlockId = readNumber(
                    getValue(item, ["lesson_block_id", "lessonBlockId"]),
                    0,
                );

                return lessonBlockId === Number(requiredFileId);
            })
            .sort((a, b) => {
                const dateA = new Date(
                    cleanText(
                        getValue(a, [
                            "updated_at",
                            "updatedAt",
                            "created_at",
                            "createdAt",
                        ]),
                    ),
                ).getTime();

                const dateB = new Date(
                    cleanText(
                        getValue(b, [
                            "updated_at",
                            "updatedAt",
                            "created_at",
                            "createdAt",
                        ]),
                    ),
                ).getTime();

                return dateB - dateA;
            })[0] ?? null
    );
}

function getStatusLabel(status: unknown) {
    const normalized = String(status ?? "PENDIENTE").toLowerCase();

    if (
        normalized === "calificado" ||
        normalized === "aprobado" ||
        normalized === "approved"
    ) {
        return "Aprobado";
    }

    if (
        normalized === "rechazado" ||
        normalized === "rechazada" ||
        normalized === "rejected"
    ) {
        return "Rechazado";
    }

    if (
        normalized === "entregado" ||
        normalized === "submitted" ||
        normalized === "pendiente"
    ) {
        return "Entregado";
    }

    return "Pendiente";
}

function getStatusClass(status: unknown) {
    const normalized = String(status ?? "PENDIENTE").toLowerCase();

    if (
        normalized === "calificado" ||
        normalized === "aprobado" ||
        normalized === "approved"
    ) {
        return "bg-emerald-50 text-emerald-700";
    }

    if (
        normalized === "rechazado" ||
        normalized === "rechazada" ||
        normalized === "rejected"
    ) {
        return "bg-red-50 text-red-700";
    }

    if (
        normalized === "entregado" ||
        normalized === "submitted" ||
        normalized === "pendiente"
    ) {
        return "bg-green-50 text-green-700";
    }

    return "bg-amber-50 text-amber-700";
}

function validateSelectedFile(requiredFile: MdtRequiredFile, file: File) {
    const maxSizeMb = Number(requiredFile.max_file_size_mb ?? 0);

    if (Number.isFinite(maxSizeMb) && maxSizeMb > 0) {
        const currentSizeMb = file.size / 1024 / 1024;

        if (currentSizeMb > maxSizeMb) {
            throw new Error(
                `El archivo supera el tamaño máximo permitido de ${maxSizeMb} MB.`,
            );
        }
    }
}

export function MdtRequiredFilesPanel(props: MdtRequiredFilesPanelProps) {
    const pathname = usePathname();
    const enabled = props.enabled ?? true;

    const courseId = useMemo(
        () => getCourseId(props, pathname),
        [props, pathname],
    );

    const enrollmentId = useMemo(() => getEnrollmentId(props), [props]);

    const [state, setState] = useState<PanelState>({
        isLoading: enabled,
        error: "",
        warning: "",
        requiredFiles: [],
        submissions: [],
    });

    const [selectedFiles, setSelectedFiles] = useState<
        Record<number, File | null>
    >({});
    const [comments, setComments] = useState<Record<number, string>>({});
    const [uploadingId, setUploadingId] = useState<number | null>(null);
    const [notice, setNotice] = useState("");

    const loadData = useCallback(async () => {
        if (!enabled) {
            setState({
                isLoading: false,
                error: "",
                warning: "",
                requiredFiles: [],
                submissions: [],
            });
            return;
        }

        if (!courseId) {
            setState({
                isLoading: false,
                error: "",
                warning:
                    "No se pudo identificar el curso para cargar los archivos obligatorios.",
                requiredFiles: [],
                submissions: [],
            });
            return;
        }

        try {
            setState((current) => ({
                ...current,
                isLoading: true,
                error: "",
                warning: "",
            }));

            let requiredFiles = await getRequiredFilesFromDefaultBlocks(
                Number(courseId),
            );

            if (requiredFiles.length === 0) {
                requiredFiles = await getRequiredFilesFromCourseBlocks(Number(courseId));
            }

            let submissions: HomeworkResponse[] = [];
            let warning = "";

            if (courseId && enrollmentId) {
                const responses = await getHomeworkResponsesByCourse(
                    Number(courseId),
                );

                submissions = responses.filter((response) => {
                    const responseEnrollmentId = readNumber(
                        getValue(response, ["enrollment_id", "enrollmentId"]),
                        0,
                    );

                    return responseEnrollmentId === Number(enrollmentId);
                });
            } else {
                warning =
                    "Los archivos se muestran, pero para enviar debe existir curso y matrícula del estudiante.";
            }

            setState({
                isLoading: false,
                error: "",
                warning,
                requiredFiles,
                submissions,
            });
        } catch (error) {
            setState({
                isLoading: false,
                error:
                    error instanceof Error
                        ? error.message
                        : "No se pudieron cargar los archivos obligatorios.",
                warning: "",
                requiredFiles: [],
                submissions: [],
            });
        }
    }, [courseId, enabled, enrollmentId]);

    useEffect(() => {
        let isMounted = true;

        const timeoutId = window.setTimeout(() => {
            if (isMounted) {
                void loadData();
            }
        }, 0);

        return () => {
            isMounted = false;
            window.clearTimeout(timeoutId);
        };
    }, [loadData]);

    if (!enabled) {
        return null;
    }

    const totalRequired = state.requiredFiles.length;

    const completedRequired = state.requiredFiles.filter((item) =>
        Boolean(
            getSubmissionForRequiredFile(
                item.lesson_block_id,
                state.submissions,
            ),
        ),
    ).length;

    async function handleUpload(requiredFile: MdtRequiredFile) {
        const file = selectedFiles[requiredFile.id];

        if (!file) {
            setNotice("Selecciona un archivo antes de enviar.");
            return;
        }

        if (!courseId) {
            setNotice("No se pudo identificar el curso.");
            return;
        }

        if (!enrollmentId) {
            setNotice("No se pudo identificar la matrícula del estudiante.");
            return;
        }

        const existing = getSubmissionForRequiredFile(
            requiredFile.lesson_block_id,
            state.submissions,
        );

        try {
            validateSelectedFile(requiredFile, file);

            setUploadingId(requiredFile.id);
            setNotice("");

            if (existing) {
                const existingId = readNumber(getValue(existing, ["id"]), 0);

                await updateHomeworkResponse(existingId, {
                    comment: comments[requiredFile.id] ?? "",
                    status: "ENTREGADO",
                    file,
                });
            } else {
                await createHomeworkResponse({
                    enrollment_id: Number(enrollmentId),
                    lesson_block_id: requiredFile.lesson_block_id,
                    comment: comments[requiredFile.id] ?? "",
                    status: "ENTREGADO",
                    file,
                });
            }

            setSelectedFiles((current) => ({
                ...current,
                [requiredFile.id]: null,
            }));

            setComments((current) => ({
                ...current,
                [requiredFile.id]: "",
            }));

            setNotice(
                existing
                    ? "Archivo actualizado correctamente."
                    : "Archivo enviado correctamente.",
            );

            await loadData();
        } catch (error) {
            setNotice(
                error instanceof Error
                    ? error.message
                    : "No se pudo enviar el archivo.",
            );
        } finally {
            setUploadingId(null);
        }
    }

    return (
        <div className="space-y-5">
            <div className="rounded-[2rem] border border-blue-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                    <div className="flex gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                            {state.isLoading ? (
                                <Loader2 className="h-7 w-7 animate-spin" />
                            ) : (
                                <FolderCheck className="h-7 w-7" />
                            )}
                        </div>

                        <div>
                            <h2 className="text-lg font-black text-slate-950">
                                Archivos obligatorios MDT
                            </h2>

                            <p className="mt-1 text-sm font-semibold text-slate-500">
                                Sube los documentos requeridos para completar el
                                proceso asociado al curso MDT.
                            </p>

                        </div>
                    </div>

                </div>

                {state.error ? (
                    <div className="mt-5 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>{state.error}</span>
                    </div>
                ) : null}

                {state.warning ? (
                    <div className="mt-5 flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>{state.warning}</span>
                    </div>
                ) : null}

                {notice ? (
                    <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700">
                        {notice}
                    </div>
                ) : null}
            </div>

            {state.isLoading ? (
                <div className="rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-sm">
                    <Loader2 className="mx-auto h-7 w-7 animate-spin text-blue-700" />

                    <p className="mt-3 text-sm font-bold text-slate-500">
                        Cargando archivos obligatorios...
                    </p>
                </div>
            ) : null}

            {!state.isLoading && state.requiredFiles.length === 0 ? (
                <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
                    <FileUp className="mx-auto h-10 w-10 text-slate-400" />

                    <h3 className="mt-4 text-lg font-black text-slate-950">
                        No hay archivos obligatorios configurados
                    </h3>

                    <p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-6 text-slate-500">
                        Verifica que existan bloques por defecto para el tipo de
                        bloque #{REQUIRED_FILE_BLOCK_TYPE_ID} y para el curso
                        actual.
                    </p>
                </div>
            ) : null}

            {!state.isLoading && state.requiredFiles.length > 0 ? (
                <div className="space-y-4">
                    {state.requiredFiles.map((requiredFile) => {
                        const submission = getSubmissionForRequiredFile(
                            requiredFile.lesson_block_id,
                            state.submissions,
                        );

                        const submissionUrl = buildFileUrl(
                            cleanText(
                                getValue(submission, [
                                    "submitted_file_url",
                                    "submittedFileUrl",
                                    "file_url",
                                    "fileUrl",
                                    "answer_file_url",
                                    "attachment_url",
                                ]),
                            ),
                        );

                        const templateUrl = buildFileUrl(
                            requiredFile.template_url,
                        );

                        const status = getValue(submission, ["status"]);

                        const comment = cleanText(
                            getValue(submission, ["comment", "comentario"]),
                        );

                        const reviewComment = cleanText(
                            getValue(submission, [
                                "review_comment",
                                "reviewComment",
                                "teacher_comment",
                                "teacherComment",
                                "feedback",
                                "grade_comment",
                                "gradeComment",
                            ]),
                        );

                        const hasSubmission = Boolean(submission);
                        const hasSubmissionFile = Boolean(submissionUrl);

                        return (
                            <div
                                key={requiredFile.id}
                                className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
                            >
                                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h3 className="text-base font-black text-slate-950">
                                                {requiredFile.title}
                                            </h3>

                                            <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-black text-red-700">
                                                Archivo obligatorio
                                            </span>

                                            {hasSubmission ? (
                                                <span
                                                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-black ${getStatusClass(
                                                        status,
                                                    )}`}
                                                >
                                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                                    {getStatusLabel(status)}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700">
                                                    <XCircle className="h-3.5 w-3.5" />
                                                    Pendiente
                                                </span>
                                            )}
                                        </div>

                                        {requiredFile.description ? (
                                            <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                                                {requiredFile.description}
                                            </p>
                                        ) : null}

                                        <div className="mt-3 flex flex-wrap gap-2 text-xs font-black text-slate-500">
                                            {requiredFile.accepted_file_types ? (
                                                <span className="rounded-full bg-slate-100 px-3 py-1">
                                                    Tipos:{" "}
                                                    {
                                                        requiredFile.accepted_file_types
                                                    }
                                                </span>
                                            ) : null}

                                            {requiredFile.max_file_size_mb ? (
                                                <span className="rounded-full bg-slate-100 px-3 py-1">
                                                    Máx:{" "}
                                                    {
                                                        requiredFile.max_file_size_mb
                                                    }{" "}
                                                    MB
                                                </span>
                                            ) : null}
                                        </div>

                                        {comment ? (
                                            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-600">
                                                Comentario: {comment}
                                            </div>
                                        ) : null}

                                        {reviewComment ? (
                                            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700">
                                                Observación: {reviewComment}
                                            </div>
                                        ) : null}
                                    </div>

                                    <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">

                                        {hasSubmissionFile ? (
                                            <a
                                                href={submissionUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-blue-700 px-4 text-sm font-black !text-white shadow-sm transition hover:bg-blue-800 [&_*]:!text-white"
                                            >
                                                <Eye className="h-4 w-4" />
                                                Ver enviado
                                            </a>
                                        ) : null}
                                    </div>
                                </div>

                                <div className="mt-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
                                    <div className="space-y-3">
                                        <input
                                            type="file"
                                            accept={
                                                requiredFile.accepted_file_types ??
                                                undefined
                                            }
                                            onChange={(event) => {
                                                const file =
                                                    event.target.files?.[0] ??
                                                    null;

                                                setSelectedFiles((current) => ({
                                                    ...current,
                                                    [requiredFile.id]: file,
                                                }));
                                            }}
                                            className="block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 file:mr-4 file:rounded-xl file:border-0 file:bg-blue-700 file:px-4 file:py-2 file:text-sm file:font-black file:text-white"
                                        />
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            void handleUpload(requiredFile)
                                        }
                                        disabled={
                                            uploadingId === requiredFile.id ||
                                            !courseId ||
                                            !enrollmentId
                                        }
                                        className="inline-flex h-full min-h-11 items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-4 text-sm font-black text-[var(--primary-foreground)] shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {uploadingId === requiredFile.id ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Upload className="h-4 w-4" />
                                        )}

                                        {hasSubmission
                                            ? "Actualizar archivo"
                                            : "Enviar archivo"}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : null}
        </div>
    );
}

export default MdtRequiredFilesPanel;