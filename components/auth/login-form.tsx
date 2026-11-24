"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Eye, EyeOff, LockKeyhole, UserRound } from "lucide-react";
import { BrandLogo } from "@/components/ui/brand-logo";
import type { TenantPublic } from "@/lib/tenant/types";

export function LoginForm({tenant}: {tenant:TenantPublic}) {
  const router=useRouter();
  const [username,setUsername]=useState("");
  const [password,setPassword]=useState("");
  const [showPassword,setShowPassword]=useState(false);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true);setError("");
    try {
      const res=await fetch("/api/auth/login",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({username,password}),cache:"no-store"});
      const data=await res.json().catch(()=>({}));
      if (!res.ok) throw new Error(data.message||"No fue posible iniciar sesión");
      setPassword("");
      // No pasar por /campus mientras haya políticas pendientes.
      router.replace(data.requiresPolicies?"/policies":"/campus");router.refresh();
    } catch(e) {setError(e instanceof Error?e.message:"No se pudo conectar con el servidor");}
    finally {setLoading(false);}
  }
  return <main className="auth-page"><div className="auth-card">
    <Link className="back-link" href="/"><ArrowLeft size={17}/> Volver a los cursos</Link>
    <div className="auth-brand"><BrandLogo name={tenant.name} logoUrl={tenant.logoUrl} large/><span>{tenant.name}</span></div>
    <h1>Bienvenido de nuevo</h1><p>Accede con tu usuario y contraseña del campus.</p>
    <form onSubmit={submit} className="auth-form">
      <label htmlFor="username">Usuario</label><div className="input-wrap"><UserRound size={19}/><input id="username" autoComplete="username" value={username} onChange={e=>setUsername(e.target.value)} required maxLength={190} placeholder="Tu usuario"/></div>
      <label htmlFor="password">Contraseña</label><div className="input-wrap"><LockKeyhole size={19}/><input id="password" type={showPassword?"text":"password"} autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required maxLength={128} placeholder="Tu contraseña"/><button type="button" aria-label={showPassword?"Ocultar":"Mostrar"} onClick={()=>setShowPassword(v=>!v)}>{showPassword?<EyeOff size={19}/>:<Eye size={19}/>}</button></div>
      {error&&<p className="form-error" role="alert">{error}</p>}
      <button className="button button-primary auth-submit" type="submit" disabled={loading}>{loading?"Ingresando…":"Iniciar sesión"}<ArrowRight size={18}/></button>
    </form>
    <p className="auth-note">Si no tienes cuenta, solicita acceso a la administración de {tenant.name}. No hay registro público.</p>
  </div></main>;
}
