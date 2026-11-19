/** Desactivado por defecto: el backend del ZIP aún NO acepta cambios de role_code.
 * Activar solo DESPUÉS de desplegar una versión de FastAPI que admita
 * `role_code: ADMIN | VISITOR` en POST /users y PATCH /users/{id}.
 * Variable solo del servidor. No exponerla con NEXT_PUBLIC_.
 */
export function canAssignPlatformRoles(): boolean {
  return process.env.ATHENA_USERS_ROLE_ASSIGNMENT === "enabled";
}
