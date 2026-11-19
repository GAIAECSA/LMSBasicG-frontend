import Link from "next/link";
import { ArrowRight, BookOpen, CircleCheck, FileText, GraduationCap,
  Layers3, ShieldCheck, UserRound } from "lucide-react";
import type { TenantPublic } from "@/lib/tenant/types";
import type { AuthUser, TenantModule } from "@/lib/auth/types";
import { isTenantAdmin } from "@/lib/policies/types";

type Props = {
  tenant: TenantPublic;
  user: AuthUser;
  modules: TenantModule[];
};

/**
 * Página de inicio del campus: no es una pantalla de confirmación de login.
 * Los datos llegan de authState() (SSR) tras validar sesión, tenant y políticas.
 *
 * Hasta migrar cada módulo del LMS, únicamente se enlazan rutas que existen:
 * Políticas (protegida también en servidor) y catálogo público. Las habilitaciones
 * del backend no equivalen a permisos de usuario ni a pantallas ya implementadas.
 */
export function CampusHome({ tenant, user, modules }: Props) {
  const admin = isTenantAdmin(user.role);
  const fullName = [user.firstname, user.lastname].filter(Boolean).join(" ").trim() || user.username;
  const policySection = admin ? "Administración" : "Información";
  const policyDescription = admin
    ? "Publica políticas de tu academia y consulta sus versiones anteriores, sin modificar el historial."
    : "Consulta las políticas vigentes, las informativas y las versiones que has aceptado.";

  return (
    <div className="lms-home">
      <header className="lms-home-header">
        <div>
          <p className="lms-eyebrow">CAMPUS VIRTUAL</p>
          <h1>Inicio</h1>
          <p className="lms-home-intro">{tenant.name}</p>
        </div>
        <span className="lms-home-session"><CircleCheck size={17} aria-hidden="true"/> Sesión activa</span>
      </header>

      <section className="lms-home-overview" aria-labelledby="lms-home-welcome">
        <div className="lms-home-overview-icon"><GraduationCap size={28} aria-hidden="true" /></div>
        <div className="lms-home-overview-text">
          <p className="lms-home-kicker">ÁREA PERSONAL</p>
          <h2 id="lms-home-welcome">Bienvenido, {fullName}</h2>
          <p>Ya estás dentro del campus de {tenant.name}. Selecciona un módulo en el menú para comenzar.</p>
        </div>
      </section>

      <section aria-labelledby="lms-home-access-title" className="lms-home-section">
        <div className="lms-home-section-header">
          <h2 id="lms-home-access-title">Accesos disponibles</h2>
          <p>Se muestran únicamente funciones que ya tienen una pantalla operativa.</p>
        </div>
        <div className="lms-home-actions">
          <Link href="/campus/policies" className="lms-home-action">
            <span className="lms-home-action-icon"><ShieldCheck size={23} aria-hidden="true"/></span>
            <span className="lms-home-action-copy">
              <small>{policySection}</small>
              <strong>Políticas</strong>
              <span>{policyDescription}</span>
              <span className="lms-home-action-link">Ir a Políticas <ArrowRight size={16} aria-hidden="true" /></span>
            </span>
          </Link>
          <Link href="/" className="lms-home-action">
            <span className="lms-home-action-icon"><BookOpen size={23} aria-hidden="true" /></span>
            <span className="lms-home-action-copy">
              <small>OFERTA DE FORMACIÓN</small>
              <strong>Catálogo público</strong>
              <span>Explora los cursos publicados por tu academia.</span>
              <span className="lms-home-action-link">Ver cursos <ArrowRight size={16} aria-hidden="true" /></span>
            </span>
          </Link>
        </div>
      </section>

      <div className="lms-home-detail-grid">
        <section className="lms-home-panel" aria-labelledby="lms-home-account-title">
          <div className="lms-home-panel-title"><UserRound size={19} aria-hidden="true" /><h2 id="lms-home-account-title">Tu cuenta</h2></div>
          <dl className="lms-home-account-details">
            <div><dt>Nombre</dt><dd>{fullName}</dd></div>
            <div><dt>Usuario</dt><dd>{user.username}</dd></div>
            <div><dt>Rol</dt><dd>{user.role.name || user.role.code}</dd></div>
          </dl>
        </section>
        <section className="lms-home-panel" aria-labelledby="lms-home-modules-title">
          <div className="lms-home-panel-title"><Layers3 size={19} aria-hidden="true" /><h2 id="lms-home-modules-title">Configuración del LMS</h2></div>
          <p className="lms-home-panel-description">Módulos habilitados para la academia según FastAPI. Sus pantallas se incorporarán progresivamente.</p>
          {modules.length > 0 ? (
            <ul className="lms-home-modules">
              {modules.map((module) => <li key={module.id}>
                <FileText size={16} aria-hidden="true" />
                <span>{module.name}</span>
                <small>Configurado</small>
              </li>)}
            </ul>
          ) : (
            <p className="lms-home-modules-empty">El backend no devolvió módulos adicionales habilitados para esta academia.</p>
          )}
        </section>
      </div>
    </div>
  );
}
