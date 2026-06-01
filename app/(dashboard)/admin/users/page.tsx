"use client";

import {
    useCallback,
    useEffect,
    useMemo,
    useState,
    type ChangeEvent,
    type FormEvent,
} from "react";
import {
    deleteUser,
    getAllUsers,
    registerUser,
    updateUser,
    type RegisterUserPayload,
    type UpdateUserPayload,
    type User,
} from "@/services/users.service";
import {
    getActivePrivacyPolicy,
    type PrivacyPolicy,
} from "@/services/privacy-policy.service";

const ROWS_PER_PAGE = 7;

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://213.165.74.184:9000";

const roleLabels = [
    { id: 2, label: "VISITANTE" },
    { id: 1, label: "ADMIN" },
    { id: 3, label: "DOCENTE" },
    { id: 4, label: "ESTUDIANTE" },
];

const modalRoleOptions = [{ id: 2, label: "VISITANTE" }];

type UserWithIdnumber = User & {
    idnumber?: string | null;
};

type RegisterUserPayloadWithIdnumber = RegisterUserPayload & {
    idnumber: string;
    privacy_policy_id?: number;
    privacyPolicyId?: number;
    privacy_policy_accepted?: boolean;
    privacyPolicyAccepted?: boolean;
};

type UpdateUserPayloadWithIdnumber = UpdateUserPayload & {
    idnumber: string;
};

interface UserFormState {
    username: string;
    idnumber: string;
    password: string;
    firstname: string;
    lastname: string;
    email: string;
    phone_number: string;
    departament: string;
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
    departament: "",
    role_id: 2,
    accepted_privacy_policy: false,
};

function getRoleLabel(roleId: number) {
    return roleLabels.find((role) => role.id === roleId)?.label || "SIN ROL";
}

function getRoleBadgeClass(roleId: number) {
    if (roleId === 1) {
        return "bg-slate-950 text-white";
    }

    if (roleId === 3) {
        return "bg-blue-100 text-blue-700";
    }

    if (roleId === 4) {
        return "bg-emerald-100 text-emerald-700";
    }

    return "bg-orange-100 text-orange-700";
}


function normalizeResourceUrl(url: string) {
    if (!url) return "";

    if (
        url.startsWith("http://") ||
        url.startsWith("https://") ||
        url.startsWith("data:")
    ) {
        return url;
    }

    if (url.startsWith("/")) {
        return `${API_URL}${url}`;
    }

    return `${API_URL}/${url}`;
}

function formatPolicyDate(value?: string | null) {
    if (!value) return "Sin fecha";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat("es-EC", {
        dateStyle: "medium",
    }).format(date);
}

export default function UsersPage() {
    const [users, setUsers] = useState<UserWithIdnumber[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserWithIdnumber | null>(
        null,
    );
    const [form, setForm] = useState<UserFormState>(emptyForm);

    const [privacyPolicy, setPrivacyPolicy] = useState<PrivacyPolicy | null>(
        null,
    );
    const [privacyLoading, setPrivacyLoading] = useState(true);
    const [privacyError, setPrivacyError] = useState("");

    const privacyPolicyUrl = useMemo(
        () =>
            privacyPolicy?.file_url
                ? normalizeResourceUrl(privacyPolicy.file_url)
                : "",
        [privacyPolicy],
    );

    const privacyPolicyIsRequired = Boolean(
        privacyPolicy?.is_active && privacyPolicy?.mandatory,
    );

    const loadUsers = useCallback(async (showRefresh = false) => {
        try {
            if (showRefresh) {
                setIsRefreshing(true);
            } else {
                setIsLoading(true);
            }

            setErrorMessage("");

            const data = await getAllUsers();
            setUsers(Array.isArray(data) ? data : []);
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : "No se pudo cargar la lista de usuarios.";

            setErrorMessage(message);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    const loadPrivacyPolicy = useCallback(async () => {
        try {
            setPrivacyLoading(true);
            setPrivacyError("");

            const activePolicy = await getActivePrivacyPolicy();

            setPrivacyPolicy(activePolicy);
        } catch {
            setPrivacyPolicy(null);
            setPrivacyError(
                "No se pudo cargar la política de privacidad activa.",
            );
        } finally {
            setPrivacyLoading(false);
        }
    }, []);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void loadUsers();
            void loadPrivacyPolicy();
        }, 0);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [loadUsers, loadPrivacyPolicy]);

    const filteredUsers = useMemo(() => {
        const query = searchTerm.trim().toLowerCase();

        if (!query) return users;

        return users.filter((user) => {
            const fullName = `${user.firstname || ""} ${user.lastname || ""
                }`.toLowerCase();

            const roleName = getRoleLabel(user.role_id).toLowerCase();

            return (
                fullName.includes(query) ||
                (user.username || "").toLowerCase().includes(query) ||
                (user.idnumber || "").toLowerCase().includes(query) ||
                (user.email || "").toLowerCase().includes(query) ||
                roleName.includes(query) ||
                (user.phone_number || "").toLowerCase().includes(query) ||
                (user.departament || "").toLowerCase().includes(query) ||
                String(user.id).includes(query)
            );
        });
    }, [searchTerm, users]);

    const totalPages = Math.max(
        1,
        Math.ceil(filteredUsers.length / ROWS_PER_PAGE),
    );

    const activePage = Math.min(currentPage, totalPages);

    const paginatedUsers = useMemo(() => {
        const startIndex = (activePage - 1) * ROWS_PER_PAGE;
        return filteredUsers.slice(startIndex, startIndex + ROWS_PER_PAGE);
    }, [activePage, filteredUsers]);

    const stats = useMemo(() => {
        return {
            total: users.length,
            admins: users.filter((user) => user.role_id === 1).length,
            teachers: users.filter((user) => user.role_id === 3).length,
            students: users.filter((user) => user.role_id === 4).length,
            visitors: users.filter((user) => user.role_id === 2).length,
        };
    }, [users]);

    const openCreateModal = () => {
        setEditingUser(null);
        setForm(emptyForm);
        setErrorMessage("");
        setSuccessMessage("");
        setIsModalOpen(true);
    };

    const openEditModal = (user: UserWithIdnumber) => {
        setEditingUser(user);
        setForm({
            username: user.username || "",
            idnumber: user.idnumber || "",
            password: "",
            firstname: user.firstname || "",
            lastname: user.lastname || "",
            email: user.email || "",
            phone_number: user.phone_number || "",
            departament: user.departament || "",
            role_id: user.role_id,
            accepted_privacy_policy: true,
        });
        setErrorMessage("");
        setSuccessMessage("");
        setIsModalOpen(true);
    };

    const closeModal = () => {
        if (isSubmitting) return;

        setIsModalOpen(false);
        setEditingUser(null);
        setForm(emptyForm);
        setErrorMessage("");
    };

    const handleInputChange = (
        event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    ) => {
        const { name, value, type } = event.target;
        const checked =
            type === "checkbox"
                ? (event.target as HTMLInputElement).checked
                : false;

        setForm((currentForm) => ({
            ...currentForm,
            [name]:
                type === "checkbox"
                    ? checked
                    : name === "role_id"
                        ? Number(value)
                        : name === "idnumber"
                            ? value.replace(/\D/g, "").slice(0, 10)
                            : value,
        }));
    };

    const validateForm = () => {
        if (!form.username.trim()) {
            return "El nombre de usuario es obligatorio.";
        }

        if (!form.idnumber.trim()) {
            return "La cédula es obligatoria.";
        }

        if (form.idnumber.trim().length !== 10) {
            return "La cédula debe tener 10 dígitos.";
        }

        if (!editingUser && !form.password.trim()) {
            return "La contraseña es obligatoria.";
        }

        if (!form.firstname.trim()) {
            return "El nombre es obligatorio.";
        }

        if (!form.lastname.trim()) {
            return "El apellido es obligatorio.";
        }

        if (!form.email.trim()) {
            return "El correo electrónico es obligatorio.";
        }

        if (!editingUser && privacyLoading) {
            return "Espera mientras se carga la política de privacidad.";
        }

        if (!editingUser && privacyPolicyIsRequired && !form.accepted_privacy_policy) {
            return "El usuario debe aceptar la política de privacidad para ser registrado manualmente.";
        }

        return "";
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const validationMessage = validateForm();

        if (validationMessage) {
            setErrorMessage(validationMessage);
            return;
        }

        try {
            setIsSubmitting(true);
            setErrorMessage("");
            setSuccessMessage("");

            if (editingUser) {
                const payload: UpdateUserPayloadWithIdnumber = {
                    username: form.username.trim(),
                    idnumber: form.idnumber.trim(),
                    firstname: form.firstname.trim(),
                    lastname: form.lastname.trim(),
                    email: form.email.trim(),
                    phone_number: form.phone_number.trim() || null,
                    departament: form.departament.trim() || null,
                };

                if (form.password.trim()) {
                    payload.password = form.password.trim();
                }

                await updateUser(editingUser.id, payload);
                setSuccessMessage("Usuario actualizado correctamente.");
            } else {
                const payload: RegisterUserPayloadWithIdnumber = {
                    username: form.username.trim(),
                    idnumber: form.idnumber.trim(),
                    password: form.password.trim(),
                    firstname: form.firstname.trim(),
                    lastname: form.lastname.trim(),
                    email: form.email.trim(),
                    phone_number: form.phone_number.trim() || null,
                    departament: form.departament.trim() || null,
                    role_id: Number(form.role_id),
                };

                if (privacyPolicy && form.accepted_privacy_policy) {
                    payload.privacy_policy_id = privacyPolicy.id;
                    payload.privacyPolicyId = privacyPolicy.id;
                    payload.privacy_policy_accepted = true;
                    payload.privacyPolicyAccepted = true;
                }

                await registerUser(payload);
                setSuccessMessage("Usuario creado correctamente.");
            }

            setIsModalOpen(false);
            setEditingUser(null);
            setForm(emptyForm);

            await loadUsers();
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : "No se pudo guardar el usuario.";

            setErrorMessage(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (user: UserWithIdnumber) => {
        const confirmed = window.confirm(
            `¿Seguro que deseas eliminar al usuario ${user.firstname} ${user.lastname}?`,
        );

        if (!confirmed) return;

        try {
            setDeletingId(user.id);
            setErrorMessage("");
            setSuccessMessage("");

            await deleteUser(user.id);

            setSuccessMessage("Usuario eliminado correctamente.");
            await loadUsers();
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : "No se pudo eliminar el usuario.";

            setErrorMessage(message);
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <section className="space-y-6">
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#07111F] via-[#172861] via-70% to-[#F97316] p-6 text-white shadow-lg">
                <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                    <div>
                        <p className="text-sm font-medium uppercase tracking-[0.25em] text-blue-100">
                            Gestión de usuarios
                        </p>

                        <h2 className="mt-3 text-2xl font-bold md:text-3xl">
                            Usuarios registrados
                        </h2>

                        <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-50">
                            Administra los usuarios creados en la plataforma,
                            revisa sus datos principales, consulta su rol y
                            realiza acciones de edición o eliminación.
                        </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:min-w-[620px]">
                        <div className="rounded-2xl bg-white/15 p-4 ring-1 ring-white/20">
                            <p className="text-xs font-bold uppercase tracking-wide text-white/75">
                                Total
                            </p>
                            <p className="mt-2 text-3xl font-bold">
                                {isLoading ? "..." : stats.total}
                            </p>
                        </div>

                        <div className="rounded-2xl bg-white/15 p-4 ring-1 ring-white/20">
                            <p className="text-xs font-bold uppercase tracking-wide text-white/75">
                                Admin
                            </p>
                            <p className="mt-2 text-3xl font-bold">
                                {isLoading ? "..." : stats.admins}
                            </p>
                        </div>

                        <div className="rounded-2xl bg-white/15 p-4 ring-1 ring-white/20">
                            <p className="text-xs font-bold uppercase tracking-wide text-white/75">
                                Docentes
                            </p>
                            <p className="mt-2 text-3xl font-bold">
                                {isLoading ? "..." : stats.teachers}
                            </p>
                        </div>

                        <div className="rounded-2xl bg-white/15 p-4 ring-1 ring-white/20">
                            <p className="text-xs font-bold uppercase tracking-wide text-white/75">
                                Estudiantes
                            </p>
                            <p className="mt-2 text-3xl font-bold">
                                {isLoading ? "..." : stats.students}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {(errorMessage || successMessage) && !isModalOpen ? (
                <div
                    className={`rounded-2xl border px-5 py-4 text-sm font-semibold ${errorMessage
                        ? "border-red-200 bg-red-50 text-red-700"
                        : "border-emerald-200 bg-emerald-50 text-emerald-700"
                        }`}
                >
                    {errorMessage || successMessage}
                </div>
            ) : null}

            <div className="rounded-3xl border border-[var(--border)] bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-slate-950">
                            Lista de usuarios
                        </h3>

                        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                            Busca por nombre, usuario, cédula, correo, teléfono,
                            departamento, rol o ID.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                        <button
                            type="button"
                            onClick={openCreateModal}
                            className="h-12 rounded-2xl bg-[#172861] px-5 text-sm font-bold text-white shadow-sm transition hover:bg-[#0B163F]"
                        >
                            Nuevo usuario
                        </button>

                        <button
                            type="button"
                            onClick={() => void loadUsers(true)}
                            disabled={isRefreshing}
                            className="h-12 rounded-2xl bg-orange-500 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isRefreshing ? "Actualizando..." : "Actualizar"}
                        </button>
                    </div>
                </div>

                <div className="mt-5">
                    <input
                        type="search"
                        value={searchTerm}
                        onChange={(event) => {
                            setSearchTerm(event.target.value);
                            setCurrentPage(1);
                        }}
                        placeholder="Buscar usuario, cédula, nombre, correo, rol o ID"
                        className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 lg:max-w-[440px]"
                    />
                </div>
            </div>

            <div className="overflow-hidden rounded-3xl border border-[var(--border)] bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                                    Usuario
                                </th>
                                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                                    Cédula
                                </th>
                                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                                    Correo
                                </th>
                                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                                    Teléfono
                                </th>
                                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                                    Departamento
                                </th>
                                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                                    Rol
                                </th>
                                <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-600">
                                    Acciones
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr>
                                    <td
                                        colSpan={7}
                                        className="px-5 py-12 text-center text-sm font-semibold text-slate-500"
                                    >
                                        Cargando usuarios...
                                    </td>
                                </tr>
                            ) : paginatedUsers.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={7}
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
                                paginatedUsers.map((user) => (
                                    <tr
                                        key={user.id}
                                        className="transition hover:bg-blue-50/40"
                                    >
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#172861] text-sm font-bold text-white">
                                                    {(user.firstname || "U")
                                                        .charAt(0)
                                                        .toUpperCase()}
                                                </div>

                                                <div>
                                                    <p className="text-sm font-bold text-slate-950">
                                                        {user.firstname}{" "}
                                                        {user.lastname}
                                                    </p>
                                                    <p className="mt-0.5 text-xs font-medium text-slate-500">
                                                        @{user.username}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-5 py-4 text-sm font-semibold text-slate-700">
                                            {user.idnumber || "Sin cédula"}
                                        </td>

                                        <td className="px-5 py-4 text-sm font-semibold text-slate-700">
                                            {user.email}
                                        </td>

                                        <td className="px-5 py-4 text-sm font-semibold text-slate-500">
                                            {user.phone_number ||
                                                "Sin teléfono"}
                                        </td>

                                        <td className="px-5 py-4 text-sm font-semibold text-slate-500">
                                            {user.departament ||
                                                "Sin departamento"}
                                        </td>

                                        <td className="px-5 py-4">
                                            <span
                                                className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${getRoleBadgeClass(
                                                    user.role_id,
                                                )}`}
                                            >
                                                {getRoleLabel(user.role_id)}
                                            </span>
                                        </td>

                                        <td className="px-5 py-4">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        openEditModal(user)
                                                    }
                                                    className="rounded-xl border border-blue-200 px-3 py-2 text-xs font-bold text-blue-700 transition hover:bg-blue-50"
                                                >
                                                    Editar
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        void handleDelete(user)
                                                    }
                                                    disabled={
                                                        deletingId === user.id
                                                    }
                                                    className="rounded-xl border border-red-200 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                                                >
                                                    {deletingId === user.id
                                                        ? "Eliminando..."
                                                        : "Eliminar"}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-semibold text-slate-500">
                        Mostrando {paginatedUsers.length} de{" "}
                        {filteredUsers.length} registros
                    </p>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() =>
                                setCurrentPage((page) =>
                                    Math.max(1, page - 1),
                                )
                            }
                            disabled={activePage === 1}
                            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Anterior
                        </button>

                        <span className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700">
                            Página {activePage} de {totalPages}
                        </span>

                        <button
                            type="button"
                            onClick={() =>
                                setCurrentPage((page) =>
                                    Math.min(totalPages, page + 1),
                                )
                            }
                            disabled={activePage === totalPages}
                            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Siguiente
                        </button>
                    </div>
                </div>
            </div>

            {isModalOpen ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6">
                    <div className="max-h-[92vh] w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl">
                        <div className="bg-gradient-to-br from-[#07111F] via-[#172861] to-[#F97316] px-6 py-5 text-white">
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
                                        Completa los datos principales del
                                        usuario.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="rounded-full bg-white/15 px-3 py-1 text-sm font-bold text-white ring-1 ring-white/20 transition hover:bg-white/25"
                                >
                                    X
                                </button>
                            </div>
                        </div>

                        <form
                            onSubmit={handleSubmit}
                            className="max-h-[calc(92vh-116px)] space-y-5 overflow-y-auto p-6"
                        >
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <label className="mb-1 block text-sm font-bold text-slate-700">
                                        Usuario
                                    </label>
                                    <input
                                        name="username"
                                        value={form.username}
                                        onChange={handleInputChange}
                                        placeholder="Ej: sebastian"
                                        className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm font-medium outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1 block text-sm font-bold text-slate-700">
                                        Cédula
                                    </label>
                                    <input
                                        name="idnumber"
                                        value={form.idnumber}
                                        onChange={handleInputChange}
                                        inputMode="numeric"
                                        maxLength={10}
                                        placeholder="Ej: 0999999999"
                                        className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm font-medium outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1 block text-sm font-bold text-slate-700">
                                        Contraseña
                                    </label>
                                    <input
                                        name="password"
                                        type="password"
                                        value={form.password}
                                        onChange={handleInputChange}
                                        placeholder={
                                            editingUser
                                                ? "Dejar vacío para no cambiar"
                                                : "Contraseña"
                                        }
                                        className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm font-medium outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1 block text-sm font-bold text-slate-700">
                                        Nombre
                                    </label>
                                    <input
                                        name="firstname"
                                        value={form.firstname}
                                        onChange={handleInputChange}
                                        placeholder="Nombre"
                                        className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm font-medium outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1 block text-sm font-bold text-slate-700">
                                        Apellido
                                    </label>
                                    <input
                                        name="lastname"
                                        value={form.lastname}
                                        onChange={handleInputChange}
                                        placeholder="Apellido"
                                        className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm font-medium outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1 block text-sm font-bold text-slate-700">
                                        Correo
                                    </label>
                                    <input
                                        name="email"
                                        type="email"
                                        value={form.email}
                                        onChange={handleInputChange}
                                        placeholder="correo@ejemplo.com"
                                        className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm font-medium outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1 block text-sm font-bold text-slate-700">
                                        Teléfono
                                    </label>
                                    <input
                                        name="phone_number"
                                        value={form.phone_number}
                                        onChange={handleInputChange}
                                        placeholder="0999999999"
                                        className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm font-medium outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1 block text-sm font-bold text-slate-700">
                                        Departamento
                                    </label>
                                    <input
                                        name="departament"
                                        value={form.departament}
                                        onChange={handleInputChange}
                                        placeholder="Ej: Académico"
                                        className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm font-medium outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1 block text-sm font-bold text-slate-700">
                                        Rol
                                    </label>

                                    {editingUser ? (
                                        <div className="flex h-11 items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700">
                                            {getRoleLabel(editingUser.role_id)}
                                        </div>
                                    ) : (
                                        <select
                                            name="role_id"
                                            value={form.role_id}
                                            onChange={handleInputChange}
                                            className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                        >
                                            {modalRoleOptions.map((role) => (
                                                <option
                                                    key={role.id}
                                                    value={role.id}
                                                >
                                                    {role.label}
                                                </option>
                                            ))}
                                        </select>
                                    )}

                                    {editingUser ? (
                                        <p className="mt-1 text-xs font-semibold text-slate-500">
                                            El rol no se modifica desde este
                                            formulario.
                                        </p>
                                    ) : null}
                                </div>
                            </div>

                            {!editingUser ? (
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                    {privacyLoading ? (
                                        <p className="text-sm font-semibold text-slate-500">
                                            Cargando política de privacidad...
                                        </p>
                                    ) : privacyPolicy ? (
                                        <label className="flex cursor-pointer items-start gap-3">
                                            <input
                                                name="accepted_privacy_policy"
                                                type="checkbox"
                                                checked={form.accepted_privacy_policy}
                                                onChange={handleInputChange}
                                                className="mt-1 h-4 w-4 accent-[#172861]"
                                            />

                                            <span className="text-sm leading-6 text-slate-600">
                                                Confirmo que el usuario acepta la{" "}
                                                <span className="font-bold text-slate-900">
                                                    {privacyPolicy.title}
                                                </span>{" "}
                                                versión{" "}
                                                <span className="font-bold">
                                                    {privacyPolicy.version}
                                                </span>
                                                , vigente desde{" "}
                                                {formatPolicyDate(
                                                    privacyPolicy.effective_date,
                                                )}
                                                .{" "}
                                                {privacyPolicyUrl ? (
                                                    <a
                                                        href={privacyPolicyUrl}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="font-bold text-[#172861] underline-offset-4 hover:underline"
                                                        onClick={(event) =>
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

                            {errorMessage ? (
                                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                                    {errorMessage}
                                </div>
                            ) : null}

                            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    disabled={isSubmitting}
                                    className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="submit"
                                    disabled={isSubmitting || (!editingUser && privacyLoading)}
                                    className="rounded-2xl bg-[#172861] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#0B163F] disabled:cursor-not-allowed disabled:opacity-60"
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
        </section>
    );
}