/** Sanitización adicional en el navegador para editar HTML visualmente sin ejecutar contenido activo.
 * FastAPI vuelve a sanitizar con Bleach al persistir; este filtro NO sustituye al servidor.
 */
const tags=new Set(['P','DIV','SPAN','BR','STRONG','B','EM','I','U','S','DEL','SUB','SUP','UL','OL','LI','H1','H2','H3','H4','BLOCKQUOTE','PRE','CODE','A','HR','TABLE','THEAD','TBODY','TR','TH','TD']);
const unsafe=new Set(['SCRIPT','STYLE','IFRAME','OBJECT','EMBED','SVG','MATH','FORM','INPUT','BUTTON','META','LINK','BASE']);
const styleKeys=new Set(['color','background-color','font-size','font-weight','font-style','text-decoration','text-align','margin','margin-left','margin-right','padding','border','border-color','border-style','border-width','line-height','letter-spacing','width','max-width','height','vertical-align','list-style-type']);
function cssSafe(raw:string){return raw.split(';').map(p=>{const i=p.indexOf(':');if(i<1)return '';const key=p.slice(0,i).trim().toLowerCase(),val=p.slice(i+1).trim();
 if(!styleKeys.has(key)||/url\s*\(|expression\s*\(|[<>\\]/i.test(val)||val.length>180)return '';
 return `${key}:${val}`;}).filter(Boolean).join(';');}
export function safeAcademicHtml(input:string):string {
 if(typeof document==='undefined')return '';
 const doc=new DOMParser().parseFromString(input,'text/html');
 const walk=(parent:Element)=>{for(const element of Array.from(parent.children)){
   if(unsafe.has(element.tagName)){element.remove();continue;}
   walk(element);
   if(!tags.has(element.tagName)){element.replaceWith(...Array.from(element.childNodes));continue;}
   for(const a of Array.from(element.attributes)){
    const key=a.name.toLowerCase();
    if(key==='style'){const cleaned=cssSafe(a.value);if(cleaned)element.setAttribute('style',cleaned);else element.removeAttribute(a.name);continue;}
    if(key==='class'&&/^[\w\s-]{0,100}$/.test(a.value))continue;
    if(key==='href'&&element.tagName==='A'){
     try{const url=new URL(a.value,'https://internal.invalid');if(!['https:','http:','mailto:'].includes(url.protocol))element.removeAttribute(a.name);}
     catch{element.removeAttribute(a.name);}continue;
    }
    if(element.tagName==='A'&&['title','target','rel'].includes(key))continue;
    if(['TH','TD'].includes(element.tagName)&&['colspan','rowspan'].includes(key)&&/^\d{1,2}$/.test(a.value))continue;
    element.removeAttribute(a.name);
   }
   if(element.tagName==='A'&&element.getAttribute('target')==='_blank')element.setAttribute('rel','noopener noreferrer');
  }};
 walk(doc.body);return doc.body.innerHTML;
}
export const plainText=(input:unknown)=>typeof input==='string'?input:'';
