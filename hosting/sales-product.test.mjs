import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { PLANS } from './catalog.mjs';
import { programModule } from './program-source.mjs';
import { practiceSequence, journeyMap } from './participant-tools.js';

const html = await readFile(new URL('sales.html', import.meta.url), 'utf8');
const plain = value => value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const normalized = value => plain(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const context = {};
vm.runInNewContext((await programModule(process.cwd())).replace('export default ', 'this.program = '), context);
const program = context.program;
const visible = normalized(html);

test('sales curriculum names and day ranges agree with the delivered program', () => {
  for (const number of [1, 7, 14, 31, 60, 61, 100]) {
    const lesson = program.lessons.find(item => item.day === number);
    assert.ok(visible.includes(normalized(`Día ${number}: ${lesson.theme}`)), `Day ${number} title must be genuine`);
  }
  for (const phase of journeyMap(100)) {
    assert.ok(visible.includes(normalized(`Días ${phase.from}–${phase.to} · ${phase.title}`)));
    assert.equal(program.lessons.filter(day => day.day >= phase.from && day.day <= phase.to).length, phase.to - phase.from + 1);
  }
  assert.match(html, /Alpha incluye el Día 0 y los días 1–14 de Control/);
});

test('public practice is a labelled application of the first delivered lesson', () => {
  assert.ok(visible.includes(normalized(program.lessons[0].action)));
  const sequence = practiceSequence(program.lessons[0], 10);
  assert.deepEqual(sequence.steps.map(step => step.time), ['1 minuto', '7 minutos', '2 minutos']);
  const sample = html.match(/<ol class="sample-steps">([\s\S]*?)<\/ol>/)[1];
  assert.deepEqual([...sample.matchAll(/<li><span>(\d+) min<\/span>/g)].map(m => Number(m[1])), [1, 7, 2]);
  assert.match(html, /esta muestra no guarda respuestas/);
  assert.match(html, /No inventes cifras ni experiencia/);
});

test('every purchase link selects a real one-time offer with its price and duration disclosed', () => {
  const links = [...html.matchAll(/href="\/comprar\?plan=([^"]+)"/g)].map(m => m[1]);
  assert.ok(links.length >= 4);
  assert.deepEqual([...new Set(links)].sort(), ['alpha', 'metodo']);
  const cards = [...html.matchAll(/<article class="offer-card[^\"]*">([\s\S]*?)<\/article>/g)];
  assert.equal(cards.length, 2);
  for (const [, card] of cards) {
    const key = card.match(/href="\/comprar\?plan=([^"]+)"/)[1];
    assert.equal(PLANS[key].billing, 'one_time');
    assert.ok(plain(card).includes(`USD ${PLANS[key].amountCents / 100}`));
    assert.ok(plain(card).includes(`${PLANS[key].accessDays} días consecutivos de acceso`));
    assert.match(card, /Desde la confirmación del pago/);
  }
  assert.match(html, /No enviamos un correo automático de acceso/);
  assert.match(html, /no es indefinido y las pausas no amplían su duración/);
  assert.doesNotMatch(html, /USD (?:79|297)/);
});

test('interactive week preview is labelled and makes all eight example days explorable without collecting data', async () => {
  assert.match(html, /Ejemplo interactivo · No guarda datos/);
  assert.equal([...html.matchAll(/data-demo-day="\d"/g)].length, 8);
  assert.match(html, /LO QUE HACES/);
  assert.match(html, /LO QUE TE QUEDA/);
  assert.match(html, /Ejemplos ilustrativos de uso, no resultados de clientes/);
  const script = await readFile(new URL('sales-experience.js', import.meta.url), 'utf8');
  assert.doesNotMatch(script, /fetch\(|localStorage|sessionStorage|document\.cookie|innerHTML/);
  const nodes=new Map(), buttons=Array.from({length:8},(_,i)=>({dataset:{demoDay:String(i)},attributes:{},setAttribute(k,v){this.attributes[k]=v;},addEventListener(_,handler){this.click=handler;}}));
  const node=()=>({textContent:'',children:[],append(...children){this.children.push(...children);},replaceChildren(...children){this.children=children;}});
  const demo={querySelector(id){if(!nodes.has(id))nodes.set(id,node());return nodes.get(id);},querySelectorAll(){return buttons;}};
  vm.runInNewContext(script,{document:{querySelector:()=>demo,createElement:node}});
  for(let day=0;day<8;day++){buttons[day].click();assert.match(nodes.get('#demo-area').textContent,new RegExp('DÍA '+day));assert.equal(buttons.filter(b=>b.attributes['aria-pressed']==='true').length,1);assert.equal(nodes.get('#demo-artifact').children[0].children.length,3);}
  buttons[2].click();assert.match(nodes.get('#demo-connection').textContent,/no conecta cuentas/);
  assert.equal([...html.matchAll(/<h1\b/g)].length, 1);
  assert.match(html, /no una transformación garantizada/);
});

test('closing action leads to the offered product while official channels remain in footer', () => {
  const closing = html.match(/<section class="final-cta">([\s\S]*?)<\/section>/)[1];
  assert.match(closing, /href="\/comprar\?plan=metodo"/);
  assert.match(closing, /href="\/comprar\?plan=alpha"/);
  assert.doesNotMatch(closing, /href="https:/);
  const footer = html.match(/<footer>([\s\S]*?)<\/footer>/)[1];
  for (const domain of ['youtube.com', 'instagram.com', 'facebook.com', 'tiktok.com']) assert.ok(footer.includes(domain));
  assert.match(html, /property="og:image" content="https:\/\/100diaselmetodo.com\/assets\/og-100-dias.png"/);
});
