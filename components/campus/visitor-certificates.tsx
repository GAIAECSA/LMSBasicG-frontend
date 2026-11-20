import { Award, ShieldCheck, Sparkles } from "lucide-react";

/** Vista informativa: deliberadamente NO solicita certificados ni genera PDFs.
 * La implementación futura consultará solo certificados autorizados de la sesión.
 */
export function VisitorCertificates() {
  return <div className="visitor-page">
    <header className="visitor-page-head"><div>
      <p className="lms-eyebrow"><Sparkles size={15}/> MIS LOGROS</p>
      <h1>Certificados</h1>
      <p>Este espacio reunirá los certificados de tus formaciones cuando el módulo esté habilitado.</p>
    </div></header>
    <section className="visitor-certificate-panel">
      <div className="visitor-certificate-emblem"><Award size={55} aria-hidden="true"/></div>
      <span className="visitor-coming-soon">PRÓXIMAMENTE</span>
      <h2>Tus logros tendrán su lugar</h2>
      <p>Estamos preparando la consulta y descarga segura de certificados. Por ahora, este apartado es solo informativo.</p>
      <div className="visitor-certificate-note"><ShieldCheck size={20} aria-hidden="true"/> Solo se mostrarán documentos que te pertenezcan y estén autorizados.</div>
    </section>
  </div>;
}
