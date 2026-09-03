// Pure presentation helpers. No account data, storage, payment logic or secrets.
export function practiceSequence(lesson, requestedMinutes) {
  const minutes = [2, 10, 20].includes(Number(requestedMinutes)) ? Number(requestedMinutes) : 10;
  const timing = minutes === 2 ? ['15 segundos', '90 segundos', '15 segundos'] : minutes === 10 ? ['1 minuto', '7 minutos', '2 minutos'] : ['2 minutos', '15 minutos', '3 minutos'];
  return {
    minutes,
    objective: lesson.action || lesson.task,
    steps: [
      { time: timing[0], title: 'Define el intento', text: 'Elige una sola parte de la práctica de hoy. Escribe qué vas a hacer y qué observarás al terminar.' },
      { time: timing[1], title: 'Haz esa parte', text: minutes === 2 ? 'Empieza por el primer gesto de esa acción. Si no cabe completa, un intento parcial es válido; no añadas otra tarea.' : 'Trabaja en la parte elegida hasta que termine este bloque. Si aparece una dificultad, anótala y reduce la tarea; no necesitas forzar el resultado.' },
      { time: timing[2], title: 'Deja un registro', text: minutes === 2 ? 'Escribe una frase: «Hice… / lo siguiente es…». Después pulsa Guardar.' : 'Anota qué hiciste, qué lo dificultó y el próximo paso. Puedes marcar completado, parcial o sin avance. Pulsa Guardar y espera la confirmación.' },
    ],
  };
}

export function journeyMap(days) {
  const limit = days === 14 ? 14 : 100;
  return [
    { from: 1, to: Math.min(30, limit), title: 'Control', description: 'Concretar una prioridad, observar distracciones y preparar una primera acción.' },
    ...(limit > 30 ? [{ from: 31, to: 60, title: 'Fortaleza', description: 'Ajustar la práctica ante errores, cansancio o interrupciones, sin inventar avances.' }] : []),
    ...(limit > 60 ? [{ from: 61, to: 100, title: 'Dirección', description: 'Elegir criterios, revisar tus registros y preparar una forma de continuar.' }] : []),
  ];
}

export function formatJournalExport(snapshot, exportedAt = new Date().toISOString()) {
  const rows = Array.isArray(snapshot.records) ? snapshot.records : [];
  const profile = rows.find(row => row.key === 'profile')?.body;
  const lines = ['100 DÍAS — EL MÉTODO', 'Mi registro personal', '', 'Exportado: ' + exportedAt, 'Plan: ' + (snapshot.plan?.name || 'Mi recorrido'), '', 'Copia privada. No compartas información sensible. Solo incluye registros confirmados; no contiene tu código de acceso.', ''];
  if (profile) lines.push('MI PRIORIDAD', profile.goal || '', 'Primer paso: ' + (profile.firstStep || ''), 'Tiempo elegido: ' + profile.minutes + ' minutos', '');
  const daily = rows.filter(row => /^day:\d+$/.test(row.key)).sort((a,b) => Number(a.key.split(':')[1]) - Number(b.key.split(':')[1]));
  const stateNames = { complete: 'Completado', partial: 'Parcial', missed: 'Sin avance' };
  if (!daily.length) lines.push('Todavía no hay días guardados.', '');
  for (const row of daily) {
    lines.push('DÍA ' + row.key.split(':')[1] + ' · ' + (stateNames[row.body.state] || 'Registro'));
    for (const [key, label] of [['action','Acción'],['notes','Lo que ocurrió'],['obstacle','Dificultad'],['nextStep','Siguiente paso']]) {
      if (row.body[key]) lines.push(label + ': ' + row.body[key]);
    }
    lines.push('Guardado: ' + row.updatedAt, '');
  }
  const reviews = rows.filter(row => /^review:\d+$/.test(row.key)).sort((a,b) => Number(a.key.split(':')[1]) - Number(b.key.split(':')[1]));
  for (const row of reviews) {
    lines.push('REVISIÓN DEL DÍA ' + row.key.split(':')[1]);
    for (const [key,label] of [['worked','Pude sostener'],['difficult','Me costó'],['nextStep','Ajustaré o mantendré']]) if (row.body[key]) lines.push(label + ': ' + row.body[key]);
    lines.push('');
  }
  return lines.join('\n');
}
