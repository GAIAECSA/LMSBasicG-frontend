'use client';
import { ToastMessage } from '@/components/ui/notifications';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { BookOpen, ClipboardList, Download, FileCheck2, FileSpreadsheet, GraduationCap, LoaderCircle, RefreshCw, Users, ChevronDown, ChevronRight, AlertCircle } from 'lucide-react';
import { apiErrorMessage, requestJson } from '@/lib/academic/client';
import { GRADE_CODES, REPORT_GROUPS, TITLES, parseReportCatalog, reportUrl,
  type ReportCode, type ReportCatalog, type ReportActivity } from '@/lib/course-reports/catalog';
import css from './course-reports.module.css';

const icons=[BookOpen,FileCheck2,Users,GraduationCap,ClipboardList,FileSpreadsheet];
const grades=(code:ReportCode)=>GRADE_CODES.some(v=>v===code);
const mandatory=(code:ReportCode,a:ReportActivity)=>code==='final-grades'&&a.counts_toward_grade;
function available(code:ReportCode,a:ReportActivity){
  if(code==='diagnostic'||code==='theoretical')return a.type==='quiz';
  if(code==='practical')return a.type==='homework';
  return a.type==='quiz'||a.type==='homework';
}
export function CourseReports({courseId,courseName}:{courseId:number;courseName:string}){
  const [catalog,setCatalog]=useState<ReportCatalog|null>(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [downloading,setDownloading]=useState<ReportCode|null>(null);
  const [open,setOpen]=useState<string|null>(null);
  const [current,setCurrent]=useState<ReportCode|null>(null);
  const [selected,setSelected]=useState<Partial<Record<ReportCode,number[]>>>({});
  const load=useCallback(async(signal?:AbortSignal)=>{
    setLoading(true);setError('');
    try{
      const raw=await requestJson(`/api/course-reports/${courseId}/catalog`,signal);
      const data=parseReportCatalog(raw,courseId);
      if(!data)throw Error('El catálogo de reportes no tiene el formato esperado');
      if(!signal?.aborted){setCatalog(data);setSelected(Object.fromEntries(
        GRADE_CODES.map(code=>[code,[...(data.defaults[code]||[])]])));}
    }catch(err){if(!signal?.aborted)setError(apiErrorMessage(err));}
    finally{if(!signal?.aborted)setLoading(false);}
  },[courseId]);
  useEffect(()=>{const controller=new AbortController();void load(controller.signal);return()=>controller.abort();},[load]);
  const candidates=useMemo(()=>current&&catalog?catalog.activities.filter(a=>available(current,a)):[],[catalog,current]);
  const active=current?(selected[current]||[]):[];
  const selectedCount=current?candidates.filter(a=>mandatory(current,a)||active.includes(a.id)).length:0;
  function toggle(code:ReportCode,id:number){
    const a=catalog?.activities.find(row=>row.id===id);
    if(!a||mandatory(code,a))return;
    setSelected(prev=>{const old=prev[code]||[];return {...prev,[code]:old.includes(id)?old.filter(v=>v!==id):[...old,id]};});
  }
  async function download(code:ReportCode,ids?:number[]){
    if(downloading)return;
    setError('');setDownloading(code);
    try{
      const response=await fetch(reportUrl(courseId,code,ids),{credentials:'same-origin',cache:'no-store'});
      if(!response.ok){
        let message=`No se pudo generar el reporte (HTTP ${response.status})`;
        try{const result:unknown=await response.json();
          if(result&&typeof result==='object'&&'detail'in result&&typeof result.detail==='string')message=result.detail;}catch{}
        throw Error(message);
      }
      if(!(response.headers.get('content-type')||'').includes('application/pdf'))throw Error('El servidor no devolvió un PDF');
      const blob=await response.blob();
      const url=URL.createObjectURL(blob);
      const link=document.createElement('a');link.href=url;
      link.download=`athena_mdt_${code.replaceAll('-','_')}_${courseId}.pdf`;
      document.body.appendChild(link);link.click();link.remove();
      // Se difiere la revocación para no interrumpir el guardado en navegadores lentos.
      setTimeout(()=>URL.revokeObjectURL(url),30_000);
    }catch(err){setError(apiErrorMessage(err));}
    finally{setDownloading(null);}
  }
  function display(code:ReportCode){
    if(grades(code)){
      setCurrent(code);
      // Cada nueva apertura parte de las opciones predeterminadas, no de una
      // selección previa que pudiera confundirse con configuración guardada.
      setSelected(prev=>({...prev,[code]:[...(catalog?.defaults[code]||[])]}));
      return;
    }
    void download(code);
  }
  function downloadGrades(){
    if(!current||!catalog)return;
    const ids=candidates.filter(a=>mandatory(current,a)||active.includes(a.id)).map(a=>a.id);
    if(!ids.length){setError('Selecciona al menos una actividad para generar el PDF.');return;}
    void download(current,ids);
  }
  return <section className={`lms-users-page lms-academic ${css.page}`} aria-label="Reportes del curso MDT">
    <header className="workspace-heading"><div>
      <p className="lms-eyebrow">CURSO MDT #{courseId} / ADMINISTRACIÓN</p>
      <h1>Reportes</h1><p>Genera los 14 reportes oficiales de «{courseName}». Solo incluyen matrículas aceptadas.</p>
    </div><div className="workspace-actions"><button type="button" className="lms-outline-button" disabled={loading||downloading!==null} onClick={()=>void load()}><RefreshCw size={16}/> Actualizar</button></div></header>
    {error&&<ToastMessage kind="error" message={error} />}
    {loading&&<p className={css.loading}><LoaderCircle className={css.spin} size={18}/> Cargando configuración y actividades...</p>}
    {!loading&&catalog&&<>
      <div className={css.summary}><strong>{catalog.reports.length} reportes</strong><span>6 categorías</span><span>{catalog.activities.length} actividades evaluables disponibles</span></div>
      <div className={css.cards}>
        {REPORT_GROUPS.map((group,index)=>{
          const Icon=icons[index];const expanded=open===group.id;
          return <article className={css.card} key={group.id}>
            <button type="button" className={css.cardTop} aria-expanded={group.reports.length===1?undefined:expanded}
              disabled={downloading!==null} onClick={()=>group.reports.length===1?display(group.reports[0]):(setOpen(expanded?null:group.id),setCurrent(null))}>
              <span className={css.cardIcon}><Icon size={24} aria-hidden="true"/></span>
              <span className={css.cardCopy}><strong>{group.title}</strong><small>{group.subtitle}</small><span className={css.count}>{group.reports.length} {group.reports.length===1?'reporte':'reportes'}</span></span>
              {group.reports.length===1?<Download size={20} className={css.arrow} aria-hidden="true"/>:expanded?<ChevronDown size={19} className={css.arrow}/>:<ChevronRight size={19} className={css.arrow}/>}
            </button>
            {expanded&&<div className={css.children}>
              {group.reports.map(code=><button key={code} type="button" disabled={downloading!==null} onClick={()=>display(code)}
                className={`${css.item} ${current===code?css.chosen:''}`}>
                <span>{TITLES[code]}</span><span>{grades(code)?'Elegir actividades':'Generar PDF'}</span><Download size={16} aria-hidden="true"/>
              </button>)}
            </div>}
          </article>;
        })}
      </div>
      {current&&<section className={css.configuration} aria-label={`Configuración de ${TITLES[current]}`}>
        <div className={css.confTop}><div><p className="lms-eyebrow">CONFIGURACIÓN DE REPORTE</p><h2>{TITLES[current]}</h2>
          <p>Selecciona las columnas para esta generación. No se guarda ninguna preferencia.</p></div>
          <button type="button" onClick={()=>setCurrent(null)} className="lms-outline-button">Cerrar</button></div>
        {current==='final-grades'&&<div className={css.note}>Todas las actividades que cuentan para la nota final aparecen obligatoriamente. Las otras son opcionales y no alteran el promedio.</div>}
        {candidates.length===0?<p className={css.empty}>No hay actividades de este tipo configuradas en el curso.</p>:
          <div className={css.checks}>{candidates.map(activity=>{
            const fixed=mandatory(current,activity);
            return <label key={activity.id} className={css.check}>
              <input type="checkbox" checked={fixed||active.includes(activity.id)} disabled={fixed}
                onChange={()=>toggle(current,activity.id)}/>
              <span><strong>{activity.title}</strong><small>{activity.type==='quiz'?'Quiz':'Tarea'} · {activity.counts_toward_grade?'Cuenta para nota final':'No cuenta para nota final'} {fixed?'· Obligatoria':''}</small></span>
            </label>;
          })}</div>}
        <div className={css.confFooter}><span>{selectedCount} actividad(es) seleccionada(s)</span>
          <button type="button" className="lms-primary-button" disabled={!selectedCount||downloading!==null} onClick={downloadGrades}>
            {downloading===current?<LoaderCircle size={17} className={css.spin}/>:<Download size={17}/>} {downloading===current?"Generando PDF...":"Generar PDF"}</button>
        </div>
      </section>}
    </>}
  </section>;
}
