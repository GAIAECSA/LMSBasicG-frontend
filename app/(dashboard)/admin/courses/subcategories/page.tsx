"use client";

import { useEffect, useMemo, useState } from "react";
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

export default function CourseSubcategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [subcategories, setSubcategories] = useState<Subcategory[]>([]);

    const [loadingCategories, setLoadingCategories] = useState(true);
    const [loadingSubcategories, setLoadingSubcategories] = useState(true);
    const [submitting, setSubmitting] = useState(false);
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
        return new Map(categories.map((category) => [category.id, category.name]));
    }, [categories]);

    const selectedCategoryName =
        selectedCategoryId !== null
            ? (categoryNameMap.get(selectedCategoryId) ??
                `Categoría #${selectedCategoryId}`)
            : "Sin categoría seleccionada";

    const filteredSubcategories = useMemo(() => {
        const searchValue = search.trim().toLowerCase();

        if (!searchValue) return subcategories;

        return subcategories.filter((subcategory) =>
            subcategory.name.toLowerCase().includes(searchValue),
        );
    }, [subcategories, search]);

    const totalPages = Math.max(
        1,
        Math.ceil(filteredSubcategories.length / ITEMS_PER_PAGE),
    );

    const safeCurrentPage = Math.min(currentPage, totalPages);

    const paginatedSubcategories = useMemo(() => {
        const start = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
        const end = start + ITEMS_PER_PAGE;

        return filteredSubcategories.slice(start, end);
    }, [filteredSubcategories, safeCurrentPage]);

    const pageNumbers = Array.from(
        { length: totalPages },
        (_, index) => index + 1,
    );

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
        setName(subcategory.name);
        setFormCategoryId(subcategory.category_id);
        setError("");
        setSuccess("");
        setIsModalOpen(true);
    }

    function closeModal() {
        if (submitting) return;

        setIsModalOpen(false);
        resetForm();
        setError("");
    }

    async function reloadSubcategories(categoryId: number) {
        try {
            setLoadingSubcategories(true);
            setError("");

            const data = await getSubcategoriesByCategory(categoryId);
            setSubcategories(data);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "No se pudieron cargar las subcategorías.",
            );
            setSubcategories([]);
        } finally {
            setLoadingSubcategories(false);
        }
    }

    useEffect(() => {
        let cancelled = false;

        async function bootstrap() {
            try {
                const categoryData = await getCategories();

                if (cancelled) return;

                setCategories(categoryData);

                if (categoryData.length === 0) {
                    setSelectedCategoryId(null);
                    setFormCategoryId(null);
                    setSubcategories([]);
                    setLoadingSubcategories(false);
                    return;
                }

                const firstCategoryId = categoryData[0].id;
                setSelectedCategoryId(firstCategoryId);
                setFormCategoryId(firstCategoryId);
            } catch (err) {
                if (cancelled) return;

                setError(
                    err instanceof Error
                        ? err.message
                        : "No se pudieron cargar las categorías.",
                );
                setSubcategories([]);
                setLoadingSubcategories(false);
            } finally {
                if (!cancelled) {
                    setLoadingCategories(false);
                }
            }
        }

        void bootstrap();

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (selectedCategoryId === null) return;

        const categoryId = selectedCategoryId;
        let cancelled = false;

        async function fetchSubcategories(categoryId: number) {
            try {
                const data = await getSubcategoriesByCategory(categoryId);

                if (cancelled) return;
                setSubcategories(data);
            } catch (err) {
                if (cancelled) return;

                setError(
                    err instanceof Error
                        ? err.message
                        : "No se pudieron cargar las subcategorías.",
                );
                setSubcategories([]);
            } finally {
                if (!cancelled) {
                    setLoadingSubcategories(false);
                }
            }
        }

        void fetchSubcategories(categoryId);

        return () => {
            cancelled = true;
        };
    }, [selectedCategoryId]);

    useEffect(() => {
        if (!error && !success) return;

        const timeout = window.setTimeout(() => {
            setError("");
            setSuccess("");
        }, 3000);

        return () => window.clearTimeout(timeout);
    }, [error, success]);

    function handleCategoryFilterChange(
        event: React.ChangeEvent<HTMLSelectElement>,
    ) {
        const nextCategoryId = Number(event.target.value);

        setSelectedCategoryId(nextCategoryId);
        setLoadingSubcategories(true);
        setSubcategories([]);
        setCurrentPage(1);

        if (!editingSubcategory) {
            setFormCategoryId(nextCategoryId);
        }
    }

    function handleSearchChange(event: React.ChangeEvent<HTMLInputElement>) {
        setSearch(event.target.value);
        setCurrentPage(1);
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const trimmedName = name.trim();

        if (!trimmedName) {
            setError("El nombre de la subcategoría es obligatorio.");
            return;
        }

        const currentFormCategoryId = formCategoryId;

        if (currentFormCategoryId === null) {
            setError("Debes seleccionar una categoría.");
            return;
        }

        try {
            setSubmitting(true);
            setError("");
            setSuccess("");

            if (editingSubcategory) {
                await updateSubcategory(editingSubcategory.id, {
                    name: trimmedName,
                    category_id: currentFormCategoryId,
                });

                setSuccess("Subcategoría actualizada correctamente.");
            } else {
                await createSubcategory({
                    name: trimmedName,
                    category_id: currentFormCategoryId,
                });

                setSuccess("Subcategoría creada correctamente.");
            }

            if (selectedCategoryId === currentFormCategoryId) {
                await reloadSubcategories(currentFormCategoryId);
            } else {
                setSelectedCategoryId(currentFormCategoryId);
                setLoadingSubcategories(true);
                setSubcategories([]);
            }

            setCurrentPage(1);
            setIsModalOpen(false);
            resetForm(currentFormCategoryId);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "No se pudo guardar la subcategoría.",
            );
        } finally {
            setSubmitting(false);
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

            const currentSelectedCategoryId = selectedCategoryId;

            if (currentSelectedCategoryId !== null) {
                await reloadSubcategories(currentSelectedCategoryId);
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

    function goToPreviousPage() {
        setCurrentPage((prev) => Math.max(1, prev - 1));
    }

    function goToNextPage() {
        setCurrentPage((prev) => Math.min(totalPages, prev + 1));
    }

    function goToPage(page: number) {
        setCurrentPage(page);
    }

    return (
        <>
            <section className="mx-auto w-full max-w-6xl space-y-4">
                <div className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="min-w-0">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--primary)]">
                                Gestión de cursos
                            </p>
                            <h1 className="mt-1 text-2xl font-bold leading-tight text-[var(--foreground)]">
                                Subcategorías
                            </h1>
                            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                                Administra las subcategorías por categoría desde una vista compacta.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={openCreateModal}
                                disabled={categories.length === 0}
                                className="inline-flex items-center justify-center rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                + Nueva subcategoría
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    const currentSelectedCategoryId = selectedCategoryId;

                                    if (currentSelectedCategoryId === null) return;

                                    void reloadSubcategories(currentSelectedCategoryId);
                                }}
                                disabled={loadingSubcategories || selectedCategoryId === null}
                                className="inline-flex items-center justify-center rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--muted)] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {loadingSubcategories ? "Cargando..." : "Recargar"}
                            </button>
                        </div>
                    </div>

                    <div className="mt-3 grid gap-3 md:grid-cols-[180px_220px_minmax(0,1fr)]">
                        <div className="rounded-xl bg-[var(--muted)]/40 p-3">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
                                Total listadas
                            </p>
                            <p className="mt-1 text-2xl font-bold leading-none text-[var(--foreground)]">
                                {subcategories.length}
                            </p>
                        </div>

                        <div className="rounded-xl bg-[var(--muted)]/40 p-3">
                            <label
                                htmlFor="subcategory-filter-category"
                                className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-foreground)]"
                            >
                                Categoría activa
                            </label>
                            <select
                                id="subcategory-filter-category"
                                value={selectedCategoryId ?? ""}
                                onChange={handleCategoryFilterChange}
                                disabled={loadingCategories || categories.length === 0}
                                className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {categories.map((category) => (
                                    <option key={category.id} value={category.id}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="rounded-xl bg-[var(--muted)]/40 p-3">
                            <label
                                htmlFor="subcategory-search"
                                className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-foreground)]"
                            >
                                Buscar subcategoría
                            </label>
                            <input
                                id="subcategory-search"
                                type="text"
                                value={search}
                                onChange={handleSearchChange}
                                placeholder="Escribe el nombre de una subcategoría..."
                                className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15"
                            />
                        </div>
                    </div>
                </div>

                {error && !isModalOpen ? (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
                        {error}
                    </div>
                ) : null}

                {success ? (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 shadow-sm">
                        {success}
                    </div>
                ) : null}

                <div className="overflow-hidden rounded-3xl border border-[var(--border)] bg-white shadow-sm">
                    <div className="flex flex-col gap-3 border-b border-[var(--border)] px-5 py-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-[var(--foreground)]">
                                Listado de subcategorías
                            </h2>
                            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                                Visualiza las subcategorías de {selectedCategoryName}.
                            </p>
                        </div>

                        <div className="rounded-2xl bg-[var(--muted)]/40 px-3 py-2 text-sm font-semibold text-[var(--foreground)]">
                            Mostrando {paginatedSubcategories.length} de {filteredSubcategories.length}
                        </div>
                    </div>

                    {loadingCategories ? (
                        <div className="px-5 py-10 text-sm text-[var(--muted-foreground)]">
                            Cargando categorías...
                        </div>
                    ) : categories.length === 0 ? (
                        <div className="px-5 py-10 text-sm text-[var(--muted-foreground)]">
                            No hay categorías registradas todavía.
                        </div>
                    ) : loadingSubcategories ? (
                        <div className="px-5 py-10 text-sm text-[var(--muted-foreground)]">
                            Cargando subcategorías...
                        </div>
                    ) : filteredSubcategories.length === 0 ? (
                        <div className="px-5 py-10 text-sm text-[var(--muted-foreground)]">
                            {subcategories.length === 0
                                ? "No hay subcategorías registradas para esta categoría."
                                : "No se encontraron subcategorías con ese criterio de búsqueda."}
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-[var(--border)]">
                                    <thead className="bg-[var(--muted)]/35">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                                                ID
                                            </th>
                                            <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                                                Nombre
                                            </th>
                                            <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                                                Categoría
                                            </th>
                                            <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                                                Acciones
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-[var(--border)]">
                                        {paginatedSubcategories.map((subcategory) => (
                                            <tr
                                                key={subcategory.id}
                                                className="transition-colors hover:bg-[var(--muted)]/20"
                                            >
                                                <td className="px-4 py-3 text-sm font-semibold text-[var(--foreground)]">
                                                    #{subcategory.id}
                                                </td>

                                                <td className="px-4 py-3">
                                                    <div>
                                                        <p className="font-semibold text-[var(--foreground)]">
                                                            {subcategory.name}
                                                        </p>
                                                        <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                                                            Subcategoría registrada en el sistema
                                                        </p>
                                                    </div>
                                                </td>

                                                <td className="px-4 py-3">
                                                    <span className="rounded-full bg-[var(--primary)]/10 px-2.5 py-1 text-xs font-semibold text-[var(--primary)]">
                                                        {categoryNameMap.get(subcategory.category_id) ??
                                                            `Categoría #${subcategory.category_id}`}
                                                    </span>
                                                </td>

                                                <td className="px-4 py-3">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => openEditModal(subcategory)}
                                                            className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--muted)]"
                                                        >
                                                            Editar
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                void handleDelete(subcategory.id)
                                                            }
                                                            disabled={deletingId === subcategory.id}
                                                            className="rounded-xl bg-red-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                                                        >
                                                            {deletingId === subcategory.id
                                                                ? "Eliminando..."
                                                                : "Eliminar"}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="flex flex-col gap-3 border-t border-[var(--border)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-sm text-[var(--muted-foreground)]">
                                    Página {safeCurrentPage} de {totalPages}
                                </p>

                                <div className="flex flex-wrap items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={goToPreviousPage}
                                        disabled={safeCurrentPage === 1}
                                        className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--muted)] disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        Anterior
                                    </button>

                                    {pageNumbers.map((page) => (
                                        <button
                                            key={page}
                                            type="button"
                                            onClick={() => goToPage(page)}
                                            className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${page === safeCurrentPage
                                                    ? "bg-[var(--primary)] text-white"
                                                    : "border border-[var(--border)] bg-white text-[var(--foreground)] hover:bg-[var(--muted)]"
                                                }`}
                                        >
                                            {page}
                                        </button>
                                    ))}

                                    <button
                                        type="button"
                                        onClick={goToNextPage}
                                        disabled={safeCurrentPage === totalPages}
                                        className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--muted)] disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        Siguiente
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </section>

            {isModalOpen ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6">
                    <div className="w-full max-w-md rounded-3xl border border-[var(--border)] bg-white p-5 shadow-2xl">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">
                                    Subcategorías
                                </p>
                                <h2 className="mt-1 text-xl font-bold text-[var(--foreground)]">
                                    {editingSubcategory
                                        ? "Editar subcategoría"
                                        : "Nueva subcategoría"}
                                </h2>
                                <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                                    Completa la información y guarda los cambios.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={closeModal}
                                disabled={submitting}
                                className="rounded-full border border-[var(--border)] px-3 py-1 text-sm font-semibold text-[var(--muted-foreground)] transition hover:bg-[var(--muted)] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                ✕
                            </button>
                        </div>

                        {error && isModalOpen ? (
                            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                {error}
                            </div>
                        ) : null}

                        {categories.length === 0 ? (
                            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-700">
                                Primero debes crear al menos una categoría.
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                                <div className="space-y-2">
                                    <label
                                        htmlFor="subcategory-name"
                                        className="text-sm font-semibold text-[var(--foreground)]"
                                    >
                                        Nombre de la subcategoría
                                    </label>
                                    <input
                                        id="subcategory-name"
                                        type="text"
                                        value={name}
                                        onChange={(event) => setName(event.target.value)}
                                        placeholder="Ej. Frontend"
                                        className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label
                                        htmlFor="subcategory-category"
                                        className="text-sm font-semibold text-[var(--foreground)]"
                                    >
                                        Categoría
                                    </label>
                                    <select
                                        id="subcategory-category"
                                        value={formCategoryId ?? ""}
                                        onChange={(event) =>
                                            setFormCategoryId(Number(event.target.value))
                                        }
                                        className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15"
                                    >
                                        {categories.map((category) => (
                                            <option key={category.id} value={category.id}>
                                                {category.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex flex-wrap justify-end gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        disabled={submitting}
                                        className="inline-flex min-w-[110px] items-center justify-center rounded-2xl border border-[var(--border)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--muted)] disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        Cancelar
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="inline-flex min-w-[160px] items-center justify-center rounded-2xl bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {submitting
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