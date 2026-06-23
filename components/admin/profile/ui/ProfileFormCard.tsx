import type {
    ChangeEvent,
} from "react";

import {
    CreditCard,
    Loader2,
    LockKeyhole,
    Mail,
    MapPin,
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
    profile: UserProfileFormState;
};

const ECUADOR_PROVINCES = [
    "Azuay",
    "Bolívar",
    "Cañar",
    "Carchi",
    "Chimborazo",
    "Cotopaxi",
    "El Oro",
    "Esmeraldas",
    "Galápagos",
    "Guayas",
    "Imbabura",
    "Loja",
    "Los Ríos",
    "Manabí",
    "Morona Santiago",
    "Napo",
    "Orellana",
    "Pastaza",
    "Pichincha",
    "Santa Elena",
    "Santo Domingo de los Tsáchilas",
    "Sucumbíos",
    "Tungurahua",
    "Zamora Chinchipe",
];

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

                <ProvinceSelectField
                    label="Provincia"
                    value={
                        profile.form
                            .departament
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
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={
                        10
                    }
                    autoComplete="tel"
                    helperText="Ingrese únicamente números. Máximo 10 dígitos."
                    onChange={(
                        value,
                    ) => {
                        const onlyNumbers =
                            value
                                .replace(
                                    /\D/g,
                                    "",
                                )
                                .slice(
                                    0,
                                    10,
                                );

                        profile.handleChange(
                            "phone_number",
                            onlyNumbers,
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

function ProvinceSelectField({
    label,
    value,
    onChange,
}: {
    label: string;
    value: string;
    onChange: (
        value: string,
    ) => void;
}) {
    function handleChange(
        event: ChangeEvent<HTMLSelectElement>,
    ) {
        onChange(
            event.target.value,
        );
    }

    return (
        <div className="min-w-0">
            <label className="mb-1.5 block text-xs font-black text-[var(--foreground)] sm:text-sm">
                {label}
            </label>

            <div className="relative">
                <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />

                <select
                    value={
                        value
                    }
                    onChange={
                        handleChange
                    }
                    className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 pl-9 text-xs font-semibold text-[var(--foreground)] outline-none transition focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)]/10 sm:h-11 sm:rounded-2xl sm:px-4 sm:pl-10 sm:text-sm"
                >
                    <option value="">
                        Selecciona una provincia
                    </option>

                    {ECUADOR_PROVINCES.map(
                        (
                            province,
                        ) => (
                            <option
                                key={
                                    province
                                }
                                value={
                                    province
                                }
                            >
                                {
                                    province
                                }
                            </option>
                        ),
                    )}
                </select>
            </div>
        </div>
    );
}

export default ProfileFormCard;