import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parseVisitorEnrollments, visibleAcceptedEnrollments } from '../lib/visitor/types.ts';

const base = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(join(base, relative), 'utf8');

const enrollment = (id, courseId, status = 'ACEPTADO', role = 'STUDENT', published = true, open = false) => ({
  id, status,
  user: { id: 25 },
  course: { id: courseId, name: `Curso ${courseId}`, is_published: published, open_enrollment: open },
  role: { id: 8, code: role, scope: 'COURSE' },
  progress_percent: null,
  completed_blocks: null,
  total_active_blocks: null,
});
const withProgress = (item, percentage, completed, total) => ({
  ...item,
  progress_percent: percentage,
  completed_blocks: completed,
  total_active_blocks: total,
});
const course = (id) => ({
  id, name: `Curso ${id}`, description: 'Ejemplo', level: 'PRINCIPIANTE', image_url: null,
});

test('validar matrícula propia, scope COURSE y estados españoles', () => {
  const parsed = parseVisitorEnrollments([
    enrollment(1, 7, 'ACEPTADO', 'TEACHER'), enrollment(2, 8, 'PENDIENTE'),
  ], 25);
  assert.equal(parsed.length, 2);
  assert.equal(parsed[0].role.code, 'TEACHER');
  assert.equal(parsed[0].progress_percent, null);
  assert.equal(parseVisitorEnrollments([enrollment(1, 7)], 24), null);
  assert.equal(parseVisitorEnrollments([{ ...enrollment(1, 7), role: { code: 'ADMIN', scope: 'PLATFORM' } }], 25), null);
  assert.equal(parseVisitorEnrollments([{ ...enrollment(1, 7), status: 'accepted' }], 25), null);
});

test('solo matrículas ACEPTADO y publicadas en el tenant, sin filtrar open_enrollment', () => {
  const parsed = parseVisitorEnrollments([
    withProgress(enrollment(1, 7, 'ACEPTADO', 'STUDENT', true, false), 67, 2, 3),
    enrollment(2, 8, 'ACEPTADO', 'TEACHER', false, true),
    enrollment(3, 9, 'PENDIENTE', 'STUDENT', true, true),
    enrollment(4, 10, 'ACEPTADO', 'STUDENT', true, true),
  ], 25);
  const result = visibleAcceptedEnrollments(parsed, [course(7), course(8), course(9)]);
  assert.deepEqual(result.map(row => row.course.id), [7]);
  assert.equal(result[0].enrollment.role.code, 'STUDENT');
  assert.equal(result[0].enrollment.progress_percent, 67);
});

test('conserva del backend 0%, 67%, 100% y null sin calcular bloques en el frontend', () => {
  const parsed = parseVisitorEnrollments([
    withProgress(enrollment(1, 7), 0, 0, 5),
    withProgress(enrollment(2, 8), 67, 2, 3),
    withProgress(enrollment(3, 9), 100, 3, 3),
    withProgress(enrollment(4, 10), null, 0, 0),
    enrollment(5, 11, 'ACEPTADO', 'TEACHER'),
    enrollment(6, 12, 'PENDIENTE'),
  ], 25);
  assert.deepEqual(parsed.map(item => item.progress_percent), [0, 67, 100, null, null, null]);
  assert.deepEqual(parsed.map(item => item.total_active_blocks), [5, 3, 3, 0, null, null]);
});

test('rechaza progreso faltante, fuera de rango o inconsistentemente nulo', () => {
  const baseEnrollment = enrollment(1, 7);
  const { progress_percent: unused, ...withoutProgress } = baseEnrollment;
  assert.equal(parseVisitorEnrollments([withoutProgress], 25), null);
  assert.equal(parseVisitorEnrollments([withProgress(baseEnrollment, '67', 2, 3)], 25), null);
  assert.equal(parseVisitorEnrollments([withProgress(baseEnrollment, -1, 2, 3)], 25), null);
  assert.equal(parseVisitorEnrollments([withProgress(baseEnrollment, 101, 2, 3)], 25), null);
  assert.equal(parseVisitorEnrollments([withProgress(baseEnrollment, 60.5, 2, 3)], 25), null);
  assert.equal(parseVisitorEnrollments([withProgress(baseEnrollment, 0, 0, 0)], 25), null);
  assert.equal(parseVisitorEnrollments([withProgress(baseEnrollment, null, 1, 3)], 25), null);
  assert.equal(parseVisitorEnrollments([withProgress(baseEnrollment, 80, 4, 3)], 25), null);
  assert.equal(parseVisitorEnrollments([withProgress(baseEnrollment, 70, null, 3)], 25), null);
});

test('VISITOR redirige /campus, no ve Inicio y conserva políticas', () => {
  const page = read('app/campus/page.tsx');
  const nav = read('components/campus/campus-shell.tsx');
  assert.match(page, /redirect\("\/campus\/my-courses"\)/);
  assert.match(nav, /\{!visitor && <Link href="\/campus"/);
  assert.match(nav, /href="\/campus\/my-courses"/);
  assert.match(nav, /href="\/campus\/catalog"/);
  assert.match(nav, /href="\/campus\/certificates"/);
  assert.match(nav, /href="\/campus\/policies"/);
});

test('rutas VISITOR conservan authState, rol y políticas; SSR obtiene progreso ya agregado', () => {
  for (const route of ['my-courses', 'catalog', 'certificates']) {
    const file = read(`app/campus/${route}/page.tsx`);
    assert.match(file, /authState\(tenant\)/);
    assert.match(file, /redirect\("\/policies"\)/);
    assert.match(file, /role\.code\s*!==\s*"VISITOR"/);
  }
  const loader = read('lib/visitor/data.ts');
  assert.match(loader, /getTenantPublicCourses\(domain\)/);
  assert.match(loader, /\/api\/v1\/enrollments\/me/);
  assert.match(loader, /enrollment\.progress_percent/);
  assert.doesNotMatch(loader, /\/api\/v1\/(?:blocks-progress|modules|lessons|lesson-blocks|lesson-block-types)/);
  assert.doesNotMatch(loader, /\/api\/v1\/courses(?!\/public)/);
  assert.doesNotMatch(loader, /studentBlockPercentage|percentageFromBlocks/);
});

test('catálogo informativo separado del aula STUDENT habilitada', () => {
  const catalog = read('components/campus/visitor-catalog.tsx');
  const mine = read('components/campus/visitor-my-courses.tsx');
  assert.doesNotMatch(catalog, /href="\/campus\/courses\//);
  assert.doesNotMatch(catalog, /\/enrollments\/request/);
  assert.doesNotMatch(mine, /Aula próximamente/);
  assert.match(mine, /Continuar aprendiendo/);
  assert.match(read('app/globals.css'), /\.visitor-catalog-grid/);
  assert.match(read('docs/DISENO_Y_BRANDING.md'), /Única fuente institucional/);
});
