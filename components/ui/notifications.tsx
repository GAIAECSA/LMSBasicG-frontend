'use client';
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
type Kind = 'success'|'error'|'warning'|'info';
type Toast = {id:number; kind:Kind; message:string};
type Decision = {message:string; resolve:(value:boolean)=>void};
let sequence=0;
const listeners=new Set<(item:Toast)=>void>();
const decisions=new Set<(item:Decision)=>void>();
export function notify(message:string,kind:Kind='info') { if(message) listeners.forEach(fn=>fn({id:++sequence,kind,message})); }
export function confirmAction(message:string):Promise<boolean>{return new Promise(resolve=>{const listener=decisions.values().next().value;if(listener)listener({message,resolve});else resolve(false);});}
export function ToastMessage({message,kind='info',children}:{message:string;kind?:Kind;children?:ReactNode}){
 useEffect(()=>{if(message)notify(message,kind);},[message,kind]);
 return children?<div className="athena-notice-actions">{children}</div>:null;
}
export function NotificationProvider(){
 const [ready,setReady]=useState(false),[items,setItems]=useState<Toast[]>([]),[decision,setDecision]=useState<Decision|null>(null);
 const current=useRef<Decision|null>(null),dialog=useRef<HTMLDialogElement>(null),timers=useRef(new Map<number,ReturnType<typeof setTimeout>>());
 function dismiss(id:number){clearTimeout(timers.current.get(id));timers.current.delete(id);setItems(old=>old.filter(x=>x.id!==id));}
 useLayoutEffect(()=>{setReady(true);const push=(item:Toast)=>{setItems(old=>[...old.filter(x=>x.message!==item.message||x.kind!==item.kind),item]);if(item.kind!=='error')timers.current.set(item.id,setTimeout(()=>dismiss(item.id),5500));};
 const ask=(item:Decision)=>{if(current.current){item.resolve(false);return;}current.current=item;setDecision(item);};listeners.add(push);decisions.add(ask);
 return()=>{listeners.delete(push);decisions.delete(ask);timers.current.forEach(clearTimeout);timers.current.clear();current.current?.resolve(false);current.current=null;};},[]);
 useEffect(()=>{if(decision&&dialog.current&&!dialog.current.open)dialog.current.showModal();},[decision]);
 function finish(value:boolean){const item=current.current;current.current=null;dialog.current?.close();setDecision(null);item?.resolve(value);}
 if(!ready)return null;
 const stack=<div className="athena-toast-stack" aria-label="Notificaciones">{items.map(item=>{const Icon=item.kind==='success'?CheckCircle2:item.kind==='info'?Info:AlertTriangle;return <div key={item.id} className={`athena-toast athena-toast-${item.kind}`} role={item.kind==='error'?'alert':'status'}><Icon size={22}/><div><strong>{{success:'Correcto',error:'Error',warning:'Advertencia',info:'Información'}[item.kind]}</strong><p>{item.message}</p></div><button type="button" aria-label="Cerrar notificación" onClick={()=>dismiss(item.id)}><X size={18}/></button></div>;})}</div>;
 return createPortal(<>{stack}<dialog ref={dialog} className="athena-confirm" aria-labelledby="athena-confirm-title" onCancel={e=>{e.preventDefault();finish(false);}} onClick={e=>{if(e.target===e.currentTarget)finish(false);}}>{decision&&<div className="athena-confirm-inner"><div className="athena-confirm-icon"><AlertTriangle size={26}/></div><h2 id="athena-confirm-title">Confirmar acción</h2><p>{decision.message}</p><div className="athena-confirm-actions"><button type="button" className="button button-secondary" autoFocus onClick={()=>finish(false)}>Cancelar</button><button type="button" className="button button-primary" onClick={()=>finish(true)}>Confirmar</button></div></div>}</dialog></>,document.body);
}
