"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { AlertTriangle, Check, Eye, EyeOff, Pencil, Plus, RefreshCw, Search, ShieldCheck, Trash2, UserRound, UsersRound, X } from "lucide-react";
import type { CreateUserInput, ManagedUser, PlatformRole, UserStatus } from "@/lib/users/types";
import { parseUser, parseUsers } from "@/lib/users/types";

type Props = { tenantId: number; currentUserId: number; roleAssignmentEnabled: boolean };
type EditableText = "username" | "firstname" | "lastname" | "email" | "idnumber" | "phone_number" | "province";
type FormData = Record<EditableText, string> & { password: string; role_code: PlatformRole; is_active: boolean };

const blankForm = (): FormData => ({ username: "", firstname: "", lastname: "", password: "", email: "",
  idnumber: "", phone_number: "", province: "", role_code: "VISITOR", is_active: true });
const fromUser = (user: ManagedUser): FormData => ({ username: user.username, firstname: user.firstname,
  lastname: user.lastname, email: user.email ?? "", idnumber: user.idnumber ?? "",
  phone_number: user.phone_number ?? "", province: user.province ?? "", password: "",
  role_code: user.role.code, is_active: user.is_active });
const nullable = (value: string) => value.trim() || null;

async function apiMessage(response: Response): Promise<string> {
  try {
    const data: unknown = await response.json();
    if (data && typeof data === "object" && "message" in data &&
        typeof (data as { message: unknown }).message === "string") return (data as {message:string}).message;
  } catch { /* 204 o respuesta sin JSON */ }
  return `No se pudo completar la operación (HTTP ${response.status})`;
}

export function AdminUsers({ tenantId, currentUserId, roleAssignmentEnabled }: Props) {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<"all" | PlatformRole>("all");
  const [status, setStatus] = useState<UserStatus>("all");
  const [editor, setEditor] = useState<ManagedUser | "new" | null>(null);
  const [form, setForm] = useState<FormData>(blankForm());
  const [showPassword, setShowPassword] = useState(false);
  const [targetDelete, setTargetDelete] = useState<ManagedUser | null>(null);
  const [modalError, setModalError] = useState("");

  const refresh = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/users", { cache: "no-store", signal });
      if (!response.ok) throw new Error(await apiMessage(response));
      const body: unknown = await response.json();
      if (!body || typeof body !== "object" || !("users" in body)) throw new Error("Respuesta inválida al listar usuarios");
      const items = (body as {users:unknown}).users;
      // La API BFF ya validó cada fila por tenant; comprobación adicional para estado cliente.
      const validated = parseUsers(items, tenantId);
      if (!validated) throw new Error("El listado de usuarios recibido no es válido");
      setUsers(validated);
    } catch (cause) {
      if (signal?.aborted) return;
      setError(cause instanceof Error ? cause.message : "No se pudo cargar el listado");
    } finally { if (!signal?.aborted) setLoading(false); }
  }, [tenantId]);

  useEffect(() => {
    const controller = new AbortController();
    void refresh(controller.signal);
    return () => controller.abort();
  }, [refresh]);

  const filtered = useMemo(() => {
    const q = search.toLocaleLowerCase("es-EC").trim();
    return users.filter(u => (role === "all" || u.role.code === role) &&
      (status === "all" || (status === "active") === u.is_active) &&
      (!q || [u.firstname, u.lastname, u.username, u.email ?? "", u.idnumber ?? ""]
        .some(s => s.toLocaleLowerCase("es-EC").includes(q))));
  }, [users, search, role, status]);
  const adminCount = users.filter(u => u.role.code === "ADMIN").length;
  const activeCount = users.filter(u => u.is_active).length;

  function openCreate() { setForm(blankForm()); setModalError(""); setShowPassword(false); setEditor("new"); }
  function openEdit(user: ManagedUser) { setForm(fromUser(user)); setModalError(""); setShowPassword(false); setEditor(user); }
  function change(key: EditableText, value: string) { setForm(previous => ({ ...previous, [key]: value })); }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !editor) return;
    setModalError("");
    const creating = editor === "new";
    const selectedRole = form.role_code;
    if (!creating && editor.id === currentUserId && !form.is_active) {
      setModalError("No puedes desactivar tu propia cuenta"); return;
    }
    if (!roleAssignmentEnabled && (selectedRole === "ADMIN" && creating ||
        !creating && selectedRole !== editor.role.code)) {
      setModalError("La administración de roles requiere la actualización del backend"); return;
    }
    const fields = {
      username: form.username.trim(), firstname: form.firstname.trim(), lastname: form.lastname.trim(),
      email: nullable(form.email), phone_number: nullable(form.phone_number),
      idnumber: nullable(form.idnumber)?.toUpperCase() ?? null, province: nullable(form.province),
    };
    if (!fields.username || !fields.firstname || !fields.lastname) {
      setModalError("Usuario, nombres y apellidos son obligatorios"); return;
    }
    if (creating && (form.password.length < 8 || form.password.length > 128)) {
      setModalError("La contraseña debe tener entre 8 y 128 caracteres"); return;
    }
    const body = creating
      ? { ...fields, password: form.password, role_code: selectedRole } satisfies CreateUserInput
      : { ...fields, is_active: form.is_active, ...(selectedRole !== editor.role.code ? { role_code: selectedRole } : {}) };
    setBusy(true);
    try {
      const url = creating ? "/api/users" : `/api/users/${editor.id}`;
      const response = await fetch(url, { method: creating ? "POST" : "PATCH", cache: "no-store",
        headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!response.ok) throw new Error(await apiMessage(response));
      const payload: unknown = await response.json();
      if (!payload || typeof payload !== "object" || !("user" in payload)) throw new Error("Respuesta de usuario inválida");
      const item = (payload as {user:unknown}).user;
      const saved = parseUser(item, tenantId);
      if (!saved) throw new Error("El usuario guardado tiene una estructura inválida");
      setUsers(previous => creating ? [...previous, saved] : previous.map(u => u.id === saved.id ? saved : u));
      setMessage(creating ? "Usuario creado correctamente" : "Usuario actualizado correctamente");
      setEditor(null);
    } catch (cause) {
      setModalError(cause instanceof Error ? cause.message : "No se pudo guardar el usuario");
    } finally { setBusy(false); }
  }

  async function remove() {
    if (!targetDelete || busy || targetDelete.id === currentUserId) return;
    setBusy(true);
    setModalError("");
    try {
      const response = await fetch(`/api/users/${targetDelete.id}`, { method: "DELETE", cache: "no-store" });
      if (!response.ok) throw new Error(await apiMessage(response));
      setUsers(previous => previous.filter(u => u.id !== targetDelete.id));
      setTargetDelete(null);
      setMessage("Usuario eliminado. La eliminación es lógica y conserva el historial académico.");
    } catch (cause) {
      setModalError(cause instanceof Error ? cause.message : "No se pudo eliminar el usuario");
    } finally { setBusy(false); }
  }

  return <div className="lms-users-page">
    <header className="lms-page-heading lms-users-heading">
      <div><p className="lms-eyebrow"><UsersRound size={15}/> ADMINISTRACIÓN DEL TENANT</p>
        <h1>Gestión de usuarios</h1>
        <p>Administra las cuentas con acceso al campus. Los roles de estudiante y docente se asignarán en las matrículas de cada curso.</p></div>
      <button className="button button-primary" type="button" onClick={openCreate}><Plus size={18}/> Nuevo usuario</button>
    </header>

    <div className="lms-users-stats" aria-label="Resumen de usuarios">
      <div><UsersRound size={20}/><span><strong>{users.length}</strong><small>Usuarios</small></span></div>
      <div><Check size={20}/><span><strong>{activeCount}</strong><small>Activos</small></span></div>
      <div><ShieldCheck size={20}/><span><strong>{adminCount}</strong><small>Administradores</small></span></div>
    </div>
    <section className="lms-users-panel" aria-label="Listado de usuarios">
      <div className="lms-users-panel-header">
        <div><h2>Usuarios del sistema</h2><p>Solo se muestran usuarios pertenecientes a esta academia.</p></div>
        <button className="lms-outline-button" type="button" onClick={() => void refresh()} disabled={loading}>
          <RefreshCw size={15} className={loading ? "lms-rotate" : ""}/> Actualizar</button>
      </div>
      <div className="lms-users-filters">
        <label className="lms-users-search"><Search size={17}/><span className="sr-only">Buscar usuarios</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre, usuario, correo o identificación" type="search" /></label>
        <label><span className="sr-only">Filtrar por rol</span>
          <select value={role} onChange={e => setRole(e.target.value as typeof role)}>
            <option value="all">Todos los roles</option><option value="ADMIN">Administrador</option><option value="VISITOR">Visitante</option>
          </select></label>
        <label><span className="sr-only">Filtrar por estado</span>
          <select value={status} onChange={e => setStatus(e.target.value as UserStatus)}>
            <option value="all">Todos los estados</option><option value="active">Activos</option><option value="inactive">Inactivos</option>
          </select></label>
      </div>
      {message && <p className="lms-users-success" role="status"><Check size={17}/>{message}<button type="button" onClick={() => setMessage("")} aria-label="Cerrar aviso"><X size={16}/></button></p>}
      {error && <div className="lms-error" role="alert">{error}<button type="button" onClick={() => void refresh()}>Reintentar</button></div>}
      {loading ? <div className="lms-loading-card">Cargando usuarios…</div> : !error && !filtered.length ?
        <div className="lms-empty-card"><UserRound size={28}/><h2>No se encontraron usuarios</h2><p>{users.length ? "Cambia los filtros para volver a ver resultados." : "Crea la primera cuenta de tu academia."}</p></div> :
        !error && <div className="lms-users-table-wrap"><table className="lms-users-table"><thead><tr>
          <th>Usuario</th><th>Identificación</th><th>Rol de acceso</th><th>Estado</th><th className="lms-users-action-col">Acciones</th>
        </tr></thead><tbody>{filtered.map(user => <tr key={user.id}>
          <td><div className="lms-users-person"><span className="lms-users-initial">{(user.firstname[0] || user.username[0] || "U").toUpperCase()}</span>
            <div><strong>{user.firstname} {user.lastname}</strong><small>@{user.username}{user.email ? ` · ${user.email}` : ""}</small></div></div></td>
          <td>{user.idnumber || <span className="lms-users-dash">—</span>}</td>
          <td><span className={`lms-users-role ${user.role.code === "ADMIN" ? "lms-users-role-admin" : ""}`}>{user.role.code === "ADMIN" ? "Administrador" : "Visitante"}</span></td>
          <td><span className={`lms-users-state ${user.is_active ? "lms-users-state-on" : "lms-users-state-off"}`}>{user.is_active ? "Activo" : "Inactivo"}</span></td>
          <td><div className="lms-users-actions">
            <button type="button" onClick={() => openEdit(user)} className="lms-icon-button" aria-label={`Editar ${user.username}`} title="Editar"><Pencil size={16}/></button>
            <button type="button" disabled={user.id === currentUserId} onClick={() => {setModalError("");setTargetDelete(user);}}
              className="lms-icon-button lms-users-danger-icon" aria-label={`Eliminar ${user.username}`} title={user.id === currentUserId ? "No puedes eliminar tu cuenta" : "Eliminar"}><Trash2 size={16}/></button>
          </div></td>
        </tr>)}</tbody></table></div>}
      <div className="lms-users-footer">{filtered.length} de {users.length} usuarios</div>
    </section>

    {editor !== null && <div className="lms-modal-backdrop" role="presentation" onMouseDown={event => {if(event.target === event.currentTarget && !busy) setEditor(null);}}>
      <section className="lms-modal lms-users-editor" role="dialog" aria-modal="true" aria-labelledby="lms-users-editor-title">
        <div className="lms-modal-titlebar"><span className="lms-doc-icon"><UserRound size={20}/></span><div className="lms-modal-heading">
          <strong id="lms-users-editor-title">{editor === "new" ? "Crear usuario" : "Editar usuario"}</strong>
          <small>{editor === "new" ? "Alta de una cuenta de acceso al campus" : `Cuenta @${editor.username}`}</small></div>
          <button className="lms-icon-button" type="button" disabled={busy} onClick={() => setEditor(null)} aria-label="Cerrar"><X size={19}/></button></div>
        <form className="lms-editor-form" onSubmit={event => void save(event)}>
          <div className="lms-form-row">
            <label>Nombre(s) *<input required maxLength={255} autoComplete="given-name" value={form.firstname} onChange={e => change("firstname",e.target.value)} disabled={busy}/></label>
            <label>Apellido(s) *<input required maxLength={255} autoComplete="family-name" value={form.lastname} onChange={e => change("lastname",e.target.value)} disabled={busy}/></label>
          </div>
          <div className="lms-form-row">
            <label>Nombre de usuario *<input required maxLength={150} autoComplete="off" value={form.username} onChange={e => change("username",e.target.value)} disabled={busy}/></label>
            <label>Correo electrónico<input type="email" maxLength={254} autoComplete="email" value={form.email} onChange={e => change("email",e.target.value)} disabled={busy}/></label>
          </div>
          <div className="lms-form-row">
            <label>Identificación<input maxLength={100} value={form.idnumber} onChange={e => change("idnumber",e.target.value)} disabled={busy}/></label>
            <label>Teléfono<input type="tel" inputMode="tel" maxLength={30} value={form.phone_number} onChange={e => change("phone_number",e.target.value)} disabled={busy} placeholder="Ej. +593987654321"/></label>
          </div>
          <div className="lms-form-row">
            <label>Provincia<input maxLength={150} value={form.province} onChange={e => change("province",e.target.value)} disabled={busy}/></label>
            <label>Rol de plataforma
              <select value={form.role_code} onChange={e => setForm(previous => ({...previous,role_code:e.target.value as PlatformRole}))}
                disabled={busy || !roleAssignmentEnabled}>
                <option value="VISITOR">Visitante</option><option value="ADMIN">Administrador</option>
              </select>
              {!roleAssignmentEnabled && <small>FastAPI actualmente crea únicamente visitantes. La asignación de administradores se habilitará al actualizar el backend.</small>}
            </label>
          </div>
          {editor === "new" ? <label>Contraseña inicial *
            <span className="lms-users-password-wrap"><input required type={showPassword ? "text" : "password"} minLength={8} maxLength={128}
              autoComplete="new-password" value={form.password} onChange={e => setForm(p => ({...p,password:e.target.value}))} disabled={busy}/>
              <button type="button" aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"} onClick={() => setShowPassword(v=>!v)}>
                {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button></span>
            <small>De 8 a 128 caracteres. Nunca se muestra la contraseña actual ni se almacena en el navegador.</small>
          </label> : <label className="lms-switch-label"><input type="checkbox" checked={form.is_active} disabled={busy || editor.id === currentUserId} onChange={e=>setForm(p=>({...p,is_active:e.target.checked}))}/>
            <span>Cuenta activa<small>Al desactivar, FastAPI revoca las sesiones del usuario. No puedes desactivar tu propia cuenta.</small></span></label>}
          {modalError && <p className="lms-error" role="alert">{modalError}</p>}
          <div className="lms-editor-actions"><button type="button" className="lms-outline-button" disabled={busy} onClick={()=>setEditor(null)}>Cancelar</button>
            <button type="submit" className="button button-primary" disabled={busy}><Check size={17}/>{busy ? "Guardando…" : editor === "new" ? "Crear usuario" : "Guardar cambios"}</button></div>
        </form>
      </section></div>}

    {targetDelete && <div className="lms-modal-backdrop" role="presentation"><section className="lms-modal lms-users-confirm" role="alertdialog" aria-modal="true" aria-labelledby="lms-users-delete-title" aria-describedby="lms-users-delete-description">
      <div className="lms-users-alert-icon"><AlertTriangle size={25}/></div>
      <h2 id="lms-users-delete-title">¿Eliminar usuario?</h2>
      <p id="lms-users-delete-description">Vas a eliminar la cuenta de <strong>{targetDelete.firstname} {targetDelete.lastname} (@{targetDelete.username})</strong>. Perderá el acceso y se revocarán sus sesiones.</p>
      <p>El backend utiliza eliminación lógica para conservar el historial y las relaciones académicas. Esta acción no se puede deshacer desde esta pantalla.</p>
      {modalError && <div className="lms-error" role="alert">{modalError}</div>}
      <div className="lms-editor-actions"><button type="button" className="lms-outline-button" disabled={busy} onClick={()=>setTargetDelete(null)}>Cancelar</button>
        <button type="button" className="lms-users-danger-button" disabled={busy} onClick={()=>void remove()}><Trash2 size={17}/>{busy ? "Eliminando…" : "Sí, eliminar"}</button></div>
    </section></div>}
  </div>;
}
