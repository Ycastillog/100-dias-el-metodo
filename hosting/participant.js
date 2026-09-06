import { practiceSequence, journeyMap, formatJournalExport } from './participant-tools.js';
import { AREAS, AREA_ORDER, chosenAreas, focusArea, toolKey, summarizeJourney, toolPreview } from './guided-tools.js';
import { BALANCE_STATES, AREA_CONTEXT, reviewDays, systemSnapshot, formatSystemReport } from './system-tools.js';
import { PRACTICE_WISDOM } from './practice-wisdom.js';

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
  function profileValues() { return records.get('profile')?.body || { goal: '', evidence: '', firstStep: '', minutes: 10, energy: 'steady', lifeArea: 'mentalidad' }; }
  function hasDraft() { return ['#journal-form', '#profile-form', '#review-form', '#tool-form', '#recovery-form'].some(id => $(id).dataset.dirty === 'true'); }
  function mayNavigate() { if (writing || loadingDay) { tell('Espera a que termine la carga o el guardado antes de cambiar.'); return false; } return !hasDraft() || window.confirm('Hay cambios sin guardar. ¿Quieres continuar sin guardarlos?'); }
  function element(tag, text, className) { const node = document.createElement(tag); if (text !== undefined) node.textContent = text; if (className) node.className = className; return node; }
  function renderBalance(container, prefix, values = {}) {
    const target=$(container); target.replaceChildren();
    for (const area of AREA_ORDER) {
      const row=element('div',undefined,'balance-row'),label=element('label',AREA_CONTEXT[area].question),select=element('select');
      select.name=prefix+':'+area; select.id=prefix+'-'+area; label.htmlFor=select.id;
      for(const [key,text] of Object.entries(BALANCE_STATES)){const option=element('option',text);option.value=key;select.append(option);}
      select.value=values[area] || ''; row.append(label,select);target.append(row);
    }
  }
  function valuesWithBalance(form,prefix) {
    const values=formValues(form);values[prefix]={};
    for(const key of AREA_ORDER){values[prefix][key]=values[prefix+':'+key] || '';delete values[prefix+':'+key];}
    return values;
  }
  function renderSystem() {
    if(!session)return;
    const state=systemSnapshot(records,session.plan.days),grid=$('#system-areas');grid.replaceChildren();
    for(const [index,area] of state.areas.entries()){
      const card=element('article',undefined,'system-area');
      card.append(element('p',String(index+1).padStart(2,'0')+' / '+area.name,'eyebrow'),element('h3',area.title));
      card.append(element('p',area.latest?toolPreview(area.latest.body):area.purpose,area.latest?'system-tool-text':'muted'));
      card.append(element('p',area.latest?'Última versión: '+date(area.latest.updatedAt):'Todavía no guardaste esta herramienta.','fine'));
      const button=element('button',area.latest?'Abrir mi herramienta →':'Preparar mi herramienta →','quiet');button.type='button';
      button.addEventListener('click',async()=>{if(!mayNavigate())return;await renderDay(day,area.key);if(displayedArea!==area.key||!dayData)return;const target=$('#tool-section');target.scrollIntoView({block:'start'});$('#tool-title').setAttribute('tabindex','-1');$('#tool-title').focus({preventScroll:true});});
      card.append(button);grid.append(card);
    }
    const report=$('#system-report');report.replaceChildren();
    report.append(element('p',`${state.recorded} días con registro · ${state.counts.complete} completados · ${state.counts.partial} parciales · ${state.counts.missed} sin avance.`,'report-counts'));
    const table=element('table',undefined,'balance-table'),caption=element('caption','Mi punto de partida y mi última revisión valorada'),head=element('thead'),headRow=element('tr');
    for(const text of ['Área','Al empezar','Última valoración']){const cell=element('th',text);cell.scope='col';headRow.append(cell);}head.append(headRow);table.append(caption,head);
    const body=element('tbody');
    for(const area of state.areas){const row=element('tr'),name=element('th',area.name);name.scope='row';row.append(name,element('td',area.baseline),element('td',area.current?area.current+' · Día '+area.reviewDay:'Sin revisión valorada'));body.append(row);}table.append(body);
    const wrapper=element('div',undefined,'table-scroll');wrapper.append(table);report.append(wrapper,element('p','Estas valoraciones son tuyas. Los registros anteriores sin área identificada se conservan sin asignarles una retrospectivamente.','fine'));
    const milestones=element('div',undefined,'milestone-actions');
    for(const d of (session.plan.days===14?[7,14]:[7,30,60,100])){const button=element('button','Día '+d+' · '+(records.has('review:'+d)?'Revisión guardada':'Revisar'),'quiet');button.type='button';button.addEventListener('click',()=>{if(!mayNavigate())return;$('#review-select').value=String(d);renderReview();$('#weekly-section').scrollIntoView({block:'start'});$('#worked').focus({preventScroll:true});});milestones.append(button);}
    report.append(milestones);
    const last=state.reviews.at(-1);report.append(element('h3','Mi siguiente decisión'),element('p',last?.body.nextStep || 'Aparecerá aquí cuando guardes una revisión. Al cerrar, escribe qué mantendrás y cuándo volverás a revisarlo.','continuity-note'));
  }
  function renderDirection() {
    const profile = profileValues(), ready = records.has('profile');
    $('#direction-goal').textContent = ready ? profile.goal : 'Todavía no lo definiste.';
    $('#direction-evidence').textContent = ready ? (profile.evidence || 'Añade en el Día 0 una señal observable para reconocer avance.') : 'Elige una señal observable para reconocer avance.';
    $('#direction-primary').textContent = ready ? (AREAS[profile.lifeArea]?.name || 'Por definir') : 'Por definir';
    $('#direction-rhythm').textContent = (profile.minutes || 10) + ' minutos por práctica';
    $('#direction-first-step').textContent = ready ? (profile.firstStep || 'Añade un primer movimiento en el Día 0.') : 'Por definir';
    $('#direction-title').textContent = ready ? 'La dirección que elegiste.' : 'Empieza por definir una dirección.';
    $('#edit-direction').textContent = ready ? 'Ajustar mi brújula →' : 'Definir mi brújula →';
    $('#review-direction').textContent = ready ? `Tu norte: ${profile.goal} · Evidencia que elegiste observar: ${profile.evidence || 'aún no definida'}.` : 'Define primero tu brújula en el Día 0 para saber con qué comparar tus registros.';
  }
  function syncPrimaryAreaChoice() {
    const primary = $('#profile-form').elements.namedItem('lifeArea')?.value;
    for (const checkbox of $('#profile-areas').querySelectorAll('input')) {
      const isPrimary = checkbox.value === primary;
      if (isPrimary) checkbox.checked = true;
      checkbox.disabled = isPrimary;
    }
  }
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
    const tools=[...records.values()].filter(record=>/^tool:[1-9]\d{0,2}:/.test(record.key)).sort((a,b)=>Number(b.key.split(':')[1])-Number(a.key.split(':')[1]));
    if(tools.length)container.append(element('h3','Mis herramientas guardadas'));
    for(const record of tools){
      const item=element('details',undefined,'saved-tool'),number=Number(record.key.split(':')[1]);
      item.append(element('summary','Día '+number+' · '+AREAS[record.body.area].name),element('p',toolPreview(record.body),'saved-tool-text'));
      if(record.body.area==='finanzas')for(const row of record.body.rows)if(row.name.trim())item.append(element('p',row.name+' · '+(row.amount||'importe pendiente')+' '+record.body.currency+' · '+(row.date||'fecha pendiente')));
      const button=element('button','Volver a esta herramienta','quiet');button.type='button';button.addEventListener('click',async()=>{if(mayNavigate()){await renderDay(number,record.body.area);$('#day-title').focus();}});item.append(button);container.append(item);
    }
    $('#current-goal').textContent = records.get('profile')?.body.goal ? 'Tu norte: ' + records.get('profile').body.goal : 'Empieza definiendo tu brújula en el Día 0.';
    $('#start-priority').textContent = records.has('profile') ? 'Tu brújula está guardada: revísala o ajústala' : 'Define tu norte y la evidencia que buscarás en el Día 0';
    $('#start-record').textContent = days.length ? 'Ya tienes un registro: continúa tu práctica' : 'Haz una acción y guarda tu primer registro';
    renderDirection();
    renderOverview();
    renderSystem();
  }
  function renderOverview() {
    if (!session) return;
    const summary = summarizeJourney(records, session.plan.days);
    const area = AREAS[displayedArea] || AREAS.mentalidad;
    $('#today-area').textContent = 'Foco de hoy · '+area.name;
    const profile = profileValues(), task = dayData?.guide?.task || dayData?.lesson.task || 'Una práctica para aprender, hacer y revisar.';
    $('#today-title').textContent = records.has('profile') ? 'Día ' + day + ' · ' + (dayData?.lesson.theme || 'Tu siguiente práctica') : 'Primero, define hacia dónde vas.';
    $('#today-description').textContent = records.has('profile') ? task : 'En el Día 0 mirarás las cinco áreas y elegirás una dirección y una señal para reconocer avance.';
    $('#continue-practice').textContent = records.has('profile') ? 'Ir a mi práctica →' : 'Definir mi brújula →';
    $('#today-context').textContent = records.has('profile') ? `${profile.minutes} minutos · Hoy trabajas ${area.name.toLowerCase()}. Las siguientes prácticas conectan las demás áreas elegidas.` : 'Después recibirás una acción por día y revisarás tu evidencia cada siete días.';
    const weekStart=Math.floor((day-1)/7)*7+1,weekEnd=Math.min(weekStart+6,session.plan.days);
    const weekRows=[...records.values()].filter(row=>/^day:/.test(row.key)&&Number(row.key.slice(4))>=weekStart&&Number(row.key.slice(4))<=weekEnd);
    $('#week-label').textContent='Mi semana · Días '+weekStart+'–'+weekEnd;
    $('#week-summary').textContent = weekRows.length + ' de '+(weekEnd-weekStart+1)+' días con registro en esta semana.';
    for (const state of ['complete','partial','missed']) $('#count-'+state).textContent=String(weekRows.filter(row=>row.body.state===state).length);
    const nav=$('#week-days'); nav.replaceChildren();
    for(let d=weekStart;d<=weekEnd;d++) {
      const saved=records.get('day:'+d)?.body.state;
      const btn=element('button',String(d),saved?'week-day '+saved:'week-day'); btn.type='button';
      const label={complete:'completado',partial:'parcial',missed:'sin avance'}[saved] || 'sin registro';
      btn.setAttribute('aria-label','Día '+d+' · '+label); if(d===day)btn.setAttribute('aria-current','step');
      btn.addEventListener('click',()=>{if(d!==day && mayNavigate())renderDay(d);}); nav.append(btn);
    }
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
    const section=$('#tool-section'); section.hidden=false;
    const wisdom=PRACTICE_WISDOM[displayedArea];
    $('#practice-wisdom').open=false;
    for(const key of ['origin','title','idea','exercise','caution']) $('#wisdom-'+key).textContent=wisdom[key];
    const source=$('#wisdom-source');source.hidden=!wisdom.source;
    if(wisdom.source){source.href=wisdom.source;source.textContent=wisdom.sourceTitle+' ↗';}else{source.removeAttribute('href');source.textContent='';}
    const area=AREAS[displayedArea]; $('#tool-area').textContent=area.name; $('#tool-title').textContent=AREA_CONTEXT[displayedArea].title;
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
    const saved=records.get(toolKey(day,displayedArea)),previous=previousTool();
    fillTool(saved?.body || previous?.body);
    if(!saved&&previous)$('#tool-form .save-status').textContent='Última herramienta cargada como punto de partida. Revísala y guarda para crear una versión en este día.';
    $('#reuse-tool').hidden=!previous;
  }
  function previousTool(){return [...records.values()].filter(r=>r.key.startsWith('tool:')&&r.body.area===displayedArea&&r.key!==toolKey(day,displayedArea)).sort((a,b)=>(Date.parse(b.updatedAt)||0)-(Date.parse(a.updatedAt)||0) || Number(b.key.split(':')[1])-Number(a.key.split(':')[1]))[0];}
  function renderGuide(guide) {
    $('#lesson-audio').pause();$('#lesson-video').pause();$('#audio-status').textContent='';
    $('#guided-lesson').hidden=!guide;$('#lesson-audio-wrap').hidden=!guide?.audio;$('#lesson-video-wrap').hidden=!guide?.video;
    $('#lesson-audio').removeAttribute('src');$('#lesson-video').removeAttribute('src');
    $('#practice-check').hidden=!guide;
    if(!guide)return;
    for(const [id,key] of [['guide-title','title'],['guide-explanation','explanation'],['guide-example','example'],['guide-bridge','bridge'],['guide-evidence','evidence'],['guide-smaller','smaller'],['guide-safety','safety']])$('#'+id).textContent=guide[key]||'';
    $('#guide-context').open=false;$('#guide-reduce').open=false;
    $('#audio-transcript').textContent=guide.transcript||'';
    if(guide.audio)$('#lesson-audio').src=guide.audio;if(guide.video)$('#lesson-video').src=guide.video;
  }
  function renderReview() {
    const profile=profileValues();renderedReview=$('#review-select').value;const saved=records.get('review:' + renderedReview)?.body;fill($('#review-form'),saved);
    renderBalance('#review-balance-fields','balance',saved?.balance);
    $('#review-direction').textContent=records.has('profile')?`Tu norte: ${profile.goal} · Evidencia que elegiste observar: ${profile.evidence || 'aún no definida'}.`:'Define primero tu punto de partida en el Día 0 para saber con qué comparar tus registros.';
    $('#review-next-label').textContent=Number(renderedReview)===session?.plan.days?'¿Qué mantendré al terminar y cuándo volveré a revisarlo?':'¿Qué ajustaré o mantendré desde ahora?';
    $('#review-coaching').textContent=Number(renderedReview)===session?.plan.days?'Tu cierre: compara el Día 0 con tus registros. Separa lo que observaste, lo que sigue abierto y lo que no puedes concluir. Elige hasta dos prácticas para continuar, un lugar donde anotarlas y una fecha para revisarlas. Descarga tu diario y tu informe antes del vencimiento.':Number(renderedReview)<=7?'Tu primera revisión: busca un intento real y una dificultad. Mira las cinco áreas, aunque alguna siga sin registros. Decide un solo ajuste para la próxima semana; no necesitas convertir todas tus intenciones en nuevas tareas.':'Revisa hechos, no solo la sensación de la semana. Compara un intento con tu señal del Día 0; reconoce qué condición te ayudó y qué necesitas reducir o cambiar. Guarda un ajuste concreto, sin exigir avances en todas las áreas.';
    const number=Number(renderedReview),from=number===30||number===60?number-29:number===100?61:Math.max(1,number-6),areas=$('#area-review');areas.replaceChildren();
    for(const key of AREA_ORDER){const relevant=[...records.values()].filter(r=>r.key.startsWith('tool:')&&r.body.area===key&&Number(r.key.split(':')[1])>=from&&Number(r.key.split(':')[1])<=number);const item=element('div');item.append(element('strong',AREAS[key].name),element('p',relevant.length+' herramientas guardadas · Días '+from+'–'+number));areas.append(item);}
  }
  function lockPractice(locked){for(const selector of ['#journal-form','#tool-form','#profile-form','#recovery-form'])$(selector).querySelectorAll('input,textarea,select,button').forEach(field=>field.disabled=locked);if(!locked)syncPrimaryAreaChoice();}
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
      for(const key of [...new Set([...chosenAreas(profileValues()),displayedArea])]) {const button=element('button',AREAS[key].name,'quiet');button.type='button';button.setAttribute('aria-pressed',String(key===displayedArea));button.addEventListener('click',()=>{if(key!==displayedArea&&mayNavigate())renderDay(day,key);});switcher.append(button);}
      $('#area-context').textContent='El recorrido alterna tus áreas. Puedes cambiar el foco de hoy; las herramientas guardadas de cada área se conservan por separado.';
      const { lesson, practice } = data;
      $('#day-label').textContent = 'Día ' + day + ' de ' + session.plan.days + ' · ' + lesson.phase;
      $('#day-title').textContent = lesson.theme; $('#day-principle').textContent = lesson.principle; $('#day-principle').hidden=!!data.guide;
      const profile=profileValues();
      $('#day-direction').textContent=records.has('profile')?`Tu norte: ${profile.goal}. Hoy trabajas con ${AREAS[displayedArea].name.toLowerCase()}.`:'Completa el Día 0 para conectar cada práctica con tu situación y una dirección personal.';
      $('#day-question').textContent = data.guide?.reflection || lesson.question;
      const sequence = practiceSequence(data.guide ? { action:data.guide.task, evidence:data.guide.evidence } : lesson, profileValues().minutes);
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
      fill($('#journal-form'), records.get('day:' + day)?.body || { action: day===1 ? profileValues().firstStep || '' : '', state: 'partial' });
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
      const reviews = loaded.days.filter(value => reviewDays(loaded.plan.days).includes(value.day));
      $('#review-select').replaceChildren(...reviews.map(value => { const option = element('option', 'Día ' + value.day + (value.day === loaded.plan.days ? ' · Cierre del recorrido' : value.day===30||value.day===60?' · Hito de etapa':' · Revisión semanal')); option.value = value.day; return option; }));
      fill($('#profile-form'), profileValues());
      renderBalance('#baseline-fields','baseline',profileValues().baseline);
      fill($('#recovery-form'),records.get('recovery')?.body);
      const areaChoices=$('#profile-areas');areaChoices.replaceChildren();
      for(const key of AREA_ORDER){const label=element('label'),checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.name='areas';checkbox.value=key;checkbox.checked=chosenAreas(profileValues()).includes(key);label.append(checkbox,element('span',AREAS[key].name));areaChoices.append(label);}
      syncPrimaryAreaChoice();renderDirection();
      $('#profile-panel').open = !records.has('profile'); renderReview(); renderHistory();
      $('#start-section').open = !records.has('profile') || !loaded.records.some(record => record.key.startsWith('day:'));
      day = loaded.days.find(value => !records.has('day:' + value.day))?.day || loaded.plan.days;
      await renderDay(day);
    } catch (error) { $('#member-workspace').hidden = true; $('#access-entry').hidden = false; tell(error.message); }
  }
  $('#redeem-form').addEventListener('submit', async event => {
    event.preventDefault(); const button = event.currentTarget.querySelector('button'); if (button.disabled) return; button.disabled = true;
    if(hasDraft()){download(JSON.stringify({notice:'Borradores sin guardar. Revisa antes de copiarlos a tu recorrido.',forms:Object.fromEntries(['journal','profile','review','tool','recovery'].filter(name=>$('#'+name+'-form').dataset.dirty==='true').map(name=>[name,formValues($('#'+name+'-form'))]))},null,2),'mis-borradores-sin-guardar.json','application/json');if(!window.confirm('Descargamos una copia de tus borradores. ¿Quieres entrar y cargar los registros de este código?')){button.disabled=false;return;}}
    try { await api('redeem', { code: $('#access-code').value.trim() }); $('#access-code').value = ''; await start(); }
    catch (error) { tell(error.message); } finally { button.disabled = false; }
  });
  $('#journal-form').addEventListener('submit', async event => { event.preventDefault(); if (dayData) await save(event.currentTarget, 'day:' + day, { ...formValues(event.currentTarget), minutes: profileValues().minutes, energy: profileValues().energy, area:displayedArea }); });
  $('#review-form').addEventListener('submit', async event => { event.preventDefault(); if(renderedReview)await save(event.currentTarget, 'review:' + renderedReview, valuesWithBalance(event.currentTarget,'balance')); });
  $('#profile-form').addEventListener('submit', async event => {
    event.preventDefault(); const form = event.currentTarget; const values = valuesWithBalance(form,'baseline'); values.minutes = Number(values.minutes);
    values.areas=[...new Set([values.lifeArea,...new FormData(form).getAll('areas')])];
    if($('#journal-form').dataset.dirty==='true'||$('#tool-form').dataset.dirty==='true'){tell('Guarda primero tu registro y tu herramienta para cambiar tus áreas sin perder el trabajo.');return;}
    if (await save(form, 'profile', values)) { $('#profile-panel').open = false; if ($('#journal-form').dataset.dirty !== 'true') await renderDay(day); else tell('Áreas guardadas. Tu borrador del día sigue aquí; guárdalo antes de recargar la práctica.'); }
  });
  $('#profile-form').addEventListener('change',event=>{if(event.target.name==='lifeArea')syncPrimaryAreaChoice();});
  $('#day-select').addEventListener('change', event => { const requested = Number(event.target.value); if (mayNavigate()) renderDay(requested); else event.target.value = String(day); });
  $('#start-priority').addEventListener('click', () => { $('#profile-panel').open = true; });
  $('#edit-direction').addEventListener('click', () => { $('#profile-panel').open = true; });
  document.querySelectorAll('.member-menu nav a').forEach(link => link.addEventListener('click', () => {
    const target = document.querySelector(link.getAttribute('href'));
    if (target?.tagName === 'DETAILS') target.open = true;
    $('.member-menu').open = false;
  }));
  $('#previous-day').addEventListener('click', () => { if (day > 1 && mayNavigate()) renderDay(day - 1); });
  $('#next-day').addEventListener('click', () => { if (day < session.plan.days && mayNavigate()) renderDay(day + 1); });
  $('#review-select').addEventListener('change', () => { if (mayNavigate()) renderReview(); else $('#review-select').value = renderedReview; });
  for (const id of ['#journal-form', '#profile-form', '#review-form', '#tool-form','#recovery-form']) $(id).addEventListener('input', () => { $(id).dataset.dirty = 'true'; });
  $('#tool-form').addEventListener('input',updateToolPreview);
  $('#tool-form').addEventListener('submit',async event=>{event.preventDefault();if(dayData)await save(event.currentTarget,toolKey(day,displayedArea),toolBody());});
  $('#recovery-form').addEventListener('submit',async event=>{event.preventDefault();await save(event.currentTarget,'recovery',{...formValues(event.currentTarget),day});});
  $('#use-recovery').addEventListener('click',()=>{if(!session||!dayData||!mayNavigate())return;const recovery=records.get('recovery')?.body;if(!recovery){tell('Guarda primero tu plan para retomar.');return;}fill($('#journal-form'),{...formValues($('#journal-form')),action:recovery.action,state:'partial',nextStep:recovery.when});$('#journal-form').dataset.dirty='true';$('#journal-form .save-status').textContent='Borrador preparado, todavía sin guardar. Haz el intento y registra después cómo quedó.';$('#journal-form').scrollIntoView({block:'start'});$('#action').focus({preventScroll:true});});
  $('#export-system').addEventListener('click',async()=>{try{const latest=await api('session');download(formatSystemReport(latest),'mi-sistema-personal-100-dias.txt');tell('Informe descargado con tus registros confirmados.');}catch(error){tell(error.message);}});
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
  $('#logout').addEventListener('click', async () => { if (!mayNavigate()) return; try { await api('logout', {}); sessionGeneration++; for (const id of ['#journal-form', '#profile-form', '#review-form','#tool-form','#recovery-form']) $(id).dataset.dirty = ''; try { localStorage.removeItem('metodo-checkout-last-order-v1'); } catch {} location.reload(); } catch (error) { tell(error.message); } });
  start();
})();
