"use client";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return <html lang="es"><body><main style={{fontFamily:"system-ui",maxWidth:560,margin:"15vh auto",padding:24}}><h1>Campus temporalmente no disponible</h1><p>No fue posible conectar con el servicio de academias. Revisa la configuración del servidor o inténtalo más tarde.</p><button onClick={reset}>Reintentar</button></main></body></html>;
}
