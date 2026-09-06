(() => {
  const query = new URLSearchParams(location.search);
  const campaign = {
    source: query.get('utm_source') || '',
    medium: query.get('utm_medium') || '',
    campaign: query.get('utm_campaign') || '',
  };
  const referrerHost = (() => {
    try { return document.referrer ? new URL(document.referrer).hostname : ''; }
    catch { return ''; }
  })();
  const send = (name, detail = '') => fetch('/api/events', {
    method: 'POST',
    credentials: 'omit',
    headers: { 'Content-Type': 'application/json' },
    keepalive: true,
    body: JSON.stringify({ name, detail, path: location.pathname, referrerHost, ...campaign }),
  }).catch(() => {});

  document.querySelectorAll('[data-utm-field]').forEach((field) => {
    field.value = campaign[field.dataset.utmField] || '';
  });
  document.querySelectorAll('[data-track]').forEach((element) => {
    element.addEventListener('click', () => send(element.dataset.track, element.dataset.detail || element.dataset.interest || ''));
  });
  // Carry only campaign labels to the same-site checkout; never copy other
  // query parameters or persist browser identifiers.
  document.querySelectorAll('a[href^="/comprar?plan="]').forEach(link=>{
    const target=new URL(link.getAttribute('href'),location.origin);
    for(const key of ['source','medium','campaign'])if(campaign[key])target.searchParams.set('utm_'+key,campaign[key].slice(0,120));
    link.href=target.pathname+target.search;
  });

  // Enhance the existing POST form; without JavaScript the server flow still works.
  // Never clear fields or announce success before the server confirms the redirect.
  const form = document.querySelector('.waitlist-form');
  if (form) {
    const button = form.querySelector('button[type="submit"]');
    const status = form.querySelector('.waitlist-status');
    const originalLabel = button.textContent;
    let submitting = false;

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (submitting) return;
      if (!form.reportValidity()) return;
      submitting = true;
      button.disabled = true;
      button.textContent = 'Enviando tu correo…';
      form.setAttribute('aria-busy', 'true');
      status.hidden = false;
      status.textContent = 'Estamos enviando tu solicitud. Espera un momento.';
      let confirmed = false;
      try {
        const response = await fetch(form.action, {
          method: 'POST',
          body: new URLSearchParams(new FormData(form)),
          credentials: 'same-origin',
        });
        const destination = new URL(response.url, location.href);
        if (response.ok && response.redirected && destination.origin === location.origin && destination.pathname === '/gracias.html') {
          location.assign(destination.href);
          confirmed = true;
          status.textContent = 'Correo registrado. Abriendo la confirmación…';
          return;
        }
        status.textContent = response.status === 400
          ? 'Revisa tu correo y la casilla de consentimiento. No borramos lo que escribiste.'
          : 'No pudimos confirmar el registro. Tus campos siguen aquí; vuelve a intentarlo en un momento.';
      } catch {
        status.textContent = 'No pudimos confirmar el registro. Revisa tu conexión y vuelve a intentarlo. Tus campos siguen aquí.';
      } finally {
        if (!confirmed) {
          submitting = false;
          button.disabled = false;
          button.textContent = originalLabel;
          form.removeAttribute('aria-busy');
          status.focus();
        }
      }
    });
  }
  send('page_view');
})();
