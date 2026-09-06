import { AREAS, AREA_ORDER, toolPreview } from './guided-tools.js';
import { toolkitExport } from './toolkit.js';

export const BALANCE_STATES = { '': 'Sin valorar', attention: 'Necesita atención', building: 'En construcción', steady: 'Bastante estable' };
export const AREA_CONTEXT = {
  mentalidad: { title: 'Mi rutina mínima', question: '¿Cómo llevo mis prioridades y hábitos?', purpose: 'Concretar una acción, darle un momento y preparar una versión pequeña.' },
  finanzas: { title: 'Mi mapa de dinero', question: '¿Cómo llevo el orden de mis pagos cotidianos?', purpose: 'Separar movimientos realizados y compromisos próximos, y revisar lo que falta por comprobar.' },
  relaciones: { title: 'Mi conversación preparada', question: '¿Cómo llevo mis conversaciones y acuerdos?', purpose: 'Aclarar lo que necesito expresar y preparar mis palabras.' },
  bienestar: { title: 'Mi espacio para cuidarme', question: '¿Cómo llevo mi energía y mi espacio personal?', purpose: 'Dejar un momento para una acción cotidiana que respete mi capacidad.' },
  profesional: { title: 'Mi próximo paso', question: '¿Cómo llevo el avance de mis proyectos?', purpose: 'Convertir un pendiente en una parte que pueda intentar.' },
};
export function validBalance(value) {
  return !!value && typeof value==='object' && !Array.isArray(value) && Object.keys(value).length===5 && AREA_ORDER.every(area=>Object.hasOwn(value,area) && typeof value[area]==='string' && Object.hasOwn(BALANCE_STATES,value[area]));
}
export function reviewDays(limit) {
  return Array.from({length:limit},(_,i)=>i+1).filter(day=>day%7===0 || day===limit || day===30 || day===60);
}
export function systemSnapshot(records, limit) {
  const rows=Array.isArray(records)?records:[...records.values()];
  const profile=rows.find(row=>row.key==='profile')?.body || {};
  const dayOf=row=>Number(row.key.split(':')[1]);
  const daily=rows.filter(row=>/^day:[1-9]\d{0,2}$/.test(row.key) && dayOf(row)<=limit).sort((a,b)=>dayOf(a)-dayOf(b));
  const reviews=rows.filter(row=>/^review:[1-9]\d{0,2}$/.test(row.key) && reviewDays(limit).includes(dayOf(row))).sort((a,b)=>dayOf(a)-dayOf(b));
  const latestReview=[...reviews].reverse().find(row=>validBalance(row.body.balance));
  const byLatest=(a,b)=>(Date.parse(b.updatedAt)||0)-(Date.parse(a.updatedAt)||0) || dayOf(b)-dayOf(a);
  const tools=rows.filter(row=>/^tool:[1-9]\d{0,2}:(mentalidad|finanzas|relaciones|bienestar|profesional)$/.test(row.key) && dayOf(row)<=limit);
  const areas=AREA_ORDER.map(key=>{
    const versions=tools.filter(row=>row.body.area===key).sort(byLatest), latest=versions[0];
    const ownDays=daily.filter(row=>row.body.area===key);
    return {key,name:AREAS[key].name,...AREA_CONTEXT[key],baseline:BALANCE_STATES[profile.baseline?.[key]] || BALANCE_STATES[''],current:latestReview?BALANCE_STATES[latestReview.body.balance[key]]:null,reviewDay:latestReview?dayOf(latestReview):null,latest,versions:versions.length,attempts:ownDays.filter(row=>row.body.state!=='missed').length};
  });
  const counts={complete:0,partial:0,missed:0};
  for(const row of daily)if(Object.hasOwn(counts,row.body.state))counts[row.body.state]++;
  return {profile,daily,reviews,areas,counts,recorded:daily.length,recovery:rows.find(row=>row.key==='recovery')?.body || null};
}
export function formatSystemReport(snapshot, exportedAt=new Date().toISOString()) {
  const limit=snapshot.plan?.days || 100, state=systemSnapshot(snapshot.records || [],limit);
  const lines=['100 DÍAS — EL MÉTODO','MI SISTEMA PERSONAL','Exportado: '+exportedAt,'Recorrido: '+(snapshot.plan?.name || limit+' días'),'', 'Este informe reúne lo que guardaste. Las valoraciones son tuyas, no un diagnóstico ni una medida objetiva de resultados. No incluye borradores ni el código de acceso.','','MI DIRECCIÓN',state.profile.goal || 'Todavía no definida.','Señal que elegí observar: '+(state.profile.evidence || 'Todavía no definida.'),'', 'MIS INTENTOS',`${state.recorded} días con registro: ${state.counts.complete} completados, ${state.counts.partial} parciales y ${state.counts.missed} sin avance.`,''];
  for(const area of state.areas){
    lines.push(area.name.toUpperCase(),'Punto de partida: '+area.baseline,'Última valoración: '+(area.current?area.current+' (revisión del día '+area.reviewDay+')':'Sin revisión valorada'),area.title+':');
    if(area.latest){lines.push(toolPreview(area.latest.body));if(area.key==='finanzas')for(const row of area.latest.body.rows)if(row.name.trim())lines.push(`${row.name} | ${row.amount || 'Importe pendiente'} ${area.latest.body.currency} | ${row.date || 'Fecha pendiente'}`);lines.push('Versión guardada: '+area.latest.updatedAt);}else lines.push('Todavía no guardaste esta herramienta.');
    if(area.latest)lines.push(...toolkitExport(area.latest.body));
    lines.push('');
  }
  if(state.recovery)lines.push('MI PLAN PARA RETOMAR','Qué me frenó: '+state.recovery.obstacle,'Mi acción pequeña: '+state.recovery.action,'Cuándo la intentaré: '+state.recovery.when,'');
  lines.push('MIS REVISIONES Y DECISIONES');
  if(!state.reviews.length)lines.push('Aún no guardaste una revisión.');
  for(const row of state.reviews)lines.push('Día '+row.key.split(':')[1],'Evidencia: '+(row.body.worked || 'Sin anotar'),'Dificultad: '+(row.body.difficult || 'Sin anotar'),'Mi siguiente ajuste: '+row.body.nextStep,'');
  const closing=state.reviews.find(row=>row.key==='review:'+limit);
  lines.push('MI CONTINUIDAD',closing?.body.nextStep || 'Completa la revisión de cierre para decidir qué mantendrás y cuándo volverás a revisarlo.');
  lines.push('', 'CÓMO USAR ESTE INFORME', 'Orientaciones del Método, no resultados ni decisiones registradas por ti:', '1. Compara una señal del punto de partida con un ejemplo real. Si faltan datos, déjalo indicado.', '2. Conserva hasta dos prácticas que te hayan servido; adapta su tamaño a tu situación.', '3. Elige dónde seguir anotando tus intentos y una fecha de revisión fuera de la plataforma.', '4. Si te interrumpes, utiliza tu plan para retomar. No necesitas completar retrospectivamente todos los días ni hacer otra compra.', '', 'Guarda esta copia en un lugar privado. Tu acceso conserva su fecha de vencimiento original.');
  return lines.join('\n');
}
