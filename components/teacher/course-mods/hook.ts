"use client";

import { useRouter, usePathname } from "next/navigation";
import type { DragEvent, FormEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import type {
    BlockFormState,
    CourseModuleView,
    CreateModalState,
    DeleteModalState,
    DragState,
    EditModalState,
    LessonItemType,
    LessonItemView,
    LessonView,
    TeacherCourseModulesPageProps,
} from "./types";
import {
    buildBlockFormState,
    buildLessonBlockPayload,
    findLessonInModules,
    getCourseIdFromPathname,
    getErrorMessage,
    isInteractiveDragTarget,
    mapLessonBlockToView,
    moveItem,
    sortByOrder,
    toLessonBlockPayload,
    toSafeNumber,
} from "./utils";

type AnyRecord = Record<string, unknown>;

function toRecord(value: unknown): AnyRecord | null {
    if (!value || typeof value !== "object") return null;

    return value as AnyRecord;
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

function shouldShowInCourseModules(block: unknown) {
    const record = toRecord(block);

    if (!record) return true;

    const content = getContentRecord(record.content);

    const isDefault = readBoolean(
        record.default ??
        record.is_default ??
        record.isDefault ??
        content.default ??
        content.is_default ??
        content.isDefault,
        false,
    );

    const isRequired = readBoolean(
        record.is_required ??
        record.required ??
        record.isRequired ??
        content.is_required ??
        content.required ??
        content.isRequired,
        false,
    );

    /*
        Esta vista debe mostrar los bloques normales activos e inactivos.

        Se muestran:
        default = true
        is_required = false

        Se mantienen ocultos únicamente los bloques especiales MDT:
        default = false
        o is_required = true

        is_active solo se usa para mostrar la etiqueta:
        ACTIVO o INACTIVO.
    */
    return isDefault && !isRequired;
}

export function useCourseMods({
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
    const [editModal, setEditModal] = useState<EditModalState | null>(null);
    const [deleteModal, setDeleteModal] = useState<DeleteModalState | null>(
        null,
    );

    const [formTitle, setFormTitle] = useState("");
    const [formOrder, setFormOrder] = useState("1");
    const [formError, setFormError] = useState("");
    const [blockForm, setBlockForm] = useState<BlockFormState>(
        buildBlockFormState({
            type: "text",
            title: "",
            order: 1,
        }),
    );

    const [dragging, setDragging] = useState<DragState | null>(null);
    const [dragOver, setDragOver] = useState<DragState | null>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [actionError, setActionError] = useState("");

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

    const itemEditorBasePath = isAdminRoute
        ? `/admin/modules/${numericCourseId}/items`
        : `/teacher/courses/${numericCourseId}/modules/items`;

    const backHref = isAdminRoute
        ? "/admin"
        : `/teacher/courses/${numericCourseId}`;

    const backLabel = isAdminRoute ? "Volver al panel" : "Volver al curso";

    const refreshModules = useCallback(
        async (showLoading = false) => {
            try {
                if (showLoading) setIsLoading(true);

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

                const safeModules = Array.isArray(courseModulesResponse)
                    ? courseModulesResponse
                    : [];

                const modulesWithLessons = await Promise.all(
                    sortByOrder<ApiCourseModule>(safeModules).map(
                        async (courseModule: ApiCourseModule) => {
                            const lessonsResponse = await getLessonsByModule(
                                courseModule.id,
                            );

                            const safeLessons = Array.isArray(lessonsResponse)
                                ? lessonsResponse
                                : [];

                            const lessonsWithBlocks = await Promise.all(
                                sortByOrder<ApiLesson>(safeLessons).map(
                                    async (lesson: ApiLesson) => {
                                        const blocksResponse =
                                            await getLessonBlocksByLesson(
                                                lesson.id,
                                            );

                                        const safeBlocks = Array.isArray(
                                            blocksResponse,
                                        )
                                            ? blocksResponse
                                            : [];

                                        const visibleBlocks =
                                            sortByOrder<LessonBlock>(
                                                safeBlocks,
                                            ).filter(shouldShowInCourseModules);

                                        return {
                                            id: String(lesson.id),
                                            title: lesson.name,
                                            order: lesson.order,
                                            moduleId: String(lesson.module_id),
                                            raw: lesson,
                                            items: visibleBlocks.map(
                                                mapLessonBlockToView,
                                            ),
                                        };
                                    },
                                ),
                            );

                            return {
                                id: String(courseModule.id),
                                title: courseModule.name,
                                order: courseModule.order,
                                raw: courseModule,
                                lessons: lessonsWithBlocks,
                            };
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

        if (dragging.id === targetState.id || dragging.type !== targetState.type) {
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
                ).map((courseModule: CourseModuleView, index: number) => ({
                    ...courseModule,
                    order: index + 1,
                }));

                setModules(reorderedModules);

                await Promise.all(
                    reorderedModules.map((courseModule: CourseModuleView) =>
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
                    (courseModule: CourseModuleView) =>
                        courseModule.id === dragging.moduleId,
                );

                if (!targetModule) return;

                const reorderedLessons = moveItem(
                    targetModule.lessons,
                    dragging.id,
                    targetState.id,
                ).map((lesson: LessonView, index: number) => ({
                    ...lesson,
                    order: index + 1,
                }));

                setModules((currentModules: CourseModuleView[]) =>
                    currentModules.map((courseModule: CourseModuleView) =>
                        courseModule.id === targetModule.id
                            ? {
                                ...courseModule,
                                lessons: reorderedLessons,
                            }
                            : courseModule,
                    ),
                );

                await Promise.all(
                    reorderedLessons.map((lesson: LessonView) =>
                        updateLesson(Number(lesson.id), {
                            name: lesson.title,
                            order: lesson.order,
                            module_id: Number(lesson.moduleId),
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
                ).map((item: LessonItemView, index: number) => ({
                    ...item,
                    order: index + 1,
                }));

                setModules((currentModules: CourseModuleView[]) =>
                    currentModules.map((courseModule: CourseModuleView) => ({
                        ...courseModule,
                        lessons: courseModule.lessons.map(
                            (lesson: LessonView) =>
                                lesson.id === targetLesson.id
                                    ? {
                                        ...lesson,
                                        items: reorderedItems,
                                    }
                                    : lesson,
                        ),
                    })),
                );

                await Promise.all(
                    reorderedItems.map((item: LessonItemView) =>
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
        setFormTitle("");
        setFormOrder(String(modules.length + 1));
        setFormError("");
        setActionError("");
        setCreateModal({ type: "module" });
    }

    function openCreateLessonModal(moduleId: string) {
        const parentModule = modules.find(
            (courseModule: CourseModuleView) => courseModule.id === moduleId,
        );

        setFormTitle("");
        setFormOrder(String((parentModule?.lessons.length ?? 0) + 1));
        setFormError("");
        setActionError("");
        setCreateModal({ type: "lesson", moduleId });
    }

    function openCreateItemModal(lessonId: string, itemType: LessonItemType) {
        const parentLesson = findLessonInModules(modules, lessonId);
        const order = (parentLesson?.items.length ?? 0) + 1;

        setFormTitle("");
        setFormOrder(String(order));
        setBlockForm(
            buildBlockFormState({
                type: itemType,
                title: "",
                order,
            }),
        );
        setFormError("");
        setActionError("");
        setCreateModal({
            type: "item",
            lessonId,
            itemType,
        });
    }

    function openEditModuleModal(courseModule: CourseModuleView) {
        setFormTitle(courseModule.title);
        setFormOrder(String(courseModule.order));
        setFormError("");
        setActionError("");
        setEditModal({
            type: "module",
            id: courseModule.id,
        });
    }

    function openEditLessonModal(lesson: LessonView) {
        setFormTitle(lesson.title);
        setFormOrder(String(lesson.order));
        setFormError("");
        setActionError("");
        setEditModal({
            type: "lesson",
            id: lesson.id,
            moduleId: lesson.moduleId,
        });
    }

    function openEditItemModal(item: LessonItemView) {
        setFormTitle(item.title);
        setFormOrder(String(item.order));
        setBlockForm(
            buildBlockFormState({
                type: item.type,
                title: item.title,
                order: item.order,
                block: item.raw,
            }),
        );
        setFormError("");
        setActionError("");
        setEditModal({
            type: "item",
            id: item.id,
            lessonId: item.lessonId,
            itemType: item.type,
            raw: item.raw,
        });
    }

    function closeCreateModal(force = false) {
        if (isSaving && !force) return;

        setCreateModal(null);
        setFormTitle("");
        setFormError("");
    }

    function closeEditModal(force = false) {
        if (isSaving && !force) return;

        setEditModal(null);
        setFormTitle("");
        setFormError("");
    }

    async function handleCreateSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!createModal) return;

        const title = formTitle.trim();

        if (!title) {
            setFormError("Ingresa un nombre para continuar.");
            return;
        }

        if (!numericCourseId || numericCourseId <= 0) {
            setFormError("Primero selecciona un curso.");
            return;
        }

        try {
            setIsSaving(true);
            setFormError("");
            setActionError("");

            if (createModal.type === "module") {
                const createdModule = await createModule({
                    name: title,
                    order: toSafeNumber(formOrder, modules.length + 1),
                    course_id: numericCourseId,
                });

                setOpenModules((current) => ({
                    ...current,
                    [createdModule.id]: true,
                }));
            }

            if (createModal.type === "lesson") {
                const parentModule = modules.find(
                    (courseModule: CourseModuleView) =>
                        courseModule.id === createModal.moduleId,
                );

                const createdLesson = await createLesson({
                    name: title,
                    order: toSafeNumber(
                        formOrder,
                        (parentModule?.lessons.length ?? 0) + 1,
                    ),
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
                await createLessonBlock(
                    buildLessonBlockPayload({
                        lessonId: createModal.lessonId,
                        type: createModal.itemType,
                        title,
                        form: {
                            ...blockForm,
                            order: formOrder,
                        },
                    }) as LessonBlockPayload,
                );

                setOpenLessons((current) => ({
                    ...current,
                    [createModal.lessonId]: true,
                }));
            }

            await refreshModules(false);
            closeCreateModal(true);
        } catch (error) {
            setFormError(getErrorMessage(error));
        } finally {
            setIsSaving(false);
        }
    }

    async function handleEditSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!editModal) return;

        const title = formTitle.trim();

        if (!title) {
            setFormError("Ingresa un título válido.");
            return;
        }

        try {
            setIsSaving(true);
            setFormError("");
            setActionError("");

            if (editModal.type === "module") {
                await updateModule(Number(editModal.id), {
                    name: title,
                    order: toSafeNumber(formOrder, 1),
                });
            }

            if (editModal.type === "lesson") {
                await updateLesson(Number(editModal.id), {
                    name: title,
                    order: toSafeNumber(formOrder, 1),
                    module_id: Number(editModal.moduleId),
                });
            }

            if (editModal.type === "item") {
                await updateLessonBlock(
                    Number(editModal.id),
                    buildLessonBlockPayload({
                        lessonId: editModal.lessonId,
                        type: editModal.itemType,
                        title,
                        form: {
                            ...blockForm,
                            order: formOrder,
                        },
                    }) as LessonBlockPayload,
                );
            }

            await refreshModules(false);
            closeEditModal(true);
        } catch (error) {
            setFormError(getErrorMessage(error));
        } finally {
            setIsSaving(false);
        }
    }

    function openDeleteModal(deleteState: DeleteModalState) {
        setActionError("");
        setDeleteModal(deleteState);
    }

    function closeDeleteModal(force = false) {
        if (isSaving && !force) return;

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
            closeDeleteModal(true);
        } catch (error) {
            setActionError(getErrorMessage(error));
        } finally {
            setIsSaving(false);
        }
    }

    return {
        routeCourseId,
        isAdminRoute,
        selectedCourseId,
        numericCourseId,
        courses,
        courseOptions,
        selectedCourseName,
        modules,
        openModules,
        openLessons,

        createModal,
        editModal,
        deleteModal,

        formTitle,
        formOrder,
        formError,
        blockForm,

        dragging,
        dragOver,

        isLoading,
        isSaving,
        errorMessage,
        actionError,

        itemEditorBasePath,
        backHref,
        backLabel,

        setOpenModules,
        setOpenLessons,
        setFormTitle,
        setFormOrder,
        setFormError,
        setBlockForm,

        refreshModules,
        handleSelectCourse,
        resetDragState,
        handleDragStart,
        handleDragOver,
        handleDrop,
        isDraggingItem,
        isDragOverItem,

        openCreateModuleModal,
        openCreateLessonModal,
        openCreateItemModal,
        openEditModuleModal,
        openEditLessonModal,
        openEditItemModal,
        closeCreateModal,
        closeEditModal,
        handleCreateSubmit,
        handleEditSubmit,

        openDeleteModal,
        closeDeleteModal,
        handleConfirmDelete,
    };
}

export type CourseModsState = ReturnType<typeof useCourseMods>;