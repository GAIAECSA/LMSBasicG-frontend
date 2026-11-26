'use client';
/* eslint-disable @next/next/no-img-element -- Logo same-origin validado y previsualización blob local. */
import { useCallback,useEffect,useRef,useState,type CSSProperties,type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { GraduationCap,ImagePlus,RefreshCw,Save,Trash2 } from 'lucide-react';
import { apiErrorMessage,requestJson } from '@/lib/academic/client';
import { confirmAction,notify } from '@/components/ui/notifications';
import { buildTenant,contrast,tenantCssVars } from '@/lib/tenant/branding';
import { COLOR_KEYS,HERO_KEYS,HERO_LIMITS,draftPatch,parseProfile,profileDraft,record,safeLogo,validHex,validLogoFile,type ColorKey,type HeroKey,type ProfileDraft,type TenantAdminProfile } from '@/lib/tenant/profile';
import type { TenantTheme } from '@/lib/tenant/types';
import styles from './admin-institution-settings.module.css';
const colorLabels:Record<ColorKey,string>={primary:'Principal',primary_hover:'Principal al pasar el cursor',primary_soft:'Principal suave',background:'Fondo',surface:'Superficies',text:'Texto'};
const themeKeys:Record<ColorKey,keyof TenantTheme>={primary:'primary',primary_hover:'primaryHover',primary_soft:'primarySoft',background:'background',surface:'surface',text:'text'};
const heroLabels:Record<HeroKey,string>={eyebrow:'Texto superior',title:'Título',description:'Descripción',cta_text:'Botón principal'};
const heroThemeKeys={eyebrow:'eyebrow',title:'title',description:'description',cta_text:'ctaText'} as const;
const endpoint='/api/tenant/admin';
class ProfileMutationError extends Error {
 constructor(message:string,readonly uncertain:boolean){super(message);}
}
/** Errores de validación permiten corregir sin descartar el formulario; red/5xx
 * pueden dejar el resultado indeterminado, por eso requieren una nueva lectura. */
async function mutateProfile(path:string,init:RequestInit):Promise<unknown>{
 const response=await fetch(`${endpoint}/${path}`,{...init,cache:'no-store'});
 if(!response.ok){let message=`La operación falló (HTTP ${response.status})`;
  try{const body:unknown=await response.json();if(record(body)&&typeof body.message==='string')message=body.message;}catch{}
  throw new ProfileMutationError(message,response.status>=500||response.status===408);
 }
 return response.status===204?null:response.json();
}
function Editor({profile,onReload,onSaved}:{profile:TenantAdminProfile;onReload:()=>Promise<void>;onSaved:(p:TenantAdminProfile)=>void}){
 const router=useRouter(),[base,setBase]=useState(()=>profileDraft(profile)),[draft,setDraft]=useState(()=>profileDraft(profile));
 const [logo,setLogo]=useState(profile.logo_url),[file,setFile]=useState<File|null>(null),[preview,setPreview]=useState<string|null>(null);
 const [resetColors,setResetColors]=useState(false),[resetHero,setResetHero]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const [uncertain,setUncertain]=useState(false),lock=useRef(false),fileInput=useRef<HTMLInputElement>(null);
 useEffect(()=>{if(!file){setPreview(null);return;}const url=URL.createObjectURL(file);setPreview(url);return()=>URL.revokeObjectURL(url);},[file]);
 const patch=draftPatch(base,draft,resetColors,resetHero),dirty=patch===null||Object.keys(patch).length>0;
 const previewTenant=buildTenant({id:profile.id,name:draft.name||profile.name,tenant_domain:profile.tenant_domain,landing_domain:profile.landing_domain,logo_url:logo,matched_domain:profile.tenant_domain,matched_domain_type:'TENANT',branding_config:{colors:draft.colors,content:{hero:draft.hero}}});
 const theme=previewTenant.theme;
 const contrastWarnings=[['Texto / fondo',contrast(theme.text,theme.background)],['Texto / superficie',contrast(theme.text,theme.surface)],['Texto / fondo suave',contrast(theme.text,theme.primarySoft)],['Acento / superficie',contrast(theme.accentInk,theme.surface)]] as const;
 const warnings=contrastWarnings.filter(([,ratio])=>ratio<4.5);
 function update(key:'name'|'email'|'phone',value:string){setDraft(p=>({...p,[key]:value}));}
 function setColor(key:ColorKey,value:string){setDraft(p=>({...p,colors:{...p.colors,[key]:value.toUpperCase()}}));}
 function setHero(key:HeroKey,value:string){setDraft(p=>({...p,hero:{...p.hero,[key]:value}}));}
 function clearFile(){setFile(null);if(fileInput.current)fileInput.current.value='';}
 async function save(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(lock.current||uncertain||!dirty)return;
  if(!patch){setError('Revisa los campos: nombre obligatorio, correo válido, textos planos y colores #RRGGBB.');return;}
  lock.current=true;setBusy(true);setError('');
  try{
   const result=parseProfile(await mutateProfile('profile',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(patch)}),profile.id);
   if(!result)throw Error('No se pudo confirmar el perfil actualizado.');
   const next=profileDraft(result);setBase(next);setDraft(next);setResetColors(false);setResetHero(false);setLogo(result.logo_url);onSaved(result);
   notify('Configuración institucional guardada.','success');router.refresh();
  }catch(e){setError(apiErrorMessage(e));if(!(e instanceof ProfileMutationError)||e.uncertain){setUncertain(true);router.refresh();}}
  finally{lock.current=false;setBusy(false);}
 }
 async function changeLogo(method:'POST'|'DELETE'){
  if(lock.current||uncertain)return;
  if(method==='POST'&&(!file||!validLogoFile(file))){setError('Selecciona una imagen PNG, JPEG o WebP de hasta 10 MiB.');return;}
  lock.current=true;setBusy(true);setError('');
  try{
   if(method==='DELETE'&&!await confirmAction('¿Quitar el logo institucional? Se mostrará la imagen predeterminada.'))return;
   const body=new FormData();if(method==='POST'&&file)body.set('file',file);
   const response=await mutateProfile('logo',{method,...(method==='POST'?{body}:{})});
   const nextLogo=method==='DELETE'?null:record(response)?safeLogo(response.logo_url,profile.tenant_domain):null;
   if(method==='POST'&&!nextLogo)throw Error('No se pudo confirmar el nuevo logo.');
   setLogo(nextLogo);clearFile();onSaved({...profile,logo_url:nextLogo});
   notify(method==='POST'?'Logo actualizado.':'Logo retirado.','success');router.refresh();
  }catch(e){setError(apiErrorMessage(e));if(!(e instanceof ProfileMutationError)||e.uncertain){setUncertain(true);router.refresh();}}
  finally{lock.current=false;setBusy(false);}
 }
 async function reload(){
  if(lock.current)return;lock.current=true;setBusy(true);
  try{if((dirty||file)&&!await confirmAction('Volver a consultar descartará los cambios locales no guardados. ¿Continuar?'))return;await onReload();router.refresh();}
  finally{lock.current=false;setBusy(false);}
 }
 return <>
  {error&&<p role="alert" className={styles.error}>{error}</p>}
  {uncertain&&<div className="lms-academic-note">No se pudo confirmar el resultado. Vuelve a consultar la configuración antes de realizar otro cambio. <button type="button" className="lms-outline-button" onClick={()=>void reload()} disabled={busy}><RefreshCw size={15}/> Volver a consultar</button></div>}
  <div className={styles.grid}>
   <div className={styles.stack}>
    <section className={`${styles.panel} lms-editor-form`} aria-labelledby="logo-heading">
     <div><h2 id="logo-heading">Logo institucional</h2><p>El logo se guarda por separado de los demás cambios.</p></div>
     <div className={styles.logo}>{preview||logo?<img src={preview||logo||''} alt="Vista previa del logo institucional"/>:<GraduationCap size={44} aria-hidden="true"/>}</div>
     <label>Seleccionar imagen<input ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp" disabled={busy||uncertain} onChange={e=>{const candidate=e.target.files?.[0]||null;if(candidate&&!validLogoFile(candidate)){clearFile();setError('Imagen inválida: PNG, JPEG o WebP, máximo 10 MiB.');return;}setFile(candidate);setError('');}}/><small>PNG, JPEG o WebP · hasta 10 MiB. La firma del archivo se verifica en el backend.</small></label>
     <div className="lms-editor-actions"><button type="button" className="lms-outline-button" disabled={busy||uncertain||!logo} onClick={()=>void changeLogo('DELETE')}><Trash2 size={16}/> Quitar logo</button><button type="button" className="button button-primary" disabled={busy||uncertain||!file} onClick={()=>void changeLogo('POST')}><ImagePlus size={16}/> {busy?'Procesando…':'Guardar logo'}</button></div>
    </section>
    <form className={styles.stack} onSubmit={e=>void save(e)}>
     <fieldset disabled={busy||uncertain} className={`${styles.panel} lms-editor-form`}>
      <div><h2>Información institucional</h2><p>Datos de contacto que identifican a tu academia.</p></div>
      <label>Nombre<input required maxLength={255} value={draft.name} onChange={e=>update('name',e.target.value)}/></label>
      <div className="lms-form-row"><label>Correo institucional<input type="email" maxLength={255} value={draft.email} onChange={e=>update('email',e.target.value)}/></label><label>Teléfono<input type="tel" maxLength={50} value={draft.phone} onChange={e=>update('phone',e.target.value)}/></label></div>
      <div className="lms-form-row"><label>Dominio del campus<input readOnly value={profile.tenant_domain}/></label><label>Dominio de landing<input readOnly value={profile.landing_domain||'Sin configurar'}/></label></div>
      <small>Tenant #{profile.id} · Los dominios y las funcionalidades contratadas son gestionados por el proveedor.</small>
     </fieldset>
     <fieldset disabled={busy||uncertain} className={`${styles.panel} lms-editor-form`}>
      <div><h2>Identidad visual</h2><p>Personaliza la paleta. Deja un campo vacío para utilizar el color derivado o predeterminado de Athena.</p></div>
      {COLOR_KEYS.map(key=><div className={styles.colorRow} key={key}><label className={styles.colorLabel}>{colorLabels[key]}<input type="color" aria-label={`Selector de color ${colorLabels[key]}`} value={theme[themeKeys[key]]} onChange={e=>setColor(key,e.target.value)}/></label><label className={styles.hexLabel}>HEX<input aria-label={`HEX ${colorLabels[key]}`} maxLength={7} placeholder={theme[themeKeys[key]]} value={draft.colors[key]} aria-invalid={!!draft.colors[key]&&!validHex(draft.colors[key])} onChange={e=>setColor(key,e.target.value)}/></label><button type="button" className="lms-outline-button" onClick={()=>setColor(key,'')}>Predeterminado</button></div>)}
      <button type="button" className="lms-outline-button" onClick={()=>{setResetColors(true);setDraft(p=>({...p,colors:Object.fromEntries(COLOR_KEYS.map(k=>[k,''])) as ProfileDraft['colors']}));}}>Restaurar todos los colores</button>
      {warnings.length>0&&<div role="status" className="lms-academic-note"><strong>Revisa el contraste (recomendado 4.5:1 para texto normal).</strong><ul>{warnings.map(([label,ratio])=><li key={label}>{label}: {ratio.toFixed(2)}:1</li>)}</ul></div>}
     </fieldset>
     <fieldset disabled={busy||uncertain} className={`${styles.panel} lms-editor-form`}>
      <div><h2>Portada pública</h2><p>Personaliza los textos sin HTML. Los campos vacíos usan el contenido predeterminado.</p></div>
      {HERO_KEYS.map(key=><label key={key}>{heroLabels[key]}{key==='description'?<textarea rows={3} maxLength={HERO_LIMITS[key]} value={draft.hero[key]} placeholder={previewTenant.hero[heroThemeKeys[key]]} onChange={e=>setHero(key,e.target.value)}/>:<input maxLength={HERO_LIMITS[key]} value={draft.hero[key]} placeholder={previewTenant.hero[heroThemeKeys[key]]} onChange={e=>setHero(key,e.target.value)}/>}</label>)}
      <button type="button" className="lms-outline-button" onClick={()=>{setResetHero(true);setDraft(p=>({...p,hero:Object.fromEntries(HERO_KEYS.map(k=>[k,''])) as ProfileDraft['hero']}));}}>Restaurar textos predeterminados</button>
     </fieldset>
     <div className={styles.savebar}><span role="status">{dirty?'Cambios sin guardar':'Configuración guardada'}</span><button type="button" className="lms-outline-button" disabled={busy||uncertain||!dirty} onClick={()=>{setDraft(base);setResetColors(false);setResetHero(false);setError('');}}>Descartar</button><button type="submit" className="button button-primary" disabled={busy||uncertain||!dirty}><Save size={17}/> {busy?'Guardando…':'Guardar configuración'}</button></div>
    </form>
   </div>
   <aside className={styles.previewColumn} aria-label="Vista previa de la identidad visual">
    <section className={styles.panel}><h2>Vista previa</h2><p>Los cambios de esta vista no se aplican hasta guardarlos.</p>
     <div className={styles.preview} style={tenantCssVars(theme) as CSSProperties}>
      <div className={styles.mockSidebar}>{preview||logo?<img src={preview||logo||''} alt=""/>:<GraduationCap size={28}/>}<strong>{previewTenant.name}</strong><small>Campus virtual</small><span>Inicio</span><span>Cursos</span><span>Administración</span></div>
      <div className={styles.mockMain}><strong>Panel administrativo</strong><div className={styles.mockCard}><small>Cursos disponibles</small><strong>12</strong></div><span className={styles.mockButton}>Nuevo curso</span><span className={styles.mockSoft}>Curso activo</span></div>
      <div className={styles.mockHero}><small>{previewTenant.hero.eyebrow}</small><h3>{previewTenant.hero.title}</h3><p>{previewTenant.hero.description}</p><span className={styles.mockButton}>{previewTenant.hero.ctaText}</span></div>
     </div>
    </section>
   </aside>
  </div>
 </>;
}
export function AdminInstitutionSettings({tenantId}:{tenantId:number}){
 const [profile,setProfile]=useState<TenantAdminProfile|null>(null),[error,setError]=useState(''),[loading,setLoading]=useState(true),[version,setVersion]=useState(0);
 const load=useCallback(async(signal?:AbortSignal)=>{setLoading(true);setError('');try{const value=parseProfile(await requestJson(`${endpoint}/profile`,signal),tenantId);if(!value)throw Error('Perfil institucional inválido.');if(!signal?.aborted){setProfile(value);setVersion(v=>v+1);}}catch(e){if(!signal?.aborted)setError(apiErrorMessage(e));}finally{if(!signal?.aborted)setLoading(false);}},[tenantId]);
 useEffect(()=>{const ctrl=new AbortController();void load(ctrl.signal);return()=>ctrl.abort();},[load]);
 return <div className="lms-users-page lms-academic"><div className="lms-page-heading"><div><p className="lms-eyebrow">ADMINISTRACIÓN</p><h1>Configuración institucional</h1><p>Gestiona los datos, el logo y el branding de tu academia.</p></div></div>
  {loading&&<p role="status">Consultando configuración institucional…</p>}
  {error&&<div role="alert" className={styles.error}>{error} <button type="button" className="lms-outline-button" disabled={loading} onClick={()=>void load()}>Reintentar</button></div>}
  {!loading&&!error&&profile&&<Editor key={`${tenantId}:${version}`} profile={profile} onReload={()=>load()} onSaved={setProfile}/>}
 </div>;
}
