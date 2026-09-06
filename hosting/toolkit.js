// Shared field definitions; examples are illustrative, never saved automatically.
export const TOOL_DETAILS = {
 mentalidad: [
  ['obstacle','Qué podría interrumpirme','Llegar cansada y querer ordenar toda la habitación.'],
  ['restart','Cómo retomaré','Retomar con un objeto al día siguiente, sin acumular tareas.']
 ],
 profesional: [
  ['done','Cómo sabré que este paso está terminado','La nota tiene cinco materiales y sus cantidades.'],
  ['steps','Hasta tres pasos de trabajo','Consultar las instrucciones.\nAnotar materiales y cantidades.\nRevisar y guardar.']
 ],
 relaciones: [
  ['agreement','Propuesta de acuerdo, todavía por conversar','Si ambos aceptamos, probar un volumen más bajo durante tres noches.'],
  ['followUp','Cuándo propondría revisarlo','Si hacemos la prueba, preguntar el domingo si conviene ajustarla.']
 ],
 bienestar: [
  ['preparation','Qué puedo dejar preparado','Dejar libre una silla y apartar el teléfono.'],
  ['limit','Cuándo reducir, adaptar o parar','Si resulta incómodo, cambiar de lugar, acortar la pausa o descansar de otra forma.']
 ]
};
export const TOOL_EXAMPLES = {
 mentalidad: {situation:'Lucía quiere cerrar el día dejando disponible su escritorio.',fields:[['Acción','Guardar cinco objetos en su sitio.'],['Momento','Después de cenar, en el escritorio.'],['Versión mínima','Guardar un objeto.'],['Dificultad','Llegar cansada y querer ordenar toda la habitación.'],['Regreso','Al día siguiente retomar con un objeto, sin compensar.']],lesson:'Aprendes a concretar una intención y a preparar el regreso.',caution:'Un plan guardado no demuestra que hiciste la acción ni que consolidaste un hábito.'},
 profesional: {situation:'Diego prepara una lista de materiales para una actividad.',fields:[['Paso','Anotar cinco materiales con su cantidad.'],['Momento','El martes, en mi siguiente bloque disponible.'],['Versión mínima','Un material y su cantidad.'],['Terminado','Una nota guardada con los cinco materiales y sus cantidades.'],['Secuencia','Consultar instrucciones → anotar → revisar y guardar.']],lesson:'Separar un proyecto completo de un paso que tiene un cierre reconocible.',caution:'Terminar la lista no significa conseguir los materiales ni realizar la actividad.'},
 relaciones: {situation:'Ana quiere conversar sobre el volumen de la televisión en un momento de lectura.',fields:[['Hecho','En dos noches escuché la televisión desde mi habitación mientras leía.'],['Necesidad','Tener media hora con menos ruido.'],['Ensayo','¿Te viene bien hablar? ¿Podemos probar un volumen más bajo mientras leo? ¿Qué te serviría a ti?'],['Propuesta','Solo si ambos aceptamos, probarlo durante tres noches.'],['Revisión','Preguntar después si mantenerlo o ajustarlo.']],lesson:'Describir un hecho y hacer una petición que permita una respuesta libre.',caution:'Es un ensayo privado: no se envía y no equivale a consentimiento ni a un acuerdo. Si no es seguro conversar, prioriza tu seguridad.'},
 bienestar: {situation:'Marta quiere una pausa entre cerrar el ordenador y las tareas de casa.',fields:[['Acción','Una pausa cómoda de tres minutos sin pantallas.'],['Momento','Al terminar mi jornada.'],['Versión pequeña','Treinta segundos, si me resulta posible.'],['Preparación','Dejar libre una silla.'],['Adaptación','Cambiar de lugar o parar si me resulta incómodo.']],lesson:'Preparar un momento de cuidado que se pueda adaptar a tu día.',caution:'No es un régimen ni una evaluación de salud. No necesitas sentirte mejor necesariamente para registrar lo ocurrido.'},
 finanzas: {situation:'Julia revisa una semana de movimientos. Todos estos importes son ficticios y están en DOP.',fields:[['Ingreso anotado','8,000.00'],['Gastos anotados','2,100.00 + 650.00 + 450.00 = 3,200.00'],['Diferencia anotada','4,800.00; no es el saldo de una cuenta.'],['Pendiente de verificar','Faltan posibles gastos en efectivo.'],['Compromisos próximos','700.00 y 1,200.00, separados de los gastos realizados.']],lesson:'Distinguir movimientos realizados, información pendiente y compromisos futuros.',caution:'La diferencia no acredita ahorro ni dinero disponible. La herramienta no se conecta al banco y no recomienda inversiones o decisiones de deuda.'}
};
export const blankPayment = () => ({name:'',amount:'',date:''});
export const blankEntry = () => ({kind:'expense',name:'',amount:'',date:''});
export const validAmount = value => typeof value==='string' && (value==='' || /^\d{1,9}(?:\.\d{1,2})?$/.test(value));
export const validDate = value => typeof value==='string' && (value==='' || /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0,10)===value);
const exactKeys=(value,keys)=>value && typeof value==='object' && !Array.isArray(value) && Object.keys(value).length===keys.length && keys.every(k=>Object.hasOwn(value,k));
export function validDetails(area,value){
 const fields=TOOL_DETAILS[area];return !!fields && exactKeys(value,fields.map(f=>f[0])) && fields.every(([key])=>typeof value[key]==='string' && value[key].length<=1000);
}
export function validLedger(value){
 if(!exactKeys(value,['start','end','incomplete','entries']) || !validDate(value.start) || !validDate(value.end) || value.start && value.end && value.start>value.end || typeof value.incomplete!=='boolean' || !Array.isArray(value.entries) || value.entries.length<1 || value.entries.length>20)return false;
 return value.entries.every(row=>exactKeys(row,['kind','name','amount','date']) && ['income','expense'].includes(row.kind) && typeof row.name==='string' && row.name.length<=120 && validAmount(row.amount) && validDate(row.date) && (row.name.trim() || !row.amount && !row.date) && (!row.date || (!value.start || row.date>=value.start) && (!value.end || row.date<=value.end)));
}
export function amountCents(value){
 if(!validAmount(value)||value==='')return null;const [whole,fraction='']=value.split('.');return Number(whole)*100+Number(fraction.padEnd(2,'0'));
}
export function ledgerSummary(ledger){
 let income=0,expense=0,unknown=0;
 for(const row of ledger?.entries || []){if(!row.name.trim())continue;const cents=amountCents(row.amount);if(cents===null){unknown++;continue;}if(row.kind==='income')income+=cents;else expense+=cents;}
 return {income:income/100,expense:expense/100,difference:(income-expense)/100,unknown,incomplete:!!ledger?.incomplete};
}
export function toolkitExport(body){
 const lines=[];
 if(body.details)for(const [key,label] of TOOL_DETAILS[body.area] || [])if(body.details[key])lines.push(label+': '+body.details[key]);
 if(body.ledger){
  const l=body.ledger,s=ledgerSummary(l);
  lines.push('MOVIMIENTOS ANOTADOS · '+(l.start || 'Inicio por definir')+' — '+(l.end || 'Fin por definir'));
  for(const row of l.entries)if(row.name.trim())lines.push((row.kind==='income'?'Ingreso':'Gasto')+' | '+row.name+' | '+(row.amount || 'Importe pendiente')+' '+body.currency+' | '+(row.date || 'Fecha pendiente'));
  lines.push('Ingresos anotados: '+s.income.toFixed(2)+' '+body.currency,'Gastos anotados: '+s.expense.toFixed(2)+' '+body.currency,'Diferencia de lo anotado: '+s.difference.toFixed(2)+' '+body.currency,'Importes pendientes: '+s.unknown+(s.incomplete?' · Indicaste que faltan movimientos.':''),'No representa saldo disponible, ahorro ni pagos de compromisos. No es asesoría financiera.');
 }
 return lines;
}
