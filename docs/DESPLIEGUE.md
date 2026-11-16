# Despliegue multi-dominio con Docker y Nginx

## 1. Requisitos

- Linux con Docker Engine + Docker Compose V2, DNS y un Nginx/Caddy HTTPS en el host.
- FastAPI refactorizado en marcha, con sus migraciones, BD y al menos un registro activo `businesses` cuyo `tenant_domain` sea el hostname real de acceso.
- Conectividad **desde el contenedor** hacia FastAPI. `127.0.0.1` dentro de un contenedor **NO** es el loopback de la VPS.

## 2. Arranque

```bash
cp .env.example .env
# Editar BACKEND_INTERNAL_URL y BACKEND_UPSTREAM para alcanzar FastAPI desde Docker.
docker compose up -d --build
docker compose ps
curl -I http://127.0.0.1:8080/api/health
```

Nginx del proyecto escucha **solo** `127.0.0.1:8080` en la VPS. La instancia Next.js no se publica directamente.

### Conectividad API

- **Recomendado en producción:** conectar frontend, proxy y backend a una red Docker privada compartida, usar por ejemplo `BACKEND_INTERNAL_URL=http://backend:9000` y `BACKEND_UPSTREAM=backend:9000`. Es cambio de **orquestación/red**, no de código FastAPI. Adaptar `compose.yaml` a la red compartida al integrarlo con el stack actual.
- **Backend publicado en host:** `host.docker.internal:9000` funciona con `extra_hosts: host-gateway` si FastAPI escucha una interfaz del host accesible desde la red puente. Si el backend publica **solo** `127.0.0.1:9000`, los contenedores puente no podrán alcanzarlo: usar red compartida o ajustar la orquestación, nunca abrir la base de datos a Internet.

## 3. DNS, Nginx público y HTTPS

Los registros `A`/`AAAA` del dominio principal o subdominio de cada academia apuntan a la **misma IP del servidor**. Ejemplo de Nginx HTTPS externo en `nginx/host-https-example.conf`.

En producción, **cada dominio** debe contar con un certificado válido. Un certificado `*.tu-saas.com` solo cubre un nivel de subdominios de tu dominio y **no** los dominios propios de terceros. Automatizar ACME, verificar titularidad del dominio y recarga de Nginx antes de dar de alta un nuevo cliente.

El Nginx público debe conservar `Host` y `X-Forwarded-Proto=https` al reenviar a `127.0.0.1:8080`; el Nginx interno los mantiene para Next.js. `location /api/v1/` y `/uploads/` apuntan a FastAPI, y el resto a Next.js. Las rutas `/api/auth/` son BFF de Next.js, no del backend.

## 4. Ejemplo de colores en PostgreSQL (sin cambiar código FastAPI)

Antes de actualizar en producción, hacer backup y confirmar el tenant. Este ejemplo reemplaza el JSONB por completo, no usarlo sin fusionar configuraciones ya existentes:

```sql
UPDATE businesses
SET branding_config = '{
  "version": 1,
  "colors": {
    "primary": "#0F766E",
    "primary_hover": "#115E59",
    "primary_soft": "#CCFBF1"
  },
  "content": {
    "hero": {
      "title": "Aprende con Academia Ejemplo",
      "description": "Consulta nuestra oferta de cursos.",
      "cta_text": "Explorar cursos"
    }
  }
}'::jsonb
WHERE tenant_domain = 'campus.ejemplo.com' AND deleted = false;
```

Cuando se implemente un editor administrativo, deberá actualizar esta columna mediante un endpoint autenticado y validado; **no mediante SQL manual de forma habitual**.

## 5. Prueba con dos academias

1. Crear `businesses` activos con `tenant_domain=campus.a.com` y `tenant_domain=lms.b.com`; si se desea, cargar diferente `branding_config` y logos.
2. Configurar DNS/TLS para los dos dominios, apuntando a un solo proxy.
3. Abrir ambas URL y comprobar nombre/logo/colores y cursos distintos. Los dominios desconocidos deben rechazar la resolución (404).
4. Iniciar sesión con el usuario de la academia A en A; verificar que su sesión no aparece en B.
5. Validar que el catálogo no utiliza `is_published`/`open_enrollment` inexistentes en el DTO público.

## 6. Operación

```bash
docker compose logs -f frontend proxy
docker compose up -d --build
# Para detener:
docker compose down
```

No se incluye PostgreSQL ni FastAPI en este ZIP por solicitud expresa. Sin backend accesible, el servidor frontend arranca, pero la portada no resolverá ningún tenant. No es un modo demo.

## 7. Seguridad

- La resolución por dominio no sustituye la autorización por JWT/business_id del backend.
- No habilitar caché compartida en HTML, JSON o sesiones sin particionar por dominio/usuario.
- No reenviar ciegamente cabeceras `X-Forwarded-Host` de clientes externos; el proxy público debe establecerlas a partir del host validado.
- Las cookies de sesión son host-only, HttpOnly, SameSite=Lax y `Secure` en HTTPS; desplegar **siempre** con TLS público.
- El endpoint público de logos es seguro porque FastAPI valida pertenencia del archivo. No crear un `alias /uploads` hacia el disco del servidor.
