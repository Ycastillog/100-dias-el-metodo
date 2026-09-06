import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { programModule } from './program-source.mjs';
import { dayGuide } from './guided-week.mjs';
import { AREAS } from './guided-tools.js';
import { formatSystemReport, reviewDays } from './system-tools.js';
import { loadSalesAssets } from './sales-assets.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const context={};
vm.runInNewContext((await programModule(root)).replace('export default ','this.program = '),context);
const program=context.program;

test('100 authored written practices carry distinct explanations, tasks, evidence and reduced options',()=>{
  assert.equal(program.curriculum.length,100);
  for(const key of ['explanation','action','evidence','smaller']){
    assert.equal(new Set(program.curriculum.map(row=>row[key])).size,100,key);
    assert.ok(program.curriculum.every(row=>typeof row[key]==='string' && row[key].trim().length>=25),key);
  }
  program.curriculum.forEach((row,i)=>assert.equal(row.day,i+1));
});

test('every purchased day and supported area/duration receives guidance without inventing later audio',()=>{
  for(let day=1;day<=100;day++)for(const area of Object.keys(AREAS))for(const minutes of [2,10,20]){
    const {guide}=dayGuide(program,day,{minutes,energy:'steady'},area);
    for(const key of ['explanation','task','activity','reflection','evidence','smaller','example','bridge','safety'])assert.ok(guide[key]?.length>15,`${day}/${area}/${minutes}: ${key}`);
    if(day<=7){assert.equal(guide.audio,'/api/participant/media?day='+day);assert.equal(guide.task,program.week.days[day-1].areas[area].action);assert.equal(guide.explanation,program.week.days[day-1].explanation);assert.ok(guide.transcript);}
    else{assert.equal(guide.audio,null);assert.equal(guide.video,null);assert.equal(guide.transcript,'');assert.equal(guide.explanation,program.curriculum[day-1].explanation);if(minutes===2)assert.equal(guide.activity,guide.smaller);}
  }
  const soft=dayGuide(program,79,{minutes:20,energy:'low'},'finanzas').guide;
  assert.equal(soft.activity,soft.smaller);
  assert.equal(dayGuide(program,101,{},'mentalidad').guide,null);
  assert.equal(dayGuide(program,10,{},'constructor'),null);
});

test('curriculum only references real review milestones and offers autonomous continuation',()=>{
  for(const row of program.curriculum)for(const match of row.action.matchAll(/revisión del día (\d+)/g))assert.ok(reviewDays(100).includes(Number(match[1])));
  assert.match(program.curriculum[99].action,/Descarga tu informe y tu diario antes de que venza el acceso/);
  const report=formatSystemReport({plan:{days:100},records:[]},'2026-09-06');
  assert.match(report,/CÓMO USAR ESTE INFORME/);assert.match(report,/no resultados ni decisiones registradas por ti/);assert.match(report,/Todavía no definida/);assert.match(report,/sin|no necesitas|No necesitas/);
});

test('member flow prioritizes practice and examples never prefill participant evidence',async()=>{
  const html=await readFile(new URL('participant.html',import.meta.url),'utf8');
  assert.ok(html.indexOf('<section id="day-section"')<html.indexOf('<section class="system-workspace"'));
  for(const id of ['guide-context','guide-evidence','guide-smaller','review-coaching'])assert.equal([...html.matchAll(new RegExp('id="'+id+'"','g'))].length,1);
  assert.match(html,/Ejemplo ilustrativo/);
  assert.doesNotMatch(html,/id="guide-task"/);
  const assets=await loadSalesAssets(root);
  const privateText=program.curriculum[89].explanation;
  for(const [path,asset] of Object.entries(assets)){assert.doesNotMatch(path,/curriculum/);assert.ok(!asset.data.includes(privateText),path);}
});
