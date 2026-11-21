/** Importador XLSX pequeño, sin dependencias de terceros. Solo lee texto de la primera hoja.
 * Limita tamaño/cantidad de entradas/descompresión. No ejecuta macros ni fórmulas.
 * Requiere DecompressionStream('deflate-raw') del navegador moderno.
 */
const decoder=new TextDecoder();
const u16=(v:DataView,p:number)=>v.getUint16(p,true);
const u32=(v:DataView,p:number)=>v.getUint32(p,true);
function xml(raw:string):Document{
  const doc=new DOMParser().parseFromString(raw,'application/xml');
  if(doc.querySelector('parsererror'))throw Error('Contenido XML del Excel inválido.');
  return doc;
}
async function entries(bytes:ArrayBuffer):Promise<Map<string,string>>{
  const view=new DataView(bytes);const size=bytes.byteLength;
  let eocd=-1;for(let i=size-22;i>=Math.max(0,size-65557);i--)if(u32(view,i)===0x06054b50){eocd=i;break;}
  if(eocd<0)throw Error('Archivo Excel inválido.');
  const count=u16(view,eocd+10), central=u32(view,eocd+16);
  if(count>200||central>=size)throw Error('Excel demasiado grande o inválido.');
  let pos=central;const result=new Map<string,string>();let total=0;
  for(let i=0;i<count;i++){
    if(pos+46>size||u32(view,pos)!==0x02014b50)throw Error('Directorio ZIP inválido.');
    const method=u16(view,pos+10),compressed=u32(view,pos+20),rawSize=u32(view,pos+24);
    const nameSize=u16(view,pos+28),extra=u16(view,pos+30),comment=u16(view,pos+32),local=u32(view,pos+42);
    const name=decoder.decode(new Uint8Array(bytes,pos+46,nameSize));
    pos+=46+nameSize+extra+comment;
    if(!/^xl\/(sharedStrings\.xml|worksheets\/sheet1\.xml)$/.test(name))continue;
    total+=rawSize;if(total>8*1024*1024||rawSize>6*1024*1024)throw Error('Excel demasiado grande.');
    if(local+30>size||u32(view,local)!==0x04034b50)throw Error('Excel ZIP inválido.');
    const offset=local+30+u16(view,local+26)+u16(view,local+28);
    if(offset+compressed>size)throw Error('Excel ZIP truncado.');
    const chunk=new Uint8Array(bytes,offset,compressed);
    let unpacked:Uint8Array;
    if(method===0)unpacked=chunk;
    else if(method===8){
      const stream=new Blob([new Uint8Array(chunk)]).stream().pipeThrough(new DecompressionStream('deflate-raw' as CompressionFormat));
      const buffer=await new Response(stream).arrayBuffer();
      unpacked=new Uint8Array(buffer);
    }else throw Error('Compresión XLSX no admitida.');
    if(unpacked.length!==rawSize)throw Error('Excel dañado o comprimido incorrectamente.');
    result.set(name,decoder.decode(unpacked));
  }
  return result;
}
export async function readFirstSheet(file:File):Promise<string[][]>{
  if(file.size>3*1024*1024)throw Error('El Excel debe pesar menos de 3 MB.');
  const parts=await entries(await file.arrayBuffer());
  const source=parts.get('xl/worksheets/sheet1.xml');if(!source)throw Error('No se encontró la primera hoja de Excel.');
  const strings=parts.get('xl/sharedStrings.xml');
  const shared=strings?Array.from(xml(strings).getElementsByTagNameNS('*','si')).map(el=>el.textContent||''):[];
  const sheet=xml(source);const result:string[][]=[];
  const rows=Array.from(sheet.getElementsByTagNameNS('*','row'));
  if(rows.length>310)throw Error('Importa hasta 300 personas por archivo.');
  for(const row of rows){
    const cols:string[]=[];
    for(const c of Array.from(row.getElementsByTagNameNS('*','c'))){
      const addr=c.getAttribute('r')||'';const letter=addr.match(/^[A-Z]+/)?.[0]||'';
      let index=0;for(const char of letter)index=index*26+char.charCodeAt(0)-64;index--;
      if(index<0||index>40)continue;
      const kind=c.getAttribute('t');const v=c.getElementsByTagNameNS('*','v')[0]?.textContent||'';
      cols[index]=kind==='s'?(shared[Number(v)]||''):
        kind==='inlineStr'?(c.getElementsByTagNameNS('*','is')[0]?.textContent||''):v;
    }
    if(cols.some(v=>v?.trim()))result.push(Array.from({length:Math.max(9,cols.length)},(_,i)=>cols[i]||''));
  }
  return result;
}
