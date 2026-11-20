import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname,resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseTransition } from '../lib/academic/types.ts';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const file=path=>readFileSync(resolve(root,path),'utf8');

const type=(id,code)=>({id,code,name:code,description:null});
const items=[];
const preview={
  course_id:1,current_type:type(1,'MDT'),target_type:type(2,'MOOC'),
  blocks_to_create:items,blocks_to_reactivate:items,blocks_to_deactivate:[
    {id:3,code:'ATTENDANCE',name:'Asistencia',has_existing_data:true},
  ],blocks_to_preserve:items,certificate_types_to_create:items,
  certificate_types_to_reactivate:items,certificate_types_to_deactivate:items,
  manual_blocks_untouched:3,automatic_certificates_to_provision:0,
  existing_automatic_certificates_untouched:4,attendance_rows_to_provision:0,
  data_will_be_deleted:false,
};

test('los planes de transición aceptan datos históricos y no presuponen que borran información',()=>{
  const result=parseTransition(preview);
  assert.ok(result);
  assert.equal(result.current_type.code,'MDT');
  assert.equal(result.target_type.code,'MOOC');
  assert.equal(result.blocks_to_deactivate[0].has_existing_data,true);
  assert.equal(result.manual_blocks_untouched,3);
  assert.equal(result.data_will_be_deleted,false);
});

test('el sidebar tiene desplazamiento independiente y mantiene marca/cuenta visibles',()=>{
  const css=file('app/globals.css');
  assert.match(css,/\.lms-sidebar\s*\{overflow:hidden;min-height:0;height:100vh;height:100dvh\}/);
  assert.match(css,/\.lms-sidebar \.lms-menu\{[^}]*flex:1 1 auto;min-height:0;overflow-x:hidden;overflow-y:auto;/);
  assert.match(css,/\.lms-sidebar \.lms-sidebar-bottom\{flex:0 0 auto;margin-top:0\}/);
  assert.match(css,/\.lms-sidebar-course \.lms-nav-item\{min-height:39px/);
  assert.match(css,/@media\(max-height:650px\)/);
  const shell=file('components/campus/campus-shell.tsx');
  assert.match(shell,/lms-sidebar-course/);
  assert.match(shell,/tabIndex=\{courseWorkspace\?0:undefined\}/);
  assert.match(shell,/menu\.scrollTop/);
  assert.match(css,/\.lms-sidebar \.lms-menu:focus-visible\{outline:2px solid var\(--tenant-on-primary\)/);
});

test('conversión independiente del PATCH: previsualización, licencia y confirmación explícita',()=>{
  const card=file('components/campus/course-type-transition.tsx');
  const editor=file('components/campus/admin-course-detail.tsx');
  const proxy=file('app/api/academic/courses/[id]/type-change/route.ts');
  assert.match(card,/\/api\/academic\/course-types/);
  assert.match(card,/allowed\.includes\(type\.code\)/);
  assert.match(card,/\/type-preview/);
  assert.match(card,/\/type-change/);
  assert.match(card,/postJson\(\{course_type_id:target\.id,confirm:true\}\)/);
  assert.match(card,/!plan\.data_will_be_deleted/);
  assert.match(card,/locked\|\|!confirmed/);
  assert.match(card,/unsaved/);
  assert.match(card,/parseTransition\(response\)/);
  assert.match(card,/parseCourse\(result\)/);
  assert.match(editor,/<CourseTypeTransitionCard/);
  assert.match(editor,/key=\{course\.course_type_id\}/);
  assert.match(editor,/router\.refresh\(\)/);
  assert.match(proxy,/payload\.confirm!==true/);
  const general=file('lib/course-workspace/editor.ts');
  assert.match(general,/course_type_id y grade_calculation_method NO son campos de CourseUpdate/);
});

test('el curso MDT/MOOC actualizado no altera menú ni permisos actuales',()=>{
  const nav=file('lib/course-workspace/navigation.ts');
  assert.match(nav,/code==='MDT'/);
  assert.match(nav,/adminOnly:true/);
  const route=file('app/campus/courses/[id]/[section]/page.tsx');
  assert.match(route,/mayOpenSection/);
  assert.match(route,/ws.role!=='ADMIN'/);
});
