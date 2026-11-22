/** Navegación declarativa del aula. Los permisos reales se comprueban en FastAPI
 * y de nuevo en las páginas de Next.js: la visibilidad de un enlace NO autoriza nada.
 * STUDENT conserva el menú normal del campus y no recibe este workspace.
 */
import type { CourseCode } from '@/lib/academic/types';

export type WorkspaceRole = 'ADMIN' | 'TEACHER';
export type CourseSection = 'modules' | 'attendance' | 'mdt-resources' |
  'grades' | 'enrollments' | 'certificates' | 'reports' | 'settings';
export type WorkspaceItem = { section: CourseSection; label: string; adminOnly?: boolean };

const common: WorkspaceItem[] = [
  {section:'modules',label:'Módulos'},
  {section:'attendance',label:'Asistencia'},
];
const sharedTail: WorkspaceItem[] = [
  {section:'grades',label:'Calificaciones'},
  {section:'enrollments',label:'Matrículas',adminOnly:true},
  {section:'certificates',label:'Certificados',adminOnly:true},
];
const adminSettings: WorkspaceItem = {section:'settings',label:'Configuraciones',adminOnly:true};

export function workspaceItems(code:CourseCode, role:WorkspaceRole):WorkspaceItem[] {
  const items: WorkspaceItem[] = [...common];
  if (code==='MDT') items.push(
    {section:'mdt-resources',label:'Recursos MDT'},
  );
  items.push(...sharedTail);
  if (code==='MDT')items.push({section:'reports',label:'Reportes',adminOnly:true});
  items.push(adminSettings);
  return items.filter(item=>role==='ADMIN'||!item.adminOnly);
}
export function mayOpenSection(code:CourseCode,role:WorkspaceRole,section:string):boolean {
  return workspaceItems(code,role).some(item=>item.section===section);
}
