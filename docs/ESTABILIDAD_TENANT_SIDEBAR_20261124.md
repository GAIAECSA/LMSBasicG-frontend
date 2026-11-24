# Athena LMS — Estabilidad del tenant, sidebar y rendimiento (24/11/2026)

## Base del parche

Se comparó con la versión consolidada de `LMSBasicG-frontend-real-SAAS`, incluidos los parches Aula STUDENT y Certificados VISITOR de 23/11/2026. **El ZIP solo reemplaza los archivos listados**. No se cambia ningún permiso académico ni la base de datos.

## Diagnóstico comprobado en código

1. `resolveTenant()` hacía una llamada `no-store` a FastAPI en cada petición SSR/BFF. `React.cache()` solo deduplicaba lecturas de una misma petición; no las repetidas entre pantallas, acciones y verificación de sesión. Había un único intento con timeout de 8 s. Las fallas de backend llegaban al layout y la pantalla `global-error` afirmaba, sin conocer la causa, que se trataba del servicio de academias.
2. La flecha del sidebar estaba conectada solo a `closeMobile()`. En escritorio no existía estado para colapsarlo ni CSS para reducir su ancho.
3. `SessionMonitor` hacía una llamada extra de verificación al recuperar el foco y cada 60 s, sin evitar solicitudes simultáneas; `authState` hacía sucesivamente tres llamadas al backend (pendientes, perfil y módulos).

## Cambios aplicados

- Cache **solo de la ficha pública del tenant** por hostname normalizado y validado contra la respuesta de FastAPI, TTL 20 segundos, máximo 128 entradas por proceso, singleflight (deduplicación de consultas simultáneas), sin guardar resultados de error y sin utilizar información caducada como fallback.
- Un segundo intento limitado solo para errores de transporte y HTTP 429/502/503/504. Se mantienen `404` para dominios no registrados, comparación estricta del host y tipo TENANT. **No se ha relajado la seguridad multi-tenant.**
- `GET /api/auth/session`: fallos de consulta del tenant dan `503` sin borrar una sesión válida. El monitor ignora fallos transitorios y reduce llamadas repetidas por enfoque o pestañas ocultas.
- Perfil y módulos se consultan en paralelo únicamente después de comprobar políticas obligatorias. Ambas operaciones conservan la verificación de FastAPI; permisos y políticas **no** se cachean.
- Sidebar colapsable en escritorio (78 px), expandible, persistencia local por `tenant.id`, iconos con ayudas y accesibilidad, y funcionamiento móvil sin cambios. No se alteran los tokens `--tenant-*` de marca.
- El mensaje de error global ya no atribuye equivocadamente **todo** fallo a la resolución del dominio.

## Instalación

1. Respaldar frontend actual.
2. Extraer el ZIP en la raíz de `LMSBasicG-frontend` respetando rutas; no copiar la carpeta contenedora si el ZIP no la lleva.
3. En PowerShell: `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`.
4. Si todos pasan: `docker compose up -d --build`.
5. Probar colapso y expansión en escritorio, recarga y cambio de ruta, móvil, varios tenants y la misma cuenta tras regresar a una pestaña inactiva. Las preferencias visuales se guardan por academia.

**No requiere Alembic, cambio de backend ni datos nuevos.**

## Diagnóstico operativo si reaparece la indisponibilidad

```powershell
docker compose ps
docker compose logs --tail=100 frontend
docker compose logs --tail=100 proxy
# Sustituye el dominio por el tenant registrado en tu BD:
docker compose exec frontend node -e "fetch(process.env.BACKEND_INTERNAL_URL+'/api/v1/tenant/resolve?domain=127.0.0.1').then(async r=>console.log(r.status,await r.text())).catch(console.error)"
```

Las fallas de la resolución quedan señaladas como `[athena/tenant]` en los logs del servidor. Si FastAPI no responde de manera sostenida, el campus seguirá **fallando de forma segura**, en vez de mostrar datos de otra academia.

## Cuellos de botella de backend encontrados (NO modificados)

- `app/services/student_course_service.py`: la generación de la vista general lee evidencias, Quiz y Homework dentro de bucles por bloque. El número de consultas crece con la cantidad de actividades, aunque la clase tenga pocos estudiantes.
- `app/services/visitor_certificate_service.py`: `_cards()` invoca `eligibility()` una vez por curso candidato, otra posible fuente de N+1.
- `app/repositories/business_repo.py`: `func.lower(tenant_domain)` y `func.lower(landing_domain)` pueden impedir aprovechar índices B-tree ordinarios; evaluar índices funcionales PostgreSQL tras un `EXPLAIN (ANALYZE, BUFFERS)` con datos reales, sin asumir que sea el cuello de botella de un deployment pequeño.
- La instancia FastAPI usa el servidor Uvicorn por defecto con un worker. Dimensionar workers y pool de PostgreSQL a partir de CPU/RAM y métricas reales, no aumentar a ciegas.

**Recomendación para siguiente fase de optimización:** instrumentar p50/p95, número de consultas SQL por `student-courses/{id}/overview` y por `visitor/certificates`, y latencia de `tenant/resolve` bajo carga. Prefetch/batching y optimización de índices deben llevar pruebas de regresión académica y aislamiento. No se cambiaron porque el reporte no aporta métricas reales del PostgreSQL del usuario.

## Pruebas de esta entrega

- `npm test`: 159 aprobadas, incluyendo 6 nuevas de caché, dominios, sidebar y monitor.
- TypeScript: 8 archivos TS/TSX afectados validados sintácticamente; comprobación focalizada con **stubs temporales de dependencias** sin errores en los archivos afectados. Estas declaraciones no se distribuyen.
- Backend: 14 pruebas focalizadas de base, seguridad y certificados VISITOR pasaron. No se ha ejecutado un `next build` ni un E2E Docker/PostgreSQL en este entorno por dependencias npm incompletas y ausencia del servidor del usuario.
