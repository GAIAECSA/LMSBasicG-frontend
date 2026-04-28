"use client";

import { useEffect, useMemo, useState } from "react";
import {
    createCategory,
    deleteCategory,
    getCategories,
    updateCategory,
    type Category,
} from "@/services/categories.service";

const ITEMS_PER_PAGE = 5;

export default function CourseCategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [name, setName] = useState("");
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const filteredCategories = useMemo(() => {
        const searchValue = search.trim().toLowerCase();

        if (!searchValue) return categories;

        return categories.filter((category) =>
            category.name.toLowerCase().includes(searchValue),
        );
    }, [categories, search]);

    const totalCategories = categories.length;

    const totalPages = Math.max(
        1,
        Math.ceil(filteredCategories.length / ITEMS_PER_PAGE),
    );

    const safeCurrentPage = Math.min(currentPage, totalPages);

    const paginatedCategories = useMemo(() => {
        const start = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
        const end = start + ITEMS_PER_PAGE;

        return filteredCategories.slice(start, end);
    }, [filteredCategories, safeCurrentPage]);

    const pageNumbers = Array.from(
        { length: totalPages },
        (_, index) => index + 1,
    );

    function resetForm() {
        setEditingCategory(null);
        setName("");
    }

    function openCreateModal() {
        resetForm();
        setError("");
        setSuccess("");
        setIsModalOpen(true);
    }

    function openEditModal(category: Category) {
        setEditingCategory(category);
        setName(category.name);
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

    async function reloadCategories() {
        try {
            setLoading(true);
            setError("");

            const data = await getCategories();
            setCategories(data);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "No se pudieron cargar las categorías.",
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        let cancelled = false;

        async function bootstrap() {
            try {
                const data = await getCategories();

                if (cancelled) return;
                setCategories(data);
            } catch (err) {
                if (cancelled) return;

                setError(
                    err instanceof Error
                        ? err.message
                        : "No se pudieron cargar las categorías.",
                );
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        void bootstrap();

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (!error && !success) return;

        const timeout = window.setTimeout(() => {
            setError("");
            setSuccess("");
        }, 3000);

        return () => window.clearTimeout(timeout);
    }, [error, success]);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const trimmedName = name.trim();

        if (!trimmedName) {
            setError("El nombre de la categoría es obligatorio.");
            return;
        }

        try {
            setSubmitting(true);
            setError("");
            setSuccess("");

            if (editingCategory) {
                const updated = await updateCategory(editingCategory.id, {
                    name: trimmedName,
                });

                setCategories((prev) =>
                    prev.map((item) =>
                        item.id === editingCategory.id ? updated : item,
                    ),
                );

                setSuccess("Categoría actualizada correctamente.");
            } else {
                const created = await createCategory({
                    name: trimmedName,
                });

                setCategories((prev) => [...prev, created]);
                setSuccess("Categoría creada correctamente.");
            }

            setIsModalOpen(false);
            resetForm();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "No se pudo guardar la categoría.",
            );
        } finally {
            setSubmitting(false);
        }
    }

    async function handleDelete(categoryId: number) {
        const confirmed = window.confirm(
            "¿Seguro que deseas eliminar esta categoría?",
        );

        if (!confirmed) return;

        try {
            setDeletingId(categoryId);
            setError("");
            setSuccess("");

            await deleteCategory(categoryId);

            setCategories((prev) =>
                prev.filter((category) => category.id !== categoryId),
            );

            setSuccess("Categoría eliminada correctamente.");
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "No se pudo eliminar la categoría.",
            );
        } finally {
            setDeletingId(null);
        }
    }

    function handleSearchChange(event: React.ChangeEvent<HTMLInputElement>) {
        setSearch(event.target.value);
        setCurrentPage(1);
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
                                Categorías
                            </h1>
                            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                                Administra las categorías del sistema desde una vista compacta.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={openCreateModal}
                                className="inline-flex items-center justify-center rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                            >
                                + Nueva categoría
                            </button>

                            <button
                                type="button"
                                onClick={() => void reloadCategories()}
                                disabled={loading}
                                className="inline-flex items-center justify-center rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--muted)] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {loading ? "Cargando..." : "Recargar"}
                            </button>
                        </div>
                    </div>

                    <div className="mt-3 grid gap-3 md:grid-cols-[190px_minmax(0,1fr)]">
                        <div className="rounded-xl bg-[var(--muted)]/40 p-3">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
                                Total de categorías
                            </p>
                            <p className="mt-1 text-2xl font-bold leading-none text-[var(--foreground)]">
                                {totalCategories}
                            </p>
                        </div>

                        <div className="rounded-xl bg-[var(--muted)]/40 p-3">
                            <label
                                htmlFor="category-search"
                                className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-foreground)]"
                            >
                                Buscar categoría
                            </label>
                            <input
                                id="category-search"
                                type="text"
                                value={search}
                                onChange={handleSearchChange}
                                placeholder="Escribe el nombre de una categoría..."
                                className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15"
                            />
                        </div>
                    </div>
                </div>

                {error ? (
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
                                Listado de categorías
                            </h2>
                            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                                Visualiza y administra las categorías registradas.
                            </p>
                        </div>

                        <div className="rounded-2xl bg-[var(--muted)]/40 px-3 py-2 text-sm font-semibold text-[var(--foreground)]">
                            Mostrando {paginatedCategories.length} de {filteredCategories.length}
                        </div>
                    </div>

                    {loading ? (
                        <div className="px-5 py-10 text-sm text-[var(--muted-foreground)]">
                            Cargando categorías...
                        </div>
                    ) : filteredCategories.length === 0 ? (
                        <div className="px-5 py-10 text-sm text-[var(--muted-foreground)]">
                            {categories.length === 0
                                ? "No hay categorías registradas todavía."
                                : "No se encontraron categorías con ese criterio de búsqueda."}
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
                                                Estado
                                            </th>
                                            <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                                                Acciones
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-[var(--border)]">
                                        {paginatedCategories.map((category) => (
                                            <tr
                                                key={category.id}
                                                className="transition-colors hover:bg-[var(--muted)]/20"
                                            >
                                                <td className="px-4 py-3 text-sm font-semibold text-[var(--foreground)]">
                                                    #{category.id}
                                                </td>

                                                <td className="px-4 py-3">
                                                    <div>
                                                        <p className="font-semibold text-[var(--foreground)]">
                                                            {category.name}
                                                        </p>
                                                        <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                                                            Categoría registrada en el sistema
                                                        </p>
                                                    </div>
                                                </td>

                                                <td className="px-4 py-3">
                                                    <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                                                        Activa
                                                    </span>
                                                </td>

                                                <td className="px-4 py-3">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => openEditModal(category)}
                                                            className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--muted)]"
                                                        >
                                                            Editar
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                void handleDelete(category.id)
                                                            }
                                                            disabled={deletingId === category.id}
                                                            className="rounded-xl bg-red-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                                                        >
                                                            {deletingId === category.id
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
                                    Categorías
                                </p>
                                <h2 className="mt-1 text-xl font-bold text-[var(--foreground)]">
                                    {editingCategory
                                        ? "Editar categoría"
                                        : "Nueva categoría"}
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

                        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                            <div className="space-y-2">
                                <label
                                    htmlFor="category-name"
                                    className="text-sm font-semibold text-[var(--foreground)]"
                                >
                                    Nombre de la categoría
                                </label>
                                <input
                                    id="category-name"
                                    type="text"
                                    value={name}
                                    onChange={(event) => setName(event.target.value)}
                                    placeholder="Ej. Programación"
                                    className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15"
                                />
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
                                    className="inline-flex min-w-[150px] items-center justify-center rounded-2xl bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {submitting
                                        ? "Guardando..."
                                        : editingCategory
                                            ? "Actualizar"
                                            : "Crear categoría"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}
        </>
    );
}