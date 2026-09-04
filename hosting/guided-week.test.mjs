import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dayGuide, audioResponse } from './guided-week.mjs';
import { AREAS } from './guided-tools.js';
const week=JSON.parse(await readFile(new URL('guided-week.json',import.meta.url),'utf8'));

test('seven real guides offer five area variants and dose-aware single activities',()=>{
  assert.equal(week.days.length,7);
  for(let day=1;day<=7;day++)for(const area of Object.keys(AREAS))for(const minutes of [2,10,20]){
    const result=dayGuide({week},day,{areas:['finanzas','relaciones'],minutes},area);
    assert.equal(result.area,area);assert.ok(result.guide.explanation);assert.ok(result.guide.example);
    assert.ok(result.guide.task);assert.ok(result.guide.activity);assert.doesNotMatch(result.guide.activity,/Define \(|Registra \(/);
    assert.equal(result.guide.audio,null);
    if(day===7)assert.match(result.guide.task,/todas las áreas/);
  }
});
test('selection rotates multiple areas, overrides stay explicit, original later days have no new guide',()=>{
  const program={week};const profile={areas:['finanzas','relaciones']};
  assert.equal(dayGuide(program,1,profile).area,'finanzas');
  assert.equal(dayGuide(program,2,profile).area,'relaciones');
  assert.equal(dayGuide(program,3,profile).area,'finanzas');
  assert.equal(dayGuide(program,1,profile,'bienestar').area,'bienestar');
  assert.equal(dayGuide(program,1,profile,'__proto__'),null);
  for(const d of [8,14,100])assert.equal(dayGuide(program,d,profile).guide,null);
});
test('authenticated media helper returns exact ranges and refuses invalid or multi-ranges',async()=>{
  const media={data:Buffer.from('0123456789').toString('base64')};
  const call=range=>audioResponse(new Request('https://example.com/api/participant/media?day=1',{headers:range?{range}:{}}),media);
  const full=call();assert.equal(full.status,200);assert.equal(full.headers.get('content-type'),'audio/mpeg');assert.equal(await full.text(),'0123456789');assert.equal(full.headers.get('cache-control'),'private, no-store');
  for(const [range,expected] of [['bytes=2-4','234'],['bytes=8-','89'],['bytes=-3','789'],['bytes=8-100','89']]){const res=call(range);assert.equal(res.status,206);assert.equal(await res.text(),expected);assert.equal(Number(res.headers.get('content-length')),expected.length);}
  for(const range of ['bytes=10-','bytes=-0','bytes=4-2','bytes=0-1,3-4','bytes=-','items=1-2'])assert.equal(call(range).status,416);
});
