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
    headers: { 'Content-Type': 'application/json' },
    keepalive: true,
    body: JSON.stringify({ name, detail, path: location.pathname, referrerHost, ...campaign }),
  }).catch(() => {});

  document.querySelectorAll('[data-utm-field]').forEach((field) => {
    field.value = campaign[field.dataset.utmField] || '';
  });
  document.querySelectorAll('[data-track]').forEach((element) => {
    element.addEventListener('click', () => send(element.dataset.track, element.dataset.detail || ''));
  });
  send('page_view');
})();
