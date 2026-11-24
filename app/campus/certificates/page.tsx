import {redirect} from 'next/navigation';
import {resolveTenant} from '@/lib/tenant/resolve';
import {authState} from '@/lib/auth/server';
import {CampusShell} from '@/components/campus/campus-shell';
import {VisitorCertificates} from '@/components/campus/visitor-certificates';
import {loadVisitorCerts} from '@/lib/visitor/certificates';

export const metadata={title:'Mis certificados'};
export default async function VisitorCertificatesPage({searchParams}:{searchParams:Promise<{page?:string}>}){
 const tenant=await resolveTenant();
 const state=await authState(tenant);
 if(state.status==='unauthenticated')redirect('/login');
 if(state.status==='pending')redirect("/policies");
 if(state.status==='unavailable')return <main className="state-page" role="alert">No fue posible verificar la sesión.</main>;
 if(state.user.role.code!=="VISITOR"||state.user.role.scope!=='PLATFORM')redirect('/campus');
 const query=(await searchParams).page||'1';
 const page=/^[1-9]\d{0,5}$/.test(query)?Math.min(Number(query),999999):1;
 const result=await loadVisitorCerts(page);
 return <CampusShell tenant={tenant} user={state.user} expiresAt={state.expiresAt}>
  <VisitorCertificates result={result}/>
 </CampusShell>;
}
