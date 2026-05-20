"use client";

import {
    useCallback,
    useEffect,
    useMemo,
    useState,
    type ChangeEvent,
    type FormEvent,
} from "react";
import { getCategories, type Category } from "@/services/categories.service";
import {
    createSubcategory,
    deleteSubcategory,
    getSubcategoriesByCategory,
    updateSubcategory,
    type Subcategory,
} from "@/services/subcategories.service";

const ITEMS_PER_PAGE = 5;

export default function CourseSubcategoriesPage() {
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
                });

                setSuccess("Subcategoría actualizada correctamente.");
            } else {
                await createSubcategory({
                    name: trimmedName,
                    category_id: formCategoryId,
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
            <section className="space-y-6">
                <div className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#07111F] via-[#172861] via-70% to-[#F97316] p-6 text-white shadow-lg">
                    <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                        <div>
                            <p className="text-sm font-medium uppercase tracking-[0.25em] text-blue-100">
                                Gestión de cursos
                            </p>

                            <h2 className="mt-3 text-2xl font-bold md:text-3xl">
                                Subcategorías
                            </h2>

                            <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-50">
                                Administra las subcategorías asociadas a cada
                                categoría para organizar mejor los cursos de la
                                plataforma.
                            </p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[520px]">
                            <div className="rounded-2xl bg-white/15 p-4 ring-1 ring-white/20">
                                <p className="text-xs font-bold uppercase tracking-wide text-white/75">
                                    Categorías
                                </p>
                                <p className="mt-2 text-3xl font-bold">
                                    {isLoadingCategories
                                        ? "..."
                                        : stats.categories}
                                </p>
                            </div>

                            <div className="rounded-2xl bg-white/15 p-4 ring-1 ring-white/20">
                                <p className="text-xs font-bold uppercase tracking-wide text-white/75">
                                    Listadas
                                </p>
                                <p className="mt-2 text-3xl font-bold">
                                    {isLoadingSubcategories
                                        ? "..."
                                        : stats.total}
                                </p>
                            </div>

                            <div className="rounded-2xl bg-white/15 p-4 ring-1 ring-white/20">
                                <p className="text-xs font-bold uppercase tracking-wide text-white/75">
                                    Coincidencias
                                </p>
                                <p className="mt-2 text-3xl font-bold">
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
                        className={`rounded-2xl border px-5 py-4 text-sm font-semibold ${error
                                ? "border-red-200 bg-red-50 text-red-700"
                                : "border-emerald-200 bg-emerald-50 text-emerald-700"
                            }`}
                    >
                        {error || success}
                    </div>
                ) : null}

                <div className="rounded-3xl border border-[var(--border)] bg-white p-5 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-slate-950">
                                Filtros de subcategorías
                            </h3>

                            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                                Selecciona una categoría y busca las
                                subcategorías registradas.
                            </p>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row">
                            <button
                                type="button"
                                onClick={openCreateModal}
                                disabled={categories.length === 0}
                                className="h-12 rounded-2xl bg-[#172861] px-5 text-sm font-bold text-white shadow-sm transition hover:bg-[#0B163F] disabled:cursor-not-allowed disabled:opacity-60"
                            >
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
                                className="h-12 rounded-2xl bg-orange-500 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {isRefreshing ? "Actualizando..." : "Actualizar"}
                            </button>
                        </div>
                    </div>

                    <div className="mt-5 grid gap-3 lg:grid-cols-[280px_1fr]">
                        <select
                            value={selectedCategoryId ?? ""}
                            onChange={handleCategoryFilterChange}
                            disabled={
                                isLoadingCategories || categories.length === 0
                            }
                            className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-60"
                        >
                            <option value="" disabled>
                                Selecciona una categoría
                            </option>

                            {categories.map((category) => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>

                        <input
                            type="text"
                            value={search}
                            onChange={handleSearchChange}
                            placeholder="Buscar por nombre de subcategoría..."
                            className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        />
                    </div>
                </div>

                <div className="overflow-hidden rounded-3xl border border-[var(--border)] bg-white shadow-sm">
                    <div className="border-b border-slate-200 px-5 py-4">
                        <h3 className="text-lg font-bold text-slate-950">
                            Listado de subcategorías
                        </h3>

                        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                            Visualiza las subcategorías de{" "}
                            <span className="font-semibold text-slate-700">
                                {selectedCategoryName}
                            </span>
                            .
                        </p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                                        ID
                                    </th>

                                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                                        Subcategoría
                                    </th>

                                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                                        Categoría
                                    </th>

                                    <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-600">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">
                                {isLoadingCategories ? (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="px-5 py-12 text-center text-sm font-semibold text-slate-500"
                                        >
                                            Cargando categorías...
                                        </td>
                                    </tr>
                                ) : categories.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="px-5 py-12 text-center"
                                        >
                                            <p className="text-sm font-bold text-slate-800">
                                                No hay categorías registradas.
                                            </p>
                                            <p className="mt-1 text-sm text-slate-500">
                                                Primero debes crear una categoría
                                                para poder registrar
                                                subcategorías.
                                            </p>
                                        </td>
                                    </tr>
                                ) : isLoadingSubcategories ? (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="px-5 py-12 text-center text-sm font-semibold text-slate-500"
                                        >
                                            Cargando subcategorías...
                                        </td>
                                    </tr>
                                ) : filteredSubcategories.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="px-5 py-12 text-center"
                                        >
                                            <p className="text-sm font-bold text-slate-800">
                                                No hay subcategorías para
                                                mostrar.
                                            </p>
                                            <p className="mt-1 text-sm text-slate-500">
                                                {subcategories.length === 0
                                                    ? "No hay subcategorías registradas para esta categoría."
                                                    : "No se encontraron subcategorías con ese criterio de búsqueda."}
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
                                                <td className="px-5 py-4 text-sm font-bold text-slate-950">
                                                    #{subcategory.id}
                                                </td>

                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#172861] text-sm font-bold uppercase text-white">
                                                            {(subcategory.name ||
                                                                "S")
                                                                .charAt(0)
                                                                .toUpperCase()}
                                                        </div>

                                                        <div>
                                                            <p className="text-sm font-bold text-slate-950">
                                                                {
                                                                    subcategory.name
                                                                }
                                                            </p>
                                                            <p className="mt-0.5 text-xs font-medium text-slate-500">
                                                                Subcategoría
                                                                registrada en
                                                                el sistema
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                                                        {categoryNameMap.get(
                                                            subcategory.category_id,
                                                        ) ??
                                                            `Categoría #${subcategory.category_id}`}
                                                    </span>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                openEditModal(
                                                                    subcategory,
                                                                )
                                                            }
                                                            className="rounded-xl border border-blue-200 px-3 py-2 text-xs font-bold text-blue-700 transition hover:bg-blue-50"
                                                        >
                                                            Editar
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                void handleDelete(
                                                                    subcategory.id,
                                                                )
                                                            }
                                                            disabled={
                                                                deletingId ===
                                                                subcategory.id
                                                            }
                                                            className="rounded-xl border border-red-200 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                                                        >
                                                            {deletingId ===
                                                                subcategory.id
                                                                ? "Eliminando..."
                                                                : "Eliminar"}
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

                    <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm font-semibold text-slate-500">
                            Mostrando {paginatedSubcategories.length} de{" "}
                            {filteredSubcategories.length} subcategorías
                        </p>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() =>
                                    setCurrentPage((page) =>
                                        Math.max(1, page - 1),
                                    )
                                }
                                disabled={activePage === 1}
                                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Anterior
                            </button>

                            <span className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700">
                                Página {activePage} de {totalPages}
                            </span>

                            <button
                                type="button"
                                onClick={() =>
                                    setCurrentPage((page) =>
                                        Math.min(totalPages, page + 1),
                                    )
                                }
                                disabled={activePage === totalPages}
                                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Siguiente
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {isModalOpen ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-sm">
                    <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
                        <div className="bg-gradient-to-br from-[#07111F] via-[#172861] to-[#F97316] px-6 py-5 text-white">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-100">
                                        Subcategorías
                                    </p>

                                    <h2 className="mt-2 text-xl font-bold">
                                        {editingSubcategory
                                            ? "Editar subcategoría"
                                            : "Nueva subcategoría"}
                                    </h2>

                                    <p className="mt-1 text-sm text-blue-50">
                                        Completa la información y guarda los
                                        cambios.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={closeModal}
                                    disabled={isSubmitting}
                                    className="rounded-2xl bg-white/15 px-3 py-1 text-sm font-bold text-white ring-1 ring-white/20 transition hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    X
                                </button>
                            </div>
                        </div>

                        {categories.length === 0 ? (
                            <div className="p-6">
                                <div className="rounded-2xl border border-orange-200 bg-orange-50 px-4 py-4 text-sm font-semibold text-orange-700">
                                    Primero debes crear al menos una categoría.
                                </div>
                            </div>
                        ) : (
                            <form
                                onSubmit={handleSubmit}
                                className="space-y-5 p-6"
                            >
                                {error ? (
                                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                                        {error}
                                    </div>
                                ) : null}

                                <div>
                                    <label
                                        htmlFor="subcategory-name"
                                        className="mb-2 block text-sm font-bold text-slate-700"
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
                                        className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="subcategory-category"
                                        className="mb-2 block text-sm font-bold text-slate-700"
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
                                        className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
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

                                <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        disabled={isSubmitting}
                                        className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        Cancelar
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="rounded-2xl bg-[#172861] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#0B163F] disabled:cursor-not-allowed disabled:opacity-60"
                                    >
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