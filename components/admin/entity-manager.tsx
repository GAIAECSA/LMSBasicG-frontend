"use client";

import { useMemo, useState } from "react";
import "../../app/styles/entity-manager.scss";

type FieldType = "text" | "email" | "number" | "date" | "select";

export type EntityField = {
    key: string;
    label: string;
    type?: FieldType;
    required?: boolean;
    options?: Array<{ label: string; value: string }>;
    placeholder?: string;
};

type EntityBase = {
    id: string;
};

interface EntityManagerProps<T extends EntityBase> {
    title: string;
    description: string;
    entityLabel: string;
    fields: EntityField[];
    initialItems?: T[];
    items?: T[];
    onCreate?: (data: Record<string, string>) => void;
    onUpdate?: (id: string, data: Record<string, string>) => void;
    onDelete?: (id: string) => void;
}

export function EntityManager<T extends EntityBase>({
    title,
    description,
    entityLabel,
    fields,
    initialItems = [],
    items,
    onCreate,
    onUpdate,
    onDelete,
}: EntityManagerProps<T>) {
    const [query, setQuery] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [error, setError] = useState("");
    const [localItems, setLocalItems] = useState<T[]>(initialItems);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    // ✅ DEFAULT STATUS = ACTIVO
    const emptyForm = useMemo(
        () =>
            fields.reduce<Record<string, string>>((acc, field) => {
                acc[field.key] = field.key.toLowerCase().includes("status")
                    ? "Activo"
                    : "";
                return acc;
            }, {}),
        [fields]
    );

    const [formData, setFormData] = useState<Record<string, string>>(emptyForm);

    const currentItems = items ?? localItems;

    function getItemValue(item: T, key: string) {
        return (item as Record<string, unknown>)[key];
    }

    const filteredItems = useMemo(() => {
        const q = query.toLowerCase();
        return currentItems.filter((item) =>
            fields.some((f) =>
                String(getItemValue(item, f.key)).toLowerCase().includes(q)
            )
        );
    }, [query, currentItems, fields]);

    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

    const paginatedItems = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredItems.slice(start, start + itemsPerPage);
    }, [filteredItems, currentPage]);

    function openCreate() {
        setEditingId(null);
        setFormData(emptyForm);
        setIsModalOpen(true);
    }

    function openEdit(item: T) {
        setEditingId(item.id);

        const form = fields.reduce<Record<string, string>>((acc, f) => {
            acc[f.key] = String(getItemValue(item, f.key));
            return acc;
        }, {});

        setFormData(form);
        setIsModalOpen(true);
    }

    function closeModal() {
        setEditingId(null);
        setFormData(emptyForm);
        setIsModalOpen(false);
        setError("");
    }

    function handleChange(key: string, value: string) {
        setFormData((prev) => ({ ...prev, [key]: value }));
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        for (const f of fields) {
            if (f.required && !formData[f.key]?.trim()) {
                setError(`El campo "${f.label}" es obligatorio`);
                return;
            }
        }

        try {
            editingId
                ? onUpdate?.(editingId, formData)
                : onCreate?.(formData);

            closeModal();
        } catch (err) {
            setError("Error al guardar");
        }
    }

    function handleDelete(id: string) {
        if (!confirm("¿Eliminar registro?")) return;
        onDelete?.(id);
    }

    return (
        <section className="space-y-6">
            {/* HEADER */}
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold">{title}</h2>
                    <p className="text-sm text-gray-500">{description}</p>
                </div>

                <button className="btn-primary" onClick={openCreate}>
                    + Nuevo {entityLabel}
                </button>
            </div>

            {/* BUSCADOR */}
            <input
                className="input"
                placeholder={`Buscar ${entityLabel}`}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
            />

            {/* TABLA */}
            <div className="table-container">
                <table className="table-modern">
                    <thead>
                        <tr>
                            {fields.map((f) => (
                                <th key={f.key}>{f.label}</th>
                            ))}
                            <th>Acciones</th>
                        </tr>
                    </thead>

                    <tbody>
                        {paginatedItems.map((item) => (
                            <tr key={item.id}>
                                {fields.map((f) => {
                                    const value = String(getItemValue(item, f.key));

                                    if (f.key.includes("status")) {
                                        return (
                                            <td key={f.key}>
                                                <span
                                                    className={`badge ${value === "Activo"
                                                        ? "badge-active"
                                                        : "badge-inactive"
                                                        }`}
                                                >
                                                    {value}
                                                </span>
                                            </td>
                                        );
                                    }

                                    return <td key={f.key}>{value}</td>;
                                })}

                                <td className="actions">
                                    <button onClick={() => openEdit(item)}>
                                        Editar
                                    </button>
                                    <button onClick={() => handleDelete(item.id)}>
                                        Eliminar
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* PAGINADOR */}
            <div className="pagination">
                <span>
                    Página {currentPage} de {totalPages}
                </span>

                <div className="controls">
                    <button
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(1)}
                    >
                        «
                    </button>

                    <button
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((p) => p - 1)}
                    >
                        ‹
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .slice(
                            Math.max(0, currentPage - 3),
                            Math.min(totalPages, currentPage + 2)
                        )
                        .map((page) => (
                            <button
                                key={page}
                                className={page === currentPage ? "active" : ""}
                                onClick={() => setCurrentPage(page)}
                            >
                                {page}
                            </button>
                        ))}

                    <button
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage((p) => p + 1)}
                    >
                        ›
                    </button>

                    <button
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(totalPages)}
                    >
                        »
                    </button>
                </div>
            </div>

            {/* MODAL */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h3>
                                {editingId
                                    ? `Editar ${entityLabel}`
                                    : `Nuevo ${entityLabel}`}
                            </h3>
                            <button onClick={closeModal}>✕</button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            {error && <div className="error">{error}</div>}

                            <div className="grid grid-cols-2 gap-4">
                                {fields.map((f) =>
                                    f.type === "select" ? (
                                        <select
                                            key={f.key}
                                            value={formData[f.key]}
                                            onChange={(e) =>
                                                handleChange(f.key, e.target.value)
                                            }
                                            className="input"
                                        >
                                            {f.options?.map((opt) => (
                                                <option key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input
                                            key={f.key}
                                            type={f.type || "text"}
                                            placeholder={f.label}
                                            value={formData[f.key]}
                                            onChange={(e) =>
                                                handleChange(f.key, e.target.value)
                                            }
                                            className="input"
                                        />
                                    )
                                )}
                            </div>

                            <div className="flex justify-end gap-2 mt-4">
                                <button type="button" onClick={closeModal}>
                                    Cancelar
                                </button>
                                <button type="submit" className="btn-primary">
                                    Guardar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </section>
    );
}