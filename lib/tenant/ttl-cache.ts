/**
 * Caché en memoria limitada para datos PUBLICOS de resolución de tenant.
 * - Clave exacta por host/origen, nunca caché global que mezcle academias.
 * - Solo respuestas correctas; 404, 5xx y fallos de red jamás se almacenan.
 * - Se comparten peticiones simultáneas al mismo host para evitar avalanchas.
 * - TTL corto: NO usar para permisos, JWT, políticas ni datos académicos.
 * - No se sirven datos caducados si FastAPI está caído (fail closed).
 */
export function createAsyncTtlCache<T>(ttlMs: number, maxEntries = 128, clock = Date.now) {
  if (!Number.isFinite(ttlMs) || ttlMs <= 0 || !Number.isSafeInteger(maxEntries) || maxEntries < 1) {
    throw new Error("Configuración de caché inválida");
  }
  const settled = new Map<string, { value: T; expiresAt: number }>();
  const pending = new Map<string, Promise<T>>();

  return {
    get(key: string, loader: () => Promise<T>): Promise<T> {
      const entry = settled.get(key);
      if (entry && entry.expiresAt > clock()) {
        // Eliminar y reinsertar mantiene un orden LRU acotado.
        settled.delete(key);
        settled.set(key, entry);
        return Promise.resolve(entry.value);
      }
      if (entry) settled.delete(key);
      const existing = pending.get(key);
      if (existing) return existing;

      const promise = Promise.resolve().then(loader).then(value => {
        settled.set(key, { value, expiresAt: clock() + ttlMs });
        while (settled.size > maxEntries) {
          const oldest = settled.keys().next().value;
          if (oldest === undefined) break;
          settled.delete(oldest);
        }
        return value;
      }).finally(() => {
        pending.delete(key);
      });
      pending.set(key, promise);
      return promise;
    },
    invalidate(key: string): void { settled.delete(key); },
  };
}
