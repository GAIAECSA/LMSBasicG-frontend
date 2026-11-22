import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=readFileSync(path.join(root,'components/campus/course-certificates.tsx'),'utf8');
test('Las pestañas de certificados tienen el mismo tipo de ID que el estado',()=>{
  assert.match(source,/type CertificateTab='design'\|'automatic'\|'MDT'\|'INSTITUTIONAL'/);
  assert.match(source,/const tabs:\s*CertificateTabItem\[\]\s*=\s*\[\]/);
  assert.match(source,/useState<CertificateTab>/);
  assert.match(source,/tabs\.push\(\{id:'MDT'/);
  assert.match(source,/tabs\.push\(\{id:'INSTITUTIONAL'/);
  assert.doesNotMatch(source,/\.\.\.\s*\(\s*institutional/);
  assert.match(source,/onClick=\{\(\)=>setTab\(item\.id\)\}/);
  assert.doesNotMatch(source,/setTab\(item\.id as any\)/);
});
