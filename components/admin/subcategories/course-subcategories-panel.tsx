"use client";

import {
    useCallback,
    useEffect,
    useMemo,
    useState,
    type ChangeEvent,
    type FormEvent,
} from "react";
import {
    ChevronLeft,
    ChevronRight,
    FolderTree,
    LoaderCircle,
    Pencil,
    Plus,
    RefreshCw,
    Tags,
    Trash2,
    X,
} from "lucide-react";
import { getCategories, type Category } from "@/services/categories.service";
import {
    createSubcategory,
    deleteSubcategory,
    getSubcategoriesByCategory,
    updateSubcategory,
    type Subcategory,
} from "@/services/subcategories.service";

const ITEMS_PER_PAGE = 5;

function getSubcategoryInitial(subcategory: Subcategory) {
    return (subcategory.name || "S").charAt(0).toUpperCase();
}

export function CourseSubcategoriesPanel() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [subcategories, setSubcategories] = useState<Subcategory[]>([]);

    const [isLoadingCategories, setIsLoadingCategories] = useState(true);
    const [isLoadingSubcategories, setIsLoadingSubcategories] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSubcategory, setEditingSubcategory] =
        useState<Subcategory | null>(null);

    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
        null,
    );
    const [formCategoryId, setFormCategoryId] = useState<number | null>(null);

    const [name, setName] = useState("");
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const categoryNameMap = useMemo(() => {
        return new Map(
            categories.map((category) => [category.id, category.name]),
        );
    }, [categories]);

    const selectedCategoryName =
        selectedCategoryId !== null
            ? categoryNameMap.get(selectedCategoryId) ??
              `Categoría #${selectedCategoryId}`
            : "Sin categoría seleccionada";

    const loadCategories = useCallback(async () => {
        try {
            setIsLoadingCategories(true);
            setError("");

            const data = await getCategories();
            const safeData = Array.isArray(data) ? data : [];

            setCategories(safeData);

            if (safeData.length === 0) {
                setSelectedCategoryId(null);
                setFormCategoryId(null);
                setSubcategories([]);
                setIsLoadingSubcategories(false);
                return;
            }

            const firstCategoryId = safeData[0].id;

            setSelectedCategoryId(firstCategoryId);
            setFormCategoryId(firstCategoryId);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "No se pudieron cargar las categorías.",
            );

            setCategories([]);
            setSubcategories([]);
            setSelectedCategoryId(null);
            setFormCategoryId(null);
            setIsLoadingSubcategories(false);
        } finally {
            setIsLoadingCategories(false);
        }
    }, []);

    const reloadSubcategories = useCallback(
        async (categoryId: number, showSuccess = false) => {
            try {
                if (showSuccess) {
                    setIsRefreshing(true);
                }

                setIsLoadingSubcategories(true);
                setError("");

                const data = await getSubcategoriesByCategory(categoryId);

                setSubcategories(Array.isArray(data) ? data : []);
                setCurrentPage(1);

                if (showSuccess) {
                    setSuccess(
                        "Lista de subcategorías actualizada correctamente.",
                    );
                }
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "No se pudieron cargar las subcategorías.",
                );

                setSubcategories([]);
            } finally {
                setIsLoadingSubcategories(false);
                setIsRefreshing(false);
            }
        },
        [],
    );

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void loadCategories();
        }, 0);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [loadCategories]);

    useEffect(() => {
        if (selectedCategoryId === null) return;

        const timeoutId = window.setTimeout(() => {
            void reloadSubcategories(selectedCategoryId);
        }, 0);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [selectedCategoryId, reloadSubcategories]);

    useEffect(() => {
        if (!error && !success) return;

        const timeoutId = window.setTimeout(() => {
            setError("");
            setSuccess("");
        }, 3000);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [error, success]);

    useEffect(() => {
        if (!isModalOpen) return;

        function handleEscape(event: KeyboardEvent) {
            if (event.key !== "Escape" || isSubmitting) return;

            setIsModalOpen(false);
            setEditingSubcategory(null);
            setName("");
            setError("");
        }

        document.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener("keydown", handleEscape);
        };
    }, [isModalOpen, isSubmitting]);

    const filteredSubcategories = useMemo(() => {
        const searchValue = search.trim().toLowerCase();

        if (!searchValue) return subcategories;

        return subcategories.filter((subcategory) =>
            (subcategory.name || "").toLowerCase().includes(searchValue),
        );
    }, [subcategories, search]);

    const totalPages = Math.max(
        1,
        Math.ceil(filteredSubcategories.length / ITEMS_PER_PAGE),
    );

    const activePage = Math.min(currentPage, totalPages);

    const paginatedSubcategories = useMemo(() => {
        const startIndex = (activePage - 1) * ITEMS_PER_PAGE;

        return filteredSubcategories.slice(
            startIndex,
            startIndex + ITEMS_PER_PAGE,
        );
    }, [filteredSubcategories, activePage]);

    const stats = useMemo(() => {
        return {
            categories: categories.length,
            total: subcategories.length,
            filtered: filteredSubcategories.length,
        };
    }, [categories.length, subcategories.length, filteredSubcategories.length]);

    function resetForm(nextCategoryId?: number | null) {
        const resolvedCategoryId =
            nextCategoryId ?? selectedCategoryId ?? categories[0]?.id ?? null;

        setEditingSubcategory(null);
        setName("");
        setFormCategoryId(resolvedCategoryId);
    }

    function openCreateModal() {
        resetForm();
        setError("");
        setSuccess("");
        setIsModalOpen(true);
    }

    function openEditModal(subcategory: Subcategory) {
        setEditingSubcategory(subcategory);
        setName(subcategory.name || "");
        setFormCategoryId(subcategory.category_id);
        setError("");
        setSuccess("");
        setIsModalOpen(true);
    }

    function closeModal() {
        if (isSubmitting) return;

        setIsModalOpen(false);
        resetForm();
        setError("");
    }

    function handleCategoryFilterChange(event: ChangeEvent<HTMLSelectElement>) {
        const nextCategoryId = Number(event.target.value);

        setSelectedCategoryId(nextCategoryId);
        setIsLoadingSubcategories(true);
        setSubcategories([]);
        setCurrentPage(1);

        if (!editingSubcategory) {
            setFormCategoryId(nextCategoryId);
        }
    }

    function handleSearchChange(event: ChangeEvent<HTMLInputElement>) {
        setSearch(event.target.value);
        setCurrentPage(1);
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const trimmedName = name.trim();

        if (!trimmedName) {
            setError("El nombre de la subcategoría es obligatorio.");
            return;
        }

        if (formCategoryId === null) {
            setError("Debes seleccionar una categoría.");
            return;
        }

        try {
            setIsSubmitting(true);
            setError("");
            setSuccess("");

            if (editingSubcategory) {
                await updateSubcategory(editingSubcategory.id, {
                    name: trimmedName,
                    category_id: formCategoryId,
                    is_mdt: editingSubcategory.is_mdt ?? false,
                });

                setSuccess("Subcategoría actualizada correctamente.");
            } else {
                await createSubcategory({
                    name: trimmedName,
                    category_id: formCategoryId,
                    is_mdt: false,
                });

                setSuccess("Subcategoría creada correctamente.");
            }

            if (selectedCategoryId === formCategoryId) {
                await reloadSubcategories(formCategoryId);
            } else {
                setSelectedCategoryId(formCategoryId);
                setIsLoadingSubcategories(true);
                setSubcategories([]);
            }

            setCurrentPage(1);
            setIsModalOpen(false);
            resetForm(formCategoryId);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "No se pudo guardar la subcategoría.",
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleDelete(subcategoryId: number) {
        const confirmed = window.confirm(
            "¿Seguro que deseas eliminar esta subcategoría?",
        );

        if (!confirmed) return;

        try {
            setDeletingId(subcategoryId);
            setError("");
            setSuccess("");

            await deleteSubcategory(subcategoryId);

            setSuccess("Subcategoría eliminada correctamente.");

            if (selectedCategoryId !== null) {
                await reloadSubcategories(selectedCategoryId);
            }
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "No se pudo eliminar la subcategoría.",
            );
        } finally {
            setDeletingId(null);
        }
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
                                Administra las subcategorías asociadas a cada
                                categoría para organizar mejor los cursos de la
                                plataforma.
                            </p>
                        </div>

                        <div className="grid grid-cols-3 gap-2 sm:gap-3 xl:min-w-[520px]">
                            <div className="rounded-xl bg-white/15 p-3 ring-1 ring-white/20 sm:rounded-2xl sm:p-4 [@media(max-height:760px)]:p-3">
                                <p className="text-[9px] font-bold uppercase tracking-wide text-white/75 sm:text-xs">
                                    Categorías
                                </p>
                                <p className="mt-1 text-xl font-bold sm:mt-2 sm:text-3xl">
                                    {isLoadingCategories
                                        ? "..."
                                        : stats.categories}
                                </p>
                            </div>

                            <div className="rounded-xl bg-white/15 p-3 ring-1 ring-white/20 sm:rounded-2xl sm:p-4 [@media(max-height:760px)]:p-3">
                                <p className="text-[9px] font-bold uppercase tracking-wide text-white/75 sm:text-xs">
                                    Listadas
                                </p>
                                <p className="mt-1 text-xl font-bold sm:mt-2 sm:text-3xl">
                                    {isLoadingSubcategories
                                        ? "..."
                                        : stats.total}
                                </p>
                            </div>

                            <div className="rounded-xl bg-white/15 p-3 ring-1 ring-white/20 sm:rounded-2xl sm:p-4 [@media(max-height:760px)]:p-3">
                                <p className="text-[9px] font-bold uppercase tracking-wide text-white/75 sm:text-xs">
                                    Coincidencias
                                </p>
                                <p className="mt-1 text-xl font-bold sm:mt-2 sm:text-3xl">
                                    {isLoadingSubcategories
                                        ? "..."
                                        : stats.filtered}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {(error || success) && !isModalOpen ? (
                    <div
                        className={`rounded-xl border px-3 py-3 text-xs font-semibold leading-5 sm:rounded-2xl sm:px-5 sm:py-4 sm:text-sm ${
                            error
                                ? "border-red-200 bg-red-50 text-red-700"
                                : "border-emerald-200 bg-emerald-50 text-emerald-700"
                        }`}
                    >
                        {error || success}
                    </div>
                ) : null}

                <div className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm sm:rounded-3xl sm:p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="min-w-0">
                            <h3 className="text-base font-bold text-slate-950 sm:text-lg">
                                Filtros de subcategorías
                            </h3>

                            <p className="mt-1 text-xs leading-5 text-[var(--muted-foreground)] sm:text-sm">
                                Selecciona una categoría y busca las
                                subcategorías registradas.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-2 xs:grid-cols-2 sm:gap-3">
                            <button
                                type="button"
                                onClick={openCreateModal}
                                disabled={categories.length === 0}
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#172861] px-4 text-xs font-bold text-white shadow-sm hover:bg-[#0B163F] disabled:cursor-not-allowed disabled:opacity-60 sm:h-12 sm:rounded-2xl sm:px-5 sm:text-sm [@media(max-height:760px)]:h-10"
                            >
                                <Plus className="h-4 w-4" />
                                Nueva subcategoría
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    if (selectedCategoryId === null) return;

                                    void reloadSubcategories(
                                        selectedCategoryId,
                                        true,
                                    );
                                }}
                                disabled={
                                    isRefreshing ||
                                    isLoadingSubcategories ||
                                    selectedCategoryId === null
                                }
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 text-xs font-bold text-white shadow-sm hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60 sm:h-12 sm:rounded-2xl sm:px-5 sm:text-sm [@media(max-height:760px)]:h-10"
                            >
                                <RefreshCw
                                    className={`h-4 w-4 ${
                                        isRefreshing ? "animate-spin" : ""
                                    }`}
                                />
                                {isRefreshing ? "Actualizando..." : "Actualizar"}
                            </button>
                        </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:mt-5 md:grid-cols-2 md:gap-4">
                        <div>
                            <label className="mb-2 block text-xs font-bold text-slate-700 sm:text-sm">
                                Categoría
                            </label>
                            <select
                                value={selectedCategoryId ?? ""}
                                onChange={handleCategoryFilterChange}
                                disabled={
                                    isLoadingCategories ||
                                    categories.length === 0
                                }
                                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100 sm:h-12 sm:rounded-2xl sm:px-5 sm:text-sm [@media(max-height:760px)]:h-10"
                            >
                                {categories.length === 0 ? (
                                    <option value="">
                                        Sin categorías registradas
                                    </option>
                                ) : null}

                                {categories.map((category) => (
                                    <option key={category.id} value={category.id}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="mb-2 block text-xs font-bold text-slate-700 sm:text-sm">
                                Buscar
                            </label>
                            <input
                                type="text"
                                value={search}
                                onChange={handleSearchChange}
                                placeholder="Buscar por nombre de subcategoría..."
                                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-4 text-xs font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:h-12 sm:rounded-2xl sm:px-5 sm:text-sm [@media(max-height:760px)]:h-10"
                            />
                        </div>
                    </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm sm:rounded-3xl">
                    <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 sm:px-5">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                            {selectedCategoryName}
                        </p>
                    </div>

                    <div className="md:hidden">
                        {isLoadingSubcategories ? (
                            <div className="px-4 py-10 text-center text-sm font-semibold text-slate-500">
                                Cargando subcategorías...
                            </div>
                        ) : filteredSubcategories.length === 0 ? (
                            <div className="px-4 py-10 text-center">
                                <p className="text-sm font-bold text-slate-800">
                                    No hay subcategorías para mostrar.
                                </p>
                                <p className="mt-1 text-xs leading-5 text-slate-500">
                                    {selectedCategoryId === null
                                        ? "Primero crea o selecciona una categoría."
                                        : "Crea una subcategoría o modifica el criterio de búsqueda."}
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {paginatedSubcategories.map((subcategory) => (
                                    <article
                                        key={subcategory.id}
                                        className="space-y-3 p-4"
                                    >
                                        <div className="flex min-w-0 items-center gap-3">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#172861] text-sm font-bold uppercase text-white">
                                                {getSubcategoryInitial(subcategory)}
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-bold text-slate-950">
                                                    {subcategory.name}
                                                </p>
                                                <p className="mt-0.5 text-xs font-medium text-slate-500">
                                                    ID #{subcategory.id}
                                                </p>
                                            </div>

                                            <span className="inline-flex shrink-0 rounded-full bg-blue-100 px-3 py-1 text-[11px] font-bold text-blue-700">
                                                {categoryNameMap.get(
                                                    subcategory.category_id,
                                                ) ??
                                                    `Categoría #${subcategory.category_id}`}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    openEditModal(subcategory)
                                                }
                                                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-blue-200 px-3 text-xs font-bold text-blue-700 hover:bg-blue-50"
                                            >
                                                <Pencil className="h-4 w-4" />
                                                Editar
                                            </button>

                                            <button
                                                type="button"
                                                disabled={
                                                    deletingId === subcategory.id
                                                }
                                                onClick={() =>
                                                    void handleDelete(
                                                        subcategory.id,
                                                    )
                                                }
                                                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-red-200 px-3 text-xs font-bold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                                            >
                                                {deletingId === subcategory.id ? (
                                                    <LoaderCircle className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Trash2 className="h-4 w-4" />
                                                )}
                                                {deletingId === subcategory.id
                                                    ? "Eliminando..."
                                                    : "Eliminar"}
                                            </button>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="hidden overflow-x-auto md:block">
                        <table className="w-full min-w-[760px] table-fixed divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="w-[12%] px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                                        ID
                                    </th>
                                    <th className="w-[42%] px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                                        Subcategoría
                                    </th>
                                    <th className="w-[24%] px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                                        Categoría
                                    </th>
                                    <th className="w-[22%] px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-600">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">
                                {isLoadingSubcategories ? (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="px-4 py-10 text-center text-sm font-semibold text-slate-500"
                                        >
                                            Cargando subcategorías...
                                        </td>
                                    </tr>
                                ) : filteredSubcategories.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="px-4 py-10 text-center"
                                        >
                                            <p className="text-sm font-bold text-slate-800">
                                                No hay subcategorías para mostrar.
                                            </p>
                                            <p className="mt-1 text-sm text-slate-500">
                                                {selectedCategoryId === null
                                                    ? "Primero crea o selecciona una categoría."
                                                    : "Crea una subcategoría o modifica el criterio de búsqueda."}
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedSubcategories.map(
                                        (subcategory) => (
                                            <tr
                                                key={subcategory.id}
                                                className="transition hover:bg-blue-50/40"
                                            >
                                                <td className="px-4 py-3 text-sm font-bold text-slate-950">
                                                    #{subcategory.id}
                                                </td>

                                                <td className="px-4 py-3">
                                                    <div className="flex min-w-0 items-center gap-3">
                                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#172861] text-sm font-bold uppercase text-white">
                                                            {getSubcategoryInitial(
                                                                subcategory,
                                                            )}
                                                        </div>

                                                        <div className="min-w-0">
                                                            <p className="truncate text-sm font-bold text-slate-950">
                                                                {subcategory.name}
                                                            </p>
                                                            <p className="mt-0.5 truncate text-xs font-medium text-slate-500">
                                                                Subcategoría registrada
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-4 py-3">
                                                    <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                                                        {categoryNameMap.get(
                                                            subcategory.category_id,
                                                        ) ??
                                                            `Categoría #${subcategory.category_id}`}
                                                    </span>
                                                </td>

                                                <td className="px-4 py-3">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            type="button"
                                                            title="Editar subcategoría"
                                                            onClick={() =>
                                                                openEditModal(
                                                                    subcategory,
                                                                )
                                                            }
                                                            className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-blue-200 px-3 text-xs font-bold text-blue-700 hover:bg-blue-50"
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                            <span className="hidden lg:inline">
                                                                Editar
                                                            </span>
                                                        </button>

                                                        <button
                                                            type="button"
                                                            title="Eliminar subcategoría"
                                                            disabled={
                                                                deletingId ===
                                                                subcategory.id
                                                            }
                                                            onClick={() =>
                                                                void handleDelete(
                                                                    subcategory.id,
                                                                )
                                                            }
                                                            className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-red-200 px-3 text-xs font-bold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                                                        >
                                                            {deletingId ===
                                                            subcategory.id ? (
                                                                <LoaderCircle className="h-4 w-4 animate-spin" />
                                                            ) : (
                                                                <Trash2 className="h-4 w-4" />
                                                            )}
                                                            <span className="hidden lg:inline">
                                                                {deletingId ===
                                                                subcategory.id
                                                                    ? "Eliminando..."
                                                                    : "Eliminar"}
                                                            </span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ),
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                        <p className="text-center text-xs font-semibold text-slate-500 sm:text-left sm:text-sm">
                            Mostrando {paginatedSubcategories.length} de{" "}
                            {filteredSubcategories.length} subcategorías
                        </p>

                        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 sm:flex">
                            <button
                                type="button"
                                aria-label="Página anterior"
                                onClick={() =>
                                    setCurrentPage((page) =>
                                        Math.max(1, page - 1),
                                    )
                                }
                                disabled={activePage === 1}
                                className="inline-flex h-10 items-center justify-center gap-1 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4 sm:text-sm"
                            >
                                <ChevronLeft className="h-4 w-4" />
                                <span className="hidden sm:inline">Anterior</span>
                            </button>

                            <span className="flex h-10 items-center justify-center whitespace-nowrap rounded-xl bg-slate-100 px-3 text-center text-xs font-bold text-slate-700 sm:px-4 sm:text-sm">
                                Página {activePage} de {totalPages}
                            </span>

                            <button
                                type="button"
                                aria-label="Página siguiente"
                                onClick={() =>
                                    setCurrentPage((page) =>
                                        Math.min(totalPages, page + 1),
                                    )
                                }
                                disabled={activePage === totalPages}
                                className="inline-flex h-10 items-center justify-center gap-1 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4 sm:text-sm"
                            >
                                <span className="hidden sm:inline">Siguiente</span>
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {isModalOpen ? (
                <div
                    className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 backdrop-blur-sm sm:items-center sm:p-4"
                    onClick={closeModal}
                >
                    <div
                        className="max-h-[94dvh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-slate-200 bg-white shadow-2xl sm:max-h-[90vh] sm:rounded-3xl"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="bg-gradient-to-br from-[#07111F] via-[#172861] to-[#F97316] px-4 py-4 text-white sm:px-6 sm:py-5">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-blue-100 sm:text-xs sm:tracking-[0.25em]">
                                        Subcategorías
                                    </p>
                                    <h2 className="mt-2 text-xl font-bold">
                                        {editingSubcategory
                                            ? "Editar subcategoría"
                                            : "Nueva subcategoría"}
                                    </h2>
                                    <p className="mt-1 text-xs leading-5 text-blue-50 sm:text-sm">
                                        Completa la información y guarda los
                                        cambios.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    aria-label="Cerrar modal"
                                    onClick={closeModal}
                                    disabled={isSubmitting}
                                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white ring-1 ring-white/20 hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-60 sm:h-10 sm:w-10"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        {categories.length === 0 ? (
                            <div className="p-4 sm:p-6">
                                <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-4 text-xs font-semibold leading-5 text-orange-700 sm:rounded-2xl sm:text-sm">
                                    Primero debes crear al menos una categoría.
                                </div>
                            </div>
                        ) : (
                            <form
                                onSubmit={handleSubmit}
                                className="space-y-4 p-4 sm:space-y-5 sm:p-6"
                            >
                                {error ? (
                                    <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-3 text-xs font-bold leading-5 text-red-700 sm:rounded-2xl sm:px-4 sm:text-sm">
                                        {error}
                                    </div>
                                ) : null}

                                <div>
                                    <label
                                        htmlFor="subcategory-name"
                                        className="mb-2 block text-xs font-bold text-slate-700 sm:text-sm"
                                    >
                                        Nombre de la subcategoría
                                    </label>
                                    <input
                                        id="subcategory-name"
                                        type="text"
                                        value={name}
                                        onChange={(event) =>
                                            setName(event.target.value)
                                        }
                                        placeholder="Ej. Frontend"
                                        autoFocus
                                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:h-12 sm:rounded-2xl sm:px-5"
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="subcategory-category"
                                        className="mb-2 block text-xs font-bold text-slate-700 sm:text-sm"
                                    >
                                        Categoría
                                    </label>
                                    <select
                                        id="subcategory-category"
                                        value={formCategoryId ?? ""}
                                        onChange={(event) =>
                                            setFormCategoryId(
                                                Number(event.target.value),
                                            )
                                        }
                                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:h-12 sm:rounded-2xl sm:px-5"
                                    >
                                        {categories.map((category) => (
                                            <option
                                                key={category.id}
                                                value={category.id}
                                            >
                                                {category.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-1 gap-2 border-t border-slate-200 pt-4 sm:grid-cols-2 sm:gap-3 sm:pt-5">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        disabled={isSubmitting}
                                        className="h-11 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 sm:h-12 sm:rounded-2xl"
                                    >
                                        Cancelar
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#172861] px-4 text-sm font-bold text-white shadow-sm hover:bg-[#0B163F] disabled:cursor-not-allowed disabled:opacity-60 sm:h-12 sm:rounded-2xl"
                                    >
                                        {isSubmitting ? (
                                            <LoaderCircle className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <FolderTree className="h-4 w-4" />
                                        )}
                                        {isSubmitting
                                            ? "Guardando..."
                                            : editingSubcategory
                                              ? "Actualizar"
                                              : "Crear subcategoría"}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            ) : null}
        </>
    );
}
