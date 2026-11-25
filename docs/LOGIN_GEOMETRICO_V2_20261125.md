# Login geométrico V2 — 25/11/2026

## Instalación

Extraer el ZIP en el frontend (donde está `package.json`), conservar `.env` local, detener el servidor y borrar `.next` antes de volver a iniciar. Ejecutar `npm ci` si faltan dependencias, `npm run typecheck`, `npm test`, `npm run build` y `npm run dev`. La ruta sigue siendo `/login` en el puerto 9001. El backend no se modifica.

## Implementación

`components/auth/login-form.tsx` importa `login-form.module.css` directamente. El fondo decorativo usa CSS nativo y once elementos no interactivos, fuera del formulario. El diseño no depende de una captura, de imágenes externas ni de clases globales nuevas. En escritorio el título y formulario aparecen en dos columnas; en móvil se apilan. Los tokens del tenant conservan identidad y contraste; los colores neutrales se mantienen en el formulario. Se retiraron únicamente las reglas globales obsoletas del primer login geométrico; el resto de estilos y el proveedor de notificaciones se conservan. Los errores de login llaman a `notify` directamente, incluso si se repite el mismo mensaje. La autenticación, las políticas pendientes y sus redirecciones siguen usando el flujo existente.

## Verificación

162 pruebas Node aprobadas (159 originales + 3 de regresión), TSX transpilado sin errores sintácticos y maqueta estática de la estructura TSX/CSS comprobada en Chromium a 1660×860, 1024×768, 390×844 y 320×568 sin desbordamiento horizontal. La maqueta utiliza sustitutos de iconos y estado React, por lo que no comprueba autenticación, hidratación ni compilación Next. No se pudo ejecutar build/typecheck completo por ausencia de dependencias npm instaladas. Validar en el entorno local con el backend activo, y con otro tenant.
