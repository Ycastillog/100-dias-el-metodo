import test from 'node:test';
import assert from 'node:assert/strict';
import {blankPayment,blankEntry,validAmount,validDate,validLedger,validDetails,ledgerSummary,toolkitExport,TOOL_EXAMPLES} from './toolkit.js';
import {validateRecord} from './participant-store.mjs';
import {formatJournalExport} from './participant-tools.js';
import {WELCOME_STEPS} from './welcome.js';

const ledger={start:'2026-09-01',end:'2026-09-07',incomplete:true,entries:[{kind:'income',name:'Entrada',amount:'0.30',date:'2026-09-01'},{kind:'expense',name:'Salida',amount:'0.10',date:'2026-09-02'},{kind:'expense',name:'Por comprobar',amount:'',date:''}]};
const finance={area:'finanzas',currency:'DOP',rows:[{name:'Pendiente',amount:'700',date:'2026-09-10'}],ledger};
test('ledger validation bounds arrays, actual dates, exact keys and reporting period',()=>{
 assert.ok(validLedger(ledger));
 for(const bad of [{...ledger,end:'2026-08-31'},{...ledger,incomplete:'true'},{...ledger,entries:[]},{...ledger,entries:Array.from({length:21},blankEntry)},{...ledger,balance:1}])assert.equal(validLedger(bad),false);
 for(const row of [{...ledger.entries[0],date:'2026-02-30'},{...ledger.entries[0],date:'2026-09-08'},{...ledger.entries[0],amount:'-2'},{...ledger.entries[0],name:''},{...ledger.entries[0],kind:'transfer'},{...ledger.entries[0],paid:true}])assert.equal(validLedger({...ledger,entries:[row]}),false);
 for(const amount of ['1e5','NaN','1,000','-0.1','12.345','1000000000'])assert.equal(validAmount(amount),false);
 assert.ok(validDate('2024-02-29'));assert.equal(validDate('2026-02-29'),false);
});
test('money summary uses cents, reports missing amounts and never subtracts future commitments',()=>{
 assert.deepEqual(ledgerSummary(ledger),{income:.3,expense:.1,difference:.2,unknown:1,incomplete:true});
 assert.equal(ledgerSummary({...ledger,entries:[{...ledger.entries[0],amount:'0.10'},{...ledger.entries[0],amount:'0.20'}]}).income,.3);
 assert.equal(ledgerSummary(finance.ledger).difference,.2);
});
test('legacy tools still work; additional rows and ledger-only notes are accepted within purchase limits',()=>{
 assert.ok(validateRecord('tool:14:finanzas',finance,14));
 assert.ok(validateRecord('tool:14:finanzas',{...finance,rows:[blankPayment()]},14));
 assert.ok(validateRecord('tool:14:finanzas',{...finance,rows:Array.from({length:12},()=>finance.rows[0]),ledger:{...ledger,entries:Array.from({length:20},()=>ledger.entries[0])}},14));
 assert.equal(validateRecord('tool:15:finanzas',finance,14),null);
 assert.equal(validateRecord('tool:1:finanzas',{...finance,rows:[blankPayment()],ledger:{...ledger,entries:[blankEntry()]}},14),null);
 const legacy={area:'mentalidad',first:'Un objeto',second:'Al cenar',third:'Un minuto'};
 assert.ok(validateRecord('tool:1:mentalidad',legacy,14));
 assert.ok(validateRecord('tool:1:mentalidad',{...legacy,details:{obstacle:'Cansancio',restart:'Un objeto mañana'}},14));
 assert.equal(validDetails('mentalidad',{obstacle:'x',restart:'y',done:true}),false);
 assert.equal(validDetails('mentalidad',{obstacle:'x'.repeat(1001),restart:''}),false);
});
test('exports preserve entered details and money rows, but do not inject illustrative cases',()=>{
 const body={area:'profesional',first:'Una lista',second:'Martes',third:'Una línea',details:{done:'Cinco cantidades',steps:'Consultar\nAnotar\nRevisar'}};
 const text=formatJournalExport({plan:{name:'Método'},records:[{key:'tool:1:finanzas',body:finance},{key:'tool:2:profesional',body}]});
 for(const fragment of ['Por comprobar','Importe pendiente','0.20 DOP','Cinco cantidades','Consultar\nAnotar\nRevisar'])assert.ok(text.includes(fragment),fragment);
 assert.match(toolkitExport(finance).join('\n'),/No representa saldo disponible/);
 assert.doesNotMatch(text,/Julia|Lucía|Diego|Marta|8,000.00/);
 assert.equal(Object.keys(TOOL_EXAMPLES).length,5);assert.equal(WELCOME_STEPS.length,5);
});
