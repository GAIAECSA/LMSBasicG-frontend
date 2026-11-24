/** Reglas de representación: datos oficiales resueltos exclusivamente por FastAPI. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.join(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=(file)=>fs.readFileSync(path.join(root,file),'utf8');

test('editor mantiene campos y coordenadas; no inventa fechas oficiales en el lienzo',()=>{
  const editor=source('components/campus/certificate-template-editor.tsx');
  assert.match(editor,/course_start_date:'FECHA DE INICIO'/);
  assert.match(editor,/course_end_date:'FECHA DE FIN'/);
  assert.match(editor,/instructor_name:'DOCENTE DEL CURSO'/);
  assert.match(editor,/Inicio: curso o matrícula/);
  assert.match(editor,/Fin: curso o emisión/);
  assert.match(editor,/Matrícula STUDENT aceptada para prueba/);
  assert.match(editor,/primer docente/);
  assert.doesNotMatch(editor,/course_start_date:'2026-01-01'|course_end_date:'2026-04-30'/);
  assert.match(editor,/CERT_PAGE_WIDTH\*scale/);
  assert.match(editor,/CERT_PAGE_HEIGHT\*scale/);
});

test('vista previa sigue usando FastAPI y matrícula seleccionada sin generar emisión',()=>{
  const editor=source('components/campus/certificate-template-editor.tsx');
  assert.match(editor,/form\.append\('enrollment_id',enrollmentId\.trim\(\)\)/);
  assert.match(editor,/template\/preview/);
  assert.match(editor,/method:'POST',body:data\(\)/);
  assert.doesNotMatch(editor,/\/generate|\bDate\.now\(|new Date\(/);
});
