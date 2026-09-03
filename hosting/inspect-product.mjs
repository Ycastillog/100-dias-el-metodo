// Local, read-only product inventory. Never contacts PayPal or reads customers.
import { programModule } from './program-source.mjs';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const root=fileURLToPath(new URL('../',import.meta.url));
const context={};
vm.runInNewContext((await programModule(root)).replace('export default ', 'this.program = '),context);
const program=context.program;
assert.equal(program.lessons.length,100);
const report={
  program:'100 Días — El Método',
  checkedAt:new Date().toISOString(),
  sourceVersion:program.version,
  lessons:program.lessons.length,
  uniqueThemes:new Set(program.lessons.map(day=>day.theme)).size,
  phases:Object.fromEntries(['Control','Fortaleza','Direccion'].map(phase=>[phase,program.lessons.filter(day=>day.phase===phase).length])),
  optionalThirdPartyResources:program.resources.length,
  alpha:{priceUSD:9,accessDays:14,lessonDays:[1,14],reviewDays:[7,14],billing:'one_time'},
  metodo:{priceUSD:29,accessDays:100,lessonDays:[1,100],reviewDays:[7,14,21,28,35,42,49,56,63,70,77,84,91,98,100],billing:'one_time'},
  ownAdditionalBooks:0,
  personalSessions:false,
  higherPlansForSale:false,
  boundaries:'Inventory is structural, not a claim of guaranteed results or independent educational certification.',
};
for(const day of program.lessons){
  for(const field of ['theme','principle','question','action','task','companion']) assert.ok(day[field],`day ${day.day}: ${field}`);
  for(const minutes of [2,10,20]) assert.equal(program.getLifeProgram(day.day,{minutes}).dose.minutes,minutes);
}
console.log(JSON.stringify(report,null,2));
