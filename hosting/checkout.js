(() => {
  const form = document.querySelector('#checkout-form');
  if (!form) return;
  const state = document.querySelector('#checkout-state');
  const next = document.querySelector('#checkout-continue');
  const container = document.querySelector('#paypal-buttons');
  const recovery = document.querySelector('#checkout-recovery');
  const accessPanel = document.querySelector('#checkout-access');
  const codeField = document.querySelector('#purchase-code');
  const LAST_ORDER = 'metodo-checkout-last-order-v1';
  let order, access, busy = false;
  const message = text => { state.textContent = text; };
  const messages = {
    sales_closed: 'No se están aceptando compras nuevas en este momento.',
    checkout_unavailable: 'No pudimos confirmar la operación. Consulta su estado antes de volver a pagar.',
    invalid_request: 'Revisa el plan y escribe un correo válido.',
    session_missing: 'Esta sesión ya no está disponible. Si pagaste, usa tu código o contacta con soporte antes de volver a comprar.',
    order_not_found: 'No encontramos esta compra en tu sesión. Si ya pagaste, usa tu código o contacta con soporte.',
    order_conflict: 'Esta solicitud corresponde a otro plan. No se modificó su importe.',
    order_expired: 'La solicitud venció. Si no llegaste a pagar, recarga para iniciar otra.',
    rate_limited: 'Hay varias solicitudes recientes. Espera antes de intentar otra vez.',
    plan_not_available: 'Ese paquete todavía no está disponible para comprar.',
    terms_required: 'Lee las condiciones y marca la casilla de aceptación antes de continuar.',
    payment_mismatch: 'No se pudo validar el importe o destino del pago. No se habilitó acceso.',
    instrument_declined: 'PayPal rechazó ese medio de pago. Elige otro dentro de PayPal.',
  };
  async function api(path, body) {
    const response = await fetch(path, { method: body === undefined ? 'GET' : 'POST', credentials: 'same-origin', headers: body === undefined ? {} : { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
    const data = await response.json();
    if (!response.ok) { const error = new Error(messages[data.error] || 'No pudimos confirmar la operación. No vuelvas a pagar hasta consultar su estado.'); error.code = data.error; throw error; }
    return data;
  }
  function showReceipt(receipt) {
    const texts = {
      paid: receipt.access ? 'Pago confirmado. Guarda tu código y entra al recorrido.' : 'Pago confirmado. La entrega aún no está disponible; conserva la referencia y contacta con soporte.',
      pending: 'PayPal está revisando el pago. Aún no está confirmado. No repitas el pago.',
      refunded: 'El pago fue reembolsado; su acceso ya no está activo.', reversed: 'PayPal revirtió el pago; su acceso ya no está activo.',
      review: 'El pago necesita revisión. No se habilitó acceso.', denied: 'El pago fue rechazado; no se habilitó acceso.',
    };
    message((receipt.sandbox ? 'PRUEBA · Sin dinero real. ' : '') + (texts[receipt.status] || 'La compra todavía no tiene un pago confirmado.') + ' Referencia: ' + receipt.id);
    access = receipt.access || null; accessPanel.hidden = !access; codeField.value = access?.code || '';
    if (access) { next.disabled = true; container.replaceChildren(); }
  }
  function rememberOrder(value) {
    order = value; recovery.hidden = false;
    // Only a non-secret reference is local; it never grants access by itself.
    try { localStorage.setItem(LAST_ORDER, JSON.stringify({ id: value.id, paypalOrderId: value.paypalOrderId })); } catch {}
  }
  try { const saved = JSON.parse(localStorage.getItem(LAST_ORDER) || 'null'); if (/^[a-f0-9-]{36}$/.test(saved?.id || '')) { order = saved; recovery.hidden = false; } } catch {}
  document.querySelector('#check-last-order').addEventListener('click', async event => {
    if (!order || busy) return;
    event.currentTarget.disabled = true;
    try { showReceipt(await api('/api/checkout/orders/' + order.id)); }
    catch (error) { message(error.message); }
    finally { document.querySelector('#check-last-order').disabled = false; }
  });
  document.querySelector('#save-purchase-code').addEventListener('click', () => {
    if (!access) return;
    const content = '100 Días — El Método\nCódigo privado: ' + access.code + '\nEntrar: ' + location.origin + access.url + '\nAcceso hasta: ' + new Date(access.expiresAt).toLocaleString('es') + '\nNo compartas este archivo.\nSoporte: https://www.instagram.com/100diaselmetodo/\n';
    const url = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = 'mi-acceso-100-dias.txt'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  const requested = new URLSearchParams(location.search).get('plan');
  if (['alpha', 'metodo'].includes(requested)) form.querySelector('input[value="' + requested + '"]').checked = true;
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (next.disabled || busy || !form.reportValidity()) return;
    busy = true; next.disabled = true; message('Preparando PayPal…');
    try {
      const config = await api('/api/checkout/config');
      if (!config.enabled) throw new Error(messages.sales_closed);
      const data = new FormData(form);
      const selection = { plan: data.get('plan'), email: data.get('email'), requestId: crypto.randomUUID(), terms: data.get('terms') === 'on' };
      if (!window.paypal) await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        const params = new URLSearchParams({ 'client-id': config.clientId, currency: 'USD', intent: 'capture', components: 'buttons', locale: 'es_ES', 'disable-funding': 'paylater,credit' });
        script.src = 'https://www.paypal.com/sdk/js?' + params;
        script.onload = resolve; script.onerror = () => { script.remove(); reject(new Error('No se pudo cargar PayPal. Inténtalo más tarde.')); }; document.head.append(script);
      });
      form.querySelectorAll('input').forEach(input => { input.disabled = true; });
      const buttons = window.paypal.Buttons({
        style: { layout: 'vertical', label: 'pay', shape: 'rect' },
        createOrder: async () => { const created = await api('/api/paypal/orders', selection); rememberOrder(created); return created.paypalOrderId; },
        onApprove: async (data, actions) => {
          if (busy) return;
          busy = true; message('Confirmando el pago con PayPal. No cierres esta página…');
          try { const receipt = await api('/api/paypal/orders/' + order.id + '/capture', { paypalOrderId: data.orderID }); await buttons.close(); showReceipt(receipt); }
          catch (error) { message(error.message); if (error.code === 'instrument_declined') return actions.restart(); }
          finally { busy = false; }
        },
        onCancel: () => message('Saliste de PayPal sin confirmar esta compra. Puedes continuar con la misma solicitud.'),
        onError: () => message('PayPal no pudo completar la operación. Si ya aprobaste un pago, consulta su estado antes de repetirlo.'),
      });
      await buttons.render(container);
      message(config.sandbox ? 'Entorno de prueba: usa una cuenta Sandbox. No se cobra dinero real.' : 'Completa la autorización en PayPal. Después volverás aquí para recibir tu acceso.');
    } catch (error) {
      message(error.message); next.disabled = false;
      form.querySelectorAll('input').forEach(input => { input.disabled = false; });
    } finally { busy = false; }
  });
})();
