import { practiceSequence, journeyMap, formatJournalExport } from './participant-tools.js';
import { AREAS, AREA_ORDER, chosenAreas, focusArea, toolKey, summarizeJourney, toolPreview } from './guided-tools.js';

(() => {
  const $ = selector => document.querySelector(selector);
  const status = $('#member-status');
  let session, day = 1, dayData, loadNumber = 0, writing = false, loadingDay = false, displayedArea = 'mentalidad', renderedReview = '', sessionGeneration = 0;
  const records = new Map();
  const messages = { access_denied: 'El acceso no está activo. Revisa el código y su fecha de vencimiento. Si tu pago está pendiente, espera la confirmación.', access_unavailable: 'No pudimos conectar con tu recorrido. Tus registros guardados siguen en el servidor. Inténtalo más tarde.', record_conflict: 'Este registro cambió en otro dispositivo. Conservamos aquí lo que escribiste: cópialo antes de recargar y comparar con la versión guardada.', invalid_record: 'Revisa los campos y sus límites antes de guardar.', rate_limited: 'Hay varios intentos recientes. Espera un minuto antes de volver a probar.' };
  const tell = text => { status.textContent = text; };
  const date = value => new Date(value).toLocaleString('es', { dateStyle: 'medium', timeStyle: 'short' });
  async function api(path, body) {
    const generation=sessionGeneration;
    const response = await fetch('/api/participant/' + path, { method: body === undefined ? 'GET' : 'POST', credentials: 'same-origin', headers: body === undefined ? {} : { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
    const value = await response.json();
    if(generation!==sessionGeneration)throw new Error('La sesión cambió. Vuelve a cargar la práctica.');
    if (!response.ok) {
      if (response.status === 401 && session) { $('#member-workspace').hidden = true; $('#access-entry').hidden = false; session = null; sessionGeneration++; }
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
  const formSnapshot = form => JSON.stringify([...new FormData(form)]);
  function profileValues() { return records.get('profile')?.body || { minutes: 10, energy: 'steady', lifeArea: 'mentalidad' }; }
  function hasDraft() { return ['#journal-form', '#profile-form', '#review-form', '#tool-form'].some(id => $(id).dataset.dirty === 'true'); }
  function mayNavigate() { if (writing || loadingDay) { tell('Espera a que termine la carga o el guardado antes de cambiar.'); return false; } return !hasDraft() || window.confirm('Hay cambios sin guardar. ¿Quieres continuar sin guardarlos?'); }
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
    const tools=[...records.values()].filter(record=>/^tool:[1-7]:/.test(record.key)).sort((a,b)=>Number(b.key.split(':')[1])-Number(a.key.split(':')[1]));
    if(tools.length)container.append(element('h3','Mis herramientas guardadas'));
    for(const record of tools){
      const item=element('details',undefined,'saved-tool'),number=Number(record.key.split(':')[1]);
      item.append(element('summary','Día '+number+' · '+AREAS[record.body.area].name),element('p',toolPreview(record.body),'saved-tool-text'));
      if(record.body.area==='finanzas')for(const row of record.body.rows)if(row.name.trim())item.append(element('p',row.name+' · '+(row.amount||'importe pendiente')+' '+record.body.currency+' · '+(row.date||'fecha pendiente')));
      const button=element('button','Volver a esta herramienta','quiet');button.type='button';button.addEventListener('click',async()=>{if(mayNavigate()){await renderDay(number,record.body.area);$('#day-title').focus();}});item.append(button);container.append(item);
    }
    $('#current-goal').textContent = records.get('profile')?.body.goal || 'Empieza eligiendo tus áreas en el Día 0.';
    $('#start-priority').textContent = records.has('profile') ? 'Áreas y ritmo guardados' : 'Elige tus áreas y tu ritmo en el Día 0';
    $('#start-record').textContent = days.length ? 'Ya tienes un registro: continúa tu práctica' : 'Haz una acción y guarda tu primer registro';
    renderOverview();
  }
  function renderOverview() {
    if (!session) return;
    const summary = summarizeJourney(records, session.plan.days);
    const area = AREAS[displayedArea] || AREAS.mentalidad;
    $('#today-area').textContent = 'Foco de hoy · '+area.name;
    $('#today-title').textContent = records.has('profile') ? 'Día ' + day + ' · ' + (dayData?.lesson.theme || 'Tu siguiente práctica') : 'Tu vida tiene varias áreas.';
    $('#today-description').textContent = records.has('profile') ? (dayData?.guide?.task || dayData?.lesson.task || 'Una práctica para aprender, hacer y revisar.') : 'Elige los aspectos que quieres trabajar. El recorrido alterna focos y te permite explorar otras áreas sin empezar de cero.';
    $('#continue-practice').textContent = records.has('profile') ? 'Ir a mi práctica →' : 'Elegir mis áreas →';
    $('#today-context').textContent = day <= 7 ? 'Primera semana · guía, herramienta y registro. Tú eliges tu ritmo.' : 'Continúa con las prácticas originales de tu recorrido.';
    $('#week-summary').textContent = summary.weekRecorded + ' de 7 días con registro en tu primera semana.';
    for (const state of ['complete','partial','missed']) $('#count-'+state).textContent=String(summary.weekCounts[state]);
    const nav=$('#week-days'); nav.replaceChildren();
    for(let d=1;d<=Math.min(7,session.plan.days);d++) {
      const saved=records.get('day:'+d)?.body.state;
      const btn=element('button',String(d),saved?'week-day '+saved:'week-day'); btn.type='button';
      const label={complete:'completado',partial:'parcial',missed:'sin avance'}[saved] || 'sin registro';
      btn.setAttribute('aria-label','Día '+d+' · '+label); if(d===day)btn.setAttribute('aria-current','step');
      btn.addEventListener('click',()=>{if(d!==day && mayNavigate())renderDay(d);}); nav.append(btn);
    }
    const areas=$('#area-review');areas.replaceChildren();
    for(const key of chosenAreas(profileValues())) {const total=[...records.values()].filter(r=>r.key.startsWith('tool:')&&r.body.area===key).length;const item=element('div');item.append(element('strong',AREAS[key].name),element('p',total+' herramientas guardadas'));areas.append(item);}
  }
  function toolBody() {
    const values=formValues($('#tool-form'));
    if(displayedArea==='finanzas') return {area:displayedArea,currency:values.currency,rows:[0,1,2].map(i=>({name:values['name'+i]||'',amount:values['amount'+i]||'',date:values['date'+i]||''}))};
    return {area:displayedArea,first:values.first||'',second:values.second||'',third:values.third||''};
  }
  function fillTool(body) {
    const values=body?.area==='finanzas' ? {currency:body.currency,...Object.fromEntries(body.rows.flatMap((r,i)=>Object.entries(r).map(([k,v])=>[k+i,v])))} : body;
    fill($('#tool-form'),values); updateToolPreview();
  }
  function updateToolPreview() { $('#tool-preview').textContent=toolPreview(toolBody()) || 'Tu preparación aparecerá aquí mientras completas los campos.'; }
  function renderTool() {
    const section=$('#tool-section'); section.hidden=day>7;
    if(day>7) { $('#tool-form').dataset.dirty=''; return; }
    const area=AREAS[displayedArea]; $('#tool-area').textContent=area.name; $('#tool-title').textContent=area.title;
    $('#tool-intro').textContent=displayedArea==='finanzas' ? 'Anota hasta tres compromisos en una misma moneda. El total solo suma lo escrito; no comprueba tu cuenta ni marca nada como pagado.' : displayedArea==='relaciones' ? 'Ensaya una petición para una conversación segura. No se envía a nadie. Si hay amenazas o violencia, prioriza tu seguridad y busca apoyo; no tienes que iniciar esa conversación.' : 'Haz visible una acción, el momento de intentarla y una alternativa pequeña. Puedes volver a ajustarla.';
    const fields=$('#tool-fields'); fields.replaceChildren();
    const input=(name,type,label,placeholder,required=false)=>{
      const wrap=element('div',undefined,'tool-field'), lab=element('label',label),field=document.createElement(type==='textarea'?'textarea':'input');
      field.id='tool-'+name;field.name=name;lab.htmlFor=field.id;if(type!=='textarea')field.type=type;else field.rows=2;
      field.required=required; if(type!=='date'&&type!=='number')field.maxLength=type==='textarea'?1500:120;
      if(placeholder)field.placeholder=placeholder;if(type==='number'){field.min='0';field.max='999999999.99';field.step='0.01';field.inputMode='decimal';}
      wrap.append(lab,field);return wrap;
    };
    if(displayedArea==='finanzas') {
      const label=element('label','Moneda de esta lista');label.htmlFor='tool-currency'; const currency=element('select');currency.id='tool-currency';currency.name='currency';
      for(const [key,text] of [['DOP','Pesos dominicanos · DOP'],['USD','Dólares · USD'],['EUR','Euros · EUR']]){const o=element('option',text);o.value=key;currency.append(o);}fields.append(label,currency);
      for(let i=0;i<3;i++){const row=element('fieldset',undefined,'payment-row');row.append(element('legend','Pago '+(i+1)),input('name'+i,'text','Concepto','Sin números de cuenta',i===0),input('amount'+i,'number','Importe','0.00'),input('date'+i,'date','Vencimiento'));fields.append(row);}
    } else area.labels.forEach((label,i)=>fields.append(input(['first','second','third'][i],'textarea',label,area.prompts[i],i===0)));
    fillTool(records.get(toolKey(day,displayedArea))?.body);
    $('#reuse-tool').hidden=!previousTool();
  }
  function previousTool(){return [...records.values()].filter(r=>r.key.startsWith('tool:')&&r.body.area===displayedArea&&Number(r.key.split(':')[1])<day).sort((a,b)=>Number(b.key.split(':')[1])-Number(a.key.split(':')[1]))[0];}
  function renderGuide(guide) {
    $('#lesson-audio').pause();$('#lesson-video').pause();$('#audio-status').textContent='';
    $('#guided-lesson').hidden=!guide;$('#lesson-audio-wrap').hidden=!guide?.audio;$('#lesson-video-wrap').hidden=!guide?.video;
    $('#lesson-audio').removeAttribute('src');$('#lesson-video').removeAttribute('src');
    if(!guide)return;
    for(const [id,key] of [['guide-title','title'],['guide-explanation','explanation'],['guide-example','example'],['guide-task','task'],['guide-safety','safety']])$('#'+id).textContent=guide[key]||'';
    $('#audio-transcript').textContent=guide.transcript||'';
    if(guide.audio)$('#lesson-audio').src=guide.audio;if(guide.video)$('#lesson-video').src=guide.video;
  }
  function renderReview() { renderedReview=$('#review-select').value;fill($('#review-form'), records.get('review:' + renderedReview)?.body); }
  function lockPractice(locked){for(const selector of ['#journal-form','#tool-form','#profile-form'])$(selector).querySelectorAll('input,textarea,select,button').forEach(field=>field.disabled=locked);}
  async function renderDay(nextDay,requestedArea) {
    const number = ++loadNumber;
    loadingDay=true;lockPractice(true);
    $('#journal-form').querySelector('button').disabled = true;
    tell('Cargando la práctica…');
    try {
      const data = await api('day?day=' + nextDay+(requestedArea?'&area='+encodeURIComponent(requestedArea):''));
      if (number !== loadNumber) return;
      day = nextDay; dayData = data; $('#day-select').value = String(day);
      displayedArea=data.area || requestedArea || focusArea(day,profileValues());
      const switcher=$('#area-switcher');switcher.replaceChildren();
      for(const key of chosenAreas(profileValues())) {const button=element('button',AREAS[key].name,'quiet');button.type='button';button.setAttribute('aria-pressed',String(key===displayedArea));button.addEventListener('click',()=>{if(key!==displayedArea&&mayNavigate())renderDay(day,key);});switcher.append(button);}
      $('#area-context').textContent='El recorrido alterna tus áreas. Puedes cambiar el foco de hoy; las herramientas guardadas de cada área se conservan por separado.';
      const { lesson, practice } = data;
      $('#day-label').textContent = 'Día ' + day + ' de ' + session.plan.days + ' · ' + lesson.phase;
      $('#day-title').textContent = lesson.theme; $('#day-principle').textContent = lesson.principle;
      $('#day-question').textContent = data.guide?.reflection || lesson.question;
      const sequence = practiceSequence(data.guide ? { action:data.guide.task } : lesson, profileValues().minutes);
      if(data.guide) sequence.steps[1].text=data.guide.activity;
      $('#day-task').textContent = sequence.objective;
      const steps = $('#practice-steps'); steps.replaceChildren();
      for (const step of sequence.steps) {
        const item = element('li'); item.append(element('strong', step.time + ' · ' + step.title), element('p', step.text)); steps.append(item);
      }
      $('#dose-note').textContent = 'Tu bloque de hoy: ' + sequence.minutes + ' minutos en total, incluido el registro. Puedes cambiarlo en el Día 0. Si necesitas parar o descansar, registra esa decisión; no tienes que completar la tarea a cualquier coste.';
      $('#day-companion').textContent = lesson.companion; $('#life-message').textContent = practice.guideMessage;
      renderGuide(data.guide); renderTool(); renderOverview();
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
    finally { if (number === loadNumber) { loadingDay=false;lockPractice(!dayData || !session); } }
  }
  async function save(form, key, body) {
    if (writing || loadingDay || !session || !form.reportValidity()) return;
    writing = true; const button = form.querySelector('button'); button.disabled = true;
    const note = form.querySelector('.save-status'); note.textContent = 'Guardando…';
    const before = formSnapshot(form);
    try {
      const saved = await api('record', { key, body, revision: records.get(key)?.revision || 0 });
      records.set(key, saved.record);
      const editedDuringSave = before !== formSnapshot(form);
      form.dataset.dirty = editedDuringSave ? 'true' : '';
      note.textContent = 'Guardado en el servidor: ' + date(saved.record.updatedAt) + (editedDuringSave ? '. Hay cambios más recientes sin guardar.' : '.');
      renderHistory();
      return !editedDuringSave;
    } catch (error) { note.textContent = error.message; return false; }
    finally { writing = false; button.disabled = false; }
  }
  async function start() {
    sessionGeneration++;
    dayData=null;
    try {
      const loaded = await api('session'); session = loaded; records.clear(); loaded.records.forEach(record => records.set(record.key, record));
      $('#access-entry').hidden = true; $('#member-workspace').hidden = false;
      $('#plan-label').textContent = loaded.plan.name + ' · Contenido digital autoguiado'; $('#expiry').textContent = 'Acceso hasta ' + date(loaded.expiresAt);
      $('#day-select').replaceChildren(...loaded.days.map(value => { const option = element('option', 'Día ' + value.day + ' · ' + value.title); option.value = value.day; return option; }));
      const roadmap = $('#journey-map'); roadmap.replaceChildren();
      for (const phase of journeyMap(loaded.plan.days)) {
        const item = element('li'); item.append(element('strong', 'Días ' + phase.from + '–' + phase.to + ' · ' + phase.title), element('p', phase.description)); roadmap.append(item);
      }
      const reviews = loaded.days.filter(value => value.day % 7 === 0 || value.day === loaded.plan.days);
      $('#review-select').replaceChildren(...reviews.map(value => { const option = element('option', 'Día ' + value.day + (value.day === loaded.plan.days ? ' · Cierre del recorrido' : ' · Revisión semanal')); option.value = value.day; return option; }));
      fill($('#profile-form'), profileValues());
      const areaChoices=$('#profile-areas');areaChoices.replaceChildren();
      for(const key of AREA_ORDER){const label=element('label'),checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.name='areas';checkbox.value=key;checkbox.checked=chosenAreas(profileValues()).includes(key);label.append(checkbox,element('span',AREAS[key].name));areaChoices.append(label);}
      $('#profile-panel').open = !records.has('profile'); renderReview(); renderHistory();
      $('#start-section').open = !records.has('profile') || !loaded.records.some(record => record.key.startsWith('day:'));
      day = loaded.days.find(value => !records.has('day:' + value.day))?.day || loaded.plan.days;
      await renderDay(day);
    } catch (error) { $('#member-workspace').hidden = true; $('#access-entry').hidden = false; tell(error.message); }
  }
  $('#redeem-form').addEventListener('submit', async event => {
    event.preventDefault(); const button = event.currentTarget.querySelector('button'); if (button.disabled) return; button.disabled = true;
    if(hasDraft()){download(JSON.stringify({notice:'Borradores sin guardar. Revisa antes de copiarlos a tu recorrido.',forms:Object.fromEntries(['journal','profile','review','tool'].filter(name=>$('#'+name+'-form').dataset.dirty==='true').map(name=>[name,formValues($('#'+name+'-form'))]))},null,2),'mis-borradores-sin-guardar.json','application/json');if(!window.confirm('Descargamos una copia de tus borradores. ¿Quieres entrar y cargar los registros de este código?')){button.disabled=false;return;}}
    try { await api('redeem', { code: $('#access-code').value.trim() }); $('#access-code').value = ''; await start(); }
    catch (error) { tell(error.message); } finally { button.disabled = false; }
  });
  $('#journal-form').addEventListener('submit', async event => { event.preventDefault(); if (dayData) await save(event.currentTarget, 'day:' + day, { ...formValues(event.currentTarget), minutes: profileValues().minutes, energy: profileValues().energy }); });
  $('#review-form').addEventListener('submit', async event => { event.preventDefault(); if(renderedReview)await save(event.currentTarget, 'review:' + renderedReview, formValues(event.currentTarget)); });
  $('#profile-form').addEventListener('submit', async event => {
    event.preventDefault(); const form = event.currentTarget; const values = formValues(form); values.minutes = Number(values.minutes);
    values.areas=new FormData(form).getAll('areas');if(!values.areas.length){tell('Elige al menos un área; puedes seleccionar varias.');return;}values.lifeArea=values.areas[0];
    if($('#journal-form').dataset.dirty==='true'||$('#tool-form').dataset.dirty==='true'){tell('Guarda primero tu registro y tu herramienta para cambiar tus áreas sin perder el trabajo.');return;}
    if (await save(form, 'profile', values)) { $('#profile-panel').open = false; if ($('#journal-form').dataset.dirty !== 'true') await renderDay(day); else tell('Áreas guardadas. Tu borrador del día sigue aquí; guárdalo antes de recargar la práctica.'); }
  });
  $('#day-select').addEventListener('change', event => { const requested = Number(event.target.value); if (mayNavigate()) renderDay(requested); else event.target.value = String(day); });
  $('#start-priority').addEventListener('click', () => { $('#profile-panel').open = true; });
  document.querySelectorAll('.member-menu nav a').forEach(link => link.addEventListener('click', () => {
    const target = document.querySelector(link.getAttribute('href'));
    if (target?.tagName === 'DETAILS') target.open = true;
    $('.member-menu').open = false;
  }));
  $('#previous-day').addEventListener('click', () => { if (day > 1 && mayNavigate()) renderDay(day - 1); });
  $('#next-day').addEventListener('click', () => { if (day < session.plan.days && mayNavigate()) renderDay(day + 1); });
  $('#review-select').addEventListener('change', () => { if (mayNavigate()) renderReview(); else $('#review-select').value = renderedReview; });
  for (const id of ['#journal-form', '#profile-form', '#review-form', '#tool-form']) $(id).addEventListener('input', () => { $(id).dataset.dirty = 'true'; });
  $('#tool-form').addEventListener('input',updateToolPreview);
  $('#tool-form').addEventListener('submit',async event=>{event.preventDefault();if(dayData&&day<=7)await save(event.currentTarget,toolKey(day,displayedArea),toolBody());});
  $('#reuse-tool').addEventListener('click',()=>{const previous=previousTool();if(previous&&mayNavigate()){fillTool(previous.body);$('#tool-form').dataset.dirty='true';$('#tool-form .save-status').textContent='Copia preparada. Revísala y guarda para conservarla en este día.';}});
  $('#continue-practice').addEventListener('click',()=>{const target=records.has('profile')?$('#day-section'):$('#profile-panel');if(target.tagName==='DETAILS')target.open=true;target.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});(records.has('profile')?$('#day-title'):$('#goal')).focus({preventScroll:true});});
  $('#lesson-audio').addEventListener('error',()=>{$('#audio-status').textContent='No se pudo cargar el audio. Puedes leer la transcripción y continuar.';});
  window.addEventListener('beforeunload', event => { if (hasDraft() || writing) { event.preventDefault(); event.returnValue = ''; } });
  function download(text, filename, type = 'text/plain;charset=utf-8') { const url = URL.createObjectURL(new Blob([text], { type })); const link = element('a'); link.href = url; link.download = filename; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
  $('#export-records').addEventListener('click', async () => {
    try { const latest = await api('session'); download(formatJournalExport(latest), 'mi-diario-100-dias.txt'); tell('Descargaste tu diario en texto legible. Incluye lo confirmado por el servidor, no los borradores sin guardar.'); } catch (error) { tell(error.message); }
  });
  $('#export-backup').addEventListener('click', async () => { try { const latest = await api('session'); download(JSON.stringify({ program: '100 Días — El Método', exportedAt: new Date().toISOString(), records: latest.records }, null, 2), 'mis-registros-100-dias.json', 'application/json'); tell('Copia de datos descargada. No incluye el código de acceso ni los borradores.'); } catch (error) { tell(error.message); } });
  $('#recover-code').addEventListener('click', async () => { try { const { access } = await api('access'); download('100 Días — El Método\nCódigo privado: ' + access.code + '\nEntrar: ' + location.origin + access.url + '\nAcceso hasta: ' + date(access.expiresAt) + '\nNo compartas este archivo.\n', 'mi-acceso-100-dias.txt'); } catch (error) { tell(error.message); } });
  $('#logout').addEventListener('click', async () => { if (!mayNavigate()) return; try { await api('logout', {}); sessionGeneration++; for (const id of ['#journal-form', '#profile-form', '#review-form','#tool-form']) $(id).dataset.dirty = ''; try { localStorage.removeItem('metodo-checkout-last-order-v1'); } catch {} location.reload(); } catch (error) { tell(error.message); } });
  start();
})();
