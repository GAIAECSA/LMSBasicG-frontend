'use client';
import { ToastMessage } from '@/components/ui/notifications';

import {useEffect,useMemo,useState} from 'react';
import {BookOpenCheck,ChevronLeft,ChevronRight,GraduationCap,Info,RefreshCw,Search} from 'lucide-react';
import {apiErrorMessage,requestJson} from '@/lib/academic/client';
import {
  courseGradesUrl,defaultGradeQuery,displayGrade,displayWeight,gradeCellLabel,
  readCourseGradesMatrix,type CourseGradesMatrix,type GradeActivity,type GradeCell,
  type GradeQuery,type GradeStudent,
} from '@/lib/course-workspace/grades';
import css from './course-grades.module.css';

const pages=(total:number,size:number)=>Math.max(1,Math.ceil(total/size));
const fullName=(item:GradeStudent)=>
  `${item.firstname.trim()} ${item.lastname.trim()}`.trim()||item.username;
const entries=(item:GradeStudent)=>new Map(item.grades.map(g=>[g.lesson_block_id,g]));

function Score({cell}:{cell:GradeCell|undefined}){
  if(!cell)return <span className={css.muted} title="Sin dato">—</span>;
  if(cell.status==='CALIFICADO')return <strong className={css.numeric} title="Calificado">{displayGrade(cell.score)}</strong>;
  return <span className={css.pending} title={gradeCellLabel(cell)}>{gradeCellLabel(cell)}</span>;
}
function FinalGrade({value}:{value:string|null}){
  return <div className={css.finalValue}>
    <strong className={value===null?css.noGrade:css.numeric}>{displayGrade(value)}</strong>
    {value===null&&<small>Sin notas</small>}
  </div>;
}
function ActivityInfo({activity}:{activity:GradeActivity}){
  const counted=activity.counts_toward_grade;
  return <div className={css.activityInfo} title={`${activity.module_name||'Módulo'} / ${activity.lesson_name||'Lección'} / ${activity.title}`}>
    <span className={css.activityType}>{activity.kind==='quiz'?'Quiz':'Homework'}</span>
    <strong>{activity.title}</strong>
    <small className={css.activityLocation}>
      {activity.module_name&&<span>{activity.module_name}</span>}
      {activity.lesson_name&&<span>{activity.lesson_name}</span>}
    </small>
    <span className={`${css.inclusion} ${counted?css.counted:css.excluded}`}>
      {counted?`Cuenta · peso ${displayWeight(activity.grade_weight)}`:'No cuenta en la nota'}
    </span>
  </div>;
}
function GradeTable({data}:{data:CourseGradesMatrix}){
  return <div className={css.tableScroll} role="region" tabIndex={0} aria-label="Tabla desplazable de calificaciones por estudiante y actividad">
    <table className={css.table}>
      <thead><tr>
        <th scope="col" className={css.stickyName}>Estudiante</th>
        <th scope="col" className={css.stickyFinal}>Nota final / 10</th>
        {data.activities.map(activity=><th scope="col" key={activity.lesson_block_id}>
          <ActivityInfo activity={activity}/>
        </th>)}
      </tr></thead>
      <tbody>{data.students.map(student=>{
        const cells=entries(student);
        return <tr key={student.enrollment_id}>
          <th scope="row" className={css.stickyName}>
            <span className={css.studentName}>{fullName(student)}</span>
            <span className={css.subName}>@{student.username}</span>
            {student.email&&<span className={css.studentEmail} title={student.email}>{student.email}</span>}
          </th>
          <td className={css.stickyFinal}><FinalGrade value={student.final_grade}/></td>
          {data.activities.map(activity=><td key={activity.lesson_block_id}>
            <Score cell={cells.get(activity.lesson_block_id)}/>
          </td>)}
        </tr>;
      })}</tbody>
    </table>
  </div>;
}
function GradeCards({data}:{data:CourseGradesMatrix}){
  return <div className={css.mobileCards} aria-label="Calificaciones por estudiante">
    {data.students.map(student=>{
      const cells=entries(student);
      return <details key={student.enrollment_id} className={css.studentCard}>
        <summary className={css.cardSummary}>
          <span className={css.cardPerson}>
            <strong>{fullName(student)}</strong>
            <small>@{student.username}</small>
          </span>
          <span className={css.cardResult}>
            <span>Nota final</span>
            <strong>{displayGrade(student.final_grade)}</strong>
          </span>
        </summary>
        <div className={css.cardDetail}>
          {student.email&&<p className={css.cardEmail}>{student.email}</p>}
          {data.activities.length===0?<p className={css.muted}>No hay actividades para los filtros actuales.</p>:
            data.activities.map(activity=><div className={css.cardActivity} key={activity.lesson_block_id}>
              <div><ActivityInfo activity={activity}/></div>
              <div className={css.cardScore}><Score cell={cells.get(activity.lesson_block_id)}/></div>
            </div>)}
        </div>
      </details>;
    })}
  </div>;
}
function Pager({label,page,total,pageSize,onChange}:{label:string;page:number;total:number;pageSize:number;onChange:(page:number)=>void}){
  const max=pages(total,pageSize);
  return <div className={css.pager} aria-label={`Paginación de ${label}`}>
    <button type="button" className="lms-outline-button" onClick={()=>onChange(page-1)} disabled={page<=1} aria-label={`Página anterior de ${label}`}>
      <ChevronLeft size={16} aria-hidden="true"/> Anterior
    </button>
    <span>{label}: <strong>{page}</strong> de <strong>{max}</strong> <span className={css.pagerTotal}>({total} en total)</span></span>
    <button type="button" className="lms-outline-button" onClick={()=>onChange(page+1)} disabled={page>=max} aria-label={`Página siguiente de ${label}`}>
      Siguiente <ChevronRight size={16} aria-hidden="true"/>
    </button>
  </div>;
}

/** Visualización exclusivamente de consulta; ninguna operación guarda ni recalcula notas. */
export function CourseGrades({courseId,courseName}:{courseId:number;courseName:string}){
  const [query,setQuery]=useState<GradeQuery>(defaultGradeQuery);
  const [searchDraft,setSearchDraft]=useState('');
  const [revision,setRevision]=useState(0);
  const [data,setData]=useState<CourseGradesMatrix|null>(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');

  useEffect(()=>{
    const timeout=setTimeout(()=>setQuery(prev=>prev.search===searchDraft.trim()?prev:
      {...prev,search:searchDraft.trim(),page:1}),350);
    return ()=>clearTimeout(timeout);
  },[searchDraft]);
  useEffect(()=>{
    const controller=new AbortController();
    setLoading(true);setError('');setData(null);
    void (async()=>{
      try{
        const value=await requestJson(courseGradesUrl(courseId,query),controller.signal);
        if(!controller.signal.aborted)setData(readCourseGradesMatrix(value,courseId));
      }catch(e){
        if(!controller.signal.aborted)setError(apiErrorMessage(e));
      }finally{
        if(!controller.signal.aborted)setLoading(false);
      }
    })();
    return ()=>controller.abort();
  },[courseId,query,revision]);

  const method=data?.grade_calculation_method==='WEIGHTED'?'Ponderado':'Promedio simple';
  const studentTotal=data?.total_students??0;
  const activityTotal=data?.total_activities??0;
  const activityPages=useMemo(()=>pages(activityTotal,query.activity_page_size),[activityTotal,query.activity_page_size]);
  const studentPages=useMemo(()=>pages(studentTotal,query.page_size),[studentTotal,query.page_size]);
  function updateQuery(patch:Partial<GradeQuery>){setQuery(prev=>({...prev,...patch}));}

  return <section className={`lms-users-page lms-academic ${css.page}`} aria-label="Calificaciones del curso">
    <header className="workspace-heading">
      <div>
        <p className="lms-eyebrow">CURSO #{courseId} / CONSULTA ACADÉMICA</p>
        <h1>Calificaciones</h1>
        <p>Consulta las notas de estudiantes aceptados de «{courseName}».</p>
      </div>
      <div className="workspace-actions">
        <button type="button" className="lms-outline-button" onClick={()=>setRevision(value=>value+1)} disabled={loading}>
          <RefreshCw size={16} aria-hidden="true"/> Actualizar
        </button>
      </div>
    </header>

    {data&&<section className={css.summary} aria-label="Resumen de calificaciones">
      <div className={css.summaryTile}><GraduationCap size={20} aria-hidden="true"/>
        <span>Estudiantes</span><strong>{data.total_students}</strong>
        <small>Con matrícula aceptada{query.search?', según búsqueda':''}</small></div>
      <div className={css.summaryTile}><BookOpenCheck size={20} aria-hidden="true"/>
        <span>Actividades</span><strong>{data.total_course_activities}</strong>
        <small>Quiz y Homework con lección</small></div>
      <div className={css.summaryTile}><Info size={20} aria-hidden="true"/>
        <span>Incluidas en nota</span><strong>{data.total_counted_activities}</strong>
        <small>Método: {method}</small></div>
    </section>}

    <div className="workspace-panel">
      <div className="workspace-panel-header">
        <h2>Matriz de notas</h2>
        <p>Se muestran actividades que cuentan y que no cuentan. Los filtros cambian las columnas visibles, no la nota final.</p>
      </div>
      <div className={css.filters}>
        <label className={css.searchField}>
          <span>Buscar estudiante</span>
          <div className={css.searchBox}><Search size={17} aria-hidden="true"/>
            <input type="search" maxLength={150} value={searchDraft} onChange={e=>setSearchDraft(e.target.value)}
              placeholder="Nombre, usuario o correo"/>
          </div>
        </label>
        <label className={css.selectField}>
          <span>Participación en nota</span>
          <select value={query.activity_filter} onChange={e=>updateQuery({activity_filter:e.target.value as GradeQuery['activity_filter'],activity_page:1})}>
            <option value="ALL">Todas</option><option value="COUNTED">Cuentan en nota</option>
            <option value="NOT_COUNTED">No cuentan</option>
          </select>
        </label>
        <label className={css.selectField}>
          <span>Tipo de actividad</span>
          <select value={query.activity_type} onChange={e=>updateQuery({activity_type:e.target.value as GradeQuery['activity_type'],activity_page:1})}>
            <option value="ALL">Quiz y Homework</option><option value="quiz">Solo Quiz</option>
            <option value="homework">Solo Homework</option>
          </select>
        </label>
        <label className={css.selectField}>
          <span>Estudiantes por página</span>
          <select value={query.page_size} onChange={e=>updateQuery({page_size:Number(e.target.value),page:1})}>
            <option value={10}>10</option><option value={25}>25</option><option value={50}>50</option><option value={100}>100</option>
          </select>
        </label>
        <label className={css.selectField}>
          <span>Actividades por página</span>
          <select value={query.activity_page_size} onChange={e=>updateQuery({activity_page_size:Number(e.target.value),activity_page:1})}>
            <option value={10}>10</option><option value={15}>15</option><option value={25}>25</option><option value={50}>50</option>
          </select>
        </label>
      </div>

      <p className={css.legend}>
        <Info size={15} aria-hidden="true"/>
        <span>«—» significa que todavía no hay nota final. <strong>0.00</strong> es una nota real. Los pendientes no se consideran cero.</span>
      </p>
      {error&&<ToastMessage kind="error" message={error}><button type="button" onClick={()=>setRevision(value=>value+1)}>Reintentar</button></ToastMessage>}
      {loading&&<div className={css.loading} role="status" aria-live="polite">Cargando calificaciones...</div>}
      {data&&!loading&&<>
        {data.students.length===0?<div className={css.empty} role="status">
          <GraduationCap size={25} aria-hidden="true"/>
          <strong>No se encontraron estudiantes</strong>
          <p>Solo aparecen matrículas aceptadas con rol STUDENT. Prueba otra búsqueda si corresponde.</p>
          {data.total_students>0&&<Pager label="Estudiantes" page={query.page} total={data.total_students} pageSize={query.page_size}
            onChange={page=>updateQuery({page})}/>}
        </div>:<>
          {data.activities.length===0&&<p className={css.emptyActivities} role="status">
            No hay actividades Quiz o Homework con lección para los filtros seleccionados.
          </p>}
          <GradeTable data={data}/>
          <GradeCards data={data}/>
          <div className={css.pagination}>
            <Pager label="Estudiantes" page={query.page} total={data.total_students} pageSize={query.page_size}
              onChange={page=>updateQuery({page})}/>
            <Pager label="Actividades" page={query.activity_page} total={data.total_activities} pageSize={query.activity_page_size}
              onChange={activity_page=>updateQuery({activity_page})}/>
          </div>
        </>}
      </>}
      {!loading&&!error&&data&&data.students.length>0&&
        <p className={css.footnote}>Notas sobre 10. {method}. Solo lectura; la nota final proviene de FastAPI y no cambia al filtrar actividades.</p>}
      {data&&(!loading)&&query.page>studentPages&&<p className={css.muted}>La página de estudiantes está fuera del rango: vuelve a la anterior.</p>}
      {data&&(!loading)&&query.activity_page>activityPages&&<p className={css.muted}>La página de actividades está fuera del rango: vuelve a la anterior.</p>}
    </div>
  </section>;
}
