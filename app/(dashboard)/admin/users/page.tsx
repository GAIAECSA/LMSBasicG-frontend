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
    Loader2,
    LoaderCircle,
    Pencil,
    Plus,
    RefreshCw,
    Search,
    Trash2,
    X,
} from "lucide-react";

import { AthenaLoadingBackground } from "@/components/ui/AthenaLoadingBackground";
import { notify } from "@/lib/notify";
import {
    getActivePrivacyPolicy,
    type PrivacyPolicy,
} from "@/services/privacy-policy.service";
import {
    createUser,
    deleteUser,
    getAllUsers,
    updateUser,
    type CreateUserPayload,
    type UpdateUserPayload,
    type User,
} from "@/services/users.service";

const ROWS_PER_PAGE = 7;

const API_URL =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ||
    "http://213.165.74.184:9000";

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

const roleLabels = [
    {
        id: 2,
        label: "VISITANTE",
    },
    {
        id: 1,
        label: "ADMIN",
    },
    {
        id: 3,
        label: "DOCENTE",
    },
    {
        id: 4,
        label: "ESTUDIANTE",
    },
];

const modalRoleOptions = [
    {
        id: 2,
        label: "VISITANTE",
    },
];

type UserWithIdnumber = User & {
    idnumber?: string | null;
    province?: string | null;
    departament?: string | null;
};

type CreateUserPayloadWithIdnumber =
    CreateUserPayload & {
        idnumber: string;
        privacy_policy_id?: number;
        privacyPolicyId?: number;
        privacy_policy_accepted?: boolean;
        privacyPolicyAccepted?: boolean;
    };

type UpdateUserPayloadWithIdnumber =
    UpdateUserPayload & {
        idnumber: string;
    };

type DeleteCandidate = {
    id: number;
    name: string;
};

interface UserFormState {
    username: string;
    idnumber: string;
    password: string;
    firstname: string;
    lastname: string;
    email: string;
    phone_number: string;
    province: string;
    role_id: number;
    accepted_privacy_policy: boolean;
}

const emptyForm: UserFormState = {
    username: "",
    idnumber: "",
    password: "",
    firstname: "",
    lastname: "",
    email: "",
    phone_number: "",
    province: "",
    role_id: 2,
    accepted_privacy_policy: false,
};

function getRoleLabel(
    roleId: number,
) {
    return (
        roleLabels.find(
            (role) =>
                role.id === roleId,
        )?.label || "SIN ROL"
    );
}

function getRoleBadgeClass(
    roleId: number,
) {
    if (
        roleId === 1
    ) {
        return "bg-slate-950 text-white";
    }

    if (
        roleId === 3
    ) {
        return "bg-blue-100 text-blue-700";
    }

    if (
        roleId === 4
    ) {
        return "bg-emerald-100 text-emerald-700";
    }

    return "bg-orange-100 text-orange-700";
}

function normalizeResourceUrl(
    url: string,
) {
    if (
        !url
    ) {
        return "";
    }

    if (
        url.startsWith("http://") ||
        url.startsWith("https://") ||
        url.startsWith("data:")
    ) {
        return url;
    }

    if (
        url.startsWith("/")
    ) {
        return `${API_URL}${url}`;
    }

    return `${API_URL}/${url}`;
}

function formatPolicyDate(
    value?: string | null,
) {
    if (
        !value
    ) {
        return "Sin fecha";
    }

    const date =
        new Date(
            value,
        );

    if (
        Number.isNaN(
            date.getTime(),
        )
    ) {
        return value;
    }

    return new Intl.DateTimeFormat(
        "es-EC",
        {
            dateStyle:
                "medium",
        },
    ).format(
        date,
    );
}

function getUserDisplayName(
    user: UserWithIdnumber,
) {
    const fullName =
        `${user.firstname ?? ""} ${user.lastname ?? ""}`.trim();

    return (
        fullName ||
        user.username ||
        "este usuario"
    );
}

function getUserProvince(
    user: UserWithIdnumber,
) {
    return (
        user.province ||
        user.departament ||
        ""
    );
}

export default function UsersPage() {
    const [
        users,
        setUsers,
    ] =
        useState<
            UserWithIdnumber[]
        >([]);

    const [
        isLoading,
        setIsLoading,
    ] =
        useState(true);

    const [
        isRefreshing,
        setIsRefreshing,
    ] =
        useState(false);

    const [
        isSubmitting,
        setIsSubmitting,
    ] =
        useState(false);

    const [
        isDeleting,
        setIsDeleting,
    ] =
        useState(false);

    const [
        deleteCandidate,
        setDeleteCandidate,
    ] =
        useState<DeleteCandidate | null>(
            null,
        );

    const [
        errorMessage,
        setErrorMessage,
    ] =
        useState("");

    const [
        searchTerm,
        setSearchTerm,
    ] =
        useState("");

    const [
        currentPage,
        setCurrentPage,
    ] =
        useState(1);

    const [
        isModalOpen,
        setIsModalOpen,
    ] =
        useState(false);

    const [
        editingUser,
        setEditingUser,
    ] =
        useState<UserWithIdnumber | null>(
            null,
        );

    const [
        form,
        setForm,
    ] =
        useState<UserFormState>(
            emptyForm,
        );

    const [
        privacyPolicy,
        setPrivacyPolicy,
    ] =
        useState<PrivacyPolicy | null>(
            null,
        );

    const [
        privacyLoading,
        setPrivacyLoading,
    ] =
        useState(true);

    const [
        privacyError,
        setPrivacyError,
    ] =
        useState("");

    const refreshInProgressRef =
        useRef(false);

    const submitInProgressRef =
        useRef(false);

    const deleteInProgressRef =
        useRef(false);

    const privacyPolicyUrl =
        useMemo(
            () =>
                privacyPolicy?.file_url
                    ? normalizeResourceUrl(
                        privacyPolicy.file_url,
                    )
                    : "",
            [
                privacyPolicy,
            ],
        );

    const privacyPolicyIsRequired =
        Boolean(
            privacyPolicy?.is_active &&
            privacyPolicy?.mandatory,
        );

    const loadUsers =
        useCallback(
            async (
                showRefresh =
                    false,
            ) => {
                if (
                    showRefresh &&
                    refreshInProgressRef.current
                ) {
                    return;
                }

                const toastId =
                    showRefresh
                        ? notify.loading(
                            "Actualizando usuarios...",
                            "Estamos consultando la lista de usuarios registrados.",
                        )
                        : null;

                if (
                    showRefresh
                ) {
                    refreshInProgressRef.current =
                        true;

                    setIsRefreshing(
                        true,
                    );
                } else {
                    setIsLoading(
                        true,
                    );
                }

                setErrorMessage(
                    "",
                );

                try {
                    const data =
                        await getAllUsers();

                    setUsers(
                        Array.isArray(
                            data,
                        )
                            ? data
                            : [],
                    );

                    if (
                        toastId !==
                        null
                    ) {
                        notify.dismiss(
                            toastId,
                        );

                        notify.success(
                            "Usuarios actualizados.",
                            "La lista de usuarios se encuentra al día.",
                        );
                    }
                } catch (
                error
                ) {
                    const message =
                        error instanceof
                            Error
                            ? error.message
                            : "No se pudo cargar la lista de usuarios.";

                    setErrorMessage(
                        message,
                    );

                    if (
                        toastId !==
                        null
                    ) {
                        notify.dismiss(
                            toastId,
                        );

                        notify.error(
                            "No se pudo actualizar la lista.",
                            message,
                        );
                    }
                } finally {
                    setIsLoading(
                        false,
                    );

                    setIsRefreshing(
                        false,
                    );

                    refreshInProgressRef.current =
                        false;
                }
            },
            [],
        );

    const loadPrivacyPolicy =
        useCallback(
            async () => {
                try {
                    setPrivacyLoading(
                        true,
                    );

                    setPrivacyError(
                        "",
                    );

                    const activePolicy =
                        await getActivePrivacyPolicy();

                    setPrivacyPolicy(
                        activePolicy,
                    );
                } catch {
                    setPrivacyPolicy(
                        null,
                    );

                    setPrivacyError(
                        "No se pudo cargar la política de privacidad activa.",
                    );
                } finally {
                    setPrivacyLoading(
                        false,
                    );
                }
            },
            [],
        );

    useEffect(() => {
        const timeoutId =
            window.setTimeout(
                () => {
                    void loadUsers();
                    void loadPrivacyPolicy();
                },
                0,
            );

        return () => {
            window.clearTimeout(
                timeoutId,
            );
        };
    }, [
        loadPrivacyPolicy,
        loadUsers,
    ]);

    const filteredUsers =
        useMemo(() => {
            const query =
                searchTerm
                    .trim()
                    .toLowerCase();

            if (
                !query
            ) {
                return users;
            }

            return users.filter(
                (
                    user,
                ) => {
                    const fullName =
                        `${user.firstname || ""} ${user.lastname || ""}`.toLowerCase();

                    const roleName =
                        getRoleLabel(
                            user.role_id,
                        ).toLowerCase();

                    const province =
                        getUserProvince(
                            user,
                        ).toLowerCase();

                    return (
                        fullName.includes(
                            query,
                        ) ||
                        (
                            user.username ||
                            ""
                        )
                            .toLowerCase()
                            .includes(
                                query,
                            ) ||
                        (
                            user.idnumber ||
                            ""
                        )
                            .toLowerCase()
                            .includes(
                                query,
                            ) ||
                        (
                            user.email ||
                            ""
                        )
                            .toLowerCase()
                            .includes(
                                query,
                            ) ||
                        roleName.includes(
                            query,
                        ) ||
                        (
                            user.phone_number ||
                            ""
                        )
                            .toLowerCase()
                            .includes(
                                query,
                            ) ||
                        province.includes(
                            query,
                        ) ||
                        String(
                            user.id,
                        ).includes(
                            query,
                        )
                    );
                },
            );
        }, [
            searchTerm,
            users,
        ]);

    const totalPages =
        Math.max(
            1,
            Math.ceil(
                filteredUsers.length /
                ROWS_PER_PAGE,
            ),
        );

    const activePage =
        Math.min(
            currentPage,
            totalPages,
        );

    const paginatedUsers =
        useMemo(() => {
            const startIndex =
                (
                    activePage -
                    1
                ) *
                ROWS_PER_PAGE;

            return filteredUsers.slice(
                startIndex,
                startIndex +
                ROWS_PER_PAGE,
            );
        }, [
            activePage,
            filteredUsers,
        ]);

    const stats =
        useMemo(
            () => ({
                total:
                    users.length,
                admins:
                    users.filter(
                        (
                            user,
                        ) =>
                            user.role_id ===
                            1,
                    ).length,
                teachers:
                    users.filter(
                        (
                            user,
                        ) =>
                            user.role_id ===
                            3,
                    ).length,
                students:
                    users.filter(
                        (
                            user,
                        ) =>
                            user.role_id ===
                            4,
                    ).length,
                visitors:
                    users.filter(
                        (
                            user,
                        ) =>
                            user.role_id ===
                            2,
                    ).length,
            }),
            [
                users,
            ],
        );

    function openCreateModal() {
        setEditingUser(
            null,
        );

        setForm(
            emptyForm,
        );

        setErrorMessage(
            "",
        );

        setIsModalOpen(
            true,
        );
    }

    function openEditModal(
        user: UserWithIdnumber,
    ) {
        setEditingUser(
            user,
        );

        setForm({
            username:
                user.username ||
                "",
            idnumber:
                user.idnumber ||
                "",
            password:
                "",
            firstname:
                user.firstname ||
                "",
            lastname:
                user.lastname ||
                "",
            email:
                user.email ||
                "",
            phone_number:
                user.phone_number ||
                "",
            province:
                getUserProvince(
                    user,
                ),
            role_id:
                user.role_id,
            accepted_privacy_policy:
                true,
        });

        setErrorMessage(
            "",
        );

        setIsModalOpen(
            true,
        );
    }

    function closeModal() {
        if (
            isSubmitting
        ) {
            return;
        }

        setIsModalOpen(
            false,
        );

        setEditingUser(
            null,
        );

        setForm(
            emptyForm,
        );

        setErrorMessage(
            "",
        );
    }

    function handleInputChange(
        event:
            ChangeEvent<
                | HTMLInputElement
                | HTMLSelectElement
            >,
    ) {
        const {
            name,
            value,
            type,
        } =
            event.target;

        const checked =
            type ===
                "checkbox"
                ? (
                    event.target as HTMLInputElement
                ).checked
                : false;

        setForm(
            (
                currentForm,
            ) => ({
                ...currentForm,
                [name]:
                    type ===
                        "checkbox"
                        ? checked
                        : name ===
                            "role_id"
                            ? Number(
                                value,
                            )
                            : name ===
                                "idnumber"
                                ? value
                                    .replace(
                                        /\D/g,
                                        "",
                                    )
                                    .slice(
                                        0,
                                        10,
                                    )
                                : value,
            }),
        );

        setErrorMessage(
            "",
        );
    }

    function validateForm() {
        if (
            !form.username.trim()
        ) {
            return "El nombre de usuario es obligatorio.";
        }

        if (
            !form.idnumber.trim()
        ) {
            return "La cédula es obligatoria.";
        }

        if (
            form.idnumber.trim()
                .length !== 10
        ) {
            return "La cédula debe tener 10 dígitos.";
        }

        if (
            !editingUser &&
            !form.password.trim()
        ) {
            return "La contraseña es obligatoria.";
        }

        if (
            !form.firstname.trim()
        ) {
            return "El nombre es obligatorio.";
        }

        if (
            !form.lastname.trim()
        ) {
            return "El apellido es obligatorio.";
        }

        if (
            !form.email.trim()
        ) {
            return "El correo electrónico es obligatorio.";
        }

        if (
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                form.email.trim(),
            )
        ) {
            return "Ingresa un correo electrónico válido.";
        }

        if (
            !form.province.trim()
        ) {
            return "Selecciona una provincia.";
        }

        if (
            form.password.trim() &&
            form.password.trim()
                .length < 6
        ) {
            return "La contraseña debe tener al menos 6 caracteres.";
        }

        if (
            !editingUser &&
            privacyLoading
        ) {
            return "Espera mientras se carga la política de privacidad.";
        }

        if (
            !editingUser &&
            privacyPolicyIsRequired &&
            !form.accepted_privacy_policy
        ) {
            return "El usuario debe aceptar la política de privacidad para ser registrado manualmente.";
        }

        return "";
    }

    async function handleSubmit(
        event:
            FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        if (
            submitInProgressRef.current ||
            isSubmitting
        ) {
            return;
        }

        const validationMessage =
            validateForm();

        if (
            validationMessage
        ) {
            notify.warning(
                "Revisa los campos requeridos.",
                validationMessage,
            );

            return;
        }

        submitInProgressRef.current =
            true;

        setIsSubmitting(
            true,
        );

        setErrorMessage(
            "",
        );

        const isEditing =
            Boolean(
                editingUser,
            );

        const toastId =
            notify.loading(
                isEditing
                    ? "Actualizando usuario..."
                    : "Creando usuario...",
                "Estamos guardando la información del usuario.",
            );

        try {
            if (
                editingUser
            ) {
                const payload:
                    UpdateUserPayloadWithIdnumber =
                {
                    username:
                        form.username.trim(),
                    idnumber:
                        form.idnumber.trim(),
                    firstname:
                        form.firstname.trim(),
                    lastname:
                        form.lastname.trim(),
                    email:
                        form.email.trim(),
                    phone_number:
                        form.phone_number.trim() ||
                        null,
                    departament:
                        form.province.trim() ||
                        null,
                };

                if (
                    form.password.trim()
                ) {
                    payload.password =
                        form.password.trim();
                }

                await updateUser(
                    editingUser.id,
                    payload,
                );
            } else {
                const payload:
                    CreateUserPayloadWithIdnumber =
                {
                    username:
                        form.username.trim(),
                    idnumber:
                        form.idnumber.trim(),
                    password:
                        form.password.trim(),
                    firstname:
                        form.firstname.trim(),
                    lastname:
                        form.lastname.trim(),
                    email:
                        form.email.trim(),
                    phone_number:
                        form.phone_number.trim() ||
                        null,
                    departament:
                        form.province.trim() ||
                        null,
                    role_id:
                        Number(
                            form.role_id,
                        ),
                };

                if (
                    privacyPolicy &&
                    form.accepted_privacy_policy
                ) {
                    payload.privacy_policy_id =
                        privacyPolicy.id;

                    payload.privacyPolicyId =
                        privacyPolicy.id;

                    payload.privacy_policy_accepted =
                        true;

                    payload.privacyPolicyAccepted =
                        true;
                }

                await createUser(
                    payload,
                );
            }

            setIsModalOpen(
                false,
            );

            setEditingUser(
                null,
            );

            setForm(
                emptyForm,
            );

            await loadUsers();

            notify.dismiss(
                toastId,
            );

            notify.success(
                isEditing
                    ? "Usuario actualizado."
                    : "Usuario creado.",
                isEditing
                    ? "Los datos del usuario se actualizaron correctamente."
                    : "El nuevo usuario fue registrado correctamente.",
            );
        } catch (
        error
        ) {
            const message =
                error instanceof
                    Error
                    ? error.message
                    : "No se pudo guardar el usuario.";

            notify.dismiss(
                toastId,
            );

            notify.error(
                isEditing
                    ? "No se pudo actualizar el usuario."
                    : "No se pudo crear el usuario.",
                message,
            );
        } finally {
            submitInProgressRef.current =
                false;

            setIsSubmitting(
                false,
            );
        }
    }

    function openDeleteModal(
        user: UserWithIdnumber,
    ) {
        if (
            isDeleting
        ) {
            return;
        }

        setDeleteCandidate({
            id:
                Number(
                    user.id,
                ),
            name:
                getUserDisplayName(
                    user,
                ),
        });
    }

    function closeDeleteModal() {
        if (
            isDeleting
        ) {
            return;
        }

        setDeleteCandidate(
            null,
        );
    }

    async function confirmDeleteUser() {
        if (
            !deleteCandidate ||
            isDeleting ||
            deleteInProgressRef.current
        ) {
            return;
        }

        deleteInProgressRef.current =
            true;

        setIsDeleting(
            true,
        );

        setErrorMessage(
            "",
        );

        const toastId =
            notify.loading(
                "Eliminando usuario...",
                `Estamos eliminando a ${deleteCandidate.name}.`,
            );

        try {
            await deleteUser(
                deleteCandidate.id,
            );

            setUsers(
                (
                    currentUsers,
                ) =>
                    currentUsers.filter(
                        (
                            user,
                        ) =>
                            Number(
                                user.id,
                            ) !==
                            deleteCandidate.id,
                    ),
            );

            notify.dismiss(
                toastId,
            );

            notify.success(
                "Usuario eliminado correctamente.",
                `${deleteCandidate.name} fue eliminado de la plataforma.`,
            );

            setDeleteCandidate(
                null,
            );
        } catch (
        error
        ) {
            const message =
                error instanceof
                    Error
                    ? error.message
                    : "No se pudo eliminar el usuario.";

            setErrorMessage(
                message,
            );

            notify.dismiss(
                toastId,
            );

            notify.error(
                "No se pudo eliminar el usuario.",
                message,
            );
        } finally {
            deleteInProgressRef.current =
                false;

            setIsDeleting(
                false,
            );
        }
    }

    if (
        isLoading
    ) {
        return (
            <AthenaLoadingBackground
                className="max-w-[1450px]"
                contentClassName="flex min-h-[calc(100dvh-150px)] items-center justify-center"
            >
                <div
                    role="status"
                    aria-live="polite"
                    aria-label="Cargando usuarios"
                    className="flex min-h-[240px] w-full max-w-xl flex-col items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--card)]/80 px-5 py-6 text-center shadow-sm backdrop-blur-[3px] sm:min-h-[300px] sm:rounded-[28px] sm:px-7 sm:py-8"
                >
                    <LoaderCircle className="h-8 w-8 animate-spin text-[var(--primary)] sm:h-9 sm:w-9" />

                    <p className="mt-4 text-sm font-black text-[var(--foreground)] sm:text-base">
                        Cargando usuarios registrados
                    </p>

                    <p className="mt-1.5 text-xs font-semibold leading-5 text-[var(--muted-foreground)] sm:text-sm">
                        Estamos preparando la información de la plataforma...
                    </p>
                </div>
            </AthenaLoadingBackground>
        );
    }

    return (
        <section className="min-w-0 space-y-4 sm:space-y-5 lg:space-y-6 [@media(max-height:760px)]:space-y-4 [&_button:not(:disabled)]:cursor-pointer [&_button:not(:disabled)]:select-none [&_button:not(:disabled)]:transition-all [&_button:not(:disabled)]:duration-150 [&_button:not(:disabled)]:ease-out [&_button:not(:disabled):active]:translate-y-px [&_button:not(:disabled):active]:scale-[0.97] [&_button:not(:disabled):active]:brightness-95 [&_button:not(:disabled):active]:shadow-inner">
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#07111F] via-[#172861] via-70% to-[#F97316] p-4 text-white shadow-lg sm:rounded-3xl sm:p-5 lg:p-6 [@media(max-height:760px)]:p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-5 xl:gap-6">
                    <div className="min-w-0">
                        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-blue-100 sm:text-xs sm:tracking-[0.25em] lg:text-sm">
                            Gestión de usuarios
                        </p>

                        <h2 className="mt-2 text-xl font-bold sm:mt-3 sm:text-2xl lg:text-3xl [@media(max-height:760px)]:text-xl">
                            Usuarios registrados
                        </h2>

                        <p className="mt-2 max-w-2xl text-xs leading-5 text-blue-50 sm:text-sm sm:leading-6 [@media(max-height:760px)]:text-xs [@media(max-height:760px)]:leading-5">
                            Administra los usuarios creados en la plataforma,
                            revisa sus datos principales, consulta su rol y
                            realiza acciones de edición o eliminación.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3 lg:min-w-[440px] xl:min-w-[560px] 2xl:min-w-[620px]">
                        <StatsCard
                            label="Total"
                            value={
                                stats.total
                            }
                        />

                        <StatsCard
                            label="Admin"
                            value={
                                stats.admins
                            }
                        />

                        <StatsCard
                            label="Docentes"
                            value={
                                stats.teachers
                            }
                        />

                        <StatsCard
                            label="Estudiantes"
                            value={
                                stats.students
                            }
                        />
                    </div>
                </div>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm sm:rounded-3xl sm:p-5 [@media(max-height:760px)]:p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h3 className="text-base font-bold text-slate-950 sm:text-lg">
                            Lista de usuarios
                        </h3>

                        <p className="mt-1 text-xs leading-5 text-[var(--muted-foreground)] sm:text-sm">
                            Busca por nombre, usuario, cédula, correo, teléfono,
                            provincia, rol o ID.
                        </p>
                    </div>

                    <div className="grid gap-2.5 xs:grid-cols-2 sm:gap-3">
                        <button
                            type="button"
                            onClick={
                                openCreateModal
                            }
                            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#172861] px-4 text-xs font-bold text-white shadow-sm transition hover:bg-[#0B163F] sm:h-11 sm:rounded-2xl sm:px-5 sm:text-sm [@media(max-height:760px)]:h-10"
                        >
                            <Plus className="h-4 w-4 shrink-0" />

                            Nuevo usuario
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                void loadUsers(
                                    true,
                                )
                            }
                            disabled={
                                isRefreshing
                            }
                            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 text-xs font-bold text-white shadow-sm transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60 sm:h-11 sm:rounded-2xl sm:px-5 sm:text-sm [@media(max-height:760px)]:h-10"
                        >
                            <RefreshCw
                                className={`h-4 w-4 shrink-0 ${isRefreshing
                                        ? "animate-spin"
                                        : ""
                                    }`}
                            />

                            {isRefreshing
                                ? "Actualizando..."
                                : "Actualizar"}
                        </button>
                    </div>
                </div>

                <div className="relative mt-4 w-full lg:max-w-[520px] [@media(max-height:760px)]:mt-3">
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                    <input
                        type="search"
                        value={
                            searchTerm
                        }
                        onChange={(
                            event,
                        ) => {
                            setSearchTerm(
                                event.target
                                    .value,
                            );

                            setCurrentPage(
                                1,
                            );
                        }}
                        placeholder="Buscar usuario, cédula, nombre, correo, provincia, rol o ID"
                        className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-xs font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:h-11 sm:rounded-2xl sm:text-sm"
                    />
                </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm sm:rounded-3xl">
                <div className="hidden overflow-x-auto lg:block">
                    <table className="w-full min-w-[900px] table-fixed divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <TableHeader className="w-[29%]">
                                    Usuario
                                </TableHeader>

                                <TableHeader className="w-[14%]">
                                    Cédula
                                </TableHeader>

                                <TableHeader className="w-[25%]">
                                    Correo
                                </TableHeader>

                                <TableHeader className="hidden w-[13%] 2xl:table-cell">
                                    Teléfono
                                </TableHeader>

                                <TableHeader className="hidden w-[15%] 2xl:table-cell">
                                    Provincia
                                </TableHeader>

                                <TableHeader className="w-[14%]">
                                    Rol
                                </TableHeader>

                                <th className="w-[112px] px-3 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-600 2xl:w-[228px]">
                                    Acciones
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                            {paginatedUsers.length ===
                                0 ? (
                                <tr>
                                    <td
                                        colSpan={
                                            7
                                        }
                                        className="px-5 py-12 text-center"
                                    >
                                        <p className="text-sm font-bold text-slate-800">
                                            No hay usuarios para mostrar.
                                        </p>

                                        <p className="mt-1 text-sm text-slate-500">
                                            Crea un usuario nuevo o cambia el
                                            texto de búsqueda.
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                paginatedUsers.map(
                                    (
                                        user,
                                    ) => (
                                        <tr
                                            key={
                                                user.id
                                            }
                                            className="transition hover:bg-blue-50/40"
                                        >
                                            <td className="min-w-0 px-4 py-3 align-middle">
                                                <UserIdentity
                                                    user={
                                                        user
                                                    }
                                                />
                                            </td>

                                            <td className="whitespace-nowrap px-4 py-3 align-middle text-sm font-semibold text-slate-700">
                                                {user.idnumber ||
                                                    "Sin cédula"}
                                            </td>

                                            <td className="min-w-0 px-4 py-3 align-middle">
                                                <p
                                                    title={
                                                        user.email ||
                                                        ""
                                                    }
                                                    className="truncate text-sm font-semibold text-slate-700"
                                                >
                                                    {
                                                        user.email
                                                    }
                                                </p>

                                                <p className="mt-1 truncate text-xs font-medium text-slate-500 2xl:hidden">
                                                    {user.phone_number ||
                                                        "Sin teléfono"}
                                                    {" · "}
                                                    {getUserProvince(
                                                        user,
                                                    ) ||
                                                        "Sin provincia"}
                                                </p>
                                            </td>

                                            <td className="hidden px-4 py-3 align-middle text-sm font-semibold text-slate-500 2xl:table-cell">
                                                <p
                                                    className="truncate"
                                                    title={
                                                        user.phone_number ||
                                                        "Sin teléfono"
                                                    }
                                                >
                                                    {user.phone_number ||
                                                        "Sin teléfono"}
                                                </p>
                                            </td>

                                            <td className="hidden min-w-0 px-4 py-3 align-middle text-sm font-semibold text-slate-500 2xl:table-cell">
                                                <p
                                                    className="truncate"
                                                    title={
                                                        getUserProvince(
                                                            user,
                                                        ) ||
                                                        "Sin provincia"
                                                    }
                                                >
                                                    {getUserProvince(
                                                        user,
                                                    ) ||
                                                        "Sin provincia"}
                                                </p>
                                            </td>

                                            <td className="px-4 py-3 align-middle">
                                                <RoleBadge
                                                    roleId={
                                                        user.role_id
                                                    }
                                                />
                                            </td>

                                            <td className="px-3 py-3 align-middle">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            openEditModal(
                                                                user,
                                                            )
                                                        }
                                                        aria-label={`Editar usuario ${getUserDisplayName(
                                                            user,
                                                        )}`}
                                                        title="Editar usuario"
                                                        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-blue-200 text-blue-700 transition hover:bg-blue-50 2xl:w-auto 2xl:gap-2 2xl:px-3"
                                                    >
                                                        <Pencil className="h-4 w-4" />

                                                        <span className="hidden text-xs font-bold 2xl:inline">
                                                            Editar
                                                        </span>
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            openDeleteModal(
                                                                user,
                                                            )
                                                        }
                                                        aria-label={`Eliminar usuario ${getUserDisplayName(
                                                            user,
                                                        )}`}
                                                        title="Eliminar usuario"
                                                        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-red-200 text-red-600 transition hover:bg-red-50 2xl:w-auto 2xl:gap-2 2xl:px-3"
                                                    >
                                                        <Trash2 className="h-4 w-4" />

                                                        <span className="hidden text-xs font-bold 2xl:inline">
                                                            Eliminar
                                                        </span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ),
                                )
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="divide-y divide-slate-100 lg:hidden">
                    {paginatedUsers.length ===
                        0 ? (
                        <div className="px-4 py-12 text-center">
                            <p className="text-sm font-bold text-slate-800">
                                No hay usuarios para mostrar.
                            </p>

                            <p className="mt-1 text-sm text-slate-500">
                                Crea un usuario nuevo o cambia el texto de búsqueda.
                            </p>
                        </div>
                    ) : (
                        paginatedUsers.map(
                            (
                                user,
                            ) => (
                                <article
                                    key={
                                        user.id
                                    }
                                    className="space-y-3 p-4 sm:space-y-4 sm:p-5"
                                >
                                    <div className="flex min-w-0 items-start justify-between gap-3">
                                        <UserIdentity
                                            user={
                                                user
                                            }
                                        />

                                        <RoleBadge
                                            roleId={
                                                user.role_id
                                            }
                                        />
                                    </div>

                                    <dl className="grid gap-3 rounded-xl bg-slate-50 p-3 text-xs sm:grid-cols-2 sm:rounded-2xl sm:text-sm">
                                        <MobileDetail
                                            label="Cédula"
                                            value={
                                                user.idnumber ||
                                                "Sin cédula"
                                            }
                                        />

                                        <MobileDetail
                                            label="Teléfono"
                                            value={
                                                user.phone_number ||
                                                "Sin teléfono"
                                            }
                                        />

                                        <MobileDetail
                                            label="Correo"
                                            value={
                                                user.email ||
                                                "Sin correo"
                                            }
                                            wide
                                        />

                                        <MobileDetail
                                            label="Provincia"
                                            value={
                                                getUserProvince(
                                                    user,
                                                ) ||
                                                "Sin provincia"
                                            }
                                            wide
                                        />
                                    </dl>

                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                openEditModal(
                                                    user,
                                                )
                                            }
                                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 px-3 py-2.5 text-xs font-bold text-blue-700 transition hover:bg-blue-50"
                                        >
                                            <Pencil className="h-4 w-4" />

                                            Editar
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                openDeleteModal(
                                                    user,
                                                )
                                            }
                                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 px-3 py-2.5 text-xs font-bold text-red-600 transition hover:bg-red-50"
                                        >
                                            <Trash2 className="h-4 w-4" />

                                            Eliminar
                                        </button>
                                    </div>
                                </article>
                            ),
                        )
                    )}
                </div>

                <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 sm:px-5 sm:py-4 md:flex-row md:items-center md:justify-between">
                    <p className="text-center text-xs font-semibold text-slate-500 sm:text-sm md:text-left">
                        Mostrando{" "}
                        {
                            paginatedUsers.length
                        }{" "}
                        de{" "}
                        {
                            filteredUsers.length
                        }{" "}
                        registros
                    </p>

                    <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-1.5 sm:gap-2">
                        <button
                            type="button"
                            onClick={() =>
                                setCurrentPage(
                                    (
                                        page,
                                    ) =>
                                        Math.max(
                                            1,
                                            page -
                                            1,
                                        ),
                                )
                            }
                            disabled={
                                activePage ===
                                1
                            }
                            className="rounded-xl border border-slate-200 px-2.5 py-2 text-[11px] font-bold text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4 sm:text-sm"
                        >
                            Anterior
                        </button>

                        <span className="whitespace-nowrap rounded-xl bg-slate-100 px-2.5 py-2 text-center text-[11px] font-bold text-slate-700 sm:px-4 sm:text-sm">
                            Página{" "}
                            {
                                activePage
                            }{" "}
                            de{" "}
                            {
                                totalPages
                            }
                        </span>

                        <button
                            type="button"
                            onClick={() =>
                                setCurrentPage(
                                    (
                                        page,
                                    ) =>
                                        Math.min(
                                            totalPages,
                                            page +
                                            1,
                                        ),
                                )
                            }
                            disabled={
                                activePage ===
                                totalPages
                            }
                            className="rounded-xl border border-slate-200 px-2.5 py-2 text-[11px] font-bold text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4 sm:text-sm"
                        >
                            Siguiente
                        </button>
                    </div>
                </div>
            </div>

            {isModalOpen ? (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-[1px] sm:items-center sm:px-4 sm:py-4 lg:py-6">
                    <div className="flex max-h-[96dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-h-[92dvh] sm:rounded-3xl [@media(max-height:760px)]:max-h-[96dvh]">
                        <div className="shrink-0 bg-gradient-to-br from-[#07111F] via-[#172861] to-[#F97316] px-4 py-3.5 text-white sm:px-6 sm:py-5 [@media(max-height:760px)]:py-3">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-100">
                                        Formulario
                                    </p>

                                    <h3 className="mt-2 text-xl font-bold">
                                        {editingUser
                                            ? "Editar usuario"
                                            : "Crear nuevo usuario"}
                                    </h3>

                                    <p className="mt-1 text-sm text-blue-50">
                                        Completa los datos principales del usuario.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={
                                        closeModal
                                    }
                                    aria-label="Cerrar formulario"
                                    title="Cerrar"
                                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-white ring-1 ring-white/20 transition hover:bg-white/25"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        <form
                            onSubmit={
                                handleSubmit
                            }
                            noValidate
                            className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:space-y-5 sm:p-6 [@media(max-height:760px)]:space-y-3 [@media(max-height:760px)]:p-4"
                        >
                            <div className="grid gap-3.5 sm:grid-cols-2 sm:gap-4 [@media(max-height:760px)]:gap-3">
                                <UserFormField
                                    label="Usuario"
                                    name="username"
                                    value={
                                        form.username
                                    }
                                    onChange={
                                        handleInputChange
                                    }
                                    required
                                    placeholder="Ej: sebastian"
                                />

                                <UserFormField
                                    label="Cédula"
                                    name="idnumber"
                                    value={
                                        form.idnumber
                                    }
                                    onChange={
                                        handleInputChange
                                    }
                                    required
                                    inputMode="numeric"
                                    maxLength={
                                        10
                                    }
                                    placeholder="Ej: 0999999999"
                                />

                                <UserFormField
                                    label="Contraseña"
                                    name="password"
                                    type="password"
                                    value={
                                        form.password
                                    }
                                    onChange={
                                        handleInputChange
                                    }
                                    required={
                                        !editingUser
                                    }
                                    placeholder={
                                        editingUser
                                            ? "Dejar vacío para no cambiar"
                                            : "Contraseña"
                                    }
                                />

                                <UserFormField
                                    label="Nombre"
                                    name="firstname"
                                    value={
                                        form.firstname
                                    }
                                    onChange={
                                        handleInputChange
                                    }
                                    required
                                    placeholder="Nombre"
                                />

                                <UserFormField
                                    label="Apellido"
                                    name="lastname"
                                    value={
                                        form.lastname
                                    }
                                    onChange={
                                        handleInputChange
                                    }
                                    required
                                    placeholder="Apellido"
                                />

                                <UserFormField
                                    label="Correo"
                                    name="email"
                                    type="email"
                                    value={
                                        form.email
                                    }
                                    onChange={
                                        handleInputChange
                                    }
                                    required
                                    placeholder="correo@ejemplo.com"
                                />

                                <UserFormField
                                    label="Teléfono"
                                    name="phone_number"
                                    value={
                                        form.phone_number
                                    }
                                    onChange={
                                        handleInputChange
                                    }
                                    placeholder="0999999999"
                                />

                                <ProvinceSelectField
                                    label="Provincia"
                                    name="province"
                                    value={
                                        form.province
                                    }
                                    onChange={
                                        handleInputChange
                                    }
                                    required
                                />

                                <div>
                                    <label className="mb-1 block text-xs font-bold text-slate-700 sm:text-sm">
                                        Rol
                                    </label>

                                    {editingUser ? (
                                        <>
                                            <div className="flex h-10 items-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-700 sm:h-11 sm:rounded-2xl sm:px-4 sm:text-sm [@media(max-height:760px)]:h-9">
                                                {getRoleLabel(
                                                    editingUser.role_id,
                                                )}
                                            </div>

                                            <p className="mt-1 text-xs font-semibold text-slate-500">
                                                El rol no se modifica desde este formulario.
                                            </p>
                                        </>
                                    ) : (
                                        <select
                                            name="role_id"
                                            value={
                                                form.role_id
                                            }
                                            onChange={
                                                handleInputChange
                                            }
                                            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:h-11 sm:rounded-2xl sm:px-4 sm:text-sm [@media(max-height:760px)]:h-9"
                                        >
                                            {modalRoleOptions.map(
                                                (
                                                    role,
                                                ) => (
                                                    <option
                                                        key={
                                                            role.id
                                                        }
                                                        value={
                                                            role.id
                                                        }
                                                    >
                                                        {
                                                            role.label
                                                        }
                                                    </option>
                                                ),
                                            )}
                                        </select>
                                    )}
                                </div>
                            </div>

                            {!editingUser ? (
                                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 sm:rounded-2xl sm:p-4">
                                    {privacyLoading ? (
                                        <p className="text-sm font-semibold text-slate-500">
                                            Cargando política de privacidad...
                                        </p>
                                    ) : privacyPolicy ? (
                                        <label className="flex cursor-pointer items-start gap-3">
                                            <input
                                                name="accepted_privacy_policy"
                                                type="checkbox"
                                                checked={
                                                    form.accepted_privacy_policy
                                                }
                                                onChange={
                                                    handleInputChange
                                                }
                                                className="mt-1 h-4 w-4 accent-[#172861]"
                                            />

                                            <span className="text-sm leading-6 text-slate-600">
                                                Confirmo que el usuario acepta la{" "}
                                                <span className="font-bold text-slate-900">
                                                    {
                                                        privacyPolicy.title
                                                    }
                                                </span>{" "}
                                                versión{" "}
                                                <span className="font-bold">
                                                    {
                                                        privacyPolicy.version
                                                    }
                                                </span>
                                                , vigente desde{" "}
                                                {formatPolicyDate(
                                                    privacyPolicy.effective_date,
                                                )}
                                                .{" "}
                                                {privacyPolicyUrl ? (
                                                    <a
                                                        href={
                                                            privacyPolicyUrl
                                                        }
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="font-bold text-[#172861] underline-offset-4 hover:underline"
                                                        onClick={(
                                                            event,
                                                        ) =>
                                                            event.stopPropagation()
                                                        }
                                                    >
                                                        Ver documento
                                                    </a>
                                                ) : null}

                                                {privacyPolicy.mandatory ? (
                                                    <span className="ml-1 font-bold text-red-600">
                                                        Obligatoria.
                                                    </span>
                                                ) : null}
                                            </span>
                                        </label>
                                    ) : (
                                        <p className="text-sm font-semibold text-slate-500">
                                            {privacyError ||
                                                "No existe una política de privacidad activa."}
                                        </p>
                                    )}
                                </div>
                            ) : null}

                            <div className="sticky bottom-0 -mx-4 -mb-4 flex flex-col-reverse gap-2 border-t border-slate-200 bg-white px-4 pb-4 pt-3 sm:-mx-6 sm:-mb-6 sm:flex-row sm:justify-end sm:gap-3 sm:px-6 sm:pb-6 sm:pt-4">
                                <button
                                    type="button"
                                    onClick={
                                        closeModal
                                    }
                                    disabled={
                                        isSubmitting
                                    }
                                    className="h-10 w-full rounded-xl border border-slate-200 px-4 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 sm:h-11 sm:w-auto sm:rounded-2xl sm:px-5 sm:text-sm"
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="submit"
                                    disabled={
                                        isSubmitting ||
                                        (
                                            !editingUser &&
                                            privacyLoading
                                        )
                                    }
                                    className="h-10 w-full rounded-xl bg-[#172861] px-4 text-xs font-bold text-white shadow-sm transition hover:bg-[#0B163F] disabled:cursor-not-allowed disabled:opacity-60 sm:h-11 sm:w-auto sm:rounded-2xl sm:px-5 sm:text-sm"
                                >
                                    {isSubmitting
                                        ? "Guardando..."
                                        : editingUser
                                            ? "Actualizar usuario"
                                            : "Crear usuario"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}

            {deleteCandidate ? (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="delete-user-title"
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-[2px]"
                >
                    <div className="w-full max-w-md overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-2xl">
                        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
                            <div className="flex min-w-0 items-start gap-3">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                                    <AlertTriangle className="h-5 w-5" />
                                </div>

                                <div className="min-w-0">
                                    <h2
                                        id="delete-user-title"
                                        className="text-base font-black text-slate-950 sm:text-lg"
                                    >
                                        Eliminar usuario
                                    </h2>

                                    <p className="mt-1 text-xs font-semibold leading-5 text-slate-500 sm:text-sm">
                                        Esta acción no se puede deshacer.
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={
                                    closeDeleteModal
                                }
                                disabled={
                                    isDeleting
                                }
                                aria-label="Cerrar confirmación"
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="px-5 py-5 sm:px-6">
                            <p className="text-sm font-semibold leading-6 text-slate-600">
                                ¿Seguro que deseas eliminar al usuario{" "}
                                <span className="font-black text-slate-950">
                                    {
                                        deleteCandidate.name
                                    }
                                </span>
                                ?
                            </p>

                            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={
                                        closeDeleteModal
                                    }
                                    disabled={
                                        isDeleting
                                    }
                                    className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 sm:h-11 sm:px-5 sm:text-sm"
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        void confirmDeleteUser()
                                    }
                                    disabled={
                                        isDeleting
                                    }
                                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-xs font-black text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60 sm:h-11 sm:px-5 sm:text-sm"
                                >
                                    {isDeleting ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Trash2 className="h-4 w-4" />
                                    )}

                                    {isDeleting
                                        ? "Eliminando..."
                                        : "Eliminar usuario"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}
        </section>
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
            <p className="truncate text-[10px] font-bold uppercase tracking-wide text-white/75 sm:text-xs">
                {label}
            </p>

            <p className="mt-1.5 text-xl font-bold sm:mt-2 sm:text-2xl xl:text-3xl [@media(max-height:760px)]:text-xl">
                {value}
            </p>
        </div>
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

function UserIdentity({
    user,
}: {
    user: UserWithIdnumber;
}) {
    return (
        <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#172861] text-sm font-bold text-white">
                {(user.firstname ||
                    "U")
                    .charAt(
                        0,
                    )
                    .toUpperCase()}
            </div>

            <div className="min-w-0">
                <p
                    title={getUserDisplayName(
                        user,
                    )}
                    className="truncate text-sm font-bold text-slate-950"
                >
                    {user.firstname}{" "}
                    {user.lastname}
                </p>

                <p
                    title={`@${user.username ||
                        ""
                        }`}
                    className="mt-0.5 truncate text-xs font-medium text-slate-500"
                >
                    @{user.username}
                </p>
            </div>
        </div>
    );
}

function RoleBadge({
    roleId,
}: {
    roleId: number;
}) {
    return (
        <span
            className={`inline-flex max-w-full rounded-full px-3 py-1 text-xs font-bold ${getRoleBadgeClass(
                roleId,
            )}`}
        >
            <span className="truncate">
                {getRoleLabel(
                    roleId,
                )}
            </span>
        </span>
    );
}

function MobileDetail({
    label,
    value,
    wide = false,
}: {
    label: string;
    value: string;
    wide?: boolean;
}) {
    return (
        <div
            className={`min-w-0 ${wide
                    ? "sm:col-span-2"
                    : ""
                }`}
        >
            <dt className="text-xs font-bold uppercase tracking-wide text-slate-400">
                {label}
            </dt>

            <dd className="mt-1 break-words font-semibold text-slate-700">
                {value}
            </dd>
        </div>
    );
}

function UserFormField({
    label,
    name,
    value,
    type = "text",
    placeholder,
    required = false,
    inputMode,
    maxLength,
    onChange,
}: {
    label: string;
    name: keyof UserFormState;
    value: string;
    type?: string;
    placeholder?: string;
    required?: boolean;
    inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
    maxLength?: number;
    onChange: (
        event:
            ChangeEvent<HTMLInputElement>,
    ) => void;
}) {
    const showRequiredMark =
        required &&
        !value.trim();

    return (
        <div>
            <label className="mb-1 block text-xs font-bold text-slate-700 sm:text-sm">
                {label}

                {showRequiredMark ? (
                    <span className="ml-1 text-red-600">
                        *
                    </span>
                ) : null}
            </label>

            <input
                name={
                    name
                }
                type={
                    type
                }
                value={
                    value
                }
                required={
                    required
                }
                inputMode={
                    inputMode
                }
                maxLength={
                    maxLength
                }
                onChange={
                    onChange
                }
                placeholder={
                    placeholder
                }
                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs font-medium outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:h-11 sm:rounded-2xl sm:px-4 sm:text-sm [@media(max-height:760px)]:h-9"
            />
        </div>
    );
}

function ProvinceSelectField({
    label,
    name,
    value,
    required = false,
    onChange,
}: {
    label: string;
    name: keyof UserFormState;
    value: string;
    required?: boolean;
    onChange: (
        event:
            ChangeEvent<HTMLSelectElement>,
    ) => void;
}) {
    const showRequiredMark =
        required &&
        !value.trim();

    return (
        <div>
            <label className="mb-1 block text-xs font-bold text-slate-700 sm:text-sm">
                {label}

                {showRequiredMark ? (
                    <span className="ml-1 text-red-600">
                        *
                    </span>
                ) : null}
            </label>

            <select
                name={
                    name
                }
                value={
                    value
                }
                required={
                    required
                }
                onChange={
                    onChange
                }
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:h-11 sm:rounded-2xl sm:px-4 sm:text-sm [@media(max-height:760px)]:h-9"
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
    );
}