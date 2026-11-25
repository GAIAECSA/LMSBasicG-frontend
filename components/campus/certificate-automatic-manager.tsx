'use client';
import { ToastMessage } from '@/components/ui/notifications';
import {useCallback,useEffect,useMemo,useState} from 'react';
import {Clock3,Download,Eye,History,RefreshCw,RotateCcw,Search,ShieldOff} from 'lucide-react';
import {certificateApi,certificateRequest,displayDate,parseAutomaticCerts,parseEvents,readableError,
  type AutomaticCert,type CertEvent} from '@/lib/course-workspace/certificates';
import {CertificatePdfViewer} from './certificate-pdf-viewer';
import css from './course-certificates.module.css';

const PAGE=50;
export function CertificateAutomaticManager({courseId}:{courseId:number}){
  const [certificates,setCertificates]=useState<AutomaticCert[]>([]);
  const [offset,setOffset]=useState(0);
  const [filter,setFilter]=useState('ALL');
  const [search,setSearch]=useState('');
  const [revision,setRevision]=useState(0);
  const [loading,setLoading]=useState(true);
  const [working,setWorking]=useState(false);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const [viewer,setViewer]=useState<AutomaticCert|null>(null);
  const [historyId,setHistoryId]=useState<number|null>(null);
  const [history,setHistory]=useState<CertEvent[]|null>(null);
  const [historyError,setHistoryError]=useState('');
  const [decision,setDecision]=useState<{certificate:AutomaticCert;action:'revoke'|'renew'}|null>(null);
  const [reason,setReason]=useState('');
  const url=useCallback((path:string)=>certificateApi(courseId,path),[courseId]);
  useEffect(()=>{
    const controller=new AbortController();setLoading(true);setError('');
    void (async()=>{
      try{
        const response=await certificateRequest(url(`automatic?limit=${PAGE}&offset=${offset}`),{signal:controller.signal});
        if(!controller.signal.aborted)setCertificates(parseAutomaticCerts(response,courseId));
      }catch(e){if(!controller.signal.aborted)setError(readableError(e));}
      finally{if(!controller.signal.aborted)setLoading(false);}
    })();return()=>controller.abort();
  },[courseId,offset,revision,url]);
  useEffect(()=>{
    if(historyId===null)return;
    let active=true;setHistory(null);setHistoryError('');
    void certificateRequest(url(`automatic/${historyId}/history`)).then(v=>{
      if(active)setHistory(parseEvents(v));
    }).catch(e=>{if(active)setHistoryError(readableError(e));});
    return()=>{active=false;};
  },[courseId,historyId,url]);
  const results=useMemo(()=>certificates.filter(c=>
    (filter==='ALL'||c.status===filter)&&
    (`${c.student_name??''} ${c.certificate_code}`.toLowerCase().includes(search.toLowerCase().trim()))
  ),[certificates,filter,search]);
  const stats=useMemo(()=>({emitted:certificates.filter(c=>c.status==='EMITIDO').length,
    pending:certificates.filter(c=>c.status==='PENDIENTE').length,
    revoked:certificates.filter(c=>c.status==='REVOCADO').length}),[certificates]);
  async function apply(){
    if(!decision||!reason.trim())return;
    setWorking(true);setError('');setNotice('');
    try{
      await certificateRequest(url(`automatic/${decision.certificate.id}/${decision.action}`),{
        method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({reason:reason.trim()})});
      setDecision(null);setReason('');setRevision(x=>x+1);
      setNotice(decision.action==='revoke'?'Certificado revocado; el verificador público reflejará su estado.':
        'Certificado reemitido. Se conserva el código y se añadió un evento de auditoría.');
    }catch(e){setError(readableError(e));}
    finally{setWorking(false);}
  }
  return <div className="workspace-panel" aria-label="Certificados automáticos MOOC">
    <div className="workspace-panel-header"><h2>Certificados del curso</h2>
      <p>ADMIN solo consulta, revoca y renueva. La emisión inicial corresponde al estudiante que cumple las condiciones del curso.</p>
    </div>
    <div className={css.stats}>
      <div><span>Total de la página</span><strong>{certificates.length}</strong></div>
      <div><span>Emitidos</span><strong>{stats.emitted}</strong></div>
      <div><span>Pendientes</span><strong>{stats.pending}</strong></div>
      <div><span>Revocados</span><strong>{stats.revoked}</strong></div>
    </div>
    <div className={css.filterBar}>
      <label className={css.search}><Search size={18}/>
        <input type="search" placeholder="Nombre o código (en esta página)" value={search} onChange={e=>setSearch(e.target.value)}/>
      </label>
      <select aria-label="Estado" value={filter} onChange={e=>setFilter(e.target.value)}>
        <option value="ALL">Todos los estados</option><option value="EMITIDO">Emitidos</option>
        <option value="PENDIENTE">Pendientes</option><option value="REVOCADO">Revocados</option>
      </select>
      <button type="button" className="lms-outline-button" disabled={loading} onClick={()=>setRevision(n=>n+1)}><RefreshCw size={16}/> Actualizar</button>
    </div>
    {notice&&<ToastMessage kind="success" message={notice} />}
    {error&&<ToastMessage kind="error" message={error} />}
    {loading?<p role="status" className={css.empty}>Cargando certificados...</p>:<>
      {results.length===0?<p className={css.empty}>No hay certificados en esta página que coincidan con los filtros.</p>:
        <div className={css.tableScroll}><table className={css.table}>
          <thead><tr><th>Estudiante</th><th>Código</th><th>Nota</th><th>Estado</th><th>Acciones</th></tr></thead>
          <tbody>{results.map(c=><tr key={c.id}>
            <td><strong>{c.student_name||'Estudiante sin nombre'}</strong><small>{displayDate(c.created_at)}</small></td>
            <td><code>{c.certificate_code}</code></td>
            <td>{c.final_grade==null?'—':`${Number(c.final_grade).toFixed(2)} / 10`}</td>
            <td><span className={`${css.status} ${c.status==='EMITIDO'?css.statusOk:c.status==='REVOCADO'?css.statusBad:css.statusPending}`}>{c.status}</span></td>
            <td><div className={css.tableActions}>
              {c.status==='EMITIDO'&&c.is_valid&&<button type="button" className="lms-outline-button" onClick={()=>setViewer(c)}><Eye size={15}/> Ver PDF</button>}
              <button type="button" className="lms-outline-button" onClick={()=>setHistoryId(c.id)}><History size={15}/> Historial</button>
              {c.status==='EMITIDO'&&c.is_valid&&<button type="button" className="lms-outline-button" onClick={()=>{setDecision({certificate:c,action:'revoke'});setReason('');}}><ShieldOff size={15}/> Revocar</button>}
              {(c.status==='EMITIDO'||c.status==='REVOCADO')&&<button type="button" className="lms-outline-button" onClick={()=>{setDecision({certificate:c,action:'renew'});setReason('');}}><RotateCcw size={15}/> Renovar</button>}
              {c.status==='PENDIENTE'&&<span className={css.muted}><Clock3 size={15}/> Pendiente de solicitud STUDENT</span>}
            </div></td>
          </tr>)}</tbody>
        </table></div>}
      <div className={css.pager}>
        <button type="button" className="lms-outline-button" disabled={offset===0} onClick={()=>setOffset(Math.max(0,offset-PAGE))}>Anterior</button>
        <span>Página {Math.floor(offset/PAGE)+1} · {certificates.length} registros cargados</span>
        <button type="button" className="lms-outline-button" disabled={certificates.length<PAGE} onClick={()=>setOffset(offset+PAGE)}>Siguiente</button>
      </div>
      <p className={css.hint}>La búsqueda y el filtro de estado afectan solo esta página de 50 certificados; la API administrativa aún no ofrece filtros globales ni el total.</p>
    </>}
    {viewer&&<CertificatePdfViewer title={`Certificado · ${viewer.student_name||viewer.certificate_code}`}
      previewUrl={url(`automatic/${viewer.id}/preview`)} downloadUrl={url(`automatic/${viewer.id}/download`)} onClose={()=>setViewer(null)}/>}
    {historyId!==null&&<div className="lms-modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setHistoryId(null);}}>
      <section className={`lms-modal ${css.historyModal}`} role="dialog" aria-modal="true" aria-labelledby="auto-history-title">
        <div className={css.modalTitle}><h2 id="auto-history-title">Historial del certificado</h2>
          <button type="button" className="lms-outline-button" onClick={()=>setHistoryId(null)}>Cerrar</button></div>
        {historyError&&<ToastMessage kind="error" message={historyError} />}
        {history===null?<p>Cargando historial...</p>:history.length===0?<p>Sin eventos registrados.</p>:
          <div className={css.historyList}>{history.map(event=><article key={event.id}>
            <div><strong>{event.action}</strong><small>{displayDate(event.created_at)} · Actor #{event.actor_user_id}</small></div>
            <p>{event.previous_status||'—'} → {event.new_status}{event.reason?` · ${event.reason}`:''}</p>
            <div className={css.actions}><a className="lms-outline-button" href={url(`automatic/${historyId}/history/${event.id}/pdf`)}><Download size={15}/> PDF del evento</a>
              {event.action!=='ISSUE'&&<a className="lms-outline-button" href={url(`automatic/${historyId}/history/${event.id}/previous-pdf`)}>PDF anterior</a>}</div>
          </article>)}</div>}
      </section>
    </div>}
    {decision&&<div className="lms-modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget&&!working)setDecision(null);}}>
      <section role="dialog" aria-modal="true" aria-labelledby="auto-action-title" className={`lms-modal ${css.actionModal}`}>
        <h2 id="auto-action-title">{decision.action==='revoke'?'Revocar':'Renovar'} certificado</h2>
        <p>{decision.certificate.student_name} · {decision.certificate.certificate_code}</p>
        <p className={css.hint}>{decision.action==='revoke'?'La verificación pública indicará que está revocado.':
          'FastAPI generará un PDF nuevo con la plantilla guardada; el código QR permanecerá estable y se conservará el anterior.'}</p>
        <label className={css.reason}>Motivo obligatorio<textarea maxLength={500} rows={3} value={reason} onChange={e=>setReason(e.target.value)} placeholder="Indica el motivo de la operación"/></label>
        <div className={css.actions}>
          <button type="button" className="lms-outline-button" onClick={()=>setDecision(null)} disabled={working}>Cancelar</button>
          <button type="button" className="button button-primary" onClick={()=>void apply()} disabled={working||!reason.trim()}>{working?'Procesando...':'Confirmar operación'}</button>
        </div>
      </section>
    </div>}
  </div>;
}
