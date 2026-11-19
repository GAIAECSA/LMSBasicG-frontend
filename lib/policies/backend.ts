import { apiFetch } from "@/lib/auth/backend";
import { parseAcceptedHistory, parseAdminPolicies, parseCurrentPolicies, parseVersions } from "./types";
import type { AdminPolicy, StudentPolicyCatalog } from "./types";

/** Las respuestas se comprueban antes de renderizar. Las URLs nunca aceptan business_id del navegador. */
export class PolicyBackendError extends Error {
  constructor(public readonly status: number, message: string) {super(message);}
}

async function jsonFrom(path:string, token:string):Promise<unknown> {
  const response=await apiFetch(path,token);
  if (!response.ok) throw new PolicyBackendError(response.status, `FastAPI rechazó ${path} (HTTP ${response.status})`);
  try {return await response.json();} catch {throw new PolicyBackendError(502,"La respuesta del backend no es JSON");}
}

/** N+1 de lectura temporal: FastAPI no ofrece catálogo ADMIN con versiones incluidas.
 * Se limita la concurrencia a cuatro para no saturar el pool de conexiones.
 */
export async function adminCatalog(token:string):Promise<AdminPolicy[]> {
  const policies=parseAdminPolicies(await jsonFrom("/api/v1/policies/admin",token));
  if (!policies) throw new PolicyBackendError(502,"Listado de políticas inválido");
  const result:AdminPolicy[]=[];
  for (let i=0;i<policies.length;i+=4) {
    const batch=await Promise.all(policies.slice(i,i+4).map(async policy=>{
      const versions=parseVersions(await jsonFrom(`/api/v1/policies/admin/${policy.id}/versions`,token),policy.id);
      if (!versions) throw new PolicyBackendError(502,"Historial de versiones inválido");
      return {...policy,versions};
    }));
    result.push(...batch);
  }
  return result;
}

export async function studentCatalog(token:string):Promise<StudentPolicyCatalog> {
  const [now,accepted]=await Promise.all([
    jsonFrom("/api/v1/policies",token),
    jsonFrom("/api/v1/policies/acceptances/me",token),
  ]);
  const current=parseCurrentPolicies(now);
  const history=parseAcceptedHistory(accepted);
  if (!current || !history) throw new PolicyBackendError(502,"Catálogo de políticas inválido");
  return {current,history};
}
