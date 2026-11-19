/** Contratos del backend revisados contra app/schemas/policy.py.
 * Los permisos nunca se deciden usando estos objetos: FastAPI comprueba el JWT y business_id.
 */
export type PolicyFormat = "HTML" | "PDF";
export type PolicyProvider = "ATHENA" | "CLIENT";

export interface AdminPolicy {
  id: number;
  code: string;
  title: string;
  mandatory: boolean;
  is_active: boolean;
  versions: PolicyVersion[];
}
export interface PolicyVersion {
  id: number;
  policy_id: number;
  version: string;
  title: string;
  content_format: PolicyFormat;
  effective_at: string;
  published_at: string;
  content_sha256: string | null;
  is_published: boolean;
}
export interface CurrentPolicy {
  policy_id: number;
  code: string;
  title: string;
  provider: PolicyProvider;
  version_id: number;
  version: string;
  content_format: PolicyFormat;
  effective_at: string;
  mandatory: boolean;
  accepted: boolean;
  accepted_at: string | null;
  needs_acceptance: boolean;
}
export interface AcceptedHistory {
  policy_id: number;
  code: string;
  version_id: number;
  version: string;
  title: string;
  accepted_at: string;
  provider: PolicyProvider;
}
export interface StudentPolicyCatalog {
  current: CurrentPolicy[];
  history: AcceptedHistory[];
}

function object(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
const integer = (v: unknown): v is number => typeof v === "number" && Number.isSafeInteger(v) && v > 0;
const string = (v: unknown): v is string => typeof v === "string";
const iso = (v: unknown): v is string => string(v) && Number.isFinite(Date.parse(v));
const format = (v: unknown): v is PolicyFormat => v === "HTML" || v === "PDF";
const provider = (v: unknown): v is PolicyProvider => v === "ATHENA" || v === "CLIENT";

export function parseAdminPolicies(value: unknown): Omit<AdminPolicy, "versions">[] | null {
  if (!Array.isArray(value)) return null;
  const result: Omit<AdminPolicy, "versions">[] = [];
  for (const v of value) {
    if (!object(v) || !integer(v.id) || !string(v.code) || !string(v.title) ||
        typeof v.mandatory !== "boolean" || typeof v.is_active !== "boolean") return null;
    result.push({id: v.id, code:v.code, title:v.title, mandatory:v.mandatory, is_active:v.is_active});
  }
  return result;
}
export function parseVersions(value: unknown, policyId: number): PolicyVersion[] | null {
  if (!Array.isArray(value)) return null;
  const result: PolicyVersion[] = [];
  for (const v of value) {
    if (!object(v) || !integer(v.id) || v.policy_id !== policyId ||
        !string(v.version) || !string(v.title) || !format(v.content_format) ||
        !iso(v.effective_at) || !iso(v.published_at) ||
        !(v.content_sha256 === null || string(v.content_sha256)) ||
        typeof v.is_published !== "boolean") return null;
    result.push({id:v.id, policy_id:policyId, version:v.version, title:v.title,
      content_format:v.content_format, effective_at:v.effective_at, published_at:v.published_at,
      content_sha256:v.content_sha256, is_published:v.is_published});
  }
  return result;
}
export function parseCurrentPolicies(value: unknown): CurrentPolicy[] | null {
  if (!Array.isArray(value)) return null;
  const result:CurrentPolicy[]=[];
  for (const v of value) {
    if (!object(v) || !integer(v.policy_id) || !integer(v.version_id) || !string(v.code) ||
        !string(v.title) || !provider(v.provider) || !string(v.version) ||
        !format(v.content_format) || !iso(v.effective_at) ||
        typeof v.mandatory!=="boolean" || typeof v.accepted!=="boolean" ||
        !(v.accepted_at===null || iso(v.accepted_at)) || typeof v.needs_acceptance!=="boolean") return null;
    result.push({policy_id:v.policy_id, code:v.code, title:v.title, provider:v.provider,
      version_id:v.version_id, version:v.version, content_format:v.content_format,
      effective_at:v.effective_at, mandatory:v.mandatory, accepted:v.accepted,
      accepted_at:v.accepted_at, needs_acceptance:v.needs_acceptance});
  }
  return result;
}
export function parseAcceptedHistory(value: unknown): AcceptedHistory[] | null {
  if (!Array.isArray(value)) return null;
  const result: AcceptedHistory[]=[];
  for (const v of value) {
    if (!object(v) || !integer(v.policy_id) || !integer(v.version_id) || !string(v.code) ||
        !string(v.version) || !string(v.title) || !iso(v.accepted_at) || !provider(v.provider)) return null;
    result.push({policy_id:v.policy_id, code:v.code, version_id:v.version_id,
      version:v.version, title:v.title, accepted_at:v.accepted_at, provider:v.provider});
  }
  return result;
}
/** Vigente: última versión publicada con fecha de efectividad <= ahora.
 * No usar is_published=false para las históricas: FastAPI conserva las versiones antiguas publicadas.
 */
export function currentVersion(versions: PolicyVersion[], now=Date.now()): PolicyVersion | undefined {
  return versions.filter(v=>v.is_published && Date.parse(v.effective_at)<=now)
    .sort((a,b)=>Date.parse(b.effective_at)-Date.parse(a.effective_at) || b.id-a.id)[0];
}
export const isTenantAdmin = (role: {code:string;scope:string}) => role.code==="ADMIN" && role.scope==="PLATFORM";
export function localDate(value:string):string {
  return new Intl.DateTimeFormat("es-EC",{dateStyle:"medium",timeStyle:"short",timeZone:"America/Guayaquil"}).format(new Date(value));
}
