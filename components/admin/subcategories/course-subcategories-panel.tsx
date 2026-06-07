"use client";

import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ChangeEvent,
    type FormEvent,
} from "react";
import {
    AlertTriangle,
    ChevronLeft,
    ChevronRight,
    FolderTree,
    Loader2,
    LoaderCircle,
    Pencil,
    Plus,
    RefreshCw,
    Search,
    Tags,
    Trash2,
    X,
} from "lucide-react";

import { AthenaLoadingBackground } from "@/components/ui/AthenaLoadingBackground";
import { notify } from "@/lib/notify";
import {
    getCategories,
    type Category,
} from "@/services/categories.service";
import {
    createSubcategory,
    deleteSubcategory,
    getSubcategoriesByCategory,
    updateSubcategory,
    type Subcategory,
} from "@/services/subcategories.service";

const ITEMS_PER_PAGE = 5;

type DeleteCandidate = {
    id: number;
    name: string;
};

function getSubcategoryInitial(
    subcategory: Subcategory,
) {
    return (
        subcategory.name ||
        "S"
    )
        .charAt(0)
        .toUpperCase();
}

function getErrorMessage(
    error: unknown,
    fallback: string,
) {
    return error instanceof Error
        ? error.message
        : fallback;
}

export function CourseSubcategoriesPanel() {
    const [categories, setCategories] =
        useState<Category[]>([]);

    const [subcategories, setSubcategories] =
        useState<Subcategory[]>([]);

    const [isInitialLoading, setIsInitialLoading] =
        useState(true);

    const [isLoadingSubcategories, setIsLoadingSubcategories] =
        useState(false);

    const [isRefreshing, setIsRefreshing] =
        useState(false);

    const [isSubmitting, setIsSubmitting] =
        useState(false);

    const [isDeleting, setIsDeleting] =
        useState(false);

    const [isModalOpen, setIsModalOpen] =
        useState(false);

    const [editingSubcategory, setEditingSubcategory] =
        useState<Subcategory | null>(null);

    const [deleteCandidate, setDeleteCandidate] =
        useState<DeleteCandidate | null>(null);

    const [selectedCategoryId, setSelectedCategoryId] =
        useState<number | null>(null);

    const [formCategoryId, setFormCategoryId] =
        useState<number | null>(null);

    const [name, setName] =
        useState("");

    const [search, setSearch] =
        useState("");

    const [currentPage, setCurrentPage] =
        useState(1);

    const [errorMessage, setErrorMessage] =
        useState("");

    const selectedCategoryIdRef =
        useRef<number | null>(null);

    const refreshInProgressRef =
        useRef(false);

    const submitInProgressRef =
        useRef(false);

    const deleteInProgressRef =
        useRef(false);

    const categoryNameMap = useMemo(() => {
        return new Map(
            categories.map((category) => [
                category.id,
                category.name,
            ]),
        );
    }, [categories]);

    const selectedCategoryName =
        selectedCategoryId !== null
            ? categoryNameMap.get(selectedCategoryId) ??
            `Categoría #${selectedCategoryId}`
            : "Sin categoría seleccionada";

    const loadInitialData = useCallback(async () => {
        try {
            setIsInitialLoading(true);
            setErrorMessage("");

            const categoriesResponse =
                await getCategories();

            const safeCategories =
                Array.isArray(categoriesResponse)
                    ? categoriesResponse
                    : [];

            setCategories(safeCategories);

            if (safeCategories.length === 0) {
                selectedCategoryIdRef.current = null;
                setSelectedCategoryId(null);
                setFormCategoryId(null);
                setSubcategories([]);
                return;
            }

            const categoryId =
                safeCategories[0].id;

            selectedCategoryIdRef.current =
                categoryId;

            setSelectedCategoryId(
                categoryId,
            );

            setFormCategoryId(
                categoryId,
            );

            const subcategoriesResponse =
                await getSubcategoriesByCategory(
                    categoryId,
                );

            setSubcategories(
                Array.isArray(
                    subcategoriesResponse,
                )
                    ? subcategoriesResponse
                    : [],
            );
        } catch (error) {
            const message =
                getErrorMessage(
                    error,
                    "No se pudieron cargar las subcategorías.",
                );

            setCategories([]);
            setSubcategories([]);
            selectedCategoryIdRef.current = null;
            setSelectedCategoryId(null);
            setFormCategoryId(null);
            setErrorMessage(message);

            notify.error(
                "No se pudo cargar la información.",
                message,
            );
        } finally {
            setIsInitialLoading(false);
        }
    }, []);

    const loadSubcategories = useCallback(
        async (
            categoryId: number,
            showToast = false,
        ) => {
            const toastId = showToast
                ? notify.loading(
                    "Actualizando subcategorías...",
                    "Estamos consultando la lista registrada.",
                )
                : null;

            try {
                setIsLoadingSubcategories(true);
                setErrorMessage("");

                const data =
                    await getSubcategoriesByCategory(
                        categoryId,
                    );

                setSubcategories(
                    Array.isArray(data)
                        ? data
                        : [],
                );

                setCurrentPage(1);

                if (toastId !== null) {
                    notify.dismiss(toastId);
                    notify.success(
                        "Subcategorías actualizadas.",
                        "La lista se encuentra al día.",
                    );
                }
            } catch (error) {
                const message =
                    getErrorMessage(
                        error,
                        "No se pudieron cargar las subcategorías.",
                    );

                setSubcategories([]);
                setErrorMessage(message);

                if (toastId !== null) {
                    notify.dismiss(toastId);
                }

                notify.error(
                    "No se pudieron cargar las subcategorías.",
                    message,
                );
            } finally {
                setIsLoadingSubcategories(false);
            }
        },
        [],
    );

    const refreshData = useCallback(async () => {
        if (
            refreshInProgressRef.current ||
            isRefreshing
        ) {
            return;
        }

        refreshInProgressRef.current = true;
        setIsRefreshing(true);
        setErrorMessage("");

        const toastId = notify.loading(
            "Actualizando subcategorías...",
            "Estamos consultando categorías y subcategorías.",
        );

        try {
            const categoriesResponse =
                await getCategories();

            const safeCategories =
                Array.isArray(categoriesResponse)
                    ? categoriesResponse
                    : [];

            setCategories(safeCategories);

            if (safeCategories.length === 0) {
                selectedCategoryIdRef.current = null;
                setSelectedCategoryId(null);
                setFormCategoryId(null);
                setSubcategories([]);
                setCurrentPage(1);

                notify.dismiss(toastId);
                notify.success(
                    "Lista actualizada.",
                    "No existen categorías registradas todavía.",
                );

                return;
            }

            const currentCategoryId =
                selectedCategoryIdRef.current;

            const nextCategoryId =
                currentCategoryId !== null &&
                    safeCategories.some(
                        (category) =>
                            category.id ===
                            currentCategoryId,
                    )
                    ? currentCategoryId
                    : safeCategories[0].id;

            selectedCategoryIdRef.current =
                nextCategoryId;

            setSelectedCategoryId(
                nextCategoryId,
            );

            setFormCategoryId((current) =>
                current !== null &&
                    safeCategories.some(
                        (category) =>
                            category.id === current,
                    )
                    ? current
                    : nextCategoryId,
            );

            const subcategoriesResponse =
                await getSubcategoriesByCategory(
                    nextCategoryId,
                );

            setSubcategories(
                Array.isArray(
                    subcategoriesResponse,
                )
                    ? subcategoriesResponse
                    : [],
            );

            setCurrentPage(1);

            notify.dismiss(toastId);
            notify.success(
                "Subcategorías actualizadas.",
                "La lista se encuentra al día.",
            );
        } catch (error) {
            const message =
                getErrorMessage(
                    error,
                    "No se pudo actualizar la lista.",
                );

            setErrorMessage(message);
            notify.dismiss(toastId);
            notify.error(
                "No se pudo actualizar la lista.",
                message,
            );
        } finally {
            refreshInProgressRef.current = false;
            setIsRefreshing(false);
        }
    }, [isRefreshing]);

    useEffect(() => {
        const timeoutId =
            window.setTimeout(() => {
                void loadInitialData();
            }, 0);

        return () => {
            window.clearTimeout(
                timeoutId,
            );
        };
    }, [loadInitialData]);

    useEffect(() => {
        function handleEscape(
            event: KeyboardEvent,
        ) {
            if (
                event.key !== "Escape"
            ) {
                return;
            }

            if (
                isSubmitting ||
                isDeleting
            ) {
                return;
            }

            setIsModalOpen(false);
            setEditingSubcategory(null);
            setDeleteCandidate(null);
            setName("");
            setErrorMessage("");
        }

        document.addEventListener(
            "keydown",
            handleEscape,
        );

        return () => {
            document.removeEventListener(
                "keydown",
                handleEscape,
            );
        };
    }, [isDeleting, isSubmitting]);

    const filteredSubcategories =
        useMemo(() => {
            const searchValue =
                search
                    .trim()
                    .toLowerCase();

            if (!searchValue) {
                return subcategories;
            }

            return subcategories.filter(
                (subcategory) =>
                    (
                        subcategory.name ||
                        ""
                    )
                        .toLowerCase()
                        .includes(
                            searchValue,
                        ),
            );
        }, [search, subcategories]);

    const totalPages = Math.max(
        1,
        Math.ceil(
            filteredSubcategories.length /
            ITEMS_PER_PAGE,
        ),
    );

    const activePage = Math.min(
        currentPage,
        totalPages,
    );

    const paginatedSubcategories =
        useMemo(() => {
            const startIndex =
                (activePage - 1) *
                ITEMS_PER_PAGE;

            return filteredSubcategories.slice(
                startIndex,
                startIndex +
                ITEMS_PER_PAGE,
            );
        }, [activePage, filteredSubcategories]);

    const stats = useMemo(
        () => ({
            categories:
                categories.length,
            listed:
                subcategories.length,
            matches:
                filteredSubcategories.length,
        }),
        [
            categories.length,
            filteredSubcategories.length,
            subcategories.length,
        ],
    );

    function resetForm(
        nextCategoryId?: number | null,
    ) {
        setEditingSubcategory(null);
        setName("");
        setFormCategoryId(
            nextCategoryId ??
            selectedCategoryIdRef.current ??
            categories[0]?.id ??
            null,
        );
    }

    function openCreateModal() {
        if (
            categories.length === 0
        ) {
            notify.warning(
                "No existen categorías.",
                "Primero registra una categoría para crear una subcategoría.",
            );

            return;
        }

        resetForm();
        setErrorMessage("");
        setIsModalOpen(true);
    }

    function openEditModal(
        subcategory: Subcategory,
    ) {
        setEditingSubcategory(
            subcategory,
        );

        setName(
            subcategory.name ||
            "",
        );

        setFormCategoryId(
            subcategory.category_id,
        );

        setErrorMessage("");
        setIsModalOpen(true);
    }

    function closeModal() {
        if (isSubmitting) return;

        setIsModalOpen(false);
        resetForm();
        setErrorMessage("");
    }

    function handleCategoryFilterChange(
        event: ChangeEvent<HTMLSelectElement>,
    ) {
        const nextCategoryId =
            Number(
                event.target.value,
            );

        if (
            !Number.isFinite(
                nextCategoryId,
            ) ||
            nextCategoryId <= 0
        ) {
            return;
        }

        selectedCategoryIdRef.current =
            nextCategoryId;

        setSelectedCategoryId(
            nextCategoryId,
        );

        setFormCategoryId(
            nextCategoryId,
        );

        setSubcategories([]);
        setCurrentPage(1);

        void loadSubcategories(
            nextCategoryId,
        );
    }

    function handleSearchChange(
        event: ChangeEvent<HTMLInputElement>,
    ) {
        setSearch(
            event.target.value,
        );

        setCurrentPage(1);
    }

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        if (
            submitInProgressRef.current ||
            isSubmitting
        ) {
            return;
        }

        const trimmedName =
            name.trim();

        if (!trimmedName) {
            notify.warning(
                "Completa el nombre.",
                "El nombre de la subcategoría es obligatorio.",
            );

            return;
        }

        if (
            formCategoryId === null
        ) {
            notify.warning(
                "Selecciona una categoría.",
                "Debes asociar la subcategoría con una categoría.",
            );

            return;
        }

        submitInProgressRef.current = true;
        setIsSubmitting(true);
        setErrorMessage("");

        const isEditing =
            Boolean(
                editingSubcategory,
            );

        const toastId = notify.loading(
            isEditing
                ? "Actualizando subcategoría..."
                : "Creando subcategoría...",
            "Estamos guardando la información.",
        );

        try {
            if (editingSubcategory) {
                await updateSubcategory(
                    editingSubcategory.id,
                    {
                        name:
                            trimmedName,
                        category_id:
                            formCategoryId,
                        is_mdt:
                            editingSubcategory.is_mdt ??
                            false,
                    },
                );
            } else {
                await createSubcategory({
                    name:
                        trimmedName,
                    category_id:
                        formCategoryId,
                    is_mdt:
                        false,
                });
            }

            if (
                selectedCategoryIdRef.current !==
                formCategoryId
            ) {
                selectedCategoryIdRef.current =
                    formCategoryId;

                setSelectedCategoryId(
                    formCategoryId,
                );
            }

            await loadSubcategories(
                formCategoryId,
            );

            setIsModalOpen(false);
            resetForm(
                formCategoryId,
            );

            notify.dismiss(toastId);
            notify.success(
                isEditing
                    ? "Subcategoría actualizada."
                    : "Subcategoría creada.",
                isEditing
                    ? "Los cambios se guardaron correctamente."
                    : "La nueva subcategoría fue registrada correctamente.",
            );
        } catch (error) {
            const message =
                getErrorMessage(
                    error,
                    "No se pudo guardar la subcategoría.",
                );

            notify.dismiss(toastId);
            notify.error(
                isEditing
                    ? "No se pudo actualizar la subcategoría."
                    : "No se pudo crear la subcategoría.",
                message,
            );
        } finally {
            submitInProgressRef.current = false;
            setIsSubmitting(false);
        }
    }

    function openDeleteModal(
        subcategory: Subcategory,
    ) {
        if (isDeleting) return;

        setDeleteCandidate({
            id:
                subcategory.id,
            name:
                subcategory.name ||
                "esta subcategoría",
        });
    }

    function closeDeleteModal() {
        if (isDeleting) return;

        setDeleteCandidate(null);
    }

    async function confirmDelete() {
        if (
            !deleteCandidate ||
            isDeleting ||
            deleteInProgressRef.current
        ) {
            return;
        }

        deleteInProgressRef.current = true;
        setIsDeleting(true);
        setErrorMessage("");

        const toastId = notify.loading(
            "Eliminando subcategoría...",
            `Estamos eliminando ${deleteCandidate.name}.`,
        );

        try {
            await deleteSubcategory(
                deleteCandidate.id,
            );

            const activeCategoryId =
                selectedCategoryIdRef.current;

            if (
                activeCategoryId !== null
            ) {
                await loadSubcategories(
                    activeCategoryId,
                );
            } else {
                setSubcategories([]);
            }

            notify.dismiss(toastId);
            notify.success(
                "Subcategoría eliminada.",
                `${deleteCandidate.name} fue eliminada correctamente.`,
            );

            setDeleteCandidate(null);
        } catch (error) {
            const message =
                getErrorMessage(
                    error,
                    "No se pudo eliminar la subcategoría.",
                );

            setErrorMessage(message);
            notify.dismiss(toastId);
            notify.error(
                "No se pudo eliminar la subcategoría.",
                message,
            );
        } finally {
            deleteInProgressRef.current = false;
            setIsDeleting(false);
        }
    }

    if (isInitialLoading) {
        return (
            <AthenaLoadingBackground
                className="max-w-[1450px]"
                contentClassName="flex min-h-[calc(100dvh-150px)] items-center justify-center"
            >
                <div className="flex min-h-[240px] w-full max-w-xl flex-col items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--card)]/80 px-5 py-6 text-center shadow-sm backdrop-blur-[3px] sm:min-h-[300px] sm:rounded-[28px] sm:px-7 sm:py-8">
                    <LoaderCircle className="h-8 w-8 animate-spin text-[var(--primary)] sm:h-9 sm:w-9" />

                    <p className="mt-4 text-sm font-black text-[var(--foreground)] sm:text-base">
                        Cargando subcategorías
                    </p>

                    <p className="mt-1.5 text-xs font-semibold leading-5 text-[var(--muted-foreground)] sm:text-sm">
                        Estamos preparando la información de la plataforma...
                    </p>
                </div>
            </AthenaLoadingBackground>
        );
    }

    return (
        <>
            <section className="min-w-0 space-y-4 sm:space-y-5 lg:space-y-6 [@media(max-height:760px)]:space-y-4 [&_button:not(:disabled)]:cursor-pointer [&_button:not(:disabled)]:select-none [&_button:not(:disabled)]:transition-all [&_button:not(:disabled)]:duration-150 [&_button:not(:disabled):active]:translate-y-px [&_button:not(:disabled):active]:scale-[0.98]">
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#07111F] via-[#172861] via-70% to-[#F97316] p-4 text-white shadow-lg sm:rounded-3xl sm:p-5 lg:p-6 [@media(max-height:760px)]:p-4">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                        <div className="min-w-0">
                            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-blue-100 sm:text-xs sm:tracking-[0.25em] lg:text-sm">
                                Gestión de cursos
                            </p>

                            <h2 className="mt-2 text-xl font-bold sm:text-2xl md:text-3xl [@media(max-height:760px)]:text-xl">
                                Subcategorías
                            </h2>

                            <p className="mt-2 max-w-2xl text-xs leading-5 text-blue-50 sm:text-sm sm:leading-6">
                                Administra las subcategorías asociadas a cada categoría para organizar mejor los cursos de la plataforma.
                            </p>
                        </div>

                        <div className="grid grid-cols-3 gap-2 sm:gap-3 xl:min-w-[520px]">
                            <StatsCard
                                label="Categorías"
                                value={stats.categories}
                            />

                            <StatsCard
                                label="Listadas"
                                value={stats.listed}
                            />

                            <StatsCard
                                label="Coincidencias"
                                value={stats.matches}
                            />
                        </div>
                    </div>
                </div>

                {errorMessage && !isModalOpen ? (
                    <div
                        role="alert"
                        aria-live="assertive"
                        className="rounded-xl border border-red-200 bg-red-50 px-3 py-3 text-xs font-semibold leading-5 text-red-700 shadow-sm sm:rounded-2xl sm:px-5 sm:py-4 sm:text-sm"
                    >
                        <p className="font-black">
                            No se pudo completar la operación.
                        </p>

                        <p className="mt-0.5 break-words">
                            {errorMessage}
                        </p>
                    </div>
                ) : null}

                <div className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm sm:rounded-3xl sm:p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="min-w-0">
                            <h3 className="text-base font-bold text-slate-950 sm:text-lg">
                                Filtros de subcategorías
                            </h3>

                            <p className="mt-1 text-xs leading-5 text-[var(--muted-foreground)] sm:text-sm">
                                Selecciona una categoría y busca las subcategorías registradas.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-2 xs:grid-cols-2 sm:gap-3">
                            <button
                                type="button"
                                onClick={openCreateModal}
                                disabled={categories.length === 0}
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#172861] px-4 text-xs font-bold text-white shadow-sm hover:bg-[#0B163F] disabled:cursor-not-allowed disabled:opacity-60 sm:h-11 sm:rounded-2xl sm:px-5 sm:text-sm"
                            >
                                <Plus className="h-4 w-4" />
                                Nueva subcategoría
                            </button>

                            <button
                                type="button"
                                onClick={() => void refreshData()}
                                disabled={isRefreshing}
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 text-xs font-bold text-white shadow-sm hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60 sm:h-11 sm:rounded-2xl sm:px-5 sm:text-sm"
                            >
                                <RefreshCw
                                    className={`h-4 w-4 ${isRefreshing
                                            ? "animate-spin"
                                            : ""
                                        }`}
                                />

                                {isRefreshing
                                    ? "Actualizando..."
                                    : "Actualizar"}
                            </button>
                        </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:mt-5 md:grid-cols-2 md:gap-4">
                        <label className="block min-w-0">
                            <span className="mb-2 block text-xs font-bold text-slate-700 sm:text-sm">
                                Categoría
                            </span>

                            <select
                                value={selectedCategoryId ?? ""}
                                onChange={handleCategoryFilterChange}
                                disabled={categories.length === 0}
                                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100 sm:h-11 sm:rounded-2xl sm:px-5 sm:text-sm"
                            >
                                {categories.length === 0 ? (
                                    <option value="">
                                        Sin categorías registradas
                                    </option>
                                ) : null}

                                {categories.map((category) => (
                                    <option
                                        key={category.id}
                                        value={category.id}
                                    >
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label className="block min-w-0">
                            <span className="mb-2 block text-xs font-bold text-slate-700 sm:text-sm">
                                Buscar
                            </span>

                            <div className="relative">
                                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                                <input
                                    type="search"
                                    value={search}
                                    onChange={handleSearchChange}
                                    placeholder="Buscar por nombre de subcategoría..."
                                    className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-xs font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:h-11 sm:rounded-2xl sm:text-sm"
                                />
                            </div>
                        </label>
                    </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm sm:rounded-3xl">
                    <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 sm:px-5">
                        <div className="min-w-0">
                            <p className="truncate text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                                {selectedCategoryName}
                            </p>
                        </div>

                        <FolderTree className="h-4 w-4 shrink-0 text-slate-400" />
                    </div>

                    {isLoadingSubcategories ? (
                        <div className="flex min-h-[220px] flex-col items-center justify-center px-4 py-10 text-center">
                            <LoaderCircle className="h-7 w-7 animate-spin text-[var(--primary)]" />

                            <p className="mt-3 text-sm font-bold text-slate-600">
                                Cargando subcategorías...
                            </p>
                        </div>
                    ) : paginatedSubcategories.length === 0 ? (
                        <div className="px-4 py-12 text-center">
                            <Tags className="mx-auto h-10 w-10 text-slate-300" />

                            <p className="mt-3 text-sm font-bold text-slate-800">
                                No hay subcategorías para mostrar.
                            </p>

                            <p className="mt-1 text-xs font-semibold leading-5 text-slate-500 sm:text-sm">
                                Registra una subcategoría o modifica el término de búsqueda.
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="grid gap-3 p-3 sm:grid-cols-2 sm:p-4 lg:hidden">
                                {paginatedSubcategories.map((subcategory) => (
                                    <SubcategoryCard
                                        key={subcategory.id}
                                        subcategory={subcategory}
                                        categoryName={
                                            categoryNameMap.get(
                                                subcategory.category_id,
                                            ) ?? "Sin categoría"
                                        }
                                        onEdit={() =>
                                            openEditModal(
                                                subcategory,
                                            )
                                        }
                                        onDelete={() =>
                                            openDeleteModal(
                                                subcategory,
                                            )
                                        }
                                    />
                                ))}
                            </div>

                            <div className="hidden overflow-x-auto lg:block">
                                <table className="w-full min-w-[760px] table-fixed divide-y divide-slate-200">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <TableHeader className="w-[36%]">
                                                Subcategoría
                                            </TableHeader>

                                            <TableHeader className="w-[30%]">
                                                Categoría
                                            </TableHeader>

                                            <TableHeader className="w-[16%]">
                                                Tipo
                                            </TableHeader>

                                            <th className="w-[190px] px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-600">
                                                Acciones
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-slate-100">
                                        {paginatedSubcategories.map((subcategory) => (
                                            <tr
                                                key={subcategory.id}
                                                className="transition hover:bg-blue-50/40"
                                            >
                                                <td className="px-4 py-3.5 align-middle">
                                                    <SubcategoryIdentity
                                                        subcategory={subcategory}
                                                    />
                                                </td>

                                                <td className="px-4 py-3.5 align-middle text-sm font-semibold text-slate-600">
                                                    <p className="truncate">
                                                        {categoryNameMap.get(
                                                            subcategory.category_id,
                                                        ) ?? "Sin categoría"}
                                                    </p>
                                                </td>

                                                <td className="px-4 py-3.5 align-middle">
                                                    <TypeBadge
                                                        isMdt={Boolean(
                                                            subcategory.is_mdt,
                                                        )}
                                                    />
                                                </td>

                                                <td className="px-4 py-3.5 align-middle">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                openEditModal(
                                                                    subcategory,
                                                                )
                                                            }
                                                            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-white px-3 text-xs font-black text-blue-700 transition hover:bg-blue-50"
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                            Editar
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                openDeleteModal(
                                                                    subcategory,
                                                                )
                                                            }
                                                            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-white px-3 text-xs font-black text-red-600 transition hover:bg-red-50"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                            Eliminar
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}

                    <Pagination
                        activePage={activePage}
                        totalPages={totalPages}
                        currentItems={paginatedSubcategories.length}
                        totalItems={filteredSubcategories.length}
                        onPrevious={() =>
                            setCurrentPage((page) =>
                                Math.max(1, page - 1),
                            )
                        }
                        onNext={() =>
                            setCurrentPage((page) =>
                                Math.min(
                                    totalPages,
                                    page + 1,
                                ),
                            )
                        }
                    />
                </div>
            </section>

            {isModalOpen ? (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-[1px] sm:items-center sm:px-4 sm:py-6">
                    <div className="flex max-h-[94dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
                        <div className="bg-gradient-to-br from-[#07111F] via-[#172861] to-[#F97316] px-4 py-4 text-white sm:px-6 sm:py-5">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-100 sm:text-xs">
                                        Formulario
                                    </p>

                                    <h3 className="mt-2 text-xl font-black">
                                        {editingSubcategory
                                            ? "Editar subcategoría"
                                            : "Nueva subcategoría"}
                                    </h3>

                                    <p className="mt-1 text-xs font-semibold leading-5 text-blue-50 sm:text-sm">
                                        Completa los datos principales de la subcategoría.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={closeModal}
                                    disabled={isSubmitting}
                                    aria-label="Cerrar formulario"
                                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-white ring-1 ring-white/20 transition hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        <form
                            onSubmit={handleSubmit}
                            noValidate
                            className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:p-6"
                        >
                            <label className="block min-w-0">
                                <span className="mb-1.5 block text-xs font-black text-slate-700 sm:text-sm">
                                    Nombre de la subcategoría

                                    {!name.trim() ? (
                                        <span className="ml-1 text-red-600">
                                            *
                                        </span>
                                    ) : null}
                                </span>

                                <input
                                    value={name}
                                    onChange={(event) => {
                                        setName(
                                            event.target.value,
                                        );
                                        setErrorMessage("");
                                    }}
                                    placeholder="Ej: Desarrollo web"
                                    autoFocus
                                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:h-11 sm:rounded-2xl sm:px-4 sm:text-sm"
                                />
                            </label>

                            <label className="block min-w-0">
                                <span className="mb-1.5 block text-xs font-black text-slate-700 sm:text-sm">
                                    Categoría

                                    {formCategoryId === null ? (
                                        <span className="ml-1 text-red-600">
                                            *
                                        </span>
                                    ) : null}
                                </span>

                                <select
                                    value={formCategoryId ?? ""}
                                    onChange={(event) => {
                                        const value = Number(
                                            event.target.value,
                                        );

                                        setFormCategoryId(
                                            Number.isFinite(value) &&
                                                value > 0
                                                ? value
                                                : null,
                                        );

                                        setErrorMessage("");
                                    }}
                                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:h-11 sm:rounded-2xl sm:px-4 sm:text-sm"
                                >
                                    <option value="">
                                        Selecciona una categoría
                                    </option>

                                    {categories.map((category) => (
                                        <option
                                            key={category.id}
                                            value={category.id}
                                        >
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <div className="sticky bottom-0 -mx-4 -mb-4 flex flex-col-reverse gap-2 border-t border-slate-200 bg-white px-4 pb-4 pt-3 sm:-mx-6 sm:-mb-6 sm:flex-row sm:justify-end sm:px-6 sm:pb-6">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    disabled={isSubmitting}
                                    className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 sm:h-11 sm:px-5 sm:text-sm"
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#172861] px-4 text-xs font-black text-white transition hover:bg-[#0B163F] disabled:cursor-not-allowed disabled:opacity-60 sm:h-11 sm:px-5 sm:text-sm"
                                >
                                    {isSubmitting ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : null}

                                    {isSubmitting
                                        ? "Guardando..."
                                        : editingSubcategory
                                            ? "Actualizar subcategoría"
                                            : "Crear subcategoría"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}

            {deleteCandidate ? (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="delete-subcategory-title"
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-[2px]"
                >
                    <div className="w-full max-w-md overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-2xl">
                        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
                            <div className="flex min-w-0 items-start gap-3">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                                    <AlertTriangle className="h-5 w-5" />
                                </div>

                                <div className="min-w-0">
                                    <h2
                                        id="delete-subcategory-title"
                                        className="text-base font-black text-slate-950 sm:text-lg"
                                    >
                                        Eliminar subcategoría
                                    </h2>

                                    <p className="mt-1 text-xs font-semibold leading-5 text-slate-500 sm:text-sm">
                                        Esta acción no se puede deshacer.
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={closeDeleteModal}
                                disabled={isDeleting}
                                aria-label="Cerrar confirmación"
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="px-5 py-5 sm:px-6">
                            <p className="text-sm font-semibold leading-6 text-slate-600">
                                ¿Seguro que deseas eliminar la subcategoría{" "}
                                <span className="font-black text-slate-950">
                                    {deleteCandidate.name}
                                </span>
                                ?
                            </p>

                            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={closeDeleteModal}
                                    disabled={isDeleting}
                                    className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 sm:h-11 sm:px-5 sm:text-sm"
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        void confirmDelete()
                                    }
                                    disabled={isDeleting}
                                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-xs font-black text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60 sm:h-11 sm:px-5 sm:text-sm"
                                >
                                    {isDeleting ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Trash2 className="h-4 w-4" />
                                    )}

                                    {isDeleting
                                        ? "Eliminando..."
                                        : "Eliminar subcategoría"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}
        </>
    );
}

function StatsCard({
    label,
    value,
}: {
    label: string;
    value: number;
}) {
    return (
        <div className="min-w-0 rounded-xl bg-white/15 p-3 ring-1 ring-white/20 sm:rounded-2xl sm:p-4 [@media(max-height:760px)]:p-3">
            <p className="truncate text-[9px] font-bold uppercase tracking-wide text-white/75 sm:text-xs">
                {label}
            </p>

            <p className="mt-1 text-xl font-bold sm:mt-2 sm:text-3xl">
                {value}
            </p>
        </div>
    );
}

function TableHeader({
    children,
    className = "",
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <th
            className={`${className} px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-600`}
        >
            {children}
        </th>
    );
}

function SubcategoryIdentity({
    subcategory,
}: {
    subcategory: Subcategory;
}) {
    return (
        <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#172861] text-sm font-black text-white">
                {getSubcategoryInitial(
                    subcategory,
                )}
            </div>

            <div className="min-w-0">
                <p className="truncate text-sm font-black text-slate-950">
                    {subcategory.name}
                </p>

                <p className="mt-0.5 truncate text-xs font-semibold text-slate-500">
                    ID #{subcategory.id}
                </p>
            </div>
        </div>
    );
}

function TypeBadge({
    isMdt,
}: {
    isMdt: boolean;
}) {
    return (
        <span
            className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide sm:text-xs ${isMdt
                    ? "bg-purple-100 text-purple-700"
                    : "bg-slate-100 text-slate-600"
                }`}
        >
            {isMdt
                ? "MDT"
                : "Normal"}
        </span>
    );
}

function SubcategoryCard({
    subcategory,
    categoryName,
    onEdit,
    onDelete,
}: {
    subcategory: Subcategory;
    categoryName: string;
    onEdit: () => void;
    onDelete: () => void;
}) {
    return (
        <article className="min-w-0 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
            <div className="flex min-w-0 items-start justify-between gap-3">
                <SubcategoryIdentity
                    subcategory={subcategory}
                />

                <TypeBadge
                    isMdt={Boolean(
                        subcategory.is_mdt,
                    )}
                />
            </div>

            <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2.5">
                <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
                    Categoría
                </p>

                <p className="mt-1 break-words text-xs font-bold text-slate-700 sm:text-sm">
                    {categoryName}
                </p>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                    type="button"
                    onClick={onEdit}
                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-white px-3 text-xs font-black text-blue-700 transition hover:bg-blue-50"
                >
                    <Pencil className="h-4 w-4" />
                    Editar
                </button>

                <button
                    type="button"
                    onClick={onDelete}
                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-white px-3 text-xs font-black text-red-600 transition hover:bg-red-50"
                >
                    <Trash2 className="h-4 w-4" />
                    Eliminar
                </button>
            </div>
        </article>
    );
}

function Pagination({
    activePage,
    totalPages,
    currentItems,
    totalItems,
    onPrevious,
    onNext,
}: {
    activePage: number;
    totalPages: number;
    currentItems: number;
    totalItems: number;
    onPrevious: () => void;
    onNext: () => void;
}) {
    return (
        <div className="flex flex-col gap-3 border-t border-slate-200 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4 lg:px-5">
            <p className="text-center text-xs font-semibold text-slate-500 sm:text-left sm:text-sm">
                Mostrando {currentItems} de {totalItems} subcategorías
            </p>

            <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 sm:flex">
                <button
                    type="button"
                    onClick={onPrevious}
                    disabled={activePage === 1}
                    aria-label="Página anterior"
                    className="inline-flex h-9 items-center justify-center gap-1 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:h-10 sm:px-4 sm:text-sm"
                >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="hidden sm:inline">
                        Anterior
                    </span>
                </button>

                <span className="flex h-9 items-center justify-center whitespace-nowrap rounded-xl bg-slate-100 px-3 text-center text-xs font-bold text-slate-700 sm:h-10 sm:px-4 sm:text-sm">
                    Página {activePage} de {totalPages}
                </span>

                <button
                    type="button"
                    onClick={onNext}
                    disabled={activePage === totalPages}
                    aria-label="Página siguiente"
                    className="inline-flex h-9 items-center justify-center gap-1 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:h-10 sm:px-4 sm:text-sm"
                >
                    <span className="hidden sm:inline">
                        Siguiente
                    </span>
                    <ChevronRight className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}

export default CourseSubcategoriesPanel;
