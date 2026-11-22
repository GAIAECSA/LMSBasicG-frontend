'use client';
import {useEffect,useMemo,useRef,useState,type PointerEvent} from 'react';
import {AlignCenter,AlignLeft,AlignRight,Check,Eye,ImagePlus,Move,Save,Trash2} from 'lucide-react';
import {CERT_KEYS,CERT_PAGE_WIDTH,CERT_PAGE_HEIGHT,certificateApi,certificateRequest,
  normalizeField,parsePresets,parseTemplate,validateLayout,validBackground,readableError,isNotFound,
  type CertField,type CertFieldKey,type CertPreset,type CertQr} from '@/lib/course-workspace/certificates';
import {CertificatePdfViewer} from './certificate-pdf-viewer';
import css from './course-certificates.module.css';

const OPTIONS:Record<CertFieldKey,string>={
  student_name:'Nombre del estudiante',student_idnumber:'Cédula del estudiante',
  course_name:'Nombre del curso',course_duration:'Horas del curso',
  course_start_date:'Inicio: curso o matrícula',course_end_date:'Fin: curso o emisión',
  enrollment_date:'Fecha de matrícula',final_grade:'Nota final',certificate_code:'Código certificado',
  instructor_name:'Docente del curso',title:'Título libre',custom_text:'Texto personalizado',
};
const EXAMPLES:Record<CertFieldKey,string>={
  student_name:'NOMBRE DEL ESTUDIANTE',student_idnumber:'0000000000',
  course_name:'NOMBRE DEL CURSO',course_duration:'40',course_start_date:'FECHA DE INICIO',
  course_end_date:'FECHA DE FIN',enrollment_date:'FECHA DE MATRÍCULA',final_grade:'9.00',
  certificate_code:'VISTA-PREVIA',instructor_name:'DOCENTE DEL CURSO',
  title:'CERTIFICADO',custom_text:'Texto personalizado',
};
function rendered(field:CertField){
  const data=Object.fromEntries(CERT_KEYS.map(key=>[key,EXAMPLES[key]])) as Record<string,string>;
  const expand=(text:string)=>text.replace(/\{\{([a-z_]+)\}\}/g,(_match,key:string)=>data[key]??`{{${key}}}`);
  return expand(field.prefix??'')+expand(field.key==='title'||field.key==='custom_text'?(field.text??''):EXAMPLES[field.key])+expand(field.suffix??'');
}
const fontFamily=(value:CertField['fontFamily'])=>
  ({'Arial':'"DejaVu Sans",Arial,sans-serif','Georgia':'"DejaVu Serif",Georgia,serif',
    'Times New Roman':'"DejaVu Serif",Georgia,serif','DejaVu Sans':'"DejaVu Sans",Arial,sans-serif',
    'DejaVu Serif':'"DejaVu Serif",Georgia,serif','DejaVu Sans Mono':'"DejaVu Sans Mono",monospace'}[value]);
const FILE_TYPES='image/png,image/jpeg,image/webp';
const clamp=(value:number,min:number,max:number)=>Math.min(max,Math.max(min,value));
const round=(value:number)=>Math.round(value);
const defaults:CertField={key:'student_name',x:240,y:330,width:640,height:64,fontSize:36,
  fontFamily:'Georgia',color:'#15213A',align:'center',bold:false};

export function CertificateTemplateEditor({courseId,courseName}:{courseId:number;courseName:string}){
  const [presets,setPresets]=useState<CertPreset[]>([]);
  const [preset,setPreset]=useState<'classic'|'modern'|'custom'>('classic');
  const [fields,setFields]=useState<CertField[]>([]);
  const [qr,setQr]=useState<CertQr>({x:880,y:620,size:116,enabled:true});
  const [selected,setSelected]=useState<number|null>(null);
  const [background,setBackground]=useState<File|null>(null);
  const [existingBackground,setExistingBackground]=useState(false);
  const [imageUrl,setImageUrl]=useState<string|null>(null);
  const [bgRevision,setBgRevision]=useState(0);
  const [busy,setBusy]=useState(false);
  const [initializing,setInitializing]=useState(true);
  const [notice,setNotice]=useState('');
  const [failure,setFailure]=useState('');
  const [preview,setPreview]=useState<string|null>(null);
  const [enrollmentId,setEnrollmentId]=useState('');
  const stageRef=useRef<HTMLDivElement|null>(null);
  const [stageWidth,setStageWidth]=useState(1122);
  const drag=useRef<{index:number;mode:'move'|'resize'|'qr';startX:number;startY:number;
    origin:CertField|CertQr}|null>(null);
  const field=selected===null?null:fields[selected]??null;
  const scale=Math.min(1,Math.max(.12,(stageWidth-2)/CERT_PAGE_WIDTH));
  const base=certificateApi(courseId,'');
  const savedBackground=certificateApi(courseId,`template/background?revision=${bgRevision}`);

  useEffect(()=>{
    if(!stageRef.current)return;
    const observer=new ResizeObserver(entries=>setStageWidth(entries[0]?.contentRect.width??1122));
    observer.observe(stageRef.current);
    return()=>observer.disconnect();
  },[]);
  useEffect(()=>{
    if(!background){setImageUrl(null);return;}
    const url=URL.createObjectURL(background);setImageUrl(url);
    return()=>URL.revokeObjectURL(url);
  },[background]);
  useEffect(()=>{
    const controller=new AbortController();
    void (async()=>{
      try{
        const raw=await certificateRequest(`${base}presets`,{signal:controller.signal});
        if(controller.signal.aborted)return;
        const available=parsePresets(raw);setPresets(available);
        const classic=available.find(p=>p.code==='classic')??available[0];
        if(!classic)throw Error('No se recibieron plantillas prediseñadas');
        setFields(classic.fields);setQr(classic.qr_config);
        try{
          const current=parseTemplate(await certificateRequest(`${base}template`,{signal:controller.signal}),courseId);
          if(!controller.signal.aborted){setFields(current.fields);setQr(current.qr_config);
            setExistingBackground(current.has_background);setPreset('custom');}
        }catch(e){if(!isNotFound(e))throw e;}
      }catch(e){if(!controller.signal.aborted)setFailure(readableError(e));}
      finally{if(!controller.signal.aborted)setInitializing(false);}
    })();
    return()=>controller.abort();
  },[courseId,base]);
  useEffect(()=>()=>{if(preview)URL.revokeObjectURL(preview);},[preview]);

  function patchField(patch:Partial<CertField>){
    if(selected===null)return;
    setFields(previous=>previous.map((entry,index)=>index===selected?{...entry,...patch}:entry));
    setPreset('custom');
  }
  function selectPreset(code:'classic'|'modern'){
    const chosen=presets.find(p=>p.code===code);if(!chosen)return;
    setFields(chosen.fields.map(f=>({...f})));setQr({...chosen.qr_config});setSelected(null);
    setPreset(code);setNotice('Diseño cargado. Guarda para aplicarlo al curso.');setFailure('');
  }
  function addField(key:CertFieldKey){
    const index=fields.length;
    if(index>=100){setFailure('La plantilla admite como máximo 100 campos');return;}
    const x=clamp(145+(index%8)*18,0,800);
    const next=normalizeField({...defaults,key,x,y:clamp(200+(index%10)*38,0,720),
      text:key==='title'?'CERTIFICADO':key==='custom_text'?'Escribe tu texto aquí':undefined});
    setFields(previous=>[...previous,next]);setSelected(index);setPreset('custom');setFailure('');
  }
  function fieldPointerDown(event:PointerEvent<HTMLDivElement>,index:number,mode:'move'|'resize'|'qr'='move'){
    if(event.button!==0)return;
    event.preventDefault();
    setSelected(index);setPreset('custom');
    drag.current={index,mode,startX:event.clientX,startY:event.clientY,
      origin:mode==='qr'?{...qr}:{...fields[index]}};
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function onMove(event:PointerEvent<HTMLDivElement>){
    const current=drag.current;if(!current)return;
    const dx=round((event.clientX-current.startX)/scale);
    const dy=round((event.clientY-current.startY)/scale);
    if(current.mode==='qr'){
      const origin=current.origin as CertQr;
      setQr(prev=>({...prev,x:clamp(origin.x+dx,0,CERT_PAGE_WIDTH-prev.size),
        y:clamp(origin.y+dy,0,CERT_PAGE_HEIGHT-prev.size)}));
      return;
    }
    const origin=current.origin as CertField;
    if(current.mode==='resize'){
      setFields(previous=>previous.map((item,index)=>index===current.index?{...item,
        width:clamp(origin.width+dx,1,CERT_PAGE_WIDTH-origin.x),
        height:clamp(origin.height+dy,1,CERT_PAGE_HEIGHT-origin.y)}:item));
    }else{
      setFields(previous=>previous.map((item,index)=>index===current.index?{...item,
        x:clamp(origin.x+dx,0,CERT_PAGE_WIDTH-origin.width),
        y:clamp(origin.y+dy,0,CERT_PAGE_HEIGHT-origin.height)}:item));
    }
  }
  const stopMove=()=>{drag.current=null;};
  const layout=useMemo(()=>{
    try{return validateLayout(fields,qr),true;}catch{return false;}
  },[fields,qr]);
  function data():FormData{
    const form=new FormData();form.append('fields',JSON.stringify(fields));
    form.append('qr_config',JSON.stringify(qr));
    if(background)form.append('background_image',background);
    if(enrollmentId.trim())form.append('enrollment_id',enrollmentId.trim());
    return form;
  }
  async function doPreview(){
    if(!layout){setFailure('Revisa las posiciones y dimensiones. Todos los campos y el QR deben caber en el lienzo.');return;}
    setBusy(true);setFailure('');setNotice('');
    try{
      const response=await fetch(`${base}template/preview`,{method:'POST',body:data(),cache:'no-store'});
      if(!response.ok){let message='No se pudo generar la vista previa';
        try{const v:unknown=await response.json();if(v&&typeof v==='object'&&'message'in v&&typeof v.message==='string')message=v.message;}catch{}
        throw Error(message);
      }
      if(!(response.headers.get('content-type')||'').includes('application/pdf'))throw Error('El servidor no devolvió PDF');
      const created=URL.createObjectURL(await response.blob());setPreview(created);
    }catch(e){setFailure(readableError(e));}
    finally{setBusy(false);}
  }
  async function save(){
    if(!layout){setFailure('Los campos o el QR exceden los límites del lienzo.');return;}
    setBusy(true);setFailure('');setNotice('');
    try{
      const form=data();form.delete('enrollment_id');
      const current=parseTemplate(await certificateRequest(`${base}template`,{method:'PUT',body:form}),courseId);
      setFields(current.fields);setQr(current.qr_config);setExistingBackground(current.has_background);
      setBackground(null);setBgRevision(x=>x+1);setNotice('Plantilla guardada. Los certificados emitidos anteriormente no cambian.');
    }catch(e){setFailure(readableError(e));}
    finally{setBusy(false);}
  }
  const numeric=(value:string,old:number,min:number,max:number)=>{
    if(value.trim()==='')return old;
    const parsed=Number(value);return Number.isFinite(parsed)?clamp(parsed,min,max):old;
  };
  return <section className="workspace-panel" aria-label="Editor de plantilla de certificado">
    <div className="workspace-panel-header">
      <h2>Diseño del certificado</h2>
      <p>Prepara el documento que generará FastAPI. La plantilla usa coordenadas fijas (1122 × 794 px).</p>
    </div>
    <div className={css.toolbar}>
      <label>Partir de una plantilla
        <select value={preset} onChange={event=>{if(event.target.value!=='custom')selectPreset(event.target.value as 'classic'|'modern');}}
          disabled={initializing||busy} aria-label="Plantilla prediseñada">
          {presets.map(p=><option key={p.code} value={p.code}>{p.name}</option>)}
          <option value="custom">Personalizada / guardada</option>
        </select>
      </label>
      <label>Añadir campo
        <select value="" disabled={initializing||busy||fields.length>=100} onChange={event=>{if(event.target.value)addField(event.target.value as CertFieldKey);}}>
          <option value="">+ Seleccionar variable</option>
          {CERT_KEYS.map(key=><option key={key} value={key}>{OPTIONS[key]}</option>)}
        </select>
      </label>
      <label className={css.fileInput}><ImagePlus size={17}/> Fondo PNG, JPG o WEBP
        <input type="file" accept={FILE_TYPES} disabled={busy} onChange={event=>{
          const file=event.target.files?.[0];event.target.value='';
          if(!file)return;const invalid=validBackground(file);if(invalid){setFailure(invalid);return;}
          setBackground(file);setPreset('custom');setFailure('');
        }}/>
      </label>
      {background&&<button type="button" className="lms-outline-button" onClick={()=>setBackground(null)} disabled={busy}>Quitar selección de imagen</button>}
    </div>
    <p className={css.hint}>Arrastra los campos y el QR para moverlos; utiliza la esquina inferior derecha para cambiar el tamaño de los campos. También puedes usar las coordenadas numéricas para ajustar con precisión. El QR siempre es obligatorio.</p>
    {existingBackground&&!background&&<p className={css.info}>Este curso tiene un fondo previamente guardado. Al escoger un diseño prediseñado se conservan los archivos existentes; puedes sustituir el fondo por otra imagen.</p>}
    {initializing?<p role="status">Cargando editor...</p>:<div className={css.editorGrid}>
      <div className={css.canvasPanel}>
        <div className={css.canvasLabel}><span><Move size={17}/> Área de diseño</span><small>{courseName}</small></div>
        <div ref={stageRef} className={css.canvasStage}>
          <div className={css.canvasScaled} style={{width:CERT_PAGE_WIDTH*scale,height:CERT_PAGE_HEIGHT*scale}}>
            <div className={css.canvasSheet} style={{width:CERT_PAGE_WIDTH,height:CERT_PAGE_HEIGHT,
              transform:`scale(${scale})`,transformOrigin:'top left'}}>
              {imageUrl||existingBackground?<img className={css.canvasBackground} src={imageUrl||savedBackground} alt="Fondo de certificado"/>:
                <div className={css.canvasDefaultBg}/>}
              {fields.map((entry,index)=><div key={index}
                className={`${css.canvasField} ${selected===index?css.canvasSelected:''}`}
                style={{left:entry.x,top:entry.y,width:entry.width,height:entry.height,
                  fontSize:entry.fontSize,fontWeight:entry.bold?700:400,textAlign:entry.align,
                  fontFamily:fontFamily(entry.fontFamily),color:entry.color}}
                onPointerDown={event=>fieldPointerDown(event,index,event.target instanceof HTMLElement&&event.target.closest('[data-resize]')?'resize':'move')}
                onPointerMove={onMove} onPointerUp={stopMove} onPointerCancel={stopMove}
                title={`Mover ${OPTIONS[entry.key]}`} role="button" tabIndex={0}
                onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();setSelected(index);}}}>
                {rendered(entry)}
                {selected===index&&<span className={css.resizeHandle} data-resize aria-hidden="true"/>}
              </div>)}
              <div className={css.canvasQr} style={{left:qr.x,top:qr.y,width:qr.size,height:qr.size}}
                role="button" tabIndex={0} aria-label="Seleccionar posición de QR" title="Arrastra QR para moverlo"
                onPointerDown={event=>fieldPointerDown(event,-1,'qr')} onPointerMove={onMove}
                onPointerUp={stopMove} onPointerCancel={stopMove} onKeyDown={event=>{if(event.key==='Enter')setSelected(null);}}>
                <span>QR</span><small>Verificación pública</small>
              </div>
            </div>
          </div>
        </div>
        <p className={css.hint}>Vista de edición aproximada. Usa «Generar PDF de prueba» para comprobar el renderizado definitivo, las fuentes y el QR real.</p>
      </div>
      <aside className={css.properties} aria-label="Propiedades de campo">
        <h3>{field?'Campo seleccionado': 'Configuración QR'}</h3>
        {field?<>
          <label>Variable
            <select value={field.key} onChange={event=>patchField({key:event.target.value as CertFieldKey,
              text:['title','custom_text'].includes(event.target.value)?field.text??'Nuevo texto':undefined})}>
              {CERT_KEYS.map(key=><option key={key} value={key}>{OPTIONS[key]}</option>)}
            </select>
          </label>
          {(field.key==='title'||field.key==='custom_text')&&<label>Texto
            <textarea rows={3} maxLength={300} value={field.text??''} onChange={event=>patchField({text:event.target.value})}/>
          </label>}
          <div className={css.grid2}>
            <label>Prefijo<input maxLength={300} value={field.prefix??''} onChange={event=>patchField({prefix:event.target.value})}/></label>
            <label>Sufijo<input maxLength={300} value={field.suffix??''} onChange={event=>patchField({suffix:event.target.value})}/></label>
          </div>
          <div className={css.grid2}>
            {(['x','y','width','height'] as const).map(key=><label key={key}>{key==='x'?'Posición X':key==='y'?'Posición Y':key==='width'?'Ancho':'Alto'}
              <input type="number" min={key==='x'||key==='y'?0:1} max={key==='x'||key==='width'?CERT_PAGE_WIDTH:CERT_PAGE_HEIGHT}
                value={field[key]} onChange={event=>{
                  const value=numeric(event.target.value,field[key],key==='x'||key==='y'?0:1,
                    key==='x'||key==='width'?CERT_PAGE_WIDTH:CERT_PAGE_HEIGHT);
                  if(key==='x')patchField({x:Math.min(value,CERT_PAGE_WIDTH-field.width)});
                  if(key==='y')patchField({y:Math.min(value,CERT_PAGE_HEIGHT-field.height)});
                  if(key==='width')patchField({width:Math.min(value,CERT_PAGE_WIDTH-field.x)});
                  if(key==='height')patchField({height:Math.min(value,CERT_PAGE_HEIGHT-field.y)});
                }}/>
            </label>)}
          </div>
          <label>Tipografía
            <select value={field.fontFamily} onChange={event=>patchField({fontFamily:event.target.value as CertField['fontFamily']})}>
              {(['Georgia','Arial','Times New Roman','DejaVu Serif','DejaVu Sans','DejaVu Sans Mono'] as const).map(font=><option key={font}>{font}</option>)}
            </select>
          </label>
          <div className={css.grid2}>
            <label>Tamaño (px)<input type="number" min={6} max={110} value={field.fontSize}
              onChange={event=>patchField({fontSize:numeric(event.target.value,field.fontSize,6,110)})}/></label>
            <label>Color<input type="color" value={field.color}
              onChange={event=>patchField({color:event.target.value})}/></label>
          </div>
          <div className={css.alignControls} aria-label="Formato y alineación">
            <button type="button" className={field.bold?css.activeControl:''} aria-pressed={field.bold} onClick={()=>patchField({bold:!field.bold})}><strong>B</strong></button>
            {(['left','center','right'] as const).map((side,index)=>{
              const Icon=[AlignLeft,AlignCenter,AlignRight][index];
              return <button key={side} type="button" className={field.align===side?css.activeControl:''}
                aria-pressed={field.align===side} aria-label={`Alinear ${side}`} onClick={()=>patchField({align:side})}><Icon size={17}/></button>;
            })}
          </div>
          <button className={`${css.deleteField} lms-outline-button`} type="button" onClick={()=>{
            setFields(items=>items.filter((_,index)=>index!==selected));setSelected(null);setPreset('custom');
          }}><Trash2 size={16}/> Eliminar campo</button>
        </>:<>
          <p className={css.hint}>QR público obligatorio. El código real y la URL los crea FastAPI, no este editor.</p>
          <div className={css.grid2}>
            {(['x','y','size'] as const).map(key=><label key={key}>{key==='size'?'Tamaño QR':`QR ${key.toUpperCase()}`}
              <input type="number" min={key==='size'?40:0} max={key==='size'?280:key==='x'?CERT_PAGE_WIDTH:CERT_PAGE_HEIGHT}
                value={qr[key]} onChange={event=>setQr(previous=>{
                  const value=numeric(event.target.value,previous[key],key==='size'?40:0,key==='size'?280:
                    key==='x'?CERT_PAGE_WIDTH:CERT_PAGE_HEIGHT);
                  const next={...previous,[key]:value};
                  return {...next,x:clamp(next.x,0,CERT_PAGE_WIDTH-next.size),y:clamp(next.y,0,CERT_PAGE_HEIGHT-next.size)};
                })}/>
            </label>)}
          </div>
        </>}
      </aside>
    </div>}
    <div className={css.previewOptions}>
      <label>Matrícula STUDENT aceptada para prueba (opcional)
        <input inputMode="numeric" pattern="[0-9]*" placeholder="ID de matrícula (vacío = estudiante ficticio)" value={enrollmentId}
          onChange={event=>setEnrollmentId(event.target.value.replace(/\D/g,'').slice(0,12))}/>
      </label>
      <p>FastAPI toma la fecha de inicio del curso o, si falta, la creación de la matrícula;
        la fecha final del curso o, si falta, el día de generación; y el primer docente
        con matrícula TEACHER aceptada. Si no existe docente, el campo queda vacío.
        Sin matrícula de prueba, la fecha de inicio queda vacía cuando el curso no la define.
        Esta prueba tiene marca de agua y no emite ni almacena certificados.</p>
    </div>
    {failure&&<div className="lms-error" role="alert">{failure}</div>}
    {notice&&<p className={css.success} role="status"><Check size={17}/>{notice}</p>}
    <div className={css.footerActions}>
      <button type="button" className="lms-outline-button" onClick={()=>void doPreview()} disabled={busy||initializing||!layout}>
        <Eye size={17}/> {busy?'Procesando...':'Generar PDF de prueba'}</button>
      <button type="button" className="button button-primary" onClick={()=>void save()} disabled={busy||initializing||!layout}>
        <Save size={17}/> Guardar plantilla</button>
    </div>
    {preview&&<CertificatePdfViewer title="Vista previa de plantilla" previewUrl={preview} temporary onClose={()=>{
      URL.revokeObjectURL(preview);setPreview(null);
    }}/>}
  </section>;
}
