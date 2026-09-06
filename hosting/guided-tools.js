export const AREAS = {
  mentalidad: {name:'Disciplina y hábitos',title:'Convierte tu intención en una acción',labels:['La acción concreta','Cuándo y dónde la intentaré','Una versión más pequeña'],prompts:['Abrir el documento y escribir una idea','Después de desayunar, en la mesa','Escribir solamente el título']},
  profesional: {name:'Proyectos y trabajo',title:'Prepara tu siguiente paso',labels:['Una parte concreta del proyecto','Mi próximo momento disponible','La versión que cabe si tengo poco tiempo'],prompts:['Revisar una descripción de mi currículum','Mañana, antes de abrir las redes','Corregir una frase']},
  bienestar: {name:'Bienestar cotidiano',title:'Deja espacio para ti',labels:['Una acción cotidiana que me serviría','Un momento realista para hacerla','Cómo reducirla si necesito descansar'],prompts:['Dejar preparada la ropa de mañana','Después de cenar','Preparar solo lo imprescindible']},
  relaciones: {name:'Relaciones y comunicación',title:'Prepara tus palabras',labels:['La situación cotidiana','Lo que quiero expresar','Mi frase de ensayo'],prompts:['Quiero aclarar un horario','Pedir un momento para conversar','¿Podemos buscar otro momento para hablar?']},
  finanzas: {name:'Organización del dinero',title:'Pon tus próximos pagos a la vista',labels:[],prompts:[]},
};

export function toolKey(day, area) { return 'tool:' + day + ':' + area; }
export const AREA_ORDER = ['mentalidad','finanzas','relaciones','bienestar','profesional'];
export function chosenAreas(profile={}) { const selected=Array.isArray(profile.areas)?[...new Set(profile.areas.filter(a=>Object.hasOwn(AREAS,a)))]:[];const primary=Object.hasOwn(AREAS,profile.lifeArea)?profile.lifeArea:null;if(selected.length)return primary&&selected.includes(primary)?[primary,...selected.filter(area=>area!==primary)]:selected;return primary?[primary,...AREA_ORDER.filter(area=>area!==primary)]:AREA_ORDER; }
export function focusArea(day,profile={}) {const areas=chosenAreas(profile);return areas[(day-1)%areas.length];}
export function summarizeJourney(records, limit) {
  const list = Array.isArray(records) ? records : [...records.values()];
  const days = list.filter(r => /^day:[1-9]\d{0,2}$/.test(r.key) && Number(r.key.slice(4)) <= limit);
  const counts = {complete:0,partial:0,missed:0};
  const weekCounts = {complete:0,partial:0,missed:0};
  for (const r of days) if (Object.hasOwn(counts, r.body.state)) counts[r.body.state]++;
  for (const r of days) if (Number(r.key.slice(4))<=7 && Object.hasOwn(weekCounts,r.body.state)) weekCounts[r.body.state]++;
  const seen = new Set(days.map(r=>Number(r.key.slice(4))));
  let next = 1; while(next <= limit && seen.has(next)) next++;
  return {counts,weekCounts,recorded:seen.size,weekRecorded:[...seen].filter(d=>d<=7).length,next:Math.min(next,limit)};
}

export function paymentSummary(rows) {
  let cents = 0;
  for (const row of rows) if (row.name.trim() && /^\d{1,9}(?:\.\d{1,2})?$/.test(row.amount)) {
    const [whole,fraction=''] = row.amount.split('.'); cents += Number(whole)*100 + Number(fraction.padEnd(2,'0'));
  }
  return {total:cents/100,dated:rows.filter(r=>r.name.trim() && r.date).slice().sort((a,b)=>a.date.localeCompare(b.date))};
}

export function toolPreview(body) {
  if (body.area === 'finanzas') {
    const summary = paymentSummary(body.rows);
    return 'Importe anotado: ' + summary.total.toLocaleString('es-DO',{minimumFractionDigits:2,maximumFractionDigits:2}) + ' ' + body.currency + '. ' + (summary.dated.length ? 'Próximo vencimiento anotado: ' + summary.dated[0].date + ' · ' + summary.dated[0].name + '.' : 'Añade fechas para ordenar los vencimientos.') + ' No indica pagos realizados, saldo disponible ni una recomendación financiera.';
  }
  const a=body.first.trim(),b=body.second.trim(),c=body.third.trim();
  return body.area === 'relaciones' ? [a && 'Situación: '+a,b && 'Mi intención: '+b,c && 'Mi frase: '+c].filter(Boolean).join('\n') : [a && 'Voy a intentar: '+a,b && 'Mi momento: '+b,c && 'Si necesito reducirlo: '+c].filter(Boolean).join('\n');
}

export function validToolRecord(key,body,maxDays) {
  const match=/^tool:([1-7]):(mentalidad|profesional|bienestar|relaciones|finanzas)$/.exec(key);
  if (!match || Number(match[1])>maxDays || body.area!==match[2]) return false;
  const only=keys=>Object.keys(body).every(k=>keys.includes(k));
  if(body.area!=='finanzas') return only(['area','first','second','third']) && ['first','second','third'].every(k=>typeof body[k]==='string' && body[k].length<=1500) && !!body.first.trim();
  if(!only(['area','currency','rows']) || !['USD','DOP','EUR'].includes(body.currency) || !Array.isArray(body.rows) || body.rows.length!==3) return false;
  const dateOK=s=>s==='' || /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s)) && new Date(s).toISOString().slice(0,10)===s;
  return body.rows.every(r=>r && typeof r==='object' && !Array.isArray(r) && Object.keys(r).length===3 && ['name','amount','date'].every(k=>typeof r[k]==='string') && r.name.length<=120 && (r.amount==='' || /^\d{1,9}(?:\.\d{1,2})?$/.test(r.amount)) && dateOK(r.date) && (r.name.trim() || !r.amount && !r.date)) && body.rows.some(r=>r.name.trim());
}
