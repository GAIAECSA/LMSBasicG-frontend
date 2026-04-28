"use client";

import {
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

const ROWS_PER_PAGE = 7;

const roleLabels = [
    { id: 2, label: "VISITANTE" },
    { id: 1, label: "ADMIN" },
    { id: 3, label: "DOCENTE" },
    { id: 4, label: "ESTUDIANTE" },
];

const modalRoleOptions = [
    { id: 2, label: "VISITANTE" },
];

interface UserFormState {
    username: string;
    password: string;
    firstname: string;
    lastname: string;
    email: string;
    phone_number: string;
    departament: string;
    role_id: number;
}

const emptyForm: UserFormState = {
    username: "",
    password: "",
    firstname: "",
    lastname: "",
    email: "",
    phone_number: "",
    departament: "",
    role_id: 2,
};

function getRoleLabel(roleId: number) {
    return roleLabels.find((role) => role.id === roleId)?.label || "SIN ROL";
}

function getRoleBadgeClass(roleId: number) {
    if (roleId === 1) {
        return "bg-slate-900 text-white";
    }

    if (roleId === 3) {
        return "bg-blue-100 text-blue-700";
    }

    if (roleId === 4) {
        return "bg-emerald-100 text-emerald-700";
    }

    return "bg-slate-100 text-slate-700";
}

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [form, setForm] = useState<UserFormState>(emptyForm);

    useEffect(() => {
        let isActive = true;

        getAllUsers()
            .then((data) => {
                if (!isActive) return;

                setUsers(Array.isArray(data) ? data : []);
                setErrorMessage("");
            })
            .catch((error) => {
                if (!isActive) return;

                const message =
                    error instanceof Error
                        ? error.message
                        : "No se pudo cargar la lista de usuarios.";

                setErrorMessage(message);
            })
            .finally(() => {
                if (!isActive) return;

                setIsLoading(false);
            });

        return () => {
            isActive = false;
        };
    }, []);

    const loadUsers = async (showRefresh = false) => {
        try {
            if (showRefresh) {
                setIsRefreshing(true);
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
    };

    const filteredUsers = useMemo(() => {
        const query = searchTerm.trim().toLowerCase();

        if (!query) return users;

        return users.filter((user) => {
            const fullName = `${user.firstname} ${user.lastname}`.toLowerCase();
            const roleName = getRoleLabel(user.role_id).toLowerCase();

            return (
                fullName.includes(query) ||
                user.username.toLowerCase().includes(query) ||
                user.email.toLowerCase().includes(query) ||
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
        };
    }, [users]);

    const openCreateModal = () => {
        setEditingUser(null);
        setForm(emptyForm);
        setErrorMessage("");
        setSuccessMessage("");
        setIsModalOpen(true);
    };

    const openEditModal = (user: User) => {
        setEditingUser(user);
        setForm({
            username: user.username || "",
            password: "",
            firstname: user.firstname || "",
            lastname: user.lastname || "",
            email: user.email || "",
            phone_number: user.phone_number || "",
            departament: user.departament || "",
            role_id: user.role_id,
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
        const { name, value } = event.target;

        setForm((currentForm) => ({
            ...currentForm,
            [name]: name === "role_id" ? Number(value) : value,
        }));
    };

    const validateForm = () => {
        if (!form.username.trim()) {
            return "El nombre de usuario es obligatorio.";
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
                const payload: UpdateUserPayload = {
                    username: form.username.trim(),
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
                const payload: RegisterUserPayload = {
                    username: form.username.trim(),
                    password: form.password.trim(),
                    firstname: form.firstname.trim(),
                    lastname: form.lastname.trim(),
                    email: form.email.trim(),
                    phone_number: form.phone_number.trim() || null,
                    departament: form.departament.trim() || null,
                    role_id: Number(form.role_id),
                };

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

    const handleDelete = async (user: User) => {
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
        <section className="min-h-screen bg-[#f4f7fb] px-5 py-8">
            <div className="mx-auto max-w-[1530px] space-y-6">
                <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
                    <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-orange-500 px-6 py-8 text-white md:px-8">
                        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <span className="inline-flex rounded-full bg-white/15 px-4 py-2 text-xs font-bold text-white ring-1 ring-white/20">
                                    Gestión de usuarios
                                </span>

                                <h1 className="mt-5 text-3xl font-black tracking-tight">
                                    Usuarios registrados
                                </h1>

                                <p className="mt-3 max-w-2xl text-sm font-medium text-blue-50">
                                    Lista de usuarios creados en la plataforma con sus
                                    datos principales, rol asignado y acciones de
                                    administración.
                                </p>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div className="rounded-2xl bg-white/15 px-5 py-4 ring-1 ring-white/20">
                                    <p className="text-xs font-bold uppercase text-white/80">
                                        Registros
                                    </p>
                                    <p className="mt-2 text-3xl font-black">
                                        {stats.total}
                                    </p>
                                </div>

                                <div className="rounded-2xl bg-white/15 px-5 py-4 ring-1 ring-white/20">
                                    <p className="text-xs font-bold uppercase text-white/80">
                                        Docentes
                                    </p>
                                    <p className="mt-2 text-3xl font-black">
                                        {stats.teachers}
                                    </p>
                                </div>

                                <div className="rounded-2xl bg-white/15 px-5 py-4 ring-1 ring-white/20">
                                    <p className="text-xs font-bold uppercase text-white/80">
                                        Estudiantes
                                    </p>
                                    <p className="mt-2 text-3xl font-black">
                                        {stats.students}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between md:px-8">
                        <input
                            type="search"
                            value={searchTerm}
                            onChange={(event) => {
                                setSearchTerm(event.target.value);
                                setCurrentPage(1);
                            }}
                            placeholder="Buscar por usuario, nombre, correo, rol o ID"
                            className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 md:max-w-[380px]"
                        />

                        <div className="flex flex-col gap-3 sm:flex-row">
                            <button
                                type="button"
                                onClick={openCreateModal}
                                className="h-12 rounded-2xl bg-blue-600 px-5 text-sm font-black text-white shadow-sm transition hover:bg-blue-700"
                            >
                                Nuevo usuario
                            </button>

                            <button
                                type="button"
                                onClick={() => void loadUsers(true)}
                                disabled={isRefreshing}
                                className="h-12 rounded-2xl bg-slate-950 px-5 text-sm font-black text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {isRefreshing ? "Actualizando..." : "Actualizar lista"}
                            </button>
                        </div>
                    </div>
                </div>

                {(errorMessage || successMessage) && !isModalOpen && (
                    <div
                        className={`rounded-2xl border px-5 py-4 text-sm font-bold ${errorMessage
                            ? "border-red-200 bg-red-50 text-red-700"
                            : "border-emerald-200 bg-emerald-50 text-emerald-700"
                            }`}
                    >
                        {errorMessage || successMessage}
                    </div>
                )}

                <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-100/80">
                                <tr>
                                    <th className="px-5 py-4 text-left text-xs font-black text-slate-700">
                                        Usuario
                                    </th>
                                    <th className="px-5 py-4 text-left text-xs font-black text-slate-700">
                                        Correo
                                    </th>
                                    <th className="px-5 py-4 text-left text-xs font-black text-slate-700">
                                        Teléfono
                                    </th>
                                    <th className="px-5 py-4 text-left text-xs font-black text-slate-700">
                                        Departamento
                                    </th>
                                    <th className="px-5 py-4 text-left text-xs font-black text-slate-700">
                                        Rol
                                    </th>
                                    <th className="px-5 py-4 text-right text-xs font-black text-slate-700">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">
                                {isLoading ? (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="px-5 py-12 text-center text-sm font-semibold text-slate-500"
                                        >
                                            Cargando usuarios...
                                        </td>
                                    </tr>
                                ) : paginatedUsers.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="px-5 py-12 text-center"
                                        >
                                            <p className="text-sm font-black text-slate-800">
                                                No hay usuarios para mostrar.
                                            </p>
                                            <p className="mt-1 text-sm font-medium text-slate-500">
                                                Crea un usuario nuevo o cambia el texto de
                                                búsqueda.
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedUsers.map((user) => (
                                        <tr
                                            key={user.id}
                                            className="transition hover:bg-slate-50"
                                        >
                                            <td className="px-5 py-4">
                                                <p className="text-sm font-black text-slate-900">
                                                    {user.firstname} {user.lastname}
                                                </p>
                                            </td>

                                            <td className="px-5 py-4 text-sm font-semibold text-slate-700">
                                                {user.email}
                                            </td>

                                            <td className="px-5 py-4 text-sm font-semibold text-slate-500">
                                                {user.phone_number || "Sin teléfono"}
                                            </td>

                                            <td className="px-5 py-4 text-sm font-semibold text-slate-500">
                                                {user.departament || "Sin departamento"}
                                            </td>

                                            <td className="px-5 py-4">
                                                <span
                                                    className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${getRoleBadgeClass(
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
                                                        onClick={() => openEditModal(user)}
                                                        className="rounded-xl border border-blue-200 px-3 py-2 text-xs font-black text-blue-700 transition hover:bg-blue-50"
                                                    >
                                                        Editar
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => void handleDelete(user)}
                                                        disabled={deletingId === user.id}
                                                        className="rounded-xl border border-red-200 px-3 py-2 text-xs font-black text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
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
                                    setCurrentPage((page) => Math.max(1, page - 1))
                                }
                                disabled={activePage === 1}
                                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Anterior
                            </button>

                            <span className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-black text-slate-700">
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
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6">
                    <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[28px] bg-white shadow-2xl">
                        <div className="border-b border-slate-200 px-6 py-5">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h3 className="text-xl font-black text-slate-950">
                                        {editingUser
                                            ? "Editar usuario"
                                            : "Crear nuevo usuario"}
                                    </h3>
                                    <p className="mt-1 text-sm font-medium text-slate-500">
                                        Completa los datos principales del usuario.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="rounded-full border border-slate-200 px-3 py-1 text-sm font-black text-slate-500 transition hover:bg-slate-50"
                                >
                                    X
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5 p-6">
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
                                                <option key={role.id} value={role.id}>
                                                    {role.label}
                                                </option>
                                            ))}
                                        </select>
                                    )}

                                    {editingUser ? (
                                        <p className="mt-1 text-xs font-semibold text-slate-500">
                                            El rol no se modifica desde este formulario.
                                        </p>
                                    ) : null}
                                </div>
                            </div>

                            {errorMessage && (
                                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                                    {errorMessage}
                                </div>
                            )}

                            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    disabled={isSubmitting}
                                    className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
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
            )}
        </section>
    );
}