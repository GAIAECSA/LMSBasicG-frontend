/** URL privada de Docker/host: jamás se envía esta dirección al navegador. */
export function backendBaseUrl(): string {
  const value = process.env.BACKEND_INTERNAL_URL;
  if (!value) throw new Error("BACKEND_INTERNAL_URL no está configurada");
  const url = new URL(value);
  if (!(["http:", "https:"].includes(url.protocol))) throw new Error("BACKEND_INTERNAL_URL requiere HTTP(S)");
  if (url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
    throw new Error("BACKEND_INTERNAL_URL debe indicar solo el origen, sin ruta ni credenciales");
  }
  return url.origin;
}
