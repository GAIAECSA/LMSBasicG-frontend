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
    createCategory,
    deleteCategory,
    getCategories,
    updateCategory,
    type Category,
} from "@/services/categories.service";

const ITEMS_PER_PAGE = 5;

export default function CourseCategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(
        null,
    );
    const [name, setName] = useState("");
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const reloadCategories = useCallback(async (showSuccess = false) => {
        try {
            if (showSuccess) {
                setIsRefreshing(true);
            } else {
                setIsLoading(true);
            }

            setError("");

            const data = await getCategories();

            setCategories(Array.isArray(data) ? data : []);
            setCurrentPage(1);

            if (showSuccess) {
                setSuccess("Lista de categorías actualizada correctamente.");
            }
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "No se pudieron cargar las categorías.",
            );
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void reloadCategories();
        }, 0);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [reloadCategories]);

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

    const filteredCategories = useMemo(() => {
        const searchValue = search.trim().toLowerCase();

        if (!searchValue) return categories;

        return categories.filter((category) =>
            (category.name || "").toLowerCase().includes(searchValue),
        );
    }, [categories, search]);

    const totalPages = Math.max(
        1,
        Math.ceil(filteredCategories.length / ITEMS_PER_PAGE),
    );

    const activePage = Math.min(currentPage, totalPages);

    const paginatedCategories = useMemo(() => {
        const startIndex = (activePage - 1) * ITEMS_PER_PAGE;

        return filteredCategories.slice(
            startIndex,
            startIndex + ITEMS_PER_PAGE,
        );
    }, [filteredCategories, activePage]);

    const stats = useMemo(() => {
        return {
            total: categories.length,
            filtered: filteredCategories.length,
            active: categories.length,
        };
    }, [categories.length, filteredCategories.length]);

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
        setName(category.name || "");
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

    function handleSearchChange(event: ChangeEvent<HTMLInputElement>) {
        setSearch(event.target.value);
        setCurrentPage(1);
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const trimmedName = name.trim();

        if (!trimmedName) {
            setError("El nombre de la categoría es obligatorio.");
            return;
        }

        try {
            setIsSubmitting(true);
            setError("");
            setSuccess("");

            if (editingCategory) {
                const updated = await updateCategory(editingCategory.id, {
                    name: trimmedName,
                });

                setCategories((current) =>
                    current.map((item) =>
                        item.id === editingCategory.id ? updated : item,
                    ),
                );

                setSuccess("Categoría actualizada correctamente.");
            } else {
                const created = await createCategory({
                    name: trimmedName,
                });

                setCategories((current) => [created, ...current]);
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
            setIsSubmitting(false);
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

            setCategories((current) =>
                current.filter((category) => category.id !== categoryId),
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
                                Categorías
                            </h2>

                            <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-50">
                                Administra las categorías usadas para organizar
                                los cursos dentro de la plataforma.
                            </p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[460px]">
                            <div className="rounded-2xl bg-white/15 p-4 ring-1 ring-white/20">
                                <p className="text-xs font-bold uppercase tracking-wide text-white/75">
                                    Total
                                </p>
                                <p className="mt-2 text-3xl font-bold">
                                    {isLoading ? "..." : stats.total}
                                </p>
                            </div>

                            <div className="rounded-2xl bg-white/15 p-4 ring-1 ring-white/20">
                                <p className="text-xs font-bold uppercase tracking-wide text-white/75">
                                    Activas
                                </p>
                                <p className="mt-2 text-3xl font-bold">
                                    {isLoading ? "..." : stats.active}
                                </p>
                            </div>

                            <div className="rounded-2xl bg-white/15 p-4 ring-1 ring-white/20">
                                <p className="text-xs font-bold uppercase tracking-wide text-white/75">
                                    Coincidencias
                                </p>
                                <p className="mt-2 text-3xl font-bold">
                                    {isLoading ? "..." : stats.filtered}
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
                                Lista de categorías
                            </h3>

                            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                                Busca, crea, edita o elimina categorías del
                                sistema.
                            </p>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row">
                            <button
                                type="button"
                                onClick={openCreateModal}
                                className="h-12 rounded-2xl bg-[#172861] px-5 text-sm font-bold text-white shadow-sm transition hover:bg-[#0B163F]"
                            >
                                Nueva categoría
                            </button>

                            <button
                                type="button"
                                onClick={() => void reloadCategories(true)}
                                disabled={isRefreshing || isLoading}
                                className="h-12 rounded-2xl bg-orange-500 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {isRefreshing ? "Actualizando..." : "Actualizar"}
                            </button>
                        </div>
                    </div>

                    <div className="mt-5">
                        <input
                            type="text"
                            value={search}
                            onChange={handleSearchChange}
                            placeholder="Buscar por nombre de categoría..."
                            className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 lg:max-w-[460px]"
                        />
                    </div>
                </div>

                <div className="overflow-hidden rounded-3xl border border-[var(--border)] bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                                        ID
                                    </th>

                                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                                        Categoría
                                    </th>

                                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                                        Estado
                                    </th>

                                    <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-600">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">
                                {isLoading ? (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="px-5 py-12 text-center text-sm font-semibold text-slate-500"
                                        >
                                            Cargando categorías...
                                        </td>
                                    </tr>
                                ) : filteredCategories.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="px-5 py-12 text-center"
                                        >
                                            <p className="text-sm font-bold text-slate-800">
                                                No hay categorías para mostrar.
                                            </p>
                                            <p className="mt-1 text-sm text-slate-500">
                                                {categories.length === 0
                                                    ? "Crea una categoría nueva desde el botón superior."
                                                    : "No se encontraron categorías con ese criterio de búsqueda."}
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedCategories.map((category) => (
                                        <tr
                                            key={category.id}
                                            className="transition hover:bg-blue-50/40"
                                        >
                                            <td className="px-5 py-4 text-sm font-bold text-slate-950">
                                                #{category.id}
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#172861] text-sm font-bold uppercase text-white">
                                                        {(category.name || "C")
                                                            .charAt(0)
                                                            .toUpperCase()}
                                                    </div>

                                                    <div>
                                                        <p className="text-sm font-bold text-slate-950">
                                                            {category.name}
                                                        </p>
                                                        <p className="mt-0.5 text-xs font-medium text-slate-500">
                                                            Categoría registrada
                                                            en el sistema
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-5 py-4">
                                                <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                                                    Activa
                                                </span>
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            openEditModal(
                                                                category,
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
                                                                category.id,
                                                            )
                                                        }
                                                        disabled={
                                                            deletingId ===
                                                            category.id
                                                        }
                                                        className="rounded-xl border border-red-200 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                                                    >
                                                        {deletingId ===
                                                            category.id
                                                            ? "Eliminando..."
                                                            : "Eliminar"}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm font-semibold text-slate-500">
                            Mostrando {paginatedCategories.length} de{" "}
                            {filteredCategories.length} categorías
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
                                        Categorías
                                    </p>

                                    <h2 className="mt-2 text-xl font-bold">
                                        {editingCategory
                                            ? "Editar categoría"
                                            : "Nueva categoría"}
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

                        <form onSubmit={handleSubmit} className="space-y-5 p-6">
                            {error ? (
                                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                                    {error}
                                </div>
                            ) : null}

                            <div>
                                <label
                                    htmlFor="category-name"
                                    className="mb-2 block text-sm font-bold text-slate-700"
                                >
                                    Nombre de la categoría
                                </label>

                                <input
                                    id="category-name"
                                    type="text"
                                    value={name}
                                    onChange={(event) =>
                                        setName(event.target.value)
                                    }
                                    placeholder="Ej. Programación"
                                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                />
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