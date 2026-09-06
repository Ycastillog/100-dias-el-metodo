import test from 'node:test';
import assert from 'node:assert/strict';
import { AREA_ORDER } from './guided-tools.js';
import { reviewDays, systemSnapshot, formatSystemReport } from './system-tools.js';
import { validateRecord } from './participant-store.mjs';

const balance=Object.fromEntries(AREA_ORDER.map(key=>[key,'building']));
const profile={goal:'Organizar mi semana',evidence:'Mis intentos',firstStep:'Un paso',lifeArea:'mentalidad',minutes:10,energy:'steady'};
const tool={area:'profesional',first:'Una frase',second:'Mañana',third:'El título'};
test('tools follow the purchased range for both plans, including days after the first week',()=>{
  for(const day of [1,7,8,14])assert.ok(validateRecord('tool:'+day+':profesional',tool,14));
  for(const day of [15,30,60,100]){assert.equal(validateRecord('tool:'+day+':profesional',tool,14),null);assert.ok(validateRecord('tool:'+day+':profesional',tool,100));}
  for(const day of ['0','01','101','-1','NaN'])assert.equal(validateRecord('tool:'+day+':profesional',tool,100),null);
});
test('self assessments are optional for legacy profiles and strictly bounded when present',()=>{
  assert.ok(validateRecord('profile',profile,14));assert.ok(validateRecord('profile',{...profile,baseline:balance},14));
  for(const baseline of [null,[],{...balance,finanzas:42},{...balance,finanzas:'rich'},{...balance,extra:'attention'}])assert.equal(validateRecord('profile',{...profile,baseline},14),null);
});
test('weekly and milestone reviews do not unlock content beyond the bought plan',()=>{
  assert.deepEqual(reviewDays(14),[7,14]);assert.equal(reviewDays(100).length,17);
  const body={worked:'Un intento',difficult:'Poco tiempo',nextStep:'Reducir',balance};
  for(const day of [7,14])assert.ok(validateRecord('review:'+day,body,14));
  for(const day of [30,60,100]){assert.ok(validateRecord('review:'+day,body,100));assert.equal(validateRecord('review:'+day,body,14),null);}
  assert.equal(validateRecord('review:15',body,100),null);
});
test('recovery stores an intention without creating completed days',()=>{
  const recovery={obstacle:'Demasiado grande',action:'Una frase',when:'Mañana',day:14};
  assert.ok(validateRecord('recovery',recovery,14));assert.equal(validateRecord('recovery',{...recovery,day:15},14),null);assert.equal(validateRecord('recovery',{...recovery,action:''},14),null);assert.equal(validateRecord('recovery',{...recovery,order_id:'other'},14),null);
  const summary=systemSnapshot([{key:'recovery',body:recovery},{key:'tool:14:profesional',body:tool}],14);assert.equal(summary.recorded,0);assert.equal(summary.counts.complete,0);
});
test('the system report uses saved evidence, preserves missing data and excludes private access credentials',()=>{
  const rows=[{key:'profile',body:{...profile,baseline:balance}},{key:'tool:14:profesional',body:tool,updatedAt:'2026-09-05'},{key:'tool:2:profesional',body:{...tool,first:'Versión corregida'},updatedAt:'2026-09-06'},{key:'day:1',body:{state:'partial',action:'Intenté'}},{key:'day:2',body:{state:'missed',area:'profesional',action:'No empecé'}},{key:'day:100',body:{state:'complete',area:'profesional'}},{key:'review:14',body:{worked:'Un intento',difficult:'Tiempo',nextStep:'Una frase después del desayuno',balance:{...balance,profesional:'steady'}}}];
  const state=systemSnapshot(rows,14);assert.equal(state.areas.find(a=>a.key==='profesional').latest.body.first,'Versión corregida');assert.equal(state.areas.find(a=>a.key==='profesional').attempts,0);assert.equal(state.recorded,2);assert.equal(state.areas.find(a=>a.key==='profesional').current,'Bastante estable');
  const report=formatSystemReport({plan:{name:'Alpha',days:14},records:rows,access:{code:'PRIVATE_CODE'},contact_email:'PRIVATE_EMAIL'});
  assert.match(report,/Versión corregida/);assert.match(report,/Una frase después del desayuno/);assert.match(report,/Todavía no guardaste esta herramienta/);assert.doesNotMatch(report,/PRIVATE_CODE|PRIVATE_EMAIL|Día 100/);
  assert.equal(systemSnapshot([],100).areas[0].current,null);
});
