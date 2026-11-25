'use client';
import { ToastMessage } from '@/components/ui/notifications';
import {useCallback,useEffect,useState} from 'react';
import {ChevronLeft,ChevronRight,History} from 'lucide-react';
import {apiErrorMessage,requestJson} from '@/lib/academic/client';
import {mdtUrl,readMdtEvents,type MdtResourceBlock,type MdtResourceEventPage} from '@/lib/course-workspace/mdt-resources';
const names:Record<string,string>={DOCUMENT_UPLOADED:'Entrega registrada',DOCUMENT_REPLACED:'Entrega reemplazada',
  PDF_UPLOADED:'PDF cargado',PDF_REPLACED:'PDF reemplazado'};
const when=(value:string)=>Number.isFinite(Date.parse(value))?new Date(value).toLocaleString('es-EC'):'Fecha no disponible';
export function MdtResourceHistory({courseId,blocks,revision}:{courseId:number;blocks:MdtResourceBlock[];revision:number}){
  const [expanded,setExpanded]=useState(false),[page,setPage]=useState(1);
  const [data,setData]=useState<MdtResourceEventPage|null>(null);
  const [loading,setLoading]=useState(false),[error,setError]=useState('');
  const load=useCallback(async(signal:AbortSignal)=>{
    setLoading(true);setError('');
    try{
      const response=await requestJson(`${mdtUrl(courseId)}/events?page=${page}&page_size=15`,signal);
      if(!signal.aborted)setData(readMdtEvents(response));
    }catch(e){if(!signal.aborted)setError(apiErrorMessage(e));}
    finally{if(!signal.aborted)setLoading(false);}
  },[courseId,page]);
  useEffect(()=>{
    if(!expanded)return;
    const controller=new AbortController();void load(controller.signal);
    return ()=>controller.abort();
  },[expanded,load,revision]);
  return <>
    <button type="button" className="lms-outline-button mdt-history-toggle" aria-expanded={expanded}
      onClick={()=>setExpanded(v=>!v)}><History size={16} aria-hidden="true"/>
      {expanded?'Ocultar historial':'Ver historial'}</button>
    {expanded&&<div className="mdt-history-body">
      {loading&&<p role="status" className="mdt-muted">Consultando bitácora...</p>}
      {error&&<ToastMessage kind="error" message={error} />}
      {!loading&&data&&!error&&<>
        {data.items.length?<div className="workspace-table-scroll"><table className="workspace-table">
          <thead><tr><th>Fecha</th><th>Acción</th><th>Recurso</th><th>Autor</th><th>Matrícula</th></tr></thead>
          <tbody>{data.items.map(item=><tr key={item.id}>
            <td>{when(item.created_at)}</td><td>{names[item.action]||item.action}</td>
            <td>{blocks.find(block=>block.id===item.lesson_block_id)?.title||`Bloque #${item.lesson_block_id}`}</td>
            <td>Usuario #{item.actor_user_id}</td><td>{item.enrollment_id===null?'Institucional':`#${item.enrollment_id}`}</td>
          </tr>)}</tbody></table></div>:
          <p className="workspace-empty">Sin eventos registrados desde la incorporación de Recursos MDT. Las entregas anteriores no generan eventos retroactivos.</p>}
        <nav className="mdt-pagination" aria-label="Paginación de historial">
          <button type="button" className="lms-outline-button" disabled={page<=1} onClick={()=>setPage(p=>p-1)}><ChevronLeft size={16}/> Anterior</button>
          <span>{data.total} evento(s)</span>
          <button type="button" className="lms-outline-button" disabled={page*15>=data.total} onClick={()=>setPage(p=>p+1)}>Siguiente <ChevronRight size={16}/></button>
        </nav>
      </>}
    </div>}
  </>;
}
