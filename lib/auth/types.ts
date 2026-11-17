/** Contratos del backend FastAPI. No derivar privilegios de role_id (los seeds usan code/scope). */
export type Role = { id: number; code: string; name: string; scope: string };

export type AuthUser = {
  id: number;
  business_id: number;
  username: string;
  firstname: string;
  lastname: string;
  role_id: number;
  role: Role;
};

export type TenantModule = {
  id: number;
  code: string;
  name: string;
  description: string | null;
  config: Record<string, unknown>;
};

export type PendingPolicy = {
  policy_id: number;
  code: string;
  title: string;
  provider: string;
  version_id: number;
  version: string;
  content_format: "HTML" | "PDF";
  mandatory: boolean;
  needs_acceptance: boolean;
};

export type AuthState =
  | { status: "unauthenticated" }
  | { status: "pending"; pending: PendingPolicy[]; expiresAt: string | null }
  | { status: "ready"; user: AuthUser; modules: TenantModule[]; expiresAt: string | null }
  | { status: "unavailable" };

export function validUser(value: unknown): value is AuthUser {
  if (!value || typeof value !== "object") return false;
  const user = value as Partial<AuthUser>;
  return typeof user.id === "number" && Number.isInteger(user.id) &&
    typeof user.business_id === "number" && Number.isInteger(user.business_id) &&
    typeof user.username === "string" && typeof user.firstname === "string" &&
    typeof user.lastname === "string" && !!user.role &&
    typeof user.role.code === "string" && typeof user.role.scope === "string" &&
    Number.isInteger(user.role.id) && typeof user.role_id === "number" && Number.isInteger(user.role_id);
}

export function parsePendingPolicies(value: unknown): PendingPolicy[] | null {
  if (!Array.isArray(value)) return null;
  const result: PendingPolicy[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object" || !Number.isInteger(item.version_id) || item.version_id < 1 ||
      !Number.isInteger(item.policy_id) || typeof item.title !== "string" ||
      !["HTML", "PDF"].includes(item.content_format) || !item.mandatory || !item.needs_acceptance ||
      typeof item.code !== "string" || typeof item.provider !== "string" || typeof item.version !== "string") return null;
    result.push({policy_id:item.policy_id,version_id:item.version_id,title:item.title,
      code:item.code,provider:item.provider,version:item.version,content_format:item.content_format,
      mandatory:true,needs_acceptance:true});
  }
  return result;
}

export function parseModules(value: unknown): TenantModule[] | null {
  if (!Array.isArray(value)) return null;
  const result: TenantModule[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object" || !Number.isInteger(item.id) ||
      typeof item.code !== "string" || typeof item.name !== "string" ||
      (item.config !== null && (typeof item.config !== "object" || Array.isArray(item.config)))) return null;
    result.push({id:item.id,code:item.code,name:item.name,
      description:typeof item.description === "string" ? item.description : null,
      config:item.config ?? {}});
  }
  return result;
}
