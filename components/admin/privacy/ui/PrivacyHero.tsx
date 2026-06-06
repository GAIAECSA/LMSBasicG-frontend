import {
    Plus,
    RefreshCw,
} from "lucide-react";

type PrivacyHeroProps = {
    loading: boolean;
    onCreate: () => void;
    onRefresh: () => void;
};

export function PrivacyHero({
    loading,
    onCreate,
    onRefresh,
}: PrivacyHeroProps) {
    return (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#07111F] via-[#172861] via-70% to-[#F97316] p-4 text-white shadow-lg sm:rounded-3xl sm:p-5 lg:p-6 [@media(max-height:760px)]:p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-100 sm:text-xs sm:tracking-[0.25em]">
                        Administración
                    </p>

                    <h1 className="mt-1.5 text-xl font-black tracking-tight sm:mt-2 sm:text-2xl lg:text-3xl">
                        Políticas de privacidad
                    </h1>

                    <p className="mt-1.5 max-w-3xl text-xs font-semibold leading-5 text-blue-50 sm:mt-2 sm:text-sm sm:leading-6">
                        Gestiona las políticas de privacidad del sistema.
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                    <button
                        type="button"
                        onClick={onCreate}
                        className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-white px-3 text-xs font-black text-[#172861] shadow-sm transition hover:bg-blue-50 active:scale-[0.97] sm:h-11 sm:gap-2 sm:rounded-2xl sm:px-4 sm:text-sm"
                    >
                        <Plus className="h-4 w-4" />
                        Nueva política
                    </button>

                    <button
                        type="button"
                        onClick={onRefresh}
                        disabled={loading}
                        className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-white/15 px-3 text-xs font-black text-white ring-1 ring-white/20 backdrop-blur transition hover:bg-white/25 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 sm:h-11 sm:gap-2 sm:rounded-2xl sm:px-4 sm:text-sm"
                    >
                        <RefreshCw
                            className={`h-4 w-4 ${
                                loading
                                    ? "animate-spin"
                                    : ""
                            }`}
                        />
                        Actualizar
                    </button>
                </div>
            </div>
        </div>
    );
}
