import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import * as systemTools from './system-tools.js';
import * as guidedTools from './guided-tools.js';
import * as wisdomTools from './practice-wisdom.js';
import * as participantTools from './participant-tools.js';

const source=await readFile(new URL('participant.js',import.meta.url),'utf8');
// Run the real event handlers with a small in-memory form adapter. No browser,
// production account, network connection, or actual purchase is involved.
function harness(){
  const nodes=new Map();
  const make=()=>({value:'',textContent:'',hidden:false,disabled:false,dataset:{},children:[],fields:[],handlers:{},
    append(...items){this.children.push(...items);},replaceChildren(...items){this.children=items;},setAttribute(){},removeAttribute(){},pause(){},reset(){for(const f of this.fields)f.value='';},reportValidity(){return true;},
    addEventListener(name,handler){this.handlers[name]=handler;},querySelector(selector){this.parts??=new Map();if(!this.parts.has(selector))this.parts.set(selector,make());return this.parts.get(selector);},querySelectorAll(){return this.fields;}});
  const get=key=>{if(!nodes.has(key))nodes.set(key,make());return nodes.get(key);};
  const form=(id,fields)=>{const node=get(id);node.fields=fields.map(name=>({name,value:'',disabled:false}));node.elements={namedItem:name=>node.fields.find(f=>f.name===name)};return node;};
  form('#journal-form',['action','state','notes','obstacle','nextStep']);form('#tool-form',['first','second','third']);form('#review-form',['worked','difficult','nextStep']);form('#profile-form',['goal','minutes','energy']);
  class FormAdapter {constructor(node){this.entries=node.fields.filter(f=>!f.disabled && f.checked!==false).map(f=>[f.name,f.value]);}[Symbol.iterator](){return this.entries[Symbol.iterator]();}getAll(key){return this.entries.filter(([k])=>k===key).map(([,v])=>v);}}
  const context={...participantTools,...systemTools,...guidedTools,...wisdomTools,document:{querySelector:get,querySelectorAll:()=>[],createElement:make},window:{addEventListener(){},confirm:()=>true},FormData:FormAdapter,fetch:async()=>{throw new Error('No fake response set');},location:{},console,URL,Blob,setTimeout,clearTimeout};
  vm.createContext(context);
  const instrumented=source.replace(/^import .*;\r?\n/gm,'').replace(/  start\(\);\r?\n\}\)\(\);/,`  globalThis.subject={api,save,renderReview,renderDay,records,renderTool,setArea:value=>{displayedArea=value;},setSession:value=>{session=value;},invalidate:()=>{sessionGeneration++;},setDayData:value=>{dayData=value;},review:()=>renderedReview}; renderHistory=()=>{};\n})();`);
  vm.runInContext(instrumented,context);
  context.subject.setSession({plan:{days:14}});
  return {get,context,subject:context.subject};
}
test('cancelling review navigation restores the rendered review and saves to its original key',async()=>{
  const h=harness(),select=h.get('#review-select'),form=h.get('#review-form');
  h.subject.records.set('review:7',{key:'review:7',body:{worked:'First week',difficult:'x',nextStep:'a'}});
  h.subject.records.set('review:14',{key:'review:14',body:{worked:'Second week',difficult:'y',nextStep:'b'}});
  select.value='7';h.subject.renderReview();select.value='14';select.handlers.change();
  form.dataset.dirty='true';h.context.window.confirm=()=>false;select.value='7';select.handlers.change();
  assert.equal(select.value,'14');assert.equal(h.subject.review(),'14');assert.equal(form.elements.namedItem('worked').value,'Second week');
  let sent;h.context.fetch=async(_,options)=>{sent=JSON.parse(options.body);return {ok:true,json:async()=>({record:{key:sent.key,body:sent.body,revision:1,updatedAt:new Date().toISOString()}})};};
  await form.handlers.submit({preventDefault(){},currentTarget:form});assert.equal(sent.key,'review:14');
});
test('day loading locks practice fields and unlocks the previous draft after failure',async()=>{
  const h=harness();h.subject.setDayData({old:true});let reject;
  h.context.fetch=()=>new Promise((_,no)=>{reject=no;});
  const pending=h.subject.renderDay(2);
  for(const id of ['#journal-form','#tool-form','#profile-form'])assert.ok(h.get(id).fields.every(field=>field.disabled));
  reject(new Error('Connection interrupted'));await pending;
  for(const id of ['#journal-form','#tool-form','#profile-form'])assert.ok(h.get(id).fields.every(field=>!field.disabled));
  assert.match(h.get('#member-status').textContent,/Connection interrupted/);
});
test('late responses cannot cross a change of purchase session',async()=>{
  const h=harness();let finish;h.context.fetch=()=>new Promise(resolve=>{finish=resolve;});
  const pending=h.subject.api('session');h.subject.invalidate();finish({ok:true,json:async()=>({records:['old purchase']})});
  await assert.rejects(pending,/sesión cambió/);
});
test('changing one of several checked areas during save keeps the new draft dirty',async()=>{
  const h=harness(),form=h.get('#profile-form');form.fields.push({name:'areas',value:'mentalidad',checked:true},{name:'areas',value:'finanzas',checked:true});
  let finish;h.context.fetch=()=>new Promise(resolve=>{finish=resolve;});
  const pending=h.subject.save(form,'profile',{areas:['mentalidad','finanzas']});
  form.fields.find(field=>field.value==='mentalidad').checked=false;
  finish({ok:true,json:async()=>({record:{key:'profile',body:{},revision:1,updatedAt:new Date().toISOString()}})});
  assert.equal(await pending,false);assert.equal(form.dataset.dirty,'true');
});
test('area wisdom follows the current tool and never writes or collects personal data',()=>{
  const h=harness();
  for(const [area,wisdom] of Object.entries(wisdomTools.PRACTICE_WISDOM)){
    h.subject.setArea(area);h.subject.renderTool();
    assert.equal(h.get('#wisdom-title').textContent,wisdom.title);
    assert.equal(h.get('#wisdom-exercise').textContent,wisdom.exercise);
    assert.equal(h.get('#wisdom-source').hidden,!wisdom.source);
    assert.equal(h.get('#practice-wisdom').open,false);
  }
  assert.equal(h.subject.records.size,0);
});

test('expanded day rendering shows the guide, keeps examples optional and never copies day zero over later evidence',async()=>{
  const h=harness();
  h.subject.records.set('profile',{key:'profile',body:{goal:'Mi dirección',firstStep:'Solo mi primer movimiento',lifeArea:'mentalidad',minutes:10,energy:'steady'}});
  const guide={title:'La idea detrás de la práctica',explanation:'Una explicación concreta para este día.',task:'Revisar un intento y elegir un ajuste.',activity:'Trabajar una parte de la acción.',reflection:'¿Qué quiero revisar?',evidence:'Un hecho y un siguiente ajuste.',smaller:'Revisar una sola entrada del diario.',bridge:'La conexión con mi área.',example:'Ejemplo ilustrativo, nunca mi registro.',safety:'Puedo reducir la práctica.',audio:null,video:null,transcript:''};
  h.context.fetch=async()=>({ok:true,json:async()=>({area:'mentalidad',lesson:{day:14,theme:'Revisar el recorrido',phase:'Control',principle:'Reflexión',companion:'Puedo retomar'},practice:{guideMessage:'Opcional',safety:'Cuidado'},guide})});
  await h.subject.renderDay(14);
  assert.match(h.get('#member-status').textContent,/Tu práctica está lista/);
  assert.equal(h.get('#guide-evidence').textContent,guide.evidence);
  assert.equal(h.get('#guide-smaller').textContent,guide.smaller);
  assert.equal(h.get('#guide-context').open,false);
  assert.equal(h.get('#practice-check').hidden,false);
  assert.equal(h.get('#lesson-audio-wrap').hidden,true);
  assert.equal(h.get('#journal-form').elements.namedItem('action').value,'');
  assert.equal(h.subject.records.size,1);
  h.subject.records.set('day:14',{key:'day:14',body:{action:'Mi intento guardado',state:'partial',notes:'Mis notas'}});
  await h.subject.renderDay(14);
  assert.equal(h.get('#journal-form').elements.namedItem('action').value,'Mi intento guardado');
  assert.equal(h.get('#journal-form').elements.namedItem('notes').value,'Mis notas');
});

test('review instructions distinguish starting, adjusting and purchased closing without fabricating outcomes',()=>{
  const h=harness();h.get('#review-select').value='7';h.subject.renderReview();
  assert.match(h.get('#review-coaching').textContent,/Tu primera revisión/);
  h.get('#review-select').value='14';h.subject.renderReview();
  assert.match(h.get('#review-coaching').textContent,/Tu cierre/);
  h.subject.setSession({plan:{days:100}});h.get('#review-select').value='60';h.subject.renderReview();
  assert.match(h.get('#review-coaching').textContent,/Revisa hechos/);
  h.get('#review-select').value='100';h.subject.renderReview();
  assert.match(h.get('#review-coaching').textContent,/antes del vencimiento/);
  assert.equal(h.subject.records.size,0);
});
