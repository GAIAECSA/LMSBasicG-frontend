/** Contrato administrativo explícito. Nunca editar dominios, IDs, licencias ni secretos. */
export const COLOR_KEYS=['primary','primary_hover','primary_soft','background','surface','text'] as const;
export const HERO_LIMITS={eyebrow:70,title:120,description:300,cta_text:38} as const;
export type ColorKey=typeof COLOR_KEYS[number];
export type HeroKey=keyof typeof HERO_LIMITS;
export const HERO_KEYS=Object.keys(HERO_LIMITS) as HeroKey[];
type Values<K extends string>=Partial<Record<K,string|null>>;
export type ProfilePatch={name?:string;email?:string|null;phone?:string|null;branding_config?:{colors?:Values<ColorKey>|null;content?:{hero?:Values<HeroKey>|null}}};
export type TenantAdminProfile={id:number;name:string;tenant_domain:string;landing_domain:string|null;logo_url:string|null;email:string|null;phone:string|null;branding_config:{colors?:Values<ColorKey>;content?:{hero?:Values<HeroKey>}}};
export const record=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const only=(v:Record<string,unknown>,keys:readonly string[])=>Object.keys(v).every(k=>keys.includes(k));
const plain=(v:string,max:number)=>[...v].length<=max&&!/[<>\u0000-\u001f\u007f]/.test(v);
export const validHex=(v:unknown):v is string=>typeof v==='string'&&/^#[0-9a-f]{6}$/i.test(v);
export function normalizedHex(v:unknown):string {
 if(validHex(v))return v.toUpperCase();
 if(typeof v==='string'&&/^#[0-9a-f]{3}$/i.test(v))return `#${v.slice(1).split('').map(c=>c+c).join('').toUpperCase()}`;
 return '';
}
export function safeLogo(v:unknown,domain:string):string|null {
 if(typeof v!=='string'||!v.startsWith('/api/v1/tenant/logo?')||/[\r\n#]/.test(v))return null;
 const params=new URLSearchParams(v.slice(v.indexOf('?')+1));
 if(params.getAll('domain').length!==1||params.get('domain')!==domain||params.getAll('v').length>1||[...params.keys()].some(k=>k!=='domain'&&k!=='v'))return null;
 return v;
}
const domain=(v:unknown):v is string=>typeof v==='string'&&v.length>0&&v.length<=253&&/^[a-z0-9.-]+$/i.test(v)&&!v.includes('..');
const nullable=(v:unknown):v is string|null=>v===null||typeof v==='string';
export function parseProfile(v:unknown,tenantId:number):TenantAdminProfile|null {
 if(!record(v)||!Number.isSafeInteger(v.id)||v.id!==tenantId||tenantId<=0||typeof v.name!=='string'||!v.name.trim()||!domain(v.tenant_domain)||!(v.landing_domain===null||domain(v.landing_domain))||!nullable(v.email)||!nullable(v.phone)||!record(v.branding_config))return null;
 const logo=safeLogo(v.logo_url,v.tenant_domain);if(v.logo_url!==null&&!logo)return null;
 // No devolver extensiones arbitrarias del JSONB al navegador. PATCH parcial las conserva en BD.
 const colors:Values<ColorKey>={},hero:Values<HeroKey>={};
 const rawColors=v.branding_config.colors,rawContent=v.branding_config.content;
 const rawHero=record(rawContent)?rawContent.hero:null;
 if(record(rawColors))for(const k of COLOR_KEYS){if(typeof rawColors[k]==='string')colors[k]=rawColors[k];}
 if(record(rawHero))for(const k of HERO_KEYS){if(typeof rawHero[k]==='string')hero[k]=rawHero[k];}
 return {id:tenantId,name:v.name,tenant_domain:v.tenant_domain,landing_domain:v.landing_domain,logo_url:logo,email:v.email,phone:v.phone,branding_config:{colors,content:{hero}}};
}
export function parseProfilePatch(v:unknown):ProfilePatch|null {
 if(!record(v)||!only(v,['name','email','phone','branding_config']))return null;
 const out:ProfilePatch={};
 if('name'in v){if(typeof v.name!=='string'||!v.name.trim()||!plain(v.name.trim(),255))return null;out.name=v.name.trim();}
 for(const k of ['email','phone'] as const)if(k in v){
  const value=v[k];if(!nullable(value))return null;
  const s=value?.trim()||null;
  if(s&&(!plain(s,k==='email'?255:50)||k==='email'&&!/^[^\s@]+@[^\s@]+$/.test(s)))return null;
  out[k]=s;
 }
 if('branding_config'in v){
  const b=v.branding_config;if(!record(b)||!only(b,['colors','content']))return null;
  const branding:NonNullable<ProfilePatch['branding_config']>={};
  if('colors'in b){
   if(b.colors===null)branding.colors=null;
   else {if(!record(b.colors)||!only(b.colors,COLOR_KEYS))return null;const colors:Values<ColorKey>={};for(const k of COLOR_KEYS)if(k in b.colors){const x=b.colors[k];if(x!==null&&!validHex(x))return null;colors[k]=x===null?null:x.toUpperCase();}branding.colors=colors;}
  }
  if('content'in b){
   if(!record(b.content)||!only(b.content,['hero']))return null;
   const content:NonNullable<NonNullable<ProfilePatch['branding_config']>['content']>={};
   if('hero'in b.content){const h=b.content.hero;if(h===null)content.hero=null;
    else {if(!record(h)||!only(h,HERO_KEYS))return null;const hero:Values<HeroKey>={};for(const k of HERO_KEYS)if(k in h){const x=h[k];if(!nullable(x)||x!==null&&!plain(x.trim(),HERO_LIMITS[k]))return null;hero[k]=x?.trim()||null;}content.hero=hero;}}
   branding.content=content;
  }
  out.branding_config=branding;
 }
 return out;
}
export type ProfileDraft={name:string;email:string;phone:string;colors:Record<ColorKey,string>;hero:Record<HeroKey,string>};
export function profileDraft(p:TenantAdminProfile):ProfileDraft {
 return {name:p.name,email:p.email||'',phone:p.phone||'',colors:Object.fromEntries(COLOR_KEYS.map(k=>[k,normalizedHex(p.branding_config.colors?.[k])])) as Record<ColorKey,string>,hero:Object.fromEntries(HERO_KEYS.map(k=>[k,p.branding_config.content?.hero?.[k]||''])) as Record<HeroKey,string>};
}
/** Omitir valores que el usuario no cambió. Vacío elimina solo el campo editado. */
export function draftPatch(base:ProfileDraft,draft:ProfileDraft,resetColors=false,resetHero=false):ProfilePatch|null {
 const patch:ProfilePatch={};
 for(const k of ['name','email','phone'] as const)if(base[k]!==draft[k])patch[k]=draft[k];
 const colors:Values<ColorKey>={},hero:Values<HeroKey>={};
 for(const k of COLOR_KEYS)if(base.colors[k]!==draft.colors[k]||resetColors)colors[k]=draft.colors[k]||null;
 for(const k of HERO_KEYS)if(base.hero[k]!==draft.hero[k]||resetHero)hero[k]=draft.hero[k]||null;
 if(Object.keys(colors).length||Object.keys(hero).length){patch.branding_config={};if(Object.keys(colors).length)patch.branding_config.colors=resetColors&&COLOR_KEYS.every(k=>!draft.colors[k])?null:colors;if(Object.keys(hero).length)patch.branding_config.content={hero:resetHero&&HERO_KEYS.every(k=>!draft.hero[k])?null:hero};}
 return parseProfilePatch(patch);
}
export const LOGO_MAX_BYTES=10*1024*1024;
export function validLogoFile(file:File):boolean {
 return file.size>0&&file.size<=LOGO_MAX_BYTES&&['image/png','image/jpeg','image/webp'].includes(file.type)&&/\.(png|jpe?g|webp)$/i.test(file.name);
}
