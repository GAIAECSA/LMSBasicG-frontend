/** Contrato de GET /api/v1/tenant/resolve del backend real (sin duplicar columnas). */
export interface TenantResponse {
  id: number;
  name: string;
  tenant_domain: string;
  landing_domain: string | null;
  logo_url: string | null;
  branding_config: Record<string, unknown>;
  matched_domain: string;
  matched_domain_type: string;
}

export interface TenantTheme {
  primary: string;
  primaryHover: string;
  primarySoft: string;
  background: string;
  surface: string;
  text: string;
  onPrimary: string;
  onPrimaryHover: string;
  accentInk: string;
  sidebar: string;
}

export interface TenantHero {
  eyebrow: string;
  title: string;
  description: string;
  ctaText: string;
}

export interface TenantPublic {
  id: number;
  name: string;
  tenantDomain: string;
  matchedDomain: string;
  logoUrl: string | null;
  theme: TenantTheme;
  hero: TenantHero;
}
