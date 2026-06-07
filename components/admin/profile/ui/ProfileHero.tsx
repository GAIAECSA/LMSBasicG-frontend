import {
    BadgeCheck,
    UserRound,
} from "lucide-react";
import type {
    ProfileAuthUser,
} from "../types";
import {
    getRoleLabel,
} from "../utils";

type ProfileHeroProps = {
    user: ProfileAuthUser | null;
    initials: string;
};

export function ProfileHero({
    user,
    initials,
}: ProfileHeroProps) {
    return (
        <div
            className="overflow-hidden rounded-2xl text-[var(--primary-foreground)] shadow-lg sm:rounded-3xl"
            style={{
                background:
                    "var(--gradient-admin)",
            }}
        >
            <div className="relative p-4 sm:p-5 lg:p-6 [@media(max-height:760px)]:p-4">
                <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-white/10 blur-3xl sm:h-40 sm:w-40" />

                <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-lg font-black text-[var(--primary)] shadow-lg sm:h-16 sm:w-16 sm:text-xl lg:h-20 lg:w-20 lg:rounded-3xl lg:text-2xl">
                            {initials}
                        </div>

                        <div className="min-w-0">
                            <p className="text-[11px] font-bold text-white/75 sm:text-xs lg:text-sm">
                                Configuración de cuenta
                            </p>

                            <h1 className="mt-0.5 text-xl font-black sm:mt-1 sm:text-2xl lg:text-3xl">
                                Mi perfil
                            </h1>

                            <p className="mt-1 text-xs font-medium leading-5 text-white/80 sm:mt-1.5 sm:text-sm">
                                Actualiza tus datos personales de la plataforma.
                            </p>
                        </div>
                    </div>

                    <div className="inline-flex h-9 w-fit shrink-0 items-center gap-1.5 rounded-xl bg-white/15 px-3 text-xs font-black text-white shadow-sm ring-1 ring-white/10 sm:h-10 sm:gap-2 sm:rounded-2xl sm:px-4 sm:text-sm">
                        <BadgeCheck className="h-4 w-4" />
                        {getRoleLabel(user)}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ProfileHero;
