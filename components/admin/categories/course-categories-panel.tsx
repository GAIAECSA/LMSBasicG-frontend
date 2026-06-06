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
    FolderOpen,
    LoaderCircle,
    Pencil,
    Plus,
    RefreshCw,
    Tags,
    Trash2,
    X,
} from "lucide-react";
import {
    createCategory,
    deleteCategory,
    getCategories,
    updateCategory,
    type Category,
} from "@/services/categories.service";

const ITEMS_PER_PAGE = 5;

function getCategoryInitial(category: Category) {
    return (category.name || "C").charAt(0).toUpperCase();
}

export function CourseCategoriesPanel() {
    const [categories, setCategories] = useState<Category[]>([]);

    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [deletingId, setDeletingId] = useState<number | null>(null);

    const [isModalOpen, setIsModalOpen] = useState(false);

    const [editingCategory, setEditingCategory] =
        useState<Category | null>(null);

    const [name, setName] = useState("");
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const reloadCategories = useCallback(
        async (showSuccess = false) => {
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
                    setSuccess(
                        "Lista de categorías actualizada correctamente.",
                    );
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
        },
        [],
    );

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

    useEffect(() => {
        if (!isModalOpen) return;

        function handleEscape(event: KeyboardEvent) {
            if (event.key !== "Escape" || isSubmitting) return;

            setIsModalOpen(false);
            setEditingCategory(null);
            setName("");
            setError("");
        }

        document.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener("keydown", handleEscape);
        };
    }, [isModalOpen, isSubmitting]);

    const filteredCategories = useMemo(() => {
        const searchValue = search.trim().toLowerCase();

        if (!searchValue) return categories;

        return categories.filter((category) =>
            (category.name || "")
                .toLowerCase()
                .includes(searchValue),
        );
    }, [categories, search]);

    const totalPages = Math.max(
        1,
        Math.ceil(filteredCategories.length / ITEMS_PER_PAGE),
    );

    const activePage = Math.min(currentPage, totalPages);

    const paginatedCategories = useMemo(() => {
        const startIndex =
            (activePage - 1) * ITEMS_PER_PAGE;

        return filteredCategories.slice(
            startIndex,
            startIndex + ITEMS_PER_PAGE,
        );
    }, [filteredCategories, activePage]);

    const stats = useMemo(() => {
        return {
            total: categories.length,
            active: categories.length,
            filtered: filteredCategories.length,
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

    function handleSearchChange(
        event: ChangeEvent<HTMLInputElement>,
    ) {
        setSearch(event.target.value);
        setCurrentPage(1);
    }

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        const trimmedName = name.trim();

        if (!trimmedName) {
            setError(
                "El nombre de la categoría es obligatorio.",
            );
            return;
        }

        try {
            setIsSubmitting(true);
            setError("");
            setSuccess("");

            if (editingCategory) {
                const updated = await updateCategory(
                    editingCategory.id,
                    {
                        name: trimmedName,
                        is_mdt:
                            editingCategory.is_mdt ?? false,
                    },
                );

                setCategories((current) =>
                    current.map((item) =>
                        item.id === editingCategory.id
                            ? updated
                            : item,
                    ),
                );

                setSuccess(
                    "Categoría actualizada correctamente.",
                );
            } else {
                const created = await createCategory({
                    name: trimmedName,
                    is_mdt: false,
                });

                setCategories((current) => [
                    created,
                    ...current,
                ]);

                setSuccess(
                    "Categoría creada correctamente.",
                );
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
                current.filter(
                    (category) => category.id !== categoryId,
                ),
            );

            setSuccess(
                "Categoría eliminada correctamente.",
            );
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
            <section className="min-w-0 space-y-4 sm:space-y-5 lg:space-y-6 [@media(max-height:760px)]:space-y-4 [&_button:not(:disabled)]:cursor-pointer [&_button:not(:disabled)]:select-none [&_button:not(:disabled)]:transition-all [&_button:not(:disabled)]:duration-150 [&_button:not(:disabled):active]:translate-y-px [&_button:not(:disabled):active]:scale-[0.98]">
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#07111F] via-[#172861] via-70% to-[#F97316] p-4 text-white shadow-lg sm:rounded-3xl sm:p-5 lg:p-6 [@media(max-height:760px)]:p-4">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                        <div className="min-w-0">
                            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-blue-100 sm:text-xs sm:tracking-[0.25em] lg:text-sm">
                                Gestión de cursos
                            </p>

                            <h2 className="mt-2 text-xl font-bold sm:text-2xl md:text-3xl [@media(max-height:760px)]:text-xl">
                                Categorías
                            </h2>

                            <p className="mt-2 max-w-2xl text-xs leading-5 text-blue-50 sm:text-sm sm:leading-6">
                                Administra las categorías utilizadas
                                para organizar los cursos dentro de la
                                plataforma.
                            </p>
                        </div>

                        <div className="grid grid-cols-3 gap-2 sm:gap-3 xl:min-w-[460px]">
                            <div className="rounded-xl bg-white/15 p-3 ring-1 ring-white/20 sm:rounded-2xl sm:p-4 [@media(max-height:760px)]:p-3">
                                <p className="text-[9px] font-bold uppercase tracking-wide text-white/75 sm:text-xs">
                                    Total
                                </p>

                                <p className="mt-1 text-xl font-bold sm:mt-2 sm:text-3xl">
                                    {isLoading
                                        ? "..."
                                        : stats.total}
                                </p>
                            </div>

                            <div className="rounded-xl bg-white/15 p-3 ring-1 ring-white/20 sm:rounded-2xl sm:p-4 [@media(max-height:760px)]:p-3">
                                <p className="text-[9px] font-bold uppercase tracking-wide text-white/75 sm:text-xs">
                                    Activas
                                </p>

                                <p className="mt-1 text-xl font-bold sm:mt-2 sm:text-3xl">
                                    {isLoading
                                        ? "..."
                                        : stats.active}
                                </p>
                            </div>

                            <div className="rounded-xl bg-white/15 p-3 ring-1 ring-white/20 sm:rounded-2xl sm:p-4 [@media(max-height:760px)]:p-3">
                                <p className="text-[9px] font-bold uppercase tracking-wide text-white/75 sm:text-xs">
                                    Coincidencias
                                </p>

                                <p className="mt-1 text-xl font-bold sm:mt-2 sm:text-3xl">
                                    {isLoading
                                        ? "..."
                                        : stats.filtered}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {(error || success) && !isModalOpen ? (
                    <div
                        className={`rounded-xl border px-3 py-3 text-xs font-semibold leading-5 sm:rounded-2xl sm:px-5 sm:py-4 sm:text-sm ${error
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
                                Lista de categorías
                            </h3>

                            <p className="mt-1 text-xs leading-5 text-[var(--muted-foreground)] sm:text-sm">
                                Busca, crea, edita o elimina
                                categorías del sistema.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-2 xs:grid-cols-2 sm:gap-3">
                            <button
                                type="button"
                                onClick={openCreateModal}
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#172861] px-4 text-xs font-bold text-white shadow-sm hover:bg-[#0B163F] sm:h-12 sm:rounded-2xl sm:px-5 sm:text-sm [@media(max-height:760px)]:h-10"
                            >
                                <Plus className="h-4 w-4" />
                                Nueva categoría
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    void reloadCategories(true)
                                }
                                disabled={
                                    isRefreshing || isLoading
                                }
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 text-xs font-bold text-white shadow-sm hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60 sm:h-12 sm:rounded-2xl sm:px-5 sm:text-sm [@media(max-height:760px)]:h-10"
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

                    <div className="mt-4 sm:mt-5">
                        <input
                            type="text"
                            value={search}
                            onChange={handleSearchChange}
                            placeholder="Buscar por nombre de categoría..."
                            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-4 text-xs font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:h-12 sm:rounded-2xl sm:px-5 sm:text-sm lg:max-w-[460px] [@media(max-height:760px)]:h-10"
                        />
                    </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm sm:rounded-3xl">
                    <div className="md:hidden">
                        {isLoading ? (
                            <div className="px-4 py-10 text-center text-sm font-semibold text-slate-500">
                                Cargando categorías...
                            </div>
                        ) : filteredCategories.length === 0 ? (
                            <div className="px-4 py-10 text-center">
                                <p className="text-sm font-bold text-slate-800">
                                    No hay categorías para mostrar.
                                </p>

                                <p className="mt-1 text-xs leading-5 text-slate-500">
                                    {categories.length === 0
                                        ? "Crea una categoría nueva desde el botón superior."
                                        : "No se encontraron categorías con ese criterio de búsqueda."}
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {paginatedCategories.map(
                                    (category) => (
                                        <article
                                            key={category.id}
                                            className="space-y-3 p-4"
                                        >
                                            <div className="flex min-w-0 items-center gap-3">
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#172861] text-sm font-bold uppercase text-white">
                                                    {getCategoryInitial(
                                                        category,
                                                    )}
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-bold text-slate-950">
                                                        {category.name}
                                                    </p>

                                                    <p className="mt-0.5 text-xs font-medium text-slate-500">
                                                        ID #{category.id}
                                                    </p>
                                                </div>

                                                <span className="inline-flex shrink-0 rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-bold text-emerald-700">
                                                    Activa
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        openEditModal(
                                                            category,
                                                        )
                                                    }
                                                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-blue-200 px-3 text-xs font-bold text-blue-700 hover:bg-blue-50"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                    Editar
                                                </button>

                                                <button
                                                    type="button"
                                                    disabled={
                                                        deletingId ===
                                                        category.id
                                                    }
                                                    onClick={() =>
                                                        void handleDelete(
                                                            category.id,
                                                        )
                                                    }
                                                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-red-200 px-3 text-xs font-bold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                                                >
                                                    {deletingId ===
                                                        category.id ? (
                                                        <LoaderCircle className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="h-4 w-4" />
                                                    )}

                                                    {deletingId ===
                                                        category.id
                                                        ? "Eliminando..."
                                                        : "Eliminar"}
                                                </button>
                                            </div>
                                        </article>
                                    ),
                                )}
                            </div>
                        )}
                    </div>

                    <div className="hidden overflow-x-auto md:block">
                        <table className="w-full min-w-[720px] table-fixed divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="w-[12%] px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                                        ID
                                    </th>

                                    <th className="w-[52%] px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                                        Categoría
                                    </th>

                                    <th className="w-[14%] px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                                        Estado
                                    </th>

                                    <th className="w-[22%] px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-600">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">
                                {isLoading ? (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="px-4 py-10 text-center text-sm font-semibold text-slate-500"
                                        >
                                            Cargando categorías...
                                        </td>
                                    </tr>
                                ) : filteredCategories.length ===
                                    0 ? (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="px-4 py-10 text-center"
                                        >
                                            <p className="text-sm font-bold text-slate-800">
                                                No hay categorías para
                                                mostrar.
                                            </p>

                                            <p className="mt-1 text-sm text-slate-500">
                                                {categories.length ===
                                                    0
                                                    ? "Crea una categoría nueva desde el botón superior."
                                                    : "No se encontraron categorías con ese criterio de búsqueda."}
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedCategories.map(
                                        (category) => (
                                            <tr
                                                key={category.id}
                                                className="transition hover:bg-blue-50/40"
                                            >
                                                <td className="px-4 py-3 text-sm font-bold text-slate-950">
                                                    #{category.id}
                                                </td>

                                                <td className="px-4 py-3">
                                                    <div className="flex min-w-0 items-center gap-3">
                                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#172861] text-sm font-bold uppercase text-white">
                                                            {getCategoryInitial(
                                                                category,
                                                            )}
                                                        </div>

                                                        <div className="min-w-0">
                                                            <p className="truncate text-sm font-bold text-slate-950">
                                                                {
                                                                    category.name
                                                                }
                                                            </p>

                                                            <p className="mt-0.5 truncate text-xs font-medium text-slate-500">
                                                                Categoría
                                                                registrada
                                                                en el
                                                                sistema
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-4 py-3">
                                                    <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                                                        Activa
                                                    </span>
                                                </td>

                                                <td className="px-4 py-3">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            type="button"
                                                            title="Editar categoría"
                                                            onClick={() =>
                                                                openEditModal(
                                                                    category,
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
                                                            title="Eliminar categoría"
                                                            disabled={
                                                                deletingId ===
                                                                category.id
                                                            }
                                                            onClick={() =>
                                                                void handleDelete(
                                                                    category.id,
                                                                )
                                                            }
                                                            className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-red-200 px-3 text-xs font-bold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                                                        >
                                                            {deletingId ===
                                                                category.id ? (
                                                                <LoaderCircle className="h-4 w-4 animate-spin" />
                                                            ) : (
                                                                <Trash2 className="h-4 w-4" />
                                                            )}

                                                            <span className="hidden lg:inline">
                                                                {deletingId ===
                                                                    category.id
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
                            Mostrando{" "}
                            {paginatedCategories.length} de{" "}
                            {filteredCategories.length} categorías
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

                                <span className="hidden sm:inline">
                                    Anterior
                                </span>
                            </button>

                            <span className="flex h-10 items-center justify-center whitespace-nowrap rounded-xl bg-slate-100 px-3 text-center text-xs font-bold text-slate-700 sm:px-4 sm:text-sm">
                                Página {activePage} de {totalPages}
                            </span>

                            <button
                                type="button"
                                aria-label="Página siguiente"
                                onClick={() =>
                                    setCurrentPage((page) =>
                                        Math.min(
                                            totalPages,
                                            page + 1,
                                        ),
                                    )
                                }
                                disabled={
                                    activePage === totalPages
                                }
                                className="inline-flex h-10 items-center justify-center gap-1 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4 sm:text-sm"
                            >
                                <span className="hidden sm:inline">
                                    Siguiente
                                </span>

                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {isModalOpen ? (
                <div
                    className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 backdrop-blur-sm sm:items-center sm:p-4"
                    onClick={() => closeModal()}
                >
                    <div
                        className="max-h-[94dvh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-slate-200 bg-white shadow-2xl sm:max-h-[90vh] sm:rounded-3xl"
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                    >
                        <div className="bg-gradient-to-br from-[#07111F] via-[#172861] to-[#F97316] px-4 py-4 text-white sm:px-6 sm:py-5">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-blue-100 sm:text-xs sm:tracking-[0.25em]">
                                        Categorías
                                    </p>

                                    <h2 className="mt-2 text-xl font-bold">
                                        {editingCategory
                                            ? "Editar categoría"
                                            : "Nueva categoría"}
                                    </h2>

                                    <p className="mt-1 text-xs leading-5 text-blue-50 sm:text-sm">
                                        Completa la información y
                                        guarda los cambios.
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
                                    htmlFor="category-name"
                                    className="mb-2 block text-xs font-bold text-slate-700 sm:text-sm"
                                >
                                    Nombre de la categoría
                                </label>

                                <input
                                    id="category-name"
                                    type="text"
                                    value={name}
                                    onChange={(event) =>
                                        setName(
                                            event.target.value,
                                        )
                                    }
                                    placeholder="Ej. Programación"
                                    autoFocus
                                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:h-12 sm:rounded-2xl sm:px-5"
                                />
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
                                        <FolderOpen className="h-4 w-4" />
                                    )}

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