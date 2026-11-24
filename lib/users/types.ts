/** Contrato de app/schemas/user.py del backend Athena (19-11-2026).
 * User.role corresponde exclusivamente a PLATFORM: ADMIN o VISITOR.
 * STUDENT/TEACHER son roles por matrícula y NO se editan aquí.
 */
export type PlatformRole = "ADMIN" | "VISITOR";
export type UserStatus = "all" | "active" | "inactive";

export interface ManagedUser {
  id: number;
  business_id: number;
  role_id: number;
  username: string;
  firstname: string;
  lastname: string;
  idnumber: string | null;
  email: string | null;
  phone_number: string | null;
  province: string | null;
  is_active: boolean;
  role: { id: number; code: PlatformRole; scope: "PLATFORM"; name: string };
}

export interface CreateUserInput {
  username: string;
  firstname: string;
  lastname: string;
  password: string;
  idnumber: string | null;
  email: string | null;
  phone_number: string | null;
  province: string | null;
  role_code: PlatformRole;
}

export type UpdateUserInput = Partial<Omit<CreateUserInput, "password">> & {
  is_active?: boolean;
};

function object(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
const posInt = (value: unknown): value is number => Number.isSafeInteger(value) && Number(value) > 0;
const nullableString = (value: unknown): value is string | null => value === null || typeof value === "string";
export const isPlatformRole = (value: unknown): value is PlatformRole => value === "ADMIN" || value === "VISITOR";

/** Validación estricta de la forma: no usar objetos externos sin verificar tenant y scope. */
export function parseUser(value: unknown, tenantId: number): ManagedUser | null {
  if (!object(value) || !posInt(value.id) || value.business_id !== tenantId ||
      !posInt(value.role_id) || typeof value.username !== "string" ||
      typeof value.firstname !== "string" || typeof value.lastname !== "string" ||
      !nullableString(value.idnumber) || !nullableString(value.email) ||
      !nullableString(value.phone_number) || !nullableString(value.province) ||
      typeof value.is_active !== "boolean" || !object(value.role) ||
      !posInt(value.role.id) || value.role.id !== value.role_id ||
      !isPlatformRole(value.role.code) || value.role.scope !== "PLATFORM" ||
      typeof value.role.name !== "string") return null;
  return value as unknown as ManagedUser;
}

export function parseUsers(value: unknown, tenantId: number): ManagedUser[] | null {
  if (!Array.isArray(value)) return null;
  const users: ManagedUser[] = [];
  for (const item of value) {
    const user = parseUser(item, tenantId);
    if (!user) return null;
    users.push(user);
  }
  return users;
}

const text = (value: unknown, max = 255): value is string =>
  typeof value === "string" && value.trim().length > 0 && value.length <= max;
const optional = (value: unknown, max = 255): value is string | null =>
  value === null || (typeof value === "string" && value.length <= max);

/** Validación BFF ANTES de enviar a FastAPI; FastAPI valida nuevamente. */
export function validCreateUser(value: unknown): value is CreateUserInput {
  if (!object(value) || Object.keys(value).some(k => ![
    "username", "firstname", "lastname", "password", "idnumber",
    "email", "phone_number", "province", "role_code",
  ].includes(k))) return false;
  return text(value.username, 150) && text(value.firstname, 255) && text(value.lastname, 255) &&
    typeof value.password === "string" && value.password.trim().length >= 8 && value.password.length <= 128 &&
    optional(value.idnumber, 100) && optional(value.email, 254) &&
    optional(value.phone_number, 30) && optional(value.province, 150) && isPlatformRole(value.role_code);
}

export function validUpdateUser(value: unknown): value is UpdateUserInput {
  if (!object(value) || Object.keys(value).length === 0 || Object.keys(value).some(k => ![
    "username", "firstname", "lastname", "idnumber", "email", "phone_number", "province", "role_code", "is_active",
  ].includes(k))) return false;
  for (const k of ["username", "firstname", "lastname"] as const) {
    if (k in value && !text(value[k], 255)) return false;
  }
  for (const k of ["idnumber", "email", "phone_number", "province"] as const) {
    if (k in value && !optional(value[k], k === "phone_number" ? 30 : 255)) return false;
  }
  return (!("role_code" in value) || isPlatformRole(value.role_code)) &&
    (!("is_active" in value) || typeof value.is_active === "boolean");
}

/** Nunca enviar role_code al backend antiguo: Pydantic lo ignoraría silenciosamente. */
export function legacyCreatePayload(input: CreateUserInput): Omit<CreateUserInput, "role_code"> {
  const { role_code: _role, ...body } = input;
  void _role;
  return body;
}
export function legacyUpdatePayload(input: UpdateUserInput): Omit<UpdateUserInput, "role_code"> {
  const { role_code: _role, ...body } = input;
  void _role;
  return body;
}
