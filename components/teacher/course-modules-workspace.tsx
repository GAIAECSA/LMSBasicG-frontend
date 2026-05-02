"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { DragEvent, FormEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    AlertCircle,
    ArrowLeft,
    ChevronDown,
    ClipboardList,
    FileText,
    ImageIcon,
    Layers3,
    Loader2,
    Pencil,
    PlayCircle,
    Plus,
    Save,
    Trash2,
    X,
} from "lucide-react";
import { getAllCourses, type Course } from "@/services/courses.service";
import {
    createModule,
    deleteModule,
    getModulesByCourse,
    updateModule,
    type CourseModule as ApiCourseModule,
} from "@/services/modules.service";
import {
    createLesson,
    createLessonBlock,
    deleteLesson,
    deleteLessonBlock,
    getLessonBlocksByLesson,
    getLessonsByModule,
    updateLesson,
    updateLessonBlock,
    type Lesson as ApiLesson,
    type LessonBlock,
    type LessonBlockPayload,
} from "@/services/lessons.service";

type TeacherCourseModulesPageProps = {
    courseId?: string;
    params?: {
        courseId?: string;
    };
};

type LessonItemType = "text" | "image" | "pdf" | "video" | "quiz";

type LessonCompletionType = "VER" | "RESPONDER" | "SUBIR";

const DEFAULT_LESSON_BLOCK_TYPE_IDS: Record<LessonItemType, number> = {
    video: 1,
    quiz: 2,
    text: 3,
    image: 4,
    pdf: 5,
};

const DEFAULT_LESSON_COMPLETION_TYPE: Record<
    LessonItemType,
    LessonCompletionType
> = {
    video: "VER",
    quiz: "RESPONDER",
    text: "VER",
    image: "SUBIR",
    pdf: "SUBIR",
};

const DEFAULT_LESSON_COMPLETION_VALUE: Record<LessonItemType, number> = {
    video: 80,
    quiz: 7,
    text: 0,
    image: 0,
    pdf: 0,
};

type CourseModuleView = {
    id: string;
    title: string;
    order: number;
    raw: ApiCourseModule;
    lessons: LessonView[];
};

type LessonView = {
    id: string;
    title: string;
    order: number;
    moduleId: string;
    raw: ApiLesson;
    items: LessonItemView[];
};

type LessonItemView = {
    id: string;
    title: string;
    type: LessonItemType;
    order: number;
    lessonId: string;
    raw: LessonBlock;
};

type CreateModalState =
    | {
        type: "module";
    }
    | {
        type: "lesson";
        moduleId: string;
    }
    | {
        type: "item";
        lessonId: string;
        itemType: LessonItemType;
    };

type DeleteModalState =
    | {
        type: "module";
        id: string;
        title: string;
    }
    | {
        type: "lesson";
        id: string;
        title: string;
    }
    | {
        type: "item";
        id: string;
        title: string;
    };

type EditModalState =
    | {
        type: "module";
        id: string;
        title: string;
        order: number;
    }
    | {
        type: "lesson";
        id: string;
        title: string;
        order: number;
    };

type DragState =
    | {
        type: "module";
        id: string;
    }
    | {
        type: "lesson";
        id: string;
        moduleId: string;
    }
    | {
        type: "item";
        id: string;
        lessonId: string;
    };

type LessonBlockWithOptionalType = LessonBlock & {
    block_type_id?: number;
    lesson_block_type?: {
        id?: number;
        key?: string;
    };
};

type LessonBlockPayloadWithoutContent = Omit<LessonBlockPayload, "content"> & {
    content?: LessonBlockPayload["content"];
};

function getCourseIdFromPathname(pathname: string) {
    const teacherMatch = pathname.match(/^\/teacher\/courses\/([^/]+)\/modules/);
    const adminCourseMatch = pathname.match(/^\/admin\/courses\/([^/]+)\/modules/);
    const adminModuleMatch = pathname.match(/^\/admin\/modules\/([^/]+)/);

    return (
        teacherMatch?.[1] ??
        adminCourseMatch?.[1] ??
        adminModuleMatch?.[1] ??
        ""
    );
}

function sortByOrder<T extends { order: number }>(items: T[]) {
    return [...items].sort((a, b) => a.order - b.order);
}

function getErrorMessage(error: unknown) {
    if (error instanceof Error) return error.message;

    return "Ocurrió un error inesperado.";
}

function renderItemIcon(type: LessonItemType, className: string) {
    if (type === "video") return <PlayCircle className={className} />;
    if (type === "quiz") return <ClipboardList className={className} />;
    if (type === "image") return <ImageIcon className={className} />;
    if (type === "pdf") return <FileText className={className} />;

    return <FileText className={className} />;
}

function getItemLabel(type: LessonItemType) {
    if (type === "video") return "Video";
    if (type === "quiz") return "Prueba";
    if (type === "image") return "Imagen";
    if (type === "pdf") return "PDF";

    return "Texto";
}

function getCreateModalTitle(modal: CreateModalState | null) {
    if (!modal) return "";

    if (modal.type === "module") return "Agregar módulo";
    if (modal.type === "lesson") return "Agregar lección";

    return `Agregar ${getItemLabel(modal.itemType).toLowerCase()}`;
}

function getCreateModalDescription(modal: CreateModalState | null) {
    if (!modal) return "";

    if (modal.type === "module") {
        return "Crea una nueva unidad para organizar las lecciones del curso.";
    }

    if (modal.type === "lesson") {
        return "Agrega una lección dentro del módulo seleccionado.";
    }

    if (modal.itemType === "text") {
        return "Agrega un bloque de texto para la lección.";
    }

    if (modal.itemType === "image") {
        return "Agrega un bloque para subir una imagen.";
    }

    if (modal.itemType === "pdf") {
        return "Agrega un bloque para subir un archivo PDF.";
    }

    if (modal.itemType === "video") {
        return "Agrega un bloque de video para la lección.";
    }

    return "Agrega una evaluación para la lección.";
}

function isInteractiveDragTarget(target: EventTarget | null) {
    if (!(target instanceof HTMLElement)) return false;

    return Boolean(
        target.closest(
            "button, a, input, textarea, select, label, [data-no-drag='true']",
        ),
    );
}

function moveItem<T extends { id: string }>(
    items: T[],
    draggedId: string,
    targetId: string,
) {
    const nextItems = [...items];

    const fromIndex = nextItems.findIndex((item) => item.id === draggedId);
    const toIndex = nextItems.findIndex((item) => item.id === targetId);

    if (fromIndex === -1 || toIndex === -1) return items;

    const [removedItem] = nextItems.splice(fromIndex, 1);

    nextItems.splice(toIndex, 0, removedItem);

    return nextItems;
}

function getContentText(
    content: Record<string, unknown> | null | undefined,
    keys: string[],
) {
    if (!content) return "";

    for (const key of keys) {
        const value = content[key];

        if (typeof value === "string" && value.trim()) {
            return value.trim();
        }
    }

    return "";
}

function getLessonBlockTitle(block: LessonBlock) {
    const contentTitle = getContentText(block.content, [
        "title",
        "name",
        "text",
        "description",
        "label",
    ]);

    if (contentTitle) return contentTitle;

    return `Bloque ${block.id}`;
}

function getLessonItemType(block: LessonBlock): LessonItemType {
    const contentType = getContentText(block.content, [
        "itemType",
        "type",
        "blockType",
        "content_type",
    ]).toLowerCase();

    const fallbackKey =
        (
            block as LessonBlockWithOptionalType
        ).lesson_block_type?.key?.toLowerCase() ?? "";

    const contentBlockTypeId = block.content?.block_type_id;
    const optionalBlock = block as LessonBlockWithOptionalType;

    const blockTypeId =
        typeof contentBlockTypeId === "number"
            ? contentBlockTypeId
            : typeof optionalBlock.block_type_id === "number"
                ? optionalBlock.block_type_id
                : typeof optionalBlock.lesson_block_type?.id === "number"
                    ? optionalBlock.lesson_block_type.id
                    : null;

    const key = contentType || fallbackKey;

    if (blockTypeId === 1 || key.includes("video")) {
        return "video";
    }

    if (
        blockTypeId === 2 ||
        key.includes("quiz") ||
        key.includes("prueba") ||
        key.includes("evaluacion") ||
        key.includes("evaluation") ||
        key.includes("exam")
    ) {
        return "quiz";
    }

    if (
        blockTypeId === 4 ||
        key.includes("image") ||
        key.includes("imagen") ||
        key.includes("photo") ||
        key.includes("foto")
    ) {
        return "image";
    }

    if (
        blockTypeId === 5 ||
        key.includes("pdf") ||
        key.includes("document") ||
        key.includes("documento")
    ) {
        return "pdf";
    }

    return "text";
}

function buildInitialLessonBlockContent(title: string, type: LessonItemType) {
    if (type === "video") {
        return {
            url: "",
            title,
            provider: "youtube",
            type: "video",
            itemType: "video",
            block_type_id: DEFAULT_LESSON_BLOCK_TYPE_IDS.video,
        };
    }

    if (type === "quiz") {
        return {
            title,
            type: "quiz",
            itemType: "quiz",
            block_type_id: DEFAULT_LESSON_BLOCK_TYPE_IDS.quiz,
            questions: [],
        };
    }

    return {
        text: "",
        title,
        type: "text",
        itemType: "text",
        block_type_id: DEFAULT_LESSON_BLOCK_TYPE_IDS.text,
    };
}

function shouldSendContent(type: LessonItemType) {
    return type !== "image" && type !== "pdf";
}

function buildCreateLessonBlockPayload(params: {
    lessonId: string;
    type: LessonItemType;
    title: string;
    order: number;
}): LessonBlockPayloadWithoutContent {
    const payload: LessonBlockPayloadWithoutContent = {
        lesson_id: Number(params.lessonId),
        block_type_id: DEFAULT_LESSON_BLOCK_TYPE_IDS[params.type],
        completion_type: DEFAULT_LESSON_COMPLETION_TYPE[params.type],
        completion_value: DEFAULT_LESSON_COMPLETION_VALUE[params.type],
        order: params.order,
        is_required: true,
        is_active: true,
        deleted: false,
    };

    if (shouldSendContent(params.type)) {
        payload.content = buildInitialLessonBlockContent(
            params.title,
            params.type,
        );
    }

    return payload;
}

function toLessonBlockPayload(
    block: LessonBlock,
    order: number,
    fallbackType: LessonItemType,
): LessonBlockPayloadWithoutContent {
    const payload: LessonBlockPayloadWithoutContent = {
        lesson_id: block.lesson_id,
        block_type_id: DEFAULT_LESSON_BLOCK_TYPE_IDS[fallbackType],
        completion_type: DEFAULT_LESSON_COMPLETION_TYPE[fallbackType],
        completion_value: DEFAULT_LESSON_COMPLETION_VALUE[fallbackType],
        order,
        is_required: block.is_required,
        is_active: block.is_active,
        deleted: false,
    };

    if (shouldSendContent(fallbackType)) {
        payload.content = {
            ...block.content,
            block_type_id: DEFAULT_LESSON_BLOCK_TYPE_IDS[fallbackType],
            type: fallbackType,
            itemType: fallbackType,
        };
    }

    return payload;
}

function mapLessonBlockToView(block: LessonBlock): LessonItemView {
    const itemType = getLessonItemType(block);

    return {
        id: String(block.id),
        title: getLessonBlockTitle(block),
        type: itemType,
        order: block.order,
        lessonId: String(block.lesson_id),
        raw: block,
    };
}

function findLessonInModules(modules: CourseModuleView[], lessonId: string) {
    for (const courseModule of modules) {
        const lesson = courseModule.lessons.find(
            (currentLesson) => currentLesson.id === lessonId,
        );

        if (lesson) return lesson;
    }

    return null;
}

export function TeacherCourseModulesPage({
    courseId,
    params,
}: TeacherCourseModulesPageProps) {
    const pathname = usePathname();
    const router = useRouter();

    const routeCourseId = useMemo(() => {
        const rawCourseId =
            courseId ?? params?.courseId ?? getCourseIdFromPathname(pathname);

        const parsedCourseId = Number(rawCourseId);

        return Number.isFinite(parsedCourseId) && parsedCourseId > 0
            ? parsedCourseId
            : 0;
    }, [courseId, params?.courseId, pathname]);

    const isAdminRoute = pathname.startsWith("/admin");

    const [selectedCourseId, setSelectedCourseId] = useState(0);

    const numericCourseId =
        routeCourseId > 0 ? routeCourseId : selectedCourseId;

    const [courses, setCourses] = useState<Course[]>([]);
    const [modules, setModules] = useState<CourseModuleView[]>([]);
    const [openModules, setOpenModules] = useState<Record<string, boolean>>({});
    const [openLessons, setOpenLessons] = useState<Record<string, boolean>>({});

    const [createModal, setCreateModal] = useState<CreateModalState | null>(
        null,
    );
    const [createTitle, setCreateTitle] = useState("");
    const [createError, setCreateError] = useState("");

    const [editModal, setEditModal] = useState<EditModalState | null>(null);
    const [editTitle, setEditTitle] = useState("");
    const [editError, setEditError] = useState("");

    const [deleteModal, setDeleteModal] = useState<DeleteModalState | null>(
        null,
    );

    const [dragging, setDragging] = useState<DragState | null>(null);
    const [dragOver, setDragOver] = useState<DragState | null>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [actionError, setActionError] = useState("");

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

    const itemEditorBasePath = isAdminRoute
        ? `/admin/modules/${numericCourseId}/items`
        : `/teacher/courses/${numericCourseId}/modules/items`;

    const backHref = isAdminRoute ? "/admin" : `/teacher/courses/${numericCourseId}`;

    const backLabel = isAdminRoute ? "Volver al panel" : "Volver al curso";

    const refreshModules = useCallback(
        async (showLoading = false) => {
            try {
                if (showLoading) {
                    setIsLoading(true);
                }

                setErrorMessage("");
                setActionError("");

                const coursesData = await getAllCourses();

                setCourses(Array.isArray(coursesData) ? coursesData : []);

                if (!Number.isFinite(numericCourseId) || numericCourseId <= 0) {
                    setModules([]);
                    return;
                }

                const courseModulesResponse =
                    await getModulesByCourse(numericCourseId);

                const modulesWithLessons = await Promise.all(
                    sortByOrder(courseModulesResponse).map(
                        async (courseModule) => {
                            const lessonsResponse = await getLessonsByModule(
                                courseModule.id,
                            );

                            const lessonsWithBlocks = await Promise.all(
                                sortByOrder(lessonsResponse).map(
                                    async (lesson) => {
                                        const blocksResponse =
                                            await getLessonBlocksByLesson(
                                                lesson.id,
                                            );

                                        const lessonView: LessonView = {
                                            id: String(lesson.id),
                                            title: lesson.name,
                                            order: lesson.order,
                                            moduleId: String(lesson.module_id),
                                            raw: lesson,
                                            items: sortByOrder(
                                                blocksResponse,
                                            ).map(mapLessonBlockToView),
                                        };

                                        return lessonView;
                                    },
                                ),
                            );

                            const moduleView: CourseModuleView = {
                                id: String(courseModule.id),
                                title: courseModule.name,
                                order: courseModule.order,
                                raw: courseModule,
                                lessons: lessonsWithBlocks,
                            };

                            return moduleView;
                        },
                    ),
                );

                setModules(modulesWithLessons);
            } catch (error) {
                setErrorMessage(getErrorMessage(error));
                setModules([]);
            } finally {
                setIsLoading(false);
            }
        },
        [numericCourseId],
    );

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void refreshModules(true);
        }, 0);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [refreshModules]);

    function handleSelectCourse(value: string) {
        const parsedCourseId = Number(value);

        const nextCourseId =
            Number.isFinite(parsedCourseId) && parsedCourseId > 0
                ? parsedCourseId
                : 0;

        setSelectedCourseId(nextCourseId);
        setModules([]);
        setOpenModules({});
        setOpenLessons({});
        setCreateModal(null);
        setEditModal(null);
        setDeleteModal(null);
        setErrorMessage("");
        setActionError("");

        if (isAdminRoute && nextCourseId > 0) {
            router.push(`/admin/modules/${nextCourseId}`);
        }
    }

    function resetDragState(event?: DragEvent<HTMLElement>) {
        event?.currentTarget.classList.remove("cursor-grabbing");

        setDragging(null);
        setDragOver(null);
    }

    function handleDragStart(
        event: DragEvent<HTMLElement>,
        dragState: DragState,
    ) {
        if (isInteractiveDragTarget(event.target)) {
            event.preventDefault();
            return;
        }

        event.stopPropagation();

        setDragging(dragState);
        setDragOver(null);

        event.currentTarget.classList.add("cursor-grabbing");
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", dragState.id);
    }

    function handleDragOver(
        event: DragEvent<HTMLElement>,
        targetState: DragState,
    ) {
        event.preventDefault();
        event.stopPropagation();

        if (!dragging) return;
        if (dragging.type !== targetState.type) return;

        if (
            dragging.type === "lesson" &&
            targetState.type === "lesson" &&
            dragging.moduleId !== targetState.moduleId
        ) {
            return;
        }

        if (
            dragging.type === "item" &&
            targetState.type === "item" &&
            dragging.lessonId !== targetState.lessonId
        ) {
            return;
        }

        setDragOver(targetState);
        event.dataTransfer.dropEffect = "move";
    }

    async function handleDrop(
        event: DragEvent<HTMLElement>,
        targetState: DragState,
    ) {
        event.preventDefault();
        event.stopPropagation();

        if (!dragging) return;

        if (dragging.id === targetState.id) {
            resetDragState();
            return;
        }

        if (dragging.type !== targetState.type) {
            resetDragState();
            return;
        }

        try {
            setActionError("");

            if (dragging.type === "module" && targetState.type === "module") {
                const reorderedModules = moveItem(
                    modules,
                    dragging.id,
                    targetState.id,
                ).map((courseModule, index) => ({
                    ...courseModule,
                    order: index + 1,
                }));

                setModules(reorderedModules);

                await Promise.all(
                    reorderedModules.map((courseModule) =>
                        updateModule(Number(courseModule.id), {
                            name: courseModule.title,
                            order: courseModule.order,
                        }),
                    ),
                );
            }

            if (dragging.type === "lesson" && targetState.type === "lesson") {
                if (dragging.moduleId !== targetState.moduleId) {
                    resetDragState();
                    return;
                }

                const targetModule = modules.find(
                    (courseModule) => courseModule.id === dragging.moduleId,
                );

                if (!targetModule) return;

                const reorderedLessons = moveItem(
                    targetModule.lessons,
                    dragging.id,
                    targetState.id,
                ).map((lesson, index) => ({
                    ...lesson,
                    order: index + 1,
                }));

                const nextModules = modules.map((courseModule) =>
                    courseModule.id === targetModule.id
                        ? {
                            ...courseModule,
                            lessons: reorderedLessons,
                        }
                        : courseModule,
                );

                setModules(nextModules);

                await Promise.all(
                    reorderedLessons.map((lesson) =>
                        updateLesson(Number(lesson.id), {
                            name: lesson.title,
                            order: lesson.order,
                        }),
                    ),
                );
            }

            if (dragging.type === "item" && targetState.type === "item") {
                if (dragging.lessonId !== targetState.lessonId) {
                    resetDragState();
                    return;
                }

                const targetLesson = findLessonInModules(
                    modules,
                    dragging.lessonId,
                );

                if (!targetLesson) return;

                const reorderedItems = moveItem(
                    targetLesson.items,
                    dragging.id,
                    targetState.id,
                ).map((item, index) => ({
                    ...item,
                    order: index + 1,
                }));

                const nextModules = modules.map((courseModule) => ({
                    ...courseModule,
                    lessons: courseModule.lessons.map((lesson) =>
                        lesson.id === targetLesson.id
                            ? {
                                ...lesson,
                                items: reorderedItems,
                            }
                            : lesson,
                    ),
                }));

                setModules(nextModules);

                await Promise.all(
                    reorderedItems.map((item) =>
                        updateLessonBlock(
                            Number(item.id),
                            toLessonBlockPayload(
                                item.raw,
                                item.order,
                                item.type,
                            ) as LessonBlockPayload,
                        ),
                    ),
                );
            }
        } catch (error) {
            setActionError(getErrorMessage(error));
            void refreshModules(false);
        } finally {
            resetDragState();
        }
    }

    function isDraggingItem(targetState: DragState) {
        return (
            dragging?.type === targetState.type && dragging.id === targetState.id
        );
    }

    function isDragOverItem(targetState: DragState) {
        return (
            dragOver?.type === targetState.type && dragOver.id === targetState.id
        );
    }

    function openCreateModuleModal() {
        setCreateTitle("");
        setCreateError("");
        setActionError("");
        setCreateModal({
            type: "module",
        });
    }

    function openCreateLessonModal(moduleId: string) {
        setCreateTitle("");
        setCreateError("");
        setActionError("");
        setCreateModal({
            type: "lesson",
            moduleId,
        });
    }

    function openCreateItemModal(lessonId: string, itemType: LessonItemType) {
        setCreateTitle("");
        setCreateError("");
        setActionError("");
        setCreateModal({
            type: "item",
            lessonId,
            itemType,
        });
    }

    function closeCreateModal() {
        if (isSaving) return;

        setCreateModal(null);
        setCreateTitle("");
        setCreateError("");
    }

    function openEditModuleModal(courseModule: CourseModuleView) {
        setEditTitle(courseModule.title);
        setEditError("");
        setActionError("");
        setEditModal({
            type: "module",
            id: courseModule.id,
            title: courseModule.title,
            order: courseModule.order,
        });
    }

    function openEditLessonModal(lesson: LessonView) {
        setEditTitle(lesson.title);
        setEditError("");
        setActionError("");
        setEditModal({
            type: "lesson",
            id: lesson.id,
            title: lesson.title,
            order: lesson.order,
        });
    }

    function closeEditModal() {
        if (isSaving) return;

        setEditModal(null);
        setEditTitle("");
        setEditError("");
    }

    async function handleCreateSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!createModal) return;

        const title = createTitle.trim();

        if (!title) {
            setCreateError("Ingresa un nombre para continuar.");
            return;
        }

        if (!numericCourseId || numericCourseId <= 0) {
            setCreateError("Primero selecciona un curso.");
            return;
        }

        try {
            setIsSaving(true);
            setCreateError("");
            setActionError("");

            if (createModal.type === "module") {
                const createdModule = await createModule({
                    name: title,
                    order: modules.length + 1,
                    course_id: numericCourseId,
                });

                setOpenModules((current) => ({
                    ...current,
                    [createdModule.id]: true,
                }));
            }

            if (createModal.type === "lesson") {
                const parentModule = modules.find(
                    (courseModule) => courseModule.id === createModal.moduleId,
                );

                const createdLesson = await createLesson({
                    name: title,
                    order: (parentModule?.lessons.length ?? 0) + 1,
                    module_id: Number(createModal.moduleId),
                });

                setOpenModules((current) => ({
                    ...current,
                    [createModal.moduleId]: true,
                }));

                setOpenLessons((current) => ({
                    ...current,
                    [createdLesson.id]: true,
                }));
            }

            if (createModal.type === "item") {
                const parentLesson = findLessonInModules(
                    modules,
                    createModal.lessonId,
                );

                await createLessonBlock(
                    buildCreateLessonBlockPayload({
                        lessonId: createModal.lessonId,
                        type: createModal.itemType,
                        title,
                        order: (parentLesson?.items.length ?? 0) + 1,
                    }) as LessonBlockPayload,
                );

                setOpenLessons((current) => ({
                    ...current,
                    [createModal.lessonId]: true,
                }));
            }

            await refreshModules(false);
            closeCreateModal();
        } catch (error) {
            setCreateError(getErrorMessage(error));
        } finally {
            setIsSaving(false);
        }
    }

    async function handleEditSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!editModal) return;

        const title = editTitle.trim();

        if (!title) {
            setEditError("Ingresa un título válido.");
            return;
        }

        try {
            setIsSaving(true);
            setEditError("");
            setActionError("");

            if (editModal.type === "module") {
                await updateModule(Number(editModal.id), {
                    name: title,
                    order: editModal.order,
                });
            }

            if (editModal.type === "lesson") {
                await updateLesson(Number(editModal.id), {
                    name: title,
                    order: editModal.order,
                });
            }

            await refreshModules(false);
            closeEditModal();
        } catch (error) {
            setEditError(getErrorMessage(error));
        } finally {
            setIsSaving(false);
        }
    }

    function openDeleteModal(deleteState: DeleteModalState) {
        setActionError("");
        setDeleteModal(deleteState);
    }

    function closeDeleteModal() {
        if (isSaving) return;

        setDeleteModal(null);
    }

    async function handleConfirmDelete() {
        if (!deleteModal) return;

        try {
            setIsSaving(true);
            setActionError("");

            if (deleteModal.type === "module") {
                await deleteModule(Number(deleteModal.id));
            }

            if (deleteModal.type === "lesson") {
                await deleteLesson(Number(deleteModal.id));
            }

            if (deleteModal.type === "item") {
                await deleteLessonBlock(Number(deleteModal.id));
            }

            await refreshModules(false);
            closeDeleteModal();
        } catch (error) {
            setActionError(getErrorMessage(error));
        } finally {
            setIsSaving(false);
        }
    }

    if (isLoading) {
        return (
            <section className="space-y-6">
                <div className="flex min-h-[360px] flex-col items-center justify-center rounded-[28px] border border-slate-200 bg-white p-8 text-center shadow-sm">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-700" />
                    <p className="mt-4 text-sm font-bold text-slate-600">
                        {numericCourseId > 0
                            ? "Cargando módulos del curso..."
                            : "Cargando cursos disponibles..."}
                    </p>
                </div>
            </section>
        );
    }

    if (numericCourseId <= 0) {
        return (
            <section className="space-y-6">
                <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
                    <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-900 px-6 py-8 md:px-8">
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-100">
                            <Layers3 className="h-3.5 w-3.5" />
                            Gestión de módulos
                        </div>

                        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white md:text-4xl">
                            Selecciona un curso
                        </h1>

                        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300 md:text-base">
                            Primero selecciona el curso para cargar sus módulos,
                            lecciones y contenido.
                        </p>
                    </div>

                    <div className="p-6 md:p-8">
                        {errorMessage ? (
                            <div className="mb-4 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                                <span>{errorMessage}</span>
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
                                    No hay cursos registrados.
                                </p>
                            ) : (
                                <p className="mt-3 text-sm font-semibold text-slate-500">
                                    Al seleccionar un curso se cargará su
                                    estructura académica.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="space-y-6">
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
                            className="h-10 min-w-[260px] rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
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

                    <button
                        type="button"
                        onClick={openCreateModuleModal}
                        className="inline-flex w-fit items-center gap-2 rounded-2xl bg-blue-700 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={isLoading || numericCourseId <= 0}
                    >
                        <Plus className="h-4 w-4" />
                        Agregar módulo
                    </button>
                </div>
            </div>

            {errorMessage ? (
                <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                    <span>{errorMessage}</span>
                </div>
            ) : null}

            {actionError ? (
                <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                    <span>{actionError}</span>
                </div>
            ) : null}

            <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
                <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-900 px-6 py-8 md:px-8">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-100">
                                <Layers3 className="h-3.5 w-3.5" />
                                Estructura MOOC
                            </div>

                            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white md:text-4xl">
                                Módulos del curso
                            </h1>

                            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300 md:text-base">
                                Curso seleccionado:{" "}
                                <span className="font-bold text-white">
                                    {selectedCourseName}
                                </span>
                                . Organiza el curso por módulos, lecciones y
                                bloques de aprendizaje.
                            </p>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-white/10 px-5 py-4 text-white backdrop-blur-sm">
                            <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-100">
                                Total módulos
                            </p>

                            <p className="mt-2 text-3xl font-black">
                                {modules.length}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-6 md:p-8">
                    {modules.length === 0 ? (
                        <div className="rounded-[28px] border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                                <Layers3 className="h-6 w-6" />
                            </div>

                            <h3 className="mt-4 text-lg font-black text-slate-950">
                                Este curso todavía no tiene módulos
                            </h3>

                            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
                                Agrega el primer módulo para empezar a construir
                                la estructura del curso.
                            </p>

                            <button
                                type="button"
                                onClick={openCreateModuleModal}
                                className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-blue-700 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-800"
                            >
                                <Plus className="h-4 w-4" />
                                Crear módulo
                            </button>
                        </div>
                    ) : (
                        <div className="relative space-y-5 pl-5">
                            <div className="absolute bottom-0 left-0 top-0 w-1 rounded-full bg-slate-200" />

                            {modules.map((courseModule, moduleIndex) => {
                                const moduleOpen =
                                    openModules[courseModule.id] ?? true;

                                const moduleDragState: DragState = {
                                    type: "module",
                                    id: courseModule.id,
                                };

                                const moduleIsDragging =
                                    isDraggingItem(moduleDragState);

                                const moduleIsOver =
                                    isDragOverItem(moduleDragState);

                                return (
                                    <div
                                        key={courseModule.id}
                                        className={`relative transition ${moduleIsDragging ? "opacity-50" : ""
                                            }`}
                                        onDragOver={(event) =>
                                            handleDragOver(
                                                event,
                                                moduleDragState,
                                            )
                                        }
                                        onDrop={(event) =>
                                            handleDrop(event, moduleDragState)
                                        }
                                    >
                                        <div className="absolute -left-[26px] top-7 h-4 w-4 rounded-full border-4 border-blue-700 bg-white" />

                                        <div
                                            draggable
                                            onDragStart={(event) =>
                                                handleDragStart(
                                                    event,
                                                    moduleDragState,
                                                )
                                            }
                                            onDragEnd={resetDragState}
                                            className={`cursor-grab rounded-[26px] border bg-slate-50 p-4 shadow-sm transition active:cursor-grabbing ${moduleIsOver
                                                ? "border-blue-500 ring-4 ring-blue-100"
                                                : "border-slate-200"
                                                }`}
                                        >
                                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                                <div className="flex min-w-0 items-center gap-3">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setOpenModules(
                                                                (current) => ({
                                                                    ...current,
                                                                    [courseModule.id]:
                                                                        !moduleOpen,
                                                                }),
                                                            )
                                                        }
                                                        className="flex min-w-0 items-center gap-3 text-left"
                                                    >
                                                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-700 text-white">
                                                            <Layers3 className="h-5 w-5" />
                                                        </span>

                                                        <span className="min-w-0">
                                                            <span className="block text-xs font-bold uppercase tracking-[0.14em] text-blue-700">
                                                                Módulo{" "}
                                                                {moduleIndex + 1}
                                                            </span>

                                                            <span className="block truncate text-lg font-black text-slate-950">
                                                                {
                                                                    courseModule.title
                                                                }
                                                            </span>
                                                        </span>

                                                        <ChevronDown
                                                            className={`h-5 w-5 text-slate-500 transition ${moduleOpen
                                                                ? ""
                                                                : "-rotate-90"
                                                                }`}
                                                        />
                                                    </button>
                                                </div>

                                                <div className="flex flex-wrap gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            openCreateLessonModal(
                                                                courseModule.id,
                                                            )
                                                        }
                                                        className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-white px-4 text-sm font-bold text-blue-700 ring-1 ring-blue-100 transition hover:bg-blue-50"
                                                    >
                                                        <Plus className="h-4 w-4" />
                                                        Lección
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            openEditModuleModal(
                                                                courseModule,
                                                            )
                                                        }
                                                        className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-white px-4 text-sm font-bold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                        Editar
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            openDeleteModal({
                                                                type: "module",
                                                                id: courseModule.id,
                                                                title: courseModule.title,
                                                            })
                                                        }
                                                        className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-white px-4 text-sm font-bold text-red-700 ring-1 ring-red-100 transition hover:bg-red-50"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                        Eliminar
                                                    </button>
                                                </div>
                                            </div>

                                            {moduleOpen ? (
                                                <div className="mt-5 space-y-4 border-l-2 border-slate-200 pl-5">
                                                    {courseModule.lessons
                                                        .length === 0 ? (
                                                        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-5 text-sm text-slate-500">
                                                            Este módulo todavía
                                                            no tiene lecciones.
                                                        </div>
                                                    ) : (
                                                        courseModule.lessons.map(
                                                            (
                                                                lesson,
                                                                lessonIndex,
                                                            ) => {
                                                                const lessonOpen =
                                                                    openLessons[
                                                                    lesson
                                                                        .id
                                                                    ] ?? true;

                                                                const lessonDragState: DragState =
                                                                {
                                                                    type: "lesson",
                                                                    id: lesson.id,
                                                                    moduleId:
                                                                        courseModule.id,
                                                                };

                                                                const lessonIsDragging =
                                                                    isDraggingItem(
                                                                        lessonDragState,
                                                                    );

                                                                const lessonIsOver =
                                                                    isDragOverItem(
                                                                        lessonDragState,
                                                                    );

                                                                return (
                                                                    <div
                                                                        key={
                                                                            lesson.id
                                                                        }
                                                                        draggable
                                                                        className={`cursor-grab rounded-2xl border bg-white p-4 transition active:cursor-grabbing ${lessonIsDragging
                                                                            ? "opacity-50"
                                                                            : ""
                                                                            } ${lessonIsOver
                                                                                ? "border-blue-500 ring-4 ring-blue-100"
                                                                                : "border-slate-200"
                                                                            }`}
                                                                        onDragStart={(
                                                                            event,
                                                                        ) =>
                                                                            handleDragStart(
                                                                                event,
                                                                                lessonDragState,
                                                                            )
                                                                        }
                                                                        onDragEnd={
                                                                            resetDragState
                                                                        }
                                                                        onDragOver={(
                                                                            event,
                                                                        ) =>
                                                                            handleDragOver(
                                                                                event,
                                                                                lessonDragState,
                                                                            )
                                                                        }
                                                                        onDrop={(
                                                                            event,
                                                                        ) =>
                                                                            handleDrop(
                                                                                event,
                                                                                lessonDragState,
                                                                            )
                                                                        }
                                                                    >
                                                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                                                            <div className="flex min-w-0 items-center gap-3">
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() =>
                                                                                        setOpenLessons(
                                                                                            (
                                                                                                current,
                                                                                            ) => ({
                                                                                                ...current,
                                                                                                [lesson.id]:
                                                                                                    !lessonOpen,
                                                                                            }),
                                                                                        )
                                                                                    }
                                                                                    className="flex min-w-0 items-center gap-3 text-left"
                                                                                >
                                                                                    <span className="min-w-0">
                                                                                        <span className="block text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                                                                                            Lección{" "}
                                                                                            {lessonIndex +
                                                                                                1}
                                                                                        </span>

                                                                                        <span className="block truncate text-base font-black text-slate-950">
                                                                                            {
                                                                                                lesson.title
                                                                                            }
                                                                                        </span>
                                                                                    </span>

                                                                                    <ChevronDown
                                                                                        className={`h-5 w-5 text-slate-500 transition ${lessonOpen
                                                                                            ? ""
                                                                                            : "-rotate-90"
                                                                                            }`}
                                                                                    />
                                                                                </button>
                                                                            </div>

                                                                            <div className="flex flex-wrap gap-2">
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() =>
                                                                                        openCreateItemModal(
                                                                                            lesson.id,
                                                                                            "text",
                                                                                        )
                                                                                    }
                                                                                    className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-slate-100 px-3 text-xs font-black text-slate-700 transition hover:bg-slate-200"
                                                                                >
                                                                                    <FileText className="h-4 w-4" />
                                                                                    Texto
                                                                                </button>

                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() =>
                                                                                        openCreateItemModal(
                                                                                            lesson.id,
                                                                                            "image",
                                                                                        )
                                                                                    }
                                                                                    className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-emerald-50 px-3 text-xs font-black text-emerald-700 transition hover:bg-emerald-100"
                                                                                >
                                                                                    <ImageIcon className="h-4 w-4" />
                                                                                    Imagen
                                                                                </button>

                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() =>
                                                                                        openCreateItemModal(
                                                                                            lesson.id,
                                                                                            "pdf",
                                                                                        )
                                                                                    }
                                                                                    className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-red-50 px-3 text-xs font-black text-red-700 transition hover:bg-red-100"
                                                                                >
                                                                                    <FileText className="h-4 w-4" />
                                                                                    PDF
                                                                                </button>

                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() =>
                                                                                        openCreateItemModal(
                                                                                            lesson.id,
                                                                                            "video",
                                                                                        )
                                                                                    }
                                                                                    className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-blue-50 px-3 text-xs font-black text-blue-700 transition hover:bg-blue-100"
                                                                                >
                                                                                    <PlayCircle className="h-4 w-4" />
                                                                                    Video
                                                                                </button>

                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() =>
                                                                                        openCreateItemModal(
                                                                                            lesson.id,
                                                                                            "quiz",
                                                                                        )
                                                                                    }
                                                                                    className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-amber-50 px-3 text-xs font-black text-amber-700 transition hover:bg-amber-100"
                                                                                >
                                                                                    <ClipboardList className="h-4 w-4" />
                                                                                    Prueba
                                                                                </button>

                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() =>
                                                                                        openEditLessonModal(
                                                                                            lesson,
                                                                                        )
                                                                                    }
                                                                                    className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-slate-50 px-3 text-xs font-black text-slate-700 transition hover:bg-slate-100"
                                                                                >
                                                                                    <Pencil className="h-4 w-4" />
                                                                                    Editar
                                                                                </button>

                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() =>
                                                                                        openDeleteModal(
                                                                                            {
                                                                                                type: "lesson",
                                                                                                id: lesson.id,
                                                                                                title: lesson.title,
                                                                                            },
                                                                                        )
                                                                                    }
                                                                                    className="inline-flex h-9 items-center justify-center rounded-xl bg-red-50 px-3 text-xs font-black text-red-700 transition hover:bg-red-100"
                                                                                >
                                                                                    <Trash2 className="h-4 w-4" />
                                                                                </button>
                                                                            </div>
                                                                        </div>

                                                                        {lessonOpen ? (
                                                                            <div className="mt-4 space-y-3">
                                                                                {lesson
                                                                                    .items
                                                                                    .length ===
                                                                                    0 ? (
                                                                                    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-500">
                                                                                        Esta
                                                                                        lección
                                                                                        todavía
                                                                                        no
                                                                                        tiene
                                                                                        contenido.
                                                                                    </div>
                                                                                ) : (
                                                                                    lesson.items.map(
                                                                                        (
                                                                                            item,
                                                                                        ) => {
                                                                                            const itemDragState: DragState =
                                                                                            {
                                                                                                type: "item",
                                                                                                id: item.id,
                                                                                                lessonId:
                                                                                                    lesson.id,
                                                                                            };

                                                                                            const itemIsDragging =
                                                                                                isDraggingItem(
                                                                                                    itemDragState,
                                                                                                );

                                                                                            const itemIsOver =
                                                                                                isDragOverItem(
                                                                                                    itemDragState,
                                                                                                );

                                                                                            return (
                                                                                                <div
                                                                                                    key={
                                                                                                        item.id
                                                                                                    }
                                                                                                    draggable
                                                                                                    className={`flex cursor-grab items-center justify-between gap-3 rounded-xl border bg-slate-50 px-4 py-3 transition active:cursor-grabbing ${itemIsDragging
                                                                                                        ? "opacity-50"
                                                                                                        : ""
                                                                                                        } ${itemIsOver
                                                                                                            ? "border-blue-500 ring-4 ring-blue-100"
                                                                                                            : "border-slate-200"
                                                                                                        }`}
                                                                                                    onDragStart={(
                                                                                                        event,
                                                                                                    ) =>
                                                                                                        handleDragStart(
                                                                                                            event,
                                                                                                            itemDragState,
                                                                                                        )
                                                                                                    }
                                                                                                    onDragEnd={
                                                                                                        resetDragState
                                                                                                    }
                                                                                                    onDragOver={(
                                                                                                        event,
                                                                                                    ) =>
                                                                                                        handleDragOver(
                                                                                                            event,
                                                                                                            itemDragState,
                                                                                                        )
                                                                                                    }
                                                                                                    onDrop={(
                                                                                                        event,
                                                                                                    ) =>
                                                                                                        handleDrop(
                                                                                                            event,
                                                                                                            itemDragState,
                                                                                                        )
                                                                                                    }
                                                                                                >
                                                                                                    <div className="flex min-w-0 items-center gap-3">
                                                                                                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-blue-700 shadow-sm">
                                                                                                            {renderItemIcon(
                                                                                                                item.type,
                                                                                                                "h-4 w-4",
                                                                                                            )}
                                                                                                        </span>

                                                                                                        <div className="min-w-0">
                                                                                                            <Link
                                                                                                                href={`${itemEditorBasePath}/${item.id}`}
                                                                                                                className="block truncate text-sm font-black text-slate-950 transition hover:text-blue-700 hover:underline"
                                                                                                            >
                                                                                                                {
                                                                                                                    item.title
                                                                                                                }
                                                                                                            </Link>

                                                                                                            <p className="text-xs font-bold text-slate-500">
                                                                                                                {getItemLabel(
                                                                                                                    item.type,
                                                                                                                )}
                                                                                                            </p>
                                                                                                        </div>
                                                                                                    </div>

                                                                                                    <button
                                                                                                        type="button"
                                                                                                        onClick={() =>
                                                                                                            openDeleteModal(
                                                                                                                {
                                                                                                                    type: "item",
                                                                                                                    id: item.id,
                                                                                                                    title: item.title,
                                                                                                                },
                                                                                                            )
                                                                                                        }
                                                                                                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-700 transition hover:bg-red-100"
                                                                                                    >
                                                                                                        <Trash2 className="h-4 w-4" />
                                                                                                    </button>
                                                                                                </div>
                                                                                            );
                                                                                        },
                                                                                    )
                                                                                )}
                                                                            </div>
                                                                        ) : null}
                                                                    </div>
                                                                );
                                                            },
                                                        )
                                                    )}
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {createModal ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
                    <div className="w-full max-w-lg overflow-hidden rounded-[28px] bg-white shadow-2xl">
                        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
                            <div>
                                <h2 className="text-xl font-black text-slate-950">
                                    {getCreateModalTitle(createModal)}
                                </h2>

                                <p className="mt-1 text-sm leading-6 text-slate-500">
                                    {getCreateModalDescription(createModal)}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={closeCreateModal}
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
                                disabled={isSaving}
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form
                            onSubmit={handleCreateSubmit}
                            className="space-y-5 p-6"
                        >
                            {createError ? (
                                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                                    {createError}
                                </div>
                            ) : null}

                            <div className="space-y-2">
                                <label className="block text-[13px] font-bold text-slate-700">
                                    Nombre
                                </label>

                                <input
                                    value={createTitle}
                                    onChange={(event) => {
                                        setCreateTitle(event.target.value);
                                        setCreateError("");
                                    }}
                                    placeholder={
                                        createModal.type === "module"
                                            ? "Ej: Unidad I. Presentación"
                                            : createModal.type === "lesson"
                                                ? "Ej: Lección 1"
                                                : `Ej: ${getItemLabel(
                                                    createModal.itemType,
                                                )} introductorio`
                                    }
                                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                    disabled={isSaving}
                                />
                            </div>

                            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={closeCreateModal}
                                    className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                                    disabled={isSaving}
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="submit"
                                    className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-blue-700 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                                    disabled={isSaving}
                                >
                                    {isSaving ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Save className="h-4 w-4" />
                                    )}
                                    Guardar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}

            {editModal ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
                    <div className="w-full max-w-lg overflow-hidden rounded-[28px] bg-white shadow-2xl">
                        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
                            <div>
                                <h2 className="text-xl font-black text-slate-950">
                                    {editModal.type === "module"
                                        ? "Editar módulo"
                                        : "Editar lección"}
                                </h2>

                                <p className="mt-1 text-sm leading-6 text-slate-500">
                                    Actualiza el título principal.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={closeEditModal}
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
                                disabled={isSaving}
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form
                            onSubmit={handleEditSubmit}
                            className="space-y-5 p-6"
                        >
                            {editError ? (
                                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                                    {editError}
                                </div>
                            ) : null}

                            <div className="space-y-2">
                                <label className="block text-[13px] font-bold text-slate-700">
                                    Título
                                </label>

                                <input
                                    value={editTitle}
                                    onChange={(event) => {
                                        setEditTitle(event.target.value);
                                        setEditError("");
                                    }}
                                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                    disabled={isSaving}
                                />
                            </div>

                            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={closeEditModal}
                                    className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                                    disabled={isSaving}
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="submit"
                                    className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-blue-700 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                                    disabled={isSaving}
                                >
                                    {isSaving ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Save className="h-4 w-4" />
                                    )}
                                    Guardar cambios
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}

            {deleteModal ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
                    <div className="w-full max-w-md overflow-hidden rounded-[28px] bg-white shadow-2xl">
                        <div className="border-b border-slate-200 px-6 py-5">
                            <h2 className="text-xl font-black text-slate-950">
                                Confirmar eliminación
                            </h2>

                            <p className="mt-2 text-sm leading-6 text-slate-500">
                                Se eliminará{" "}
                                <span className="font-bold text-slate-800">
                                    {deleteModal.title}
                                </span>
                                . Esta acción no se puede deshacer.
                            </p>
                        </div>

                        <div className="flex flex-col-reverse gap-3 p-6 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                onClick={closeDeleteModal}
                                className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                                disabled={isSaving}
                            >
                                Cancelar
                            </button>

                            <button
                                type="button"
                                onClick={handleConfirmDelete}
                                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                                disabled={isSaving}
                            >
                                {isSaving ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Trash2 className="h-4 w-4" />
                                )}
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </section>
    );
}

export default TeacherCourseModulesPage;