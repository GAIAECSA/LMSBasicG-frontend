"use client";

import { Loader2, RefreshCw, Search } from "lucide-react";
import type { CertificateStatusFilter } from "../types";

type CertificatesToolbarProps = {
    totalCertificates: number;
    mdtCertificatesCount: number;
    institutionalCertificatesCount: number;
    statusFilter: CertificateStatusFilter;
    searchTerm: string;
    isRefreshing: boolean;
    onStatusFilterChange: (filter: CertificateStatusFilter) => void;
    onSearchTermChange: (value: string) => void;
    onRefresh: () => void;
};

type ToolbarFilterButtonProps = {
    isActive: boolean;
    label: string;
    onClick: () => void;
};

function ToolbarFilterButton({
    isActive,
    label,
    onClick,
}: ToolbarFilterButtonProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`inline-flex h-10 items-center justify-center rounded-xl px-5 text-sm font-black transition ${isActive
                    ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm"
                    : "bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--primary)]"
                }`}
        >
            {label}
        </button>
    );
}

export function CertificatesToolbar({
    totalCertificates,
    mdtCertificatesCount,
    institutionalCertificatesCount,
    statusFilter,
    searchTerm,
    isRefreshing,
    onStatusFilterChange,
    onSearchTermChange,
    onRefresh,
}: CertificatesToolbarProps) {
    return (
        <div className="mb-5 rounded-[22px] border border-[var(--border)] bg-[var(--card)] p-3 shadow-sm">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex flex-wrap gap-2">
                    <ToolbarFilterButton
                        isActive={statusFilter === "all"}
                        label={`Todos (${totalCertificates})`}
                        onClick={() => onStatusFilterChange("all")}
                    />

                    <ToolbarFilterButton
                        isActive={statusFilter === "mdt"}
                        label={`MDT (${mdtCertificatesCount})`}
                        onClick={() => onStatusFilterChange("mdt")}
                    />

                    <ToolbarFilterButton
                        isActive={statusFilter === "institutional"}
                        label={`Institucionales (${institutionalCertificatesCount})`}
                        onClick={() =>
                            onStatusFilterChange("institutional")
                        }
                    />
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <label className="relative block w-full sm:w-[360px] xl:w-[470px]">
                        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--muted-foreground)]" />

                        <input
                            type="search"
                            value={searchTerm}
                            onChange={(event) =>
                                onSearchTermChange(event.target.value)
                            }
                            placeholder="Buscar por curso, código o tipo..."
                            className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--card)] pl-12 pr-4 text-sm font-semibold text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--ring)]/30"
                        />
                    </label>

                    <button
                        type="button"
                        onClick={onRefresh}
                        disabled={isRefreshing}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-5 text-sm font-black text-[var(--foreground)] transition hover:bg-[var(--muted)] disabled:cursor-not-allowed disabled:opacity-60"
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
        </div>
    );
}