"use client";

import { Filter, Loader2, RefreshCw, Search } from "lucide-react";
import type { CertificateStatusFilter } from "../types";

type CertificatesToolbarProps = {
    totalCertificates: number;
    validCertificatesCount: number;
    statusFilter: CertificateStatusFilter;
    searchTerm: string;
    isRefreshing: boolean;
    onStatusFilterChange: (filter: CertificateStatusFilter) => void;
    onSearchTermChange: (value: string) => void;
    onRefresh: () => void;
};

export function CertificatesToolbar({
    totalCertificates,
    validCertificatesCount,
    statusFilter,
    searchTerm,
    isRefreshing,
    onStatusFilterChange,
    onSearchTermChange,
    onRefresh,
}: CertificatesToolbarProps) {
    return (
        <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap gap-3">
                <button
                    type="button"
                    onClick={() => onStatusFilterChange("all")}
                    className={`h-12 rounded-2xl px-7 text-sm font-black transition ${
                        statusFilter === "all"
                            ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm"
                            : "bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--primary)]"
                    }`}
                >
                    Todos ({totalCertificates})
                </button>

                <button
                    type="button"
                    onClick={() => onStatusFilterChange("valid")}
                    className={`h-12 rounded-2xl px-7 text-sm font-black transition ${
                        statusFilter === "valid"
                            ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm"
                            : "bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--primary)]"
                    }`}
                >
                    Emitidos ({validCertificatesCount})
                </button>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <label className="relative block w-full sm:w-[420px] xl:w-[520px]">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--muted-foreground)]" />

                    <input
                        type="search"
                        value={searchTerm}
                        onChange={(event) => onSearchTermChange(event.target.value)}
                        placeholder="Buscar certificados..."
                        className="h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--card)] pl-12 pr-4 text-sm font-semibold text-[var(--foreground)] shadow-sm outline-none transition placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--ring)]/30"
                    />
                </label>

                <button
                    type="button"
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--card)] px-5 text-sm font-black text-[var(--foreground)] shadow-sm transition hover:bg-[var(--muted)]"
                >
                    <Filter className="h-4 w-4" />
                    Filtros
                </button>

                <button
                    type="button"
                    onClick={onRefresh}
                    disabled={isRefreshing}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--card)] px-5 text-sm font-black text-[var(--foreground)] shadow-sm transition hover:bg-[var(--muted)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {isRefreshing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <RefreshCw className="h-4 w-4" />
                    )}
                    Actualizar
                </button>
            </div>
        </div>
    );
}
