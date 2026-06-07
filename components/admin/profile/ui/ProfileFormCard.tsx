import {
    Building2,
    CreditCard,
    Loader2,
    LockKeyhole,
    Mail,
    Phone,
    Save,
    UserRound,
} from "lucide-react";

import type {
    UserProfileFormState,
} from "../hook";
import {
    ProfileField,
} from "./ProfileField";

type ProfileFormCardProps = {
    profile:
    UserProfileFormState;
};

export function ProfileFormCard({
    profile,
}: ProfileFormCardProps) {
    return (
        <form
            onSubmit={
                profile.handleSubmit
            }
            noValidate
            className="rounded-2xl border border-[var(--border)] p-3 shadow-sm sm:rounded-3xl sm:p-4 lg:p-5"
            style={{
                background:
                    "var(--gradient-card)",
            }}
        >
            <div className="mb-3 flex min-w-0 items-center gap-2.5 border-b border-[var(--border)] pb-3 sm:mb-4 sm:gap-3 sm:pb-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--secondary)] text-[var(--secondary-foreground)] sm:h-10 sm:w-10 sm:rounded-2xl">
                    <UserRound className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>

                <div className="min-w-0">
                    <h2 className="text-sm font-black text-[var(--foreground)] sm:text-base lg:text-lg">
                        Información personal
                    </h2>

                    <p
                        title={
                            profile.fullName
                        }
                        className="mt-0.5 truncate text-[11px] font-semibold text-[var(--muted-foreground)] sm:text-xs"
                    >
                        Usuario autenticado:{" "}
                        {
                            profile.fullName
                        }
                    </p>
                </div>
            </div>

            <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
                <ProfileField
                    label="Usuario"
                    value={
                        profile.form
                            .username
                    }
                    placeholder="Nombre de usuario"
                    readOnly
                    disabled
                />

                <ProfileField
                    label="Cédula / identificación"
                    value={
                        profile.form
                            .idnumber
                    }
                    placeholder="Identificación no disponible"
                    Icon={
                        CreditCard
                    }
                    readOnly
                    disabled
                />

                <ProfileField
                    label="Departamento"
                    value={
                        profile.form
                            .departament
                    }
                    placeholder="Ingrese su departamento"
                    Icon={
                        Building2
                    }
                    onChange={(
                        value,
                    ) => {
                        profile.handleChange(
                            "departament",
                            value,
                        );
                    }}
                />

                <ProfileField
                    label="Nombres"
                    value={
                        profile.form
                            .firstname
                    }
                    placeholder="Ingrese sus nombres"
                    required
                    onChange={(
                        value,
                    ) => {
                        profile.handleChange(
                            "firstname",
                            value,
                        );
                    }}
                />

                <ProfileField
                    label="Apellidos"
                    value={
                        profile.form
                            .lastname
                    }
                    placeholder="Ingrese sus apellidos"
                    required
                    onChange={(
                        value,
                    ) => {
                        profile.handleChange(
                            "lastname",
                            value,
                        );
                    }}
                />

                <ProfileField
                    label="Correo electrónico"
                    type="email"
                    value={
                        profile.form
                            .email
                    }
                    placeholder="correo@ejemplo.com"
                    Icon={
                        Mail
                    }
                    required
                    onChange={(
                        value,
                    ) => {
                        profile.handleChange(
                            "email",
                            value,
                        );
                    }}
                />

                <ProfileField
                    label="Teléfono"
                    value={
                        profile.form
                            .phone_number
                    }
                    placeholder="Ingrese su teléfono"
                    Icon={
                        Phone
                    }
                    onChange={(
                        value,
                    ) => {
                        profile.handleChange(
                            "phone_number",
                            value,
                        );
                    }}
                />

                <ProfileField
                    label="Nueva contraseña"
                    type="password"
                    value={
                        profile.form
                            .password
                    }
                    placeholder="Dejar vacío para no cambiar"
                    Icon={
                        LockKeyhole
                    }
                    helperText="Solo se actualizará cuando escribas una nueva contraseña de al menos 6 caracteres."
                    onChange={(
                        value,
                    ) => {
                        profile.handleChange(
                            "password",
                            value,
                        );
                    }}
                />
            </div>

            <div className="mt-4 flex justify-end border-t border-[var(--border)] pt-3 sm:mt-5 sm:pt-4">
                <button
                    type="submit"
                    disabled={
                        profile.saving
                    }
                    className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 text-xs font-black text-[var(--primary-foreground)] shadow-sm transition hover:opacity-90 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 sm:h-11 sm:w-auto sm:rounded-2xl sm:px-5 sm:text-sm"
                >
                    {profile.saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Save className="h-4 w-4" />
                    )}

                    {profile.saving
                        ? "Guardando..."
                        : "Guardar cambios"}
                </button>
            </div>
        </form>
    );
}

export default ProfileFormCard;