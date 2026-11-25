"use client";

import { type FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Eye, EyeOff, LockKeyhole, UserRound } from "lucide-react";
import { BrandLogo } from "@/components/ui/brand-logo";
import { notify } from "@/components/ui/notifications";
import type { TenantPublic } from "@/lib/tenant/types";
import styles from "./login-form.module.css";

export function LoginForm({ tenant }: { tenant: TenantPublic }) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }), cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "No fue posible iniciar sesión");
      setPassword("");
      // No pasar por /campus mientras haya políticas pendientes.
      router.replace(data.requiresPolicies?"/policies":"/campus");
      router.refresh();
    } catch (error) {
      notify(error instanceof Error ? error.message : "No se pudo conectar con el servidor", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.geometry} aria-hidden="true">
        <span className={styles.diagonalTop} />
        <span className={styles.diagonalBottom} />
        <span className={styles.circleTop} />
        <span className={styles.ringTop} />
        <span className={styles.circleBottomSoft} />
        <span className={styles.circleBottom} />
        <span className={styles.dotsTop} />
        <span className={styles.dotsBottom} />
        <span className={styles.squareOne} />
        <span className={styles.squareTwo} />
        <span className={styles.smallCircle} />
      </div>
      <div className={styles.layout}>
        <aside className={styles.intro} aria-label="Campus virtual">
          <div className={styles.accentLine} aria-hidden="true" />
          <p className={styles.campusTitle}>Campus <br />virtual</p>
          <p className={styles.slogan}>Aprende. <br />Crece. <br />Avanza.</p>
        </aside>
        <section className={styles.card} aria-labelledby="login-title">
          <Link className={styles.backLink} href="/"><ArrowLeft size={17} aria-hidden="true" /> Volver a los cursos</Link>
          <div className={styles.brand}>
            <BrandLogo name={tenant.name} logoUrl={tenant.logoUrl} large />
            <span>{tenant.name}</span>
          </div>
          <h1 id="login-title" className={styles.title}>Bienvenido de nuevo</h1>
          <p className={styles.description}>Accede con tu usuario y contraseña del campus.</p>
          <form onSubmit={submit} className={styles.form} aria-busy={loading}>
            <div className={styles.field}>
              <label htmlFor="username">Usuario</label>
              <div className={styles.inputWrap}>
                <UserRound size={19} aria-hidden="true" />
                <input id="username" name="username" autoComplete="username" value={username} onChange={e => setUsername(e.target.value)} required maxLength={190} placeholder="Tu usuario" />
              </div>
            </div>
            <div className={styles.field}>
              <label htmlFor="password">Contraseña</label>
              <div className={styles.inputWrap}>
                <LockKeyhole size={19} aria-hidden="true" />
                <input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required maxLength={128} placeholder="Tu contraseña" />
                <button type="button" className={styles.passwordToggle} aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"} onClick={() => setShowPassword(v => !v)}>
                  {showPassword ? <EyeOff size={19} aria-hidden="true" /> : <Eye size={19} aria-hidden="true" />}
                </button>
              </div>
            </div>
            <button className={styles.submit} type="submit" disabled={loading}>
              {loading ? "Ingresando…" : "Iniciar sesión"}<ArrowRight size={18} aria-hidden="true" />
            </button>
          </form>
          <p className={styles.note}>Si no tienes cuenta, solicita acceso a la administración de {tenant.name}.</p>
        </section>
      </div>
    </main>
  );
}
