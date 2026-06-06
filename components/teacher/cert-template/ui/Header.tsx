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
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#07111F] via-[#172861] via-70% to-[#F97316] p-4 text-white shadow-lg sm:rounded-3xl sm:p-5 lg:p-6 [@media(max-height:760px)]:p-4">
            <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-center xl:grid-cols-[minmax(0,1fr)_380px]">
                <div className="min-w-0">
                    <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-blue-100 sm:text-xs sm:tracking-[0.25em] lg:text-sm">
                        {isAdminRoute
                            ? "Panel del administrador"
                            : "Panel del profesor"}
                    </p>

                    <h2 className="mt-2 text-xl font-bold sm:text-2xl lg:text-3xl [@media(max-height:760px)]:text-xl">
                        Plantilla del certificado
                    </h2>

                    <p className="mt-2 max-w-3xl text-xs leading-5 text-blue-50 sm:text-sm sm:leading-6">
                        Diseña y guarda la plantilla del certificado para{" "}
                        <span className="font-bold text-white">
                            {selectedCourseName}
                        </span>
                        . Puedes ubicar campos, firmas, fondo y código QR.
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <HeaderMetric label="Campos" value={fieldsCount} />

                    <HeaderMetric
                        label="QR"
                        value={qrEnabled ? "Activo" : "No"}
                    />
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
        <div className="rounded-xl bg-white/15 px-3 py-2.5 ring-1 ring-white/20 sm:rounded-2xl sm:px-4 sm:py-3 [@media(max-height:760px)]:py-2.5">
            <p className="text-[10px] font-bold uppercase tracking-wide text-white/75 sm:text-xs">
                {label}
            </p>

            <p className="mt-1 text-xl font-bold sm:text-2xl lg:text-3xl [@media(max-height:760px)]:text-xl">
                {value}
            </p>
        </div>
    );
}
