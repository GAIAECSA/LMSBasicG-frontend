import { redirect } from 'next/navigation';
import { resolveTenant } from '@/lib/tenant/resolve';
import { authState } from '@/lib/auth/server';
import { isTenantAdmin } from '@/lib/policies/types';
import { CampusShell } from '@/components/campus/campus-shell';
import { AdminTaxonomy } from '@/components/campus/admin-taxonomy';
export const metadata={title:'Categorías'};
export default async function Page(){
 const tenant=await resolveTenant();const state=await authState(tenant);
 if(state.status==='unauthenticated')redirect('/login');
 if(state.status==='pending')redirect('/policies');
 if(state.status==='unavailable')return <main className="state-page" role="alert">No se pudo validar la sesión.</main>;
 if(state.status!=='ready')return <main className="state-page">Acceso no disponible</main>;
 if(!isTenantAdmin(state.user.role))redirect('/campus');
 return <CampusShell tenant={tenant} user={state.user} expiresAt={state.expiresAt}><AdminTaxonomy mode="categories" /></CampusShell>;
}
