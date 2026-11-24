"use client";

import { useEffect, useState } from "react";
const KEY="lms_cookie_notice_v1";

/** Banner informativo: NO existen cookies opcionales/tracking en esta fase.
 * La cookie HttpOnly de login es estrictamente necesaria y no requiere consentimiento opcional.
 */
export function CookieNotice() {
  const [show,setShow]=useState(false);
  const [details,setDetails]=useState(false);
  useEffect(()=>{try{setShow(localStorage.getItem(KEY)!=="seen");}catch{setShow(true);}},[]);
  function close(){try{localStorage.setItem(KEY,"seen");}catch{}setShow(false);}
  if (!show) return null;
  return <aside className="cookie-notice" aria-label="Información sobre cookies" role="region">
    <div><strong>Cookies necesarias</strong>
      <p>Esta academia utiliza una cookie de sesión para mantener tu acceso de forma segura. No usamos cookies publicitarias ni de seguimiento en esta versión.</p>
      {details&&<p>La cookie de autenticación es HttpOnly, SameSite=Lax y pertenece únicamente a este dominio. Expira con tu sesión. Guardamos localmente que viste este aviso para no repetirlo.</p>}
    </div>
    <div className="cookie-actions"><button type="button" onClick={()=>setDetails(v=>!v)} className="button button-secondary">{details?"Ocultar detalles":"Más información"}</button>
      <button type="button" onClick={close} className="button button-primary">Entendido</button></div>
  </aside>;
}
