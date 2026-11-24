import test from 'node:test';
import assert from 'node:assert/strict';
import { parseStructure, moveInTree, snapshotOrder, youtubeId, isFuture, BLOCK_KINDS } from '../lib/course-modules/domain.ts';
import { resolveModuleRoute } from '../lib/course-modules/paths.ts';
import fs from 'node:fs';

const initial={course_id:27,modules:[
 {id:1,name:'Primero',order:0,lessons:[
   {id:4,name:'Lección A',order:0,blocks:[{id:12,block_type:'quiz',title:'Prueba',order:0,is_active:true,counts_toward_grade:true,date_available:null},
     {id:13,block_type:'survey',title:'Opiniones',order:1,is_active:true,counts_toward_grade:false,date_available:'2099-01-01T00:00:00Z'}]}]},
 {id:2,name:'Segundo',order:1,lessons:[{id:5,name:'Lección B',order:0,blocks:[]}]}]};

test('MOOC/MDT comparten los ocho recursos',()=>{
 assert.deepEqual(BLOCK_KINDS,['text','image','pdf','video','quiz','homework','survey','forum']);
});
test('La estructura valida curso y no acepta ids duplicados',()=>{
 const tree=parseStructure(initial,27);assert.equal(tree.modules.length,2);
 assert.throws(()=>parseStructure(initial,99));
 const malformed=structuredClone(initial);malformed.modules[1].lessons[0].id=4;
 assert.throws(()=>parseStructure(malformed,27),/duplicados/);
});
test('Reordenamiento puro de módulos y movimiento de lecciones entre módulos',()=>{
 const tree=parseStructure(initial,27);
 const shifted=moveInTree(tree,'module',2,null,0);
 assert.deepEqual(shifted.modules.map(x=>x.id),[2,1]);
 const moved=moveInTree(shifted,'lesson',4,2,1);
 assert.deepEqual(moved.modules[0].lessons.map(x=>x.id),[5,4]);
 assert.equal(tree.modules[0].lessons[0].id,4,'No mutar estructura original');
 const order=snapshotOrder(moved);assert.deepEqual(order.modules[0].lessons[1].blocks,[12,13]);
});
test('Reordenamiento permite mover LessonBlock entre lecciones del mismo curso',()=>{
 const tree=parseStructure(initial,27);
 const moved=moveInTree(tree,'block',13,5,0);
 assert.deepEqual(moved.modules[0].lessons[0].blocks.map(x=>x.id),[12]);
 assert.deepEqual(moved.modules[1].lessons[0].blocks.map(x=>x.id),[13]);
 assert.equal(moveInTree(tree,'block',12,999,0),tree);
});
test('Fecha futura y validación estricta del proveedor YouTube',()=>{
 assert.equal(isFuture('2099-01-01T00:00:00Z',Date.UTC(2026,0)),true);
 assert.equal(isFuture('2020-01-01T00:00:00Z',Date.UTC(2026,0)),false);
 assert.equal(youtubeId('https://youtu.be/abcdefghijk'),'abcdefghijk');
 assert.equal(youtubeId('https://www.youtube.com/watch?v=abcdefghijk'),'abcdefghijk');
 assert.equal(youtubeId('https://evil.com/watch?v=abcdefghijk'),null);
 assert.equal(youtubeId('http://youtube.com/watch?v=abcdefghijk'),null);
});
test('BFF: rutas permitidas con método estricto y sin inyección de paths',()=>{
 assert.equal(resolveModuleRoute(['order'],'PUT',27)?.path,'/api/v1/academic-modules/27/structure/order');
 assert.equal(resolveModuleRoute(['assisted','quiz','blocks','12','enrollments','88','start'],'POST',27)?.path,
 '/api/v1/academic-assisted/quiz/blocks/12/enrollments/88/start');
 assert.equal(resolveModuleRoute(['blocks','12','file'],'GET',27)?.path,'/api/v1/media/lesson-blocks/12/file');
 assert.equal(resolveModuleRoute(['blocks','12','file'],'DELETE',27),null);
 assert.equal(resolveModuleRoute(['blocks','../../77'],'GET',27),null);
 assert.equal(resolveModuleRoute(['foo','bar'],'GET',27),null);
});
test('Seguridad estructural del BFF: permiso ADMIN/TEACHER y cookie, sin JWT en cliente',()=>{
 const route=fs.readFileSync(new URL('../app/api/course-modules/[id]/[...resource]/route.ts',import.meta.url),'utf8');
 assert.match(route,/getCourseWorkspace\(id\)/);
 assert.match(route,/SESSION_COOKIE/);
 assert.match(route,/session\.workspace\.role==='STUDENT'/);
 assert.match(route,/resolveModuleRoute/);
 assert.match(route,/mutation\(request/);
 assert.match(route,/LIMIT_MULTIPART/);
 const client=fs.readFileSync(new URL('../lib/course-modules/client.ts',import.meta.url),'utf8');
 assert.doesNotMatch(client,/localStorage|Bearer|Authorization/);
});

test('Revisión docente usa participantes del curso, no matrículas propias del TEACHER',()=>{
 assert.equal(resolveModuleRoute(['participants','teachers'],'GET',27)?.path,
  '/api/v1/academic-assisted/courses/27/teachers');
 const bff=fs.readFileSync(new URL('../app/api/course-modules/[id]/[...resource]/route.ts',import.meta.url),'utf8');
 assert.match(bff,/academic-assisted\/courses\/\$\{ctx\.courseId\}\/teachers/);
 assert.doesNotMatch(bff,/\/api\/v1\/enrollments\/me/);
 assert.match(bff,/encodeURIComponent\(search\)/);
});
