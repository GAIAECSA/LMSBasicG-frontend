import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {
  parseCertificateTypeRules, currentMdtCertificateSettings, nextCertificateTypeIds,
  parseMdtCertificateSettings,
} from '../lib/course-workspace/certificate-settings.ts';

const root=path.join(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=(p)=>fs.readFileSync(path.join(root,p),'utf8');
// IDs intencionalmente diferentes de los del seed para probar ausencia de IDs mágicos.
const rawType={id:42,code:'MDT',certificate_rules:[
  {id:11,required:true,default_active:true,certificate_type:{id:91,code:'MDT',name:'Ministerio'}},
  {id:12,required:false,default_active:false,certificate_type:{id:73,code:'INSTITUTIONAL',name:'Institucional'}},
  {id:13,required:false,default_active:false,certificate_type:{id:35,code:'AUTOMATIC',name:'Automático'}},
]};
const rules=parseCertificateTypeRules(rawType,42);
const course=(caps)=>({id:27,course_type:{id:42,code:'MDT'},certificate_types:caps});
const cap=(id,code,active=true)=>({id:100+id,is_active:active,certificate_type:{id,code,name:code}});

test('las reglas permitidas se obtienen del backend y se validan',()=>{
  assert.ok(rules);assert.equal(rules.length,3);
  assert.equal(parseCertificateTypeRules({...rawType,code:'MOOC'},42),null);
  assert.equal(parseCertificateTypeRules({...rawType,id:9},42),null);
  assert.equal(parseCertificateTypeRules({...rawType,certificate_rules:[rawType.certificate_rules[0],rawType.certificate_rules[0]]},42),null);
});
test('activar institucional desde un curso sin fila previa conserva MDT',()=>{
  const current=course([cap(91,'MDT')]);
  assert.deepEqual(nextCertificateTypeIds(current,rules,true),[73,91]);
  assert.deepEqual(nextCertificateTypeIds(current,rules,false),[91]);
  const state=currentMdtCertificateSettings(current,rules);
  assert.deepEqual(state,{course_id:27,course_type:'MDT',ministerial_enabled:true,institutional_allowed:true,institutional_enabled:false});
});
test('al deshabilitar institucional no se pierde AUTOMATIC ni otras opciones habilitadas',()=>{
  const current=course([cap(91,'MDT'),cap(73,'INSTITUTIONAL'),cap(35,'AUTOMATIC')]);
  assert.deepEqual(nextCertificateTypeIds(current,rules,false),[35,91]);
  assert.deepEqual(nextCertificateTypeIds(current,rules,true),[35,73,91]);
  assert.equal(currentMdtCertificateSettings(current,rules).institutional_enabled,true);
});
test('MOOC nunca admite actualización institucional y se valida la respuesta BFF',()=>{
  const mooc={...course([cap(91,'MDT')]),course_type:{id:5,code:'MOOC'}};
  assert.throws(()=>nextCertificateTypeIds(mooc,rules,true),/MDT/);
  assert.equal(parseMdtCertificateSettings({course_id:27,course_type:'MDT',ministerial_enabled:true,institutional_allowed:true,institutional_enabled:false},27)?.institutional_enabled,false);
  assert.equal(parseMdtCertificateSettings({course_id:44,course_type:'MDT',ministerial_enabled:true,institutional_allowed:true,institutional_enabled:false},27),null);
});
test('BFF exige ADMIN, mismo origen, contrato booleano y no admite otro tenant',()=>{
  const source=read('app/api/academic/courses/[id]/certificate-types/route.ts');
  assert.match(source,/authorize\(request\)/);
  assert.match(source,/mutation\(request\)/);
  assert.match(source,/certificate_type_ids/);
  assert.match(source,/course\.course_type\.code !== 'MDT'/);
  assert.match(source,/typeof input\.value\.institutional_enabled !== 'boolean'/);
  assert.match(source,/api\/v1\/courses\/\$\{id\}\/certificate-types/);
  assert.doesNotMatch(source,/business_id=|NEXT_PUBLIC_BACKEND|export async function DELETE/);
});
test('interfaz de configuraciones aparece solo en MDT y reutiliza gestor externo existente',()=>{
  const settings=read('components/campus/admin-course-detail.tsx');
  const certs=read('components/campus/course-certificates.tsx');
  const roster=read('components/campus/certificate-mdt-overview.tsx');
  assert.match(settings,/course\.course_type\.code==='MDT'&&<CourseCertificateSettings/);
  assert.match(certs,/institutional&&tab==='overview'/);
  assert.match(certs,/CertificateExternalManager/);
  assert.match(roster,/certificate_type: code/);
  assert.match(roster,/parseRoster/);
  assert.match(roster,/enrollment_id/);
  assert.match(roster,/CertificatePdfViewer/);
  assert.match(roster,/Historial/);
  assert.doesNotMatch(roster,/business_id/);
});
