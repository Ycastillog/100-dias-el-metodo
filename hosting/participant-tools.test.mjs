import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { programModule } from './program-source.mjs';
import { practiceSequence, journeyMap, formatJournalExport } from './participant-tools.js';
import { loadSalesAssets } from './sales-assets.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const context={};
vm.runInNewContext((await programModule(root)).replace('export default ', 'this.program = '),context);

test('all 100 paid lessons have a concrete objective and three timed steps for each supported duration',()=>{
  assert.equal(context.program.lessons.length,100);
  assert.equal(new Set(context.program.lessons.map(day=>day.theme)).size,100);
  for(const lesson of context.program.lessons) for(const minutes of [2,10,20]){
    const guide=practiceSequence(lesson,minutes);
    assert.equal(guide.minutes,minutes);assert.ok(guide.objective.length>20);assert.equal(guide.steps.length,3);
    assert.ok(guide.steps.every(step=>step.time && step.title && step.text));
    assert.equal(guide.objective,lesson.action || lesson.task);
  }
  assert.equal(practiceSequence({task:'Fallback'},'invalid').minutes,10);
});
test('roadmap shows only the purchased range',()=>{
  assert.deepEqual(journeyMap(14).map(p=>[p.from,p.to]),[[1,14]]);
  assert.deepEqual(journeyMap(100).map(p=>[p.from,p.to]),[[1,30],[31,60],[61,100]]);
});
test('readable journal preserves Spanish, sorts days, includes reviews, excludes receipt and recovery code',()=>{
  const text=formatJournalExport({plan:{name:'El Método'},access:{code:'NEVER_INCLUDE'},records:[
    {key:'day:10',body:{state:'missed',action:'Descansé',nextStep:'Revisar mañana'},updatedAt:'2026-09-03'},
    {key:'profile',body:{goal:'Leer sin prisas',firstStep:'Abrir el libro',minutes:2}},
    {key:'day:2',body:{state:'partial',action:'Leí una página',notes:'Una idea útil'},updatedAt:'2026-09-02'},
    {key:'review:7',body:{worked:'Empecé',difficult:'Prisas',nextStep:'Reducir'}},
  ]},'2026-09-03');
  assert.ok(text.indexOf('DÍA 2')<text.indexOf('DÍA 10'));assert.match(text,/Leí una página/);assert.match(text,/REVISIÓN DEL DÍA 7/);assert.match(text,/Sin avance/);assert.doesNotMatch(text,/NEVER_INCLUDE/);
});
test('participant module helpers are served and private program sources remain excluded',async()=>{
  const assets=await loadSalesAssets(root);
  assert.match(assets['/mi-metodo'].data, /type="module" src="\/assets\/participant.js"/);
  for(const id of ['start-priority','start-record','practice-steps','journey-map','export-backup']) assert.ok(assets['/mi-metodo'].data.includes('id="'+id+'"'));
  assert.match(assets['/assets/participant-tools.js'].type,/javascript/);
  assert.ok(!assets['/assets/app.js']);assert.ok(!assets['/assets/life-program.js']);
  assert.match(assets['/'].data,/https:\/\/www.tiktok.com\/@100diaselmetodo/);
});
