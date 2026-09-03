(() => {
  const $ = selector => document.querySelector(selector);
  const status = $('#member-status');
  let session, day = 1, dayData, loadNumber = 0, writing = false;
  const records = new Map();
  const messages = { access_denied: 'El acceso no está activo. Revisa el código y su fecha de vencimiento. Si tu pago está pendiente, espera la confirmación.', access_unavailable: 'No pudimos conectar con tu recorrido. Tus registros guardados siguen en el servidor. Inténtalo más tarde.', record_conflict: 'Este registro cambió en otro dispositivo. Conservamos aquí lo que escribiste: cópialo antes de recargar y comparar con la versión guardada.', invalid_record: 'Revisa los campos y sus límites antes de guardar.', rate_limited: 'Hay varios intentos recientes. Espera un minuto antes de volver a probar.' };
  const tell = text => { status.textContent = text; };
  const date = value => new Date(value).toLocaleString('es', { dateStyle: 'medium', timeStyle: 'short' });
  async function api(path, body) {
    const response = await fetch('/api/participant/' + path, { method: body === undefined ? 'GET' : 'POST', credentials: 'same-origin', headers: body === undefined ? {} : { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
    const value = await response.json();
    if (!response.ok) {
      if (response.status === 401 && session) { $('#member-workspace').hidden = true; $('#access-entry').hidden = false; session = null; }
      throw new Error(messages[value.error] || 'No se pudo confirmar la operación. No cerramos ni borramos lo que escribiste.');
    }
    return value;
  }
  function fill(form, values) {
    form.reset();
    for (const [key, value] of Object.entries(values || {})) { const field = form.elements.namedItem(key); if (field) field.value = String(value); }
    form.dataset.dirty = ''; form.querySelector('.save-status').textContent = '';
  }
  const formValues = form => Object.fromEntries(new FormData(form));
  function profileValues() { return records.get('profile')?.body || { minutes: 10, energy: 'steady', lifeArea: 'mentalidad' }; }
  function hasDraft() { return ['#journal-form', '#profile-form', '#review-form'].some(id => $(id).dataset.dirty === 'true'); }
  function mayNavigate() { if (writing) { tell('Espera la confirmación del guardado antes de cambiar de día.'); return false; } return !hasDraft() || window.confirm('Hay cambios sin guardar. ¿Quieres continuar sin guardarlos?'); }
  function element(tag, text, className) { const node = document.createElement(tag); if (text !== undefined) node.textContent = text; if (className) node.className = className; return node; }
  function renderHistory() {
    const container = $('#record-history'); container.replaceChildren();
    const days = [...records.values()].filter(record => record.key.startsWith('day:')).sort((a, b) => Number(b.key.split(':')[1]) - Number(a.key.split(':')[1]));
    $('#progress-count').textContent = days.length + ' de ' + session.plan.days + ' días con registro. No es una puntuación ni una racha.';
    if (!days.length) container.append(element('p', 'Todavía no guardaste un día. Tu primer registro aparecerá aquí.', 'muted'));
    for (const record of days) {
      const item = element('article', undefined, 'record-entry');
      const label = { complete: 'Completado', partial: 'Parcial', missed: 'Sin avance' }[record.body.state];
      item.append(element('h3', 'Día ' + record.key.split(':')[1] + ' · ' + label), element('p', record.body.action));
      for (const [key, title] of [['notes', 'Lo que ocurrió'], ['obstacle', 'Dificultad'], ['nextStep', 'Siguiente paso']]) if (record.body[key]) item.append(element('p', title + ': ' + record.body[key]));
      item.append(element('p', 'Guardado: ' + date(record.updatedAt), 'record-date')); container.append(item);
    }
    $('#current-goal').textContent = records.get('profile')?.body.goal || 'Empieza eligiendo una prioridad en el Día 0.';
  }
  function renderReview() { fill($('#review-form'), records.get('review:' + $('#review-select').value)?.body); }
  async function renderDay(nextDay) {
    const number = ++loadNumber;
    $('#journal-form').querySelector('button').disabled = true;
    tell('Cargando la práctica…');
    try {
      const data = await api('day?day=' + nextDay);
      if (number !== loadNumber) return;
      day = nextDay; dayData = data; $('#day-select').value = String(day);
      const { lesson, practice } = data;
      $('#day-label').textContent = 'Día ' + day + ' de ' + session.plan.days + ' · ' + lesson.phase;
      $('#day-title').textContent = lesson.theme; $('#day-principle').textContent = lesson.principle;
      $('#day-question').textContent = lesson.question; $('#day-task').textContent = lesson.task;
      $('#dose-note').textContent = 'Tu ritmo elegido: ' + profileValues().minutes + ' minutos. Adapta la tarea a ese tiempo; si el ejemplo propone más, haz una parte concreta. Puedes cambiar tu ritmo en el Día 0.';
      $('#day-companion').textContent = lesson.companion; $('#life-message').textContent = practice.guideMessage;
      const actions = $('#life-actions'); actions.replaceChildren();
      for (const key of ['learning', 'movement', 'finance', 'connection', 'video']) {
        const value = practice[key]; if (!value) continue;
        const item = element('article'); item.append(element('h4', value.title), element('p', value.action));
        if (value.resource) {
          try { const url = new URL(value.resource.url); if (url.protocol === 'https:') { const link = element('a', 'Abrir recurso de ' + value.resource.source + ' ↗'); link.href = url.href; link.target = '_blank'; link.rel = 'noopener noreferrer'; item.append(link); } } catch {}
        }
        actions.append(item);
      }
      $('#life-safety').textContent = practice.safety;
      fill($('#journal-form'), records.get('day:' + day)?.body || { action: profileValues().firstStep || '', state: 'partial' });
      $('#previous-day').disabled = day === 1; $('#next-day').disabled = day === session.plan.days;
      tell(session.sandbox ? 'PRUEBA SANDBOX · Este acceso no corresponde a un pago real.' : 'Tu práctica está lista. Elige una acción y registra lo que ocurrió.');
    } catch (error) { $('#day-select').value = String(day); tell(error.message); }
    finally { if (number === loadNumber) $('#journal-form').querySelector('button').disabled = !dayData; }
  }
  async function save(form, key, body) {
    if (writing || !session || !form.reportValidity()) return;
    writing = true; const button = form.querySelector('button'); button.disabled = true;
    const note = form.querySelector('.save-status'); note.textContent = 'Guardando…';
    const before = JSON.stringify(formValues(form));
    try {
      const saved = await api('record', { key, body, revision: records.get(key)?.revision || 0 });
      records.set(key, saved.record);
      const editedDuringSave = before !== JSON.stringify(formValues(form));
      form.dataset.dirty = editedDuringSave ? 'true' : '';
      note.textContent = 'Guardado en el servidor: ' + date(saved.record.updatedAt) + (editedDuringSave ? '. Hay cambios más recientes sin guardar.' : '.');
      renderHistory();
      return !editedDuringSave;
    } catch (error) { note.textContent = error.message; return false; }
    finally { writing = false; button.disabled = false; }
  }
  async function start() {
    try {
      const loaded = await api('session'); session = loaded; records.clear(); loaded.records.forEach(record => records.set(record.key, record));
      $('#access-entry').hidden = true; $('#member-workspace').hidden = false;
      $('#plan-label').textContent = loaded.plan.name + ' · Contenido digital autoguiado'; $('#expiry').textContent = 'Acceso hasta ' + date(loaded.expiresAt);
      $('#day-select').replaceChildren(...loaded.days.map(value => { const option = element('option', 'Día ' + value.day + ' · ' + value.title); option.value = value.day; return option; }));
      const reviews = loaded.days.filter(value => value.day % 7 === 0 || value.day === loaded.plan.days);
      $('#review-select').replaceChildren(...reviews.map(value => { const option = element('option', 'Día ' + value.day + (value.day === loaded.plan.days ? ' · Cierre del recorrido' : ' · Revisión semanal')); option.value = value.day; return option; }));
      fill($('#profile-form'), profileValues()); $('#profile-panel').open = !records.has('profile'); renderReview(); renderHistory();
      day = loaded.days.find(value => !records.has('day:' + value.day))?.day || loaded.plan.days;
      await renderDay(day);
    } catch (error) { $('#member-workspace').hidden = true; $('#access-entry').hidden = false; tell(error.message); }
  }
  $('#redeem-form').addEventListener('submit', async event => {
    event.preventDefault(); const button = event.currentTarget.querySelector('button'); if (button.disabled) return; button.disabled = true;
    try { await api('redeem', { code: $('#access-code').value.trim() }); $('#access-code').value = ''; await start(); }
    catch (error) { tell(error.message); } finally { button.disabled = false; }
  });
  $('#journal-form').addEventListener('submit', async event => { event.preventDefault(); if (dayData) await save(event.currentTarget, 'day:' + day, { ...formValues(event.currentTarget), minutes: profileValues().minutes, energy: profileValues().energy }); });
  $('#review-form').addEventListener('submit', async event => { event.preventDefault(); await save(event.currentTarget, 'review:' + $('#review-select').value, formValues(event.currentTarget)); });
  $('#profile-form').addEventListener('submit', async event => {
    event.preventDefault(); const form = event.currentTarget; const values = formValues(form); values.minutes = Number(values.minutes);
    if (await save(form, 'profile', values)) { $('#profile-panel').open = false; if ($('#journal-form').dataset.dirty !== 'true') await renderDay(day); else tell('Prioridad guardada. Tu borrador del día sigue aquí; guárdalo antes de recargar la práctica.'); }
  });
  $('#day-select').addEventListener('change', event => { const requested = Number(event.target.value); if (mayNavigate()) renderDay(requested); else event.target.value = String(day); });
  $('#previous-day').addEventListener('click', () => { if (day > 1 && mayNavigate()) renderDay(day - 1); });
  $('#next-day').addEventListener('click', () => { if (day < session.plan.days && mayNavigate()) renderDay(day + 1); });
  let previousReview = '';
  $('#review-select').addEventListener('focus', () => { previousReview = $('#review-select').value; });
  $('#review-select').addEventListener('change', () => { if (mayNavigate()) renderReview(); else if (previousReview) $('#review-select').value = previousReview; });
  for (const id of ['#journal-form', '#profile-form', '#review-form']) $(id).addEventListener('input', () => { $(id).dataset.dirty = 'true'; });
  window.addEventListener('beforeunload', event => { if (hasDraft() || writing) { event.preventDefault(); event.returnValue = ''; } });
  function download(text, filename, type = 'text/plain;charset=utf-8') { const url = URL.createObjectURL(new Blob([text], { type })); const link = element('a'); link.href = url; link.download = filename; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
  $('#export-records').addEventListener('click', async () => {
    try { const latest = await api('session'); download(JSON.stringify({ program: '100 Días — El Método', exportedAt: new Date().toISOString(), records: latest.records }, null, 2), 'mis-registros-100-dias.json', 'application/json'); tell('Descargaste los registros confirmados del servidor. Los borradores sin guardar no están incluidos.'); } catch (error) { tell(error.message); }
  });
  $('#recover-code').addEventListener('click', async () => { try { const { access } = await api('access'); download('100 Días — El Método\nCódigo privado: ' + access.code + '\nEntrar: ' + location.origin + access.url + '\nAcceso hasta: ' + date(access.expiresAt) + '\nNo compartas este archivo.\n', 'mi-acceso-100-dias.txt'); } catch (error) { tell(error.message); } });
  $('#logout').addEventListener('click', async () => { if (!mayNavigate()) return; try { await api('logout', {}); for (const id of ['#journal-form', '#profile-form', '#review-form']) $(id).dataset.dirty = ''; try { localStorage.removeItem('metodo-checkout-last-order-v1'); } catch {} location.reload(); } catch (error) { tell(error.message); } });
  start();
})();
