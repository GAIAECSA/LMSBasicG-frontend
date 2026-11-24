/* eslint-disable @next/next/no-img-element -- Imágenes públicas desde FastAPI sin optimizador remoto. */
import { GraduationCap } from "lucide-react";

export function BrandLogo({ name, logoUrl, large = false }: {
  name: string;
  logoUrl: string | null;
  large?: boolean;
}) {
  return (
    <span className={`brand-logo ${large ? "brand-logo-large" : ""}`} aria-label={`Logo de ${name}`}>
      {logoUrl ? <img src={logoUrl} alt={`Logo de ${name}`} /> : <GraduationCap aria-hidden="true" size={large ? 38 : 27} />}
    </span>
  );
}
