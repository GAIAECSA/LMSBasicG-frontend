"use client";

/** Error del layout raíz: puede venir de FastAPI, de datos o de Next.js.
 * No afirmar que el tenant es incorrecto cuando no se conoce la causa.
 * Nunca imprimir stack traces, datos internos ni tokens en la pantalla.
 */
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return <html lang="es"><body><main style={{fontFamily:"system-ui",maxWidth:560,margin:"15vh auto",padding:24,lineHeight:1.6}}>
    <h1 style={{fontSize:24}}>Campus temporalmente no disponible</h1>
    <p>Hubo un problema al cargar la página. Si estabas guardando cambios, verifica el resultado antes de repetir la operación.</p>
    <p>Si el problema persiste, revisa la conexión entre Athena y el servidor de la academia.</p>
    <button type="button" onClick={reset} style={{cursor:"pointer",borderRadius:8,padding:"10px 16px"}}>Reintentar</button>
  </main></body></html>;
}
