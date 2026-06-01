type HeaderProps = {
    isAdminRoute: boolean;
    selectedCourseName: string;
    fieldsCount: number;
    qrEnabled: boolean;
};

export function Header({
    isAdminRoute,
    selectedCourseName,
    fieldsCount,
    qrEnabled,
}: HeaderProps) {
    return (
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#07111F] via-[#172861] via-70% to-[#F97316] p-6 text-white shadow-lg">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                <div>
                    <p className="text-sm font-medium uppercase tracking-[0.25em] text-blue-100">
                        {isAdminRoute
                            ? "Panel del administrador"
                            : "Panel del profesor"}
                    </p>

                    <h2 className="mt-3 text-2xl font-bold md:text-3xl">
                        Plantilla del certificado
                    </h2>

                    <p className="mt-2 max-w-3xl text-sm leading-6 text-blue-50">
                        Diseña y guarda la plantilla del certificado para{" "}
                        <span className="font-bold text-white">
                            {selectedCourseName}
                        </span>
                        . Puedes ubicar campos, firmas, fondo y código QR.
                    </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[420px]">
                    <HeaderMetric label="Campos" value={fieldsCount} />
                    <HeaderMetric label="QR" value={qrEnabled ? "Activo" : "No"} />
                </div>
            </div>
        </div>
    );
}

function HeaderMetric({
    label,
    value,
}: {
    label: string;
    value: string | number;
}) {
    return (
        <div className="rounded-2xl bg-white/15 p-4 ring-1 ring-white/20">
            <p className="text-xs font-bold uppercase tracking-wide text-white/75">
                {label}
            </p>
            <p className="mt-2 text-3xl font-bold">{value}</p>
        </div>
    );
}