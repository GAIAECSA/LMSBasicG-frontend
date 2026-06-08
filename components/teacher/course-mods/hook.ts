"use client";

import { useRouter, usePathname } from "next/navigation";
import type { DragEvent, FormEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { notify } from "@/lib/notify";
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

/*
 * En la pantalla de módulos se muestran todos los bloques normales,
 * tanto activos como inactivos.
 *
 * El campo default no controla la visualización porque los bloques
 * normales también se guardan con default = false.
 *
 * Únicamente se ocultan los archivos obligatorios MDT.
 */
function shouldShowInCourseModules(block: unknown) {
    const record = toRecord(block);

    if (!record) return true;

    const content = getContentRecord(record.content);

    const isRequired = readBoolean(
        record.is_required ??
        record.required ??
        record.isRequired ??
        content.is_required ??
        content.required ??
        content.isRequired,
        false,
    );

    return !isRequired;
}

function getResourceLabel(
    type: "module" | "lesson" | "item",
) {
    if (type === "module") {
        return "módulo";
    }

    if (type === "lesson") {
        return "lección";
    }

    return "actividad";
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
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [actionError, setActionError] = useState("");

    const refreshInProgressRef = useRef(false);
    const saveInProgressRef = useRef(false);
    const reorderInProgressRef = useRef(false);

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
        async (
            showLoading = false,
            showToast = false,
        ) => {
            if (
                showToast &&
                refreshInProgressRef.current
            ) {
                return;
            }

            let toastId:
                | ReturnType<typeof notify.loading>
                | null = null;

            if (showToast) {
                refreshInProgressRef.current =
                    true;

                setIsRefreshing(
                    true,
                );

                toastId =
                    notify.loading(
                        "Actualizando contenido...",
                        "Estamos consultando los módulos, lecciones y actividades del curso.",
                    );
            }

            try {
                if (showLoading) {
                    setIsLoading(
                        true,
                    );
                }

                setErrorMessage(
                    "",
                );

                setActionError(
                    "",
                );

                const coursesData =
                    await getAllCourses();

                setCourses(
                    Array.isArray(
                        coursesData,
                    )
                        ? coursesData
                        : [],
                );

                if (
                    !Number.isFinite(
                        numericCourseId,
                    ) ||
                    numericCourseId <= 0
                ) {
                    setModules(
                        [],
                    );

                    if (
                        toastId !==
                        null
                    ) {
                        notify.dismiss(
                            toastId,
                        );

                        notify.success(
                            "Cursos actualizados.",
                            "La lista de cursos disponibles se encuentra al día.",
                        );
                    }

                    return;
                }

                const courseModulesResponse =
                    await getModulesByCourse(
                        numericCourseId,
                    );

                const safeModules =
                    Array.isArray(
                        courseModulesResponse,
                    )
                        ? courseModulesResponse
                        : [];

                const modulesWithLessons =
                    await Promise.all(
                        sortByOrder<ApiCourseModule>(
                            safeModules,
                        ).map(
                            async (
                                courseModule:
                                    ApiCourseModule,
                            ) => {
                                const lessonsResponse =
                                    await getLessonsByModule(
                                        courseModule.id,
                                    );

                                const safeLessons =
                                    Array.isArray(
                                        lessonsResponse,
                                    )
                                        ? lessonsResponse
                                        : [];

                                const lessonsWithBlocks =
                                    await Promise.all(
                                        sortByOrder<ApiLesson>(
                                            safeLessons,
                                        ).map(
                                            async (
                                                lesson:
                                                    ApiLesson,
                                            ) => {
                                                const blocksResponse =
                                                    await getLessonBlocksByLesson(
                                                        lesson.id,
                                                    );

                                                const safeBlocks =
                                                    Array.isArray(
                                                        blocksResponse,
                                                    )
                                                        ? blocksResponse
                                                        : [];

                                                const visibleBlocks =
                                                    sortByOrder<LessonBlock>(
                                                        safeBlocks,
                                                    ).filter(
                                                        shouldShowInCourseModules,
                                                    );

                                                return {
                                                    id: String(
                                                        lesson.id,
                                                    ),
                                                    title:
                                                        lesson.name,
                                                    order:
                                                        lesson.order,
                                                    moduleId:
                                                        String(
                                                            lesson.module_id,
                                                        ),
                                                    raw: lesson,
                                                    items:
                                                        visibleBlocks.map(
                                                            mapLessonBlockToView,
                                                        ),
                                                };
                                            },
                                        ),
                                    );

                                return {
                                    id: String(
                                        courseModule.id,
                                    ),
                                    title:
                                        courseModule.name,
                                    order:
                                        courseModule.order,
                                    raw:
                                        courseModule,
                                    lessons:
                                        lessonsWithBlocks,
                                };
                            },
                        ),
                    );

                setModules(
                    modulesWithLessons,
                );

                if (
                    toastId !== null
                ) {
                    notify.dismiss(
                        toastId,
                    );

                    notify.success(
                        "Contenido actualizado.",
                        "Los módulos, lecciones y actividades se encuentran al día.",
                    );
                }
            } catch (error) {
                const message =
                    getErrorMessage(
                        error,
                    );

                setErrorMessage(
                    message,
                );

                setModules(
                    [],
                );

                if (
                    toastId !== null
                ) {
                    notify.dismiss(
                        toastId,
                    );

                    notify.error(
                        "No se pudo actualizar el contenido.",
                        message,
                    );
                }
            } finally {
                setIsLoading(
                    false,
                );

                setIsRefreshing(
                    false,
                );

                refreshInProgressRef.current =
                    false;
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

    function handleManualRefresh() {
        void refreshModules(
            false,
            true,
        );
    }

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

        if (
            !dragging ||
            reorderInProgressRef.current
        ) {
            return;
        }

        if (
            dragging.id ===
            targetState.id ||
            dragging.type !==
            targetState.type
        ) {
            resetDragState();
            return;
        }

        const resourceLabel =
            dragging.type ===
                "module"
                ? "módulos"
                : dragging.type ===
                    "lesson"
                    ? "lecciones"
                    : "actividades";

        const toastId =
            notify.loading(
                `Reorganizando ${resourceLabel}...`,
                "Estamos guardando el nuevo orden.",
            );

        reorderInProgressRef.current =
            true;

        let orderWasUpdated =
            false;

        try {
            setActionError(
                "",
            );

            if (
                dragging.type ===
                "module" &&
                targetState.type ===
                "module"
            ) {
                const reorderedModules =
                    moveItem(
                        modules,
                        dragging.id,
                        targetState.id,
                    ).map(
                        (
                            courseModule:
                                CourseModuleView,
                            index:
                                number,
                        ) => ({
                            ...courseModule,
                            order:
                                index +
                                1,
                        }),
                    );

                setModules(
                    reorderedModules,
                );

                await Promise.all(
                    reorderedModules.map(
                        (
                            courseModule:
                                CourseModuleView,
                        ) =>
                            updateModule(
                                Number(
                                    courseModule.id,
                                ),
                                {
                                    name:
                                        courseModule.title,
                                    order:
                                        courseModule.order,
                                },
                            ),
                    ),
                );

                orderWasUpdated =
                    true;
            }

            if (
                dragging.type ===
                "lesson" &&
                targetState.type ===
                "lesson"
            ) {
                if (
                    dragging.moduleId !==
                    targetState.moduleId
                ) {
                    return;
                }

                const targetModule =
                    modules.find(
                        (
                            courseModule:
                                CourseModuleView,
                        ) =>
                            courseModule.id ===
                            dragging.moduleId,
                    );

                if (
                    !targetModule
                ) {
                    return;
                }

                const reorderedLessons =
                    moveItem(
                        targetModule.lessons,
                        dragging.id,
                        targetState.id,
                    ).map(
                        (
                            lesson:
                                LessonView,
                            index:
                                number,
                        ) => ({
                            ...lesson,
                            order:
                                index +
                                1,
                        }),
                    );

                setModules(
                    (
                        currentModules:
                            CourseModuleView[],
                    ) =>
                        currentModules.map(
                            (
                                courseModule:
                                    CourseModuleView,
                            ) =>
                                courseModule.id ===
                                    targetModule.id
                                    ? {
                                        ...courseModule,
                                        lessons:
                                            reorderedLessons,
                                    }
                                    : courseModule,
                        ),
                );

                await Promise.all(
                    reorderedLessons.map(
                        (
                            lesson:
                                LessonView,
                        ) =>
                            updateLesson(
                                Number(
                                    lesson.id,
                                ),
                                {
                                    name:
                                        lesson.title,
                                    order:
                                        lesson.order,
                                    module_id:
                                        Number(
                                            lesson.moduleId,
                                        ),
                                },
                            ),
                    ),
                );

                orderWasUpdated =
                    true;
            }

            if (
                dragging.type ===
                "item" &&
                targetState.type ===
                "item"
            ) {
                if (
                    dragging.lessonId !==
                    targetState.lessonId
                ) {
                    return;
                }

                const targetLesson =
                    findLessonInModules(
                        modules,
                        dragging.lessonId,
                    );

                if (
                    !targetLesson
                ) {
                    return;
                }

                const reorderedItems =
                    moveItem(
                        targetLesson.items,
                        dragging.id,
                        targetState.id,
                    ).map(
                        (
                            item:
                                LessonItemView,
                            index:
                                number,
                        ) => ({
                            ...item,
                            order:
                                index +
                                1,
                        }),
                    );

                setModules(
                    (
                        currentModules:
                            CourseModuleView[],
                    ) =>
                        currentModules.map(
                            (
                                courseModule:
                                    CourseModuleView,
                            ) => ({
                                ...courseModule,
                                lessons:
                                    courseModule.lessons.map(
                                        (
                                            lesson:
                                                LessonView,
                                        ) =>
                                            lesson.id ===
                                                targetLesson.id
                                                ? {
                                                    ...lesson,
                                                    items:
                                                        reorderedItems,
                                                }
                                                : lesson,
                                    ),
                            })),
                );

                await Promise.all(
                    reorderedItems.map(
                        (
                            item:
                                LessonItemView,
                        ) =>
                            updateLessonBlock(
                                Number(
                                    item.id,
                                ),
                                toLessonBlockPayload(
                                    item.raw,
                                    item.order,
                                    item.type,
                                ) as LessonBlockPayload,
                            ),
                    ),
                );

                orderWasUpdated =
                    true;
            }

            if (
                orderWasUpdated
            ) {
                notify.dismiss(
                    toastId,
                );

                notify.success(
                    "Orden actualizado.",
                    `El orden de ${resourceLabel} se guardó correctamente.`,
                );
            }
        } catch (error) {
            const message =
                getErrorMessage(
                    error,
                );

            setActionError(
                message,
            );

            notify.dismiss(
                toastId,
            );

            notify.error(
                "No se pudo guardar el nuevo orden.",
                message,
            );

            void refreshModules(
                false,
            );
        } finally {
            notify.dismiss(
                toastId,
            );

            reorderInProgressRef.current =
                false;

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

    async function handleCreateSubmit(
        event:
            FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        if (
            !createModal ||
            isSaving ||
            saveInProgressRef.current
        ) {
            return;
        }

        const title =
            formTitle.trim();

        if (
            !title
        ) {
            const message =
                "Ingresa un nombre para continuar.";

            setFormError(
                message,
            );

            notify.warning(
                "Revisa el formulario.",
                message,
            );

            return;
        }

        if (
            !numericCourseId ||
            numericCourseId <= 0
        ) {
            const message =
                "Primero selecciona un curso.";

            setFormError(
                message,
            );

            notify.warning(
                "Curso requerido.",
                message,
            );

            return;
        }

        const resourceLabel =
            getResourceLabel(
                createModal.type,
            );

        const toastId =
            notify.loading(
                `Creando ${resourceLabel}...`,
                "Estamos guardando la información.",
            );

        saveInProgressRef.current =
            true;

        try {
            setIsSaving(
                true,
            );

            setFormError(
                "",
            );

            setActionError(
                "",
            );

            if (
                createModal.type ===
                "module"
            ) {
                const createdModule =
                    await createModule({
                        name: title,
                        order:
                            toSafeNumber(
                                formOrder,
                                modules.length +
                                1,
                            ),
                        course_id:
                            numericCourseId,
                    });

                setOpenModules(
                    (
                        current,
                    ) => ({
                        ...current,
                        [createdModule.id]:
                            true,
                    }),
                );
            }

            if (
                createModal.type ===
                "lesson"
            ) {
                const parentModule =
                    modules.find(
                        (
                            courseModule:
                                CourseModuleView,
                        ) =>
                            courseModule.id ===
                            createModal.moduleId,
                    );

                const createdLesson =
                    await createLesson({
                        name: title,
                        order:
                            toSafeNumber(
                                formOrder,
                                (
                                    parentModule?.lessons
                                        .length ??
                                    0
                                ) + 1,
                            ),
                        module_id:
                            Number(
                                createModal.moduleId,
                            ),
                    });

                setOpenModules(
                    (
                        current,
                    ) => ({
                        ...current,
                        [createModal.moduleId]:
                            true,
                    }),
                );

                setOpenLessons(
                    (
                        current,
                    ) => ({
                        ...current,
                        [createdLesson.id]:
                            true,
                    }),
                );
            }

            if (
                createModal.type ===
                "item"
            ) {
                await createLessonBlock(
                    buildLessonBlockPayload({
                        lessonId:
                            createModal.lessonId,
                        type:
                            createModal.itemType,
                        title,
                        form: {
                            ...blockForm,
                            order:
                                formOrder,
                        },
                    }) as LessonBlockPayload,
                );

                setOpenLessons(
                    (
                        current,
                    ) => ({
                        ...current,
                        [createModal.lessonId]:
                            true,
                    }),
                );
            }

            await refreshModules(
                false,
            );

            closeCreateModal(
                true,
            );

            notify.dismiss(
                toastId,
            );

            notify.success(
                `${resourceLabel
                    .charAt(
                        0,
                    )
                    .toUpperCase()}${resourceLabel.slice(
                        1,
                    )} creado correctamente.`,
                "La estructura del curso fue actualizada.",
            );
        } catch (error) {
            const message =
                getErrorMessage(
                    error,
                );

            setFormError(
                message,
            );

            notify.dismiss(
                toastId,
            );

            notify.error(
                `No se pudo crear el ${resourceLabel}.`,
                message,
            );
        } finally {
            notify.dismiss(
                toastId,
            );

            saveInProgressRef.current =
                false;

            setIsSaving(
                false,
            );
        }
    }

    async function handleEditSubmit(
        event:
            FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        if (
            !editModal ||
            isSaving ||
            saveInProgressRef.current
        ) {
            return;
        }

        const title =
            formTitle.trim();

        if (
            !title
        ) {
            const message =
                "Ingresa un título válido.";

            setFormError(
                message,
            );

            notify.warning(
                "Revisa el formulario.",
                message,
            );

            return;
        }

        const resourceLabel =
            getResourceLabel(
                editModal.type,
            );

        const toastId =
            notify.loading(
                `Actualizando ${resourceLabel}...`,
                "Estamos guardando los cambios.",
            );

        saveInProgressRef.current =
            true;

        try {
            setIsSaving(
                true,
            );

            setFormError(
                "",
            );

            setActionError(
                "",
            );

            if (
                editModal.type ===
                "module"
            ) {
                await updateModule(
                    Number(
                        editModal.id,
                    ),
                    {
                        name: title,
                        order:
                            toSafeNumber(
                                formOrder,
                                1,
                            ),
                    },
                );
            }

            if (
                editModal.type ===
                "lesson"
            ) {
                await updateLesson(
                    Number(
                        editModal.id,
                    ),
                    {
                        name: title,
                        order:
                            toSafeNumber(
                                formOrder,
                                1,
                            ),
                        module_id:
                            Number(
                                editModal.moduleId,
                            ),
                    },
                );
            }

            if (
                editModal.type ===
                "item"
            ) {
                await updateLessonBlock(
                    Number(
                        editModal.id,
                    ),
                    buildLessonBlockPayload({
                        lessonId:
                            editModal.lessonId,
                        type:
                            editModal.itemType,
                        title,
                        form: {
                            ...blockForm,
                            order:
                                formOrder,
                        },
                    }) as LessonBlockPayload,
                );
            }

            await refreshModules(
                false,
            );

            closeEditModal(
                true,
            );

            notify.dismiss(
                toastId,
            );

            notify.success(
                `${resourceLabel
                    .charAt(
                        0,
                    )
                    .toUpperCase()}${resourceLabel.slice(
                        1,
                    )} actualizado correctamente.`,
                "Los cambios fueron guardados.",
            );
        } catch (error) {
            const message =
                getErrorMessage(
                    error,
                );

            setFormError(
                message,
            );

            notify.dismiss(
                toastId,
            );

            notify.error(
                `No se pudo actualizar el ${resourceLabel}.`,
                message,
            );
        } finally {
            notify.dismiss(
                toastId,
            );

            saveInProgressRef.current =
                false;

            setIsSaving(
                false,
            );
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
        if (
            !deleteModal ||
            isSaving ||
            saveInProgressRef.current
        ) {
            return;
        }

        const resourceLabel =
            getResourceLabel(
                deleteModal.type,
            );

        const toastId =
            notify.loading(
                `Eliminando ${resourceLabel}...`,
                "Estamos actualizando la estructura del curso.",
            );

        saveInProgressRef.current =
            true;

        try {
            setIsSaving(
                true,
            );

            setActionError(
                "",
            );

            if (
                deleteModal.type ===
                "module"
            ) {
                await deleteModule(
                    Number(
                        deleteModal.id,
                    ),
                );
            }

            if (
                deleteModal.type ===
                "lesson"
            ) {
                await deleteLesson(
                    Number(
                        deleteModal.id,
                    ),
                );
            }

            if (
                deleteModal.type ===
                "item"
            ) {
                await deleteLessonBlock(
                    Number(
                        deleteModal.id,
                    ),
                );
            }

            await refreshModules(
                false,
            );

            closeDeleteModal(
                true,
            );

            notify.dismiss(
                toastId,
            );

            notify.success(
                `${resourceLabel
                    .charAt(
                        0,
                    )
                    .toUpperCase()}${resourceLabel.slice(
                        1,
                    )} eliminado correctamente.`,
                "La estructura del curso fue actualizada.",
            );
        } catch (error) {
            const message =
                getErrorMessage(
                    error,
                );

            setActionError(
                message,
            );

            notify.dismiss(
                toastId,
            );

            notify.error(
                `No se pudo eliminar el ${resourceLabel}.`,
                message,
            );
        } finally {
            notify.dismiss(
                toastId,
            );

            saveInProgressRef.current =
                false;

            setIsSaving(
                false,
            );
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
        isRefreshing,
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
        handleManualRefresh,
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