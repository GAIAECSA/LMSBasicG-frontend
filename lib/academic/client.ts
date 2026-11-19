/** Utilidades de cliente que nunca manipulan JWT. Las cookies host-only viajan al BFF automáticamente. */
export function apiErrorMessage(e:unknown):string{return e instanceof Error?e.message:'No fue posible completar la operación';}
export async function requestJson(url:string,signal?:AbortSignal,init:RequestInit={}):Promise<unknown>{
 const response=await fetch(url,{...init,signal:signal??init.signal,cache:'no-store'});
 if(!response.ok){let message=`La operación falló (HTTP ${response.status})`;
  try{const body:unknown=await response.json();if(body&&typeof body==='object'&&'message'in body&&typeof body.message==='string')message=body.message;}catch{}
  throw Error(message);
 }
 if(response.status===204)return null;
 return response.json();
}
