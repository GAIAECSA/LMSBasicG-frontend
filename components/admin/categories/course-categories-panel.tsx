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
    FolderOpen,
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

function getErrorMessage(error: unknown, fallbackMessage: string) {
    return error instanceof Error ? error.message : fallbackMessage;
}

export function CourseCategoriesPanel() {
    const [categories, setCategories] = useState<Category[]>([]);

    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] =
        useState<Category | null>(null);
    const [deleteCandidate, setDeleteCandidate] =
        useState<Category | null>(null);

    const [name, setName] = useState("");
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    const [error, setError] = useState("");

    const refreshInProgressRef = useRef(false);
    const submitInProgressRef = useRef(false);
    const deleteInProgressRef = useRef(false);

    const reloadCategories = useCallback(
        async (manualRefresh = false) => {
            if (manualRefresh && refreshInProgressRef.current) {
                return;
            }

            const toastId = manualRefresh
                ? notify.loading(
                    "Actualizando categorías...",
                    "Estamos consultando la lista de categorías registradas.",
                )
                : null;

            if (manualRefresh) {
                refreshInProgressRef.current = true;
                setIsRefreshing(true);
            } else {
                setIsLoading(true);
            }

            setError("");

            try {
                const data = await getCategories();

                setCategories(Array.isArray(data) ? data : []);
                setCurrentPage(1);

                if (toastId !== null) {
                    notify.dismiss(toastId);
                    notify.success(
                        "Categorías actualizadas.",
                        "La lista de categorías se encuentra al día.",
                    );
                }
            } catch (currentError) {
                const message = getErrorMessage(
                    currentError,
                    "No se pudieron cargar las categorías.",
                );

                setError(message);

                if (toastId !== null) {
                    notify.dismiss(toastId);
                }

                notify.error(
                    manualRefresh
                        ? "No se pudo actualizar la lista."
                        : "No se pudieron cargar las categorías.",
                    message,
                );
            } finally {
                setIsLoading(false);
                setIsRefreshing(false);
                refreshInProgressRef.current = false;
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
        function handleEscape(event: KeyboardEvent) {
            if (event.key !== "Escape") return;

            if (deleteCandidate && !isDeleting) {
                setDeleteCandidate(null);
                return;
            }

            if (isModalOpen && !isSubmitting) {
                setIsModalOpen(false);
                setEditingCategory(null);
                setName("");
            }
        }

        document.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener("keydown", handleEscape);
        };
    }, [deleteCandidate, isDeleting, isModalOpen, isSubmitting]);

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
    }, [activePage, filteredCategories]);

    const stats = useMemo(
        () => ({
            total: categories.length,
            active: categories.length,
            filtered: filteredCategories.length,
        }),
        [categories.length, filteredCategories.length],
    );

    function resetForm() {
        setEditingCategory(null);
        setName("");
    }

    function openCreateModal() {
        resetForm();
        setError("");
        setIsModalOpen(true);
    }

    function openEditModal(category: Category) {
        setEditingCategory(category);
        setName(category.name || "");
        setError("");
        setIsModalOpen(true);
    }

    function closeModal() {
        if (isSubmitting) return;

        setIsModalOpen(false);
        resetForm();
    }

    function handleSearchChange(event: ChangeEvent<HTMLInputElement>) {
        setSearch(event.target.value);
        setCurrentPage(1);
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (submitInProgressRef.current || isSubmitting) {
            return;
        }

        const trimmedName = name.trim();

        if (!trimmedName) {
            notify.warning(
                "Completa el campo obligatorio.",
                "El nombre de la categoría es obligatorio.",
            );
            return;
        }

        submitInProgressRef.current = true;
        setIsSubmitting(true);

        const isEditing = Boolean(editingCategory);

        const toastId = notify.loading(
            isEditing
                ? "Actualizando categoría..."
                : "Creando categoría...",
            "Estamos guardando la información de la categoría.",
        );

        try {
            if (editingCategory) {
                const updated = await updateCategory(editingCategory.id, {
                    name: trimmedName,
                    is_mdt: editingCategory.is_mdt ?? false,
                });

                setCategories((current) =>
                    current.map((item) =>
                        item.id === editingCategory.id ? updated : item,
                    ),
                );
            } else {
                const created = await createCategory({
                    name: trimmedName,
                    is_mdt: false,
                });

                setCategories((current) => [created, ...current]);
                setCurrentPage(1);
            }

            setIsModalOpen(false);
            resetForm();

            notify.dismiss(toastId);
            notify.success(
                isEditing
                    ? "Categoría actualizada."
                    : "Categoría creada.",
                isEditing
                    ? "Los datos se actualizaron correctamente."
                    : "La nueva categoría fue registrada correctamente.",
            );
        } catch (currentError) {
            const message = getErrorMessage(
                currentError,
                "No se pudo guardar la categoría.",
            );

            notify.dismiss(toastId);
            notify.error(
                isEditing
                    ? "No se pudo actualizar la categoría."
                    : "No se pudo crear la categoría.",
                message,
            );
        } finally {
            submitInProgressRef.current = false;
            setIsSubmitting(false);
        }
    }

    function openDeleteModal(category: Category) {
        if (isDeleting) return;

        setDeleteCandidate(category);
    }

    function closeDeleteModal() {
        if (isDeleting) return;

        setDeleteCandidate(null);
    }

    async function confirmDeleteCategory() {
        if (
            !deleteCandidate ||
            isDeleting ||
            deleteInProgressRef.current
        ) {
            return;
        }

        deleteInProgressRef.current = true;
        setIsDeleting(true);
        setError("");

        const toastId = notify.loading(
            "Eliminando categoría...",
            `Estamos eliminando ${deleteCandidate.name}.`,
        );

        try {
            await deleteCategory(deleteCandidate.id);

            setCategories((current) =>
                current.filter((category) => category.id !== deleteCandidate.id),
            );

            notify.dismiss(toastId);
            notify.success(
                "Categoría eliminada.",
                `${deleteCandidate.name} fue eliminada correctamente.`,
            );

            setDeleteCandidate(null);
        } catch (currentError) {
            const message = getErrorMessage(
                currentError,
                "No se pudo eliminar la categoría.",
            );

            setError(message);

            notify.dismiss(toastId);
            notify.error(
                "No se pudo eliminar la categoría.",
                message,
            );
        } finally {
            deleteInProgressRef.current = false;
            setIsDeleting(false);
        }
    }

    if (isLoading) {
        return (
            <AthenaLoadingBackground
                className="max-w-[1450px]"
                contentClassName="flex min-h-[calc(100dvh-150px)] items-center justify-center"
            >
                <div
                    role="status"
                    aria-live="polite"
                    aria-label="Cargando categorías"
                    className="flex min-h-[240px] w-full max-w-xl flex-col items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--card)]/80 px-5 py-6 text-center shadow-sm backdrop-blur-[3px] sm:min-h-[300px] sm:rounded-[28px] sm:px-7 sm:py-8"
                >
                    <LoaderCircle className="h-8 w-8 animate-spin text-[var(--primary)] sm:h-9 sm:w-9" />

                    <p className="mt-4 text-sm font-black text-[var(--foreground)] sm:text-base">
                        Cargando categorías
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
            <section className="min-w-0 space-y-4 sm:space-y-5 lg:space-y-6 [@media(max-height:760px)]:space-y-4 [&_button:not(:disabled)]:cursor-pointer [&_button:not(:disabled)]:select-none [&_button:not(:disabled)]:transition-all [&_button:not(:disabled)]:duration-150 [&_button:not(:disabled)]:ease-out [&_button:not(:disabled):active]:translate-y-px [&_button:not(:disabled):active]:scale-[0.98]">
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
                                Administra las categorías utilizadas para
                                organizar los cursos dentro de la plataforma.
                            </p>
                        </div>

                        <div className="grid grid-cols-3 gap-2 sm:gap-3 xl:min-w-[460px]">
                            <StatsCard label="Total" value={stats.total} />
                            <StatsCard label="Activas" value={stats.active} />
                            <StatsCard
                                label="Coincidencias"
                                value={stats.filtered}
                            />
                        </div>
                    </div>
                </div>

                {error ? (
                    <div
                        role="alert"
                        aria-live="assertive"
                        className="rounded-xl border border-red-200 bg-red-50 px-3 py-3 text-xs font-semibold leading-5 text-red-700 shadow-sm sm:rounded-2xl sm:px-5 sm:py-4 sm:text-sm"
                    >
                        <p className="font-black">
                            No se pudo completar la operación.
                        </p>

                        <p className="mt-0.5 break-words">{error}</p>
                    </div>
                ) : null}

                <div className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm sm:rounded-3xl sm:p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="min-w-0">
                            <h3 className="text-base font-bold text-slate-950 sm:text-lg">
                                Lista de categorías
                            </h3>

                            <p className="mt-1 text-xs leading-5 text-[var(--muted-foreground)] sm:text-sm">
                                Busca, crea, edita o elimina categorías del
                                sistema.
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
                                onClick={() => void reloadCategories(true)}
                                disabled={isRefreshing}
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 text-xs font-bold text-white shadow-sm hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60 sm:h-12 sm:rounded-2xl sm:px-5 sm:text-sm [@media(max-height:760px)]:h-10"
                            >
                                <RefreshCw
                                    className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""
                                        }`}
                                />

                                {isRefreshing
                                    ? "Actualizando..."
                                    : "Actualizar"}
                            </button>
                        </div>
                    </div>

                    <div className="relative mt-4 sm:mt-5 lg:max-w-[520px]">
                        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                        <input
                            type="text"
                            value={search}
                            onChange={handleSearchChange}
                            placeholder="Buscar por nombre de categoría..."
                            className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-xs font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:h-12 sm:rounded-2xl sm:pl-11 sm:pr-5 sm:text-sm [@media(max-height:760px)]:h-10"
                        />
                    </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm sm:rounded-3xl">
                    <div className="md:hidden">
                        {filteredCategories.length === 0 ? (
                            <EmptyState hasCategories={categories.length > 0} />
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {paginatedCategories.map((category) => (
                                    <article
                                        key={category.id}
                                        className="space-y-3 p-4"
                                    >
                                        <div className="flex min-w-0 items-center gap-3">
                                            <CategoryInitial category={category} />

                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-bold text-slate-950">
                                                    {category.name}
                                                </p>

                                                <p className="mt-0.5 text-xs font-medium text-slate-500">
                                                    ID #{category.id}
                                                </p>
                                            </div>

                                            <StatusBadge />
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    openEditModal(category)
                                                }
                                                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-blue-200 px-3 text-xs font-bold text-blue-700 hover:bg-blue-50"
                                            >
                                                <Pencil className="h-4 w-4" />
                                                Editar
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    openDeleteModal(category)
                                                }
                                                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-red-200 px-3 text-xs font-bold text-red-600 hover:bg-red-50"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                                Eliminar
                                            </button>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="hidden overflow-x-auto md:block">
                        <table className="w-full min-w-[720px] table-fixed divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <TableHeader className="w-[12%]">ID</TableHeader>
                                    <TableHeader className="w-[52%]">
                                        Categoría
                                    </TableHeader>
                                    <TableHeader className="w-[14%]">
                                        Estado
                                    </TableHeader>
                                    <TableHeader className="w-[22%] text-right">
                                        Acciones
                                    </TableHeader>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">
                                {filteredCategories.length === 0 ? (
                                    <tr>
                                        <td colSpan={4}>
                                            <EmptyState
                                                hasCategories={
                                                    categories.length > 0
                                                }
                                            />
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedCategories.map((category) => (
                                        <tr
                                            key={category.id}
                                            className="transition hover:bg-blue-50/40"
                                        >
                                            <td className="px-4 py-3 text-sm font-bold text-slate-950">
                                                #{category.id}
                                            </td>

                                            <td className="px-4 py-3">
                                                <div className="flex min-w-0 items-center gap-3">
                                                    <CategoryInitial
                                                        category={category}
                                                    />

                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-bold text-slate-950">
                                                            {category.name}
                                                        </p>

                                                        <p className="mt-0.5 truncate text-xs font-medium text-slate-500">
                                                            Categoría registrada
                                                            en el sistema
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-4 py-3">
                                                <StatusBadge />
                                            </td>

                                            <td className="px-4 py-3">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        title="Editar categoría"
                                                        onClick={() =>
                                                            openEditModal(category)
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
                                                        onClick={() =>
                                                            openDeleteModal(
                                                                category,
                                                            )
                                                        }
                                                        className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-red-200 px-3 text-xs font-bold text-red-600 hover:bg-red-50"
                                                    >
                                                        <Trash2 className="h-4 w-4" />

                                                        <span className="hidden lg:inline">
                                                            Eliminar
                                                        </span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <Pagination
                        activePage={activePage}
                        totalPages={totalPages}
                        currentItems={paginatedCategories.length}
                        totalItems={filteredCategories.length}
                        onPrevious={() =>
                            setCurrentPage((page) => Math.max(1, page - 1))
                        }
                        onNext={() =>
                            setCurrentPage((page) =>
                                Math.min(totalPages, page + 1),
                            )
                        }
                    />
                </div>
            </section>

            {isModalOpen ? (
                <div
                    className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 backdrop-blur-sm sm:items-center sm:p-4"
                    onClick={closeModal}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="category-form-title"
                        className="max-h-[94dvh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-slate-200 bg-white shadow-2xl sm:max-h-[90vh] sm:rounded-3xl"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="bg-gradient-to-br from-[#07111F] via-[#172861] to-[#F97316] px-4 py-4 text-white sm:px-6 sm:py-5">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-blue-100 sm:text-xs sm:tracking-[0.25em]">
                                        Categorías
                                    </p>

                                    <h2
                                        id="category-form-title"
                                        className="mt-2 text-xl font-bold"
                                    >
                                        {editingCategory
                                            ? "Editar categoría"
                                            : "Nueva categoría"}
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

                        <form
                            onSubmit={handleSubmit}
                            noValidate
                            className="space-y-4 p-4 sm:space-y-5 sm:p-6"
                        >
                            <div>
                                <label
                                    htmlFor="category-name"
                                    className="mb-2 block text-xs font-bold text-slate-700 sm:text-sm"
                                >
                                    Nombre de la categoría

                                    {!name.trim() ? (
                                        <span className="ml-1 text-red-600">
                                            *
                                        </span>
                                    ) : null}
                                </label>

                                <input
                                    id="category-name"
                                    type="text"
                                    value={name}
                                    onChange={(event) => {
                                        setName(event.target.value);
                                        setError("");
                                    }}
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

            {deleteCandidate ? (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-[2px]"
                    onClick={closeDeleteModal}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="delete-category-title"
                        className="w-full max-w-md overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-2xl"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
                            <div className="flex min-w-0 items-start gap-3">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                                    <AlertTriangle className="h-5 w-5" />
                                </div>

                                <div className="min-w-0">
                                    <h2
                                        id="delete-category-title"
                                        className="text-base font-black text-slate-950 sm:text-lg"
                                    >
                                        Eliminar categoría
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
                                ¿Seguro que deseas eliminar la categoría{" "}
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
                                        void confirmDeleteCategory()
                                    }
                                    disabled={isDeleting}
                                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-xs font-black text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60 sm:h-11 sm:px-5 sm:text-sm"
                                >
                                    {isDeleting ? (
                                        <LoaderCircle className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Trash2 className="h-4 w-4" />
                                    )}

                                    {isDeleting
                                        ? "Eliminando..."
                                        : "Eliminar categoría"}
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

function CategoryInitial({ category }: { category: Category }) {
    return (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#172861] text-sm font-bold uppercase text-white">
            {getCategoryInitial(category)}
        </div>
    );
}

function StatusBadge() {
    return (
        <span className="inline-flex shrink-0 rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-bold text-emerald-700 sm:text-xs">
            Activa
        </span>
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

function EmptyState({ hasCategories }: { hasCategories: boolean }) {
    return (
        <div className="px-4 py-10 text-center">
            <Tags className="mx-auto h-8 w-8 text-slate-400" />

            <p className="mt-3 text-sm font-bold text-slate-800">
                No hay categorías para mostrar.
            </p>

            <p className="mx-auto mt-1 max-w-lg text-xs leading-5 text-slate-500 sm:text-sm">
                {hasCategories
                    ? "No se encontraron categorías con ese criterio de búsqueda."
                    : "Crea una categoría nueva desde el botón superior."}
            </p>
        </div>
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
        <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <p className="text-center text-xs font-semibold text-slate-500 sm:text-left sm:text-sm">
                Mostrando {currentItems} de {totalItems} categorías
            </p>

            <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 sm:flex">
                <button
                    type="button"
                    aria-label="Página anterior"
                    onClick={onPrevious}
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
                    onClick={onNext}
                    disabled={activePage === totalPages}
                    className="inline-flex h-10 items-center justify-center gap-1 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4 sm:text-sm"
                >
                    <span className="hidden sm:inline">Siguiente</span>
                    <ChevronRight className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}

export default CourseCategoriesPanel;
