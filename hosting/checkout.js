(() => {
  const form = document.querySelector('#checkout-form');
  if (!form) return;
  const state = document.querySelector('#checkout-state');
  const next = document.querySelector('#checkout-continue');
  const container = document.querySelector('#paypal-buttons');
  let order;
  let requestId = crypto.randomUUID();
  const message = text => { state.textContent = text; };
  const messages = {
    sales_closed: 'Los pagos todavía no están habilitados.',
    checkout_unavailable: 'El checkout no está disponible. No se inició un cobro.',
    invalid_request: 'Revisa el plan y escribe un correo válido.',
    session_missing: 'Recarga esta página para iniciar una sesión de compra segura.',
    order_not_found: 'No encontramos esta compra en tu sesión.',
    order_conflict: 'Esta solicitud ya corresponde a otro plan. Recarga la página.',
    order_expired: 'La solicitud venció. Recarga la página antes de intentarlo otra vez.',
    rate_limited: 'Hay varias solicitudes recientes. Espera antes de intentar otra vez.',
    payment_mismatch: 'No se pudo validar el importe o destino del pago. No se habilitó acceso.',
    instrument_declined: 'PayPal rechazó ese medio de pago. Elige otro dentro de PayPal.',
  };
  async function api(path, body) {
    const response = await fetch(path, { method: body === undefined ? 'GET' : 'POST', credentials: 'same-origin',
      headers: body === undefined ? {} : { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
    const data = await response.json();
    if (!response.ok) {
      const error = new Error(messages[data.error] || 'No pudimos confirmar la operación. No vuelvas a pagar hasta consultar su estado.');
      error.code = data.error; throw error;
    }
    return data;
  }
  function showReceipt(receipt) {
    const texts = {
      paid: 'Pago de prueba confirmado. No se cobró dinero real ni se creó acceso al programa.',
      pending: 'PayPal está revisando el pago de prueba. Aún no está confirmado. No repitas el pago.',
      refunded: 'El pago de prueba fue reembolsado.', reversed: 'PayPal revirtió el pago de prueba.',
      review: 'El pago necesita revisión. No se habilitó acceso.', denied: 'El pago fue rechazado; no se habilitó acceso.',
    };
    message((texts[receipt.status] || 'La compra todavía no tiene un pago confirmado.') + ' Referencia: ' + receipt.id);
  }
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (next.disabled || !form.reportValidity()) return;
    next.disabled = true; message('Preparando PayPal de prueba…');
    try {
      const config = await api('/api/checkout/config');
      if (!config.enabled) throw new Error(messages.sales_closed);
      const data = new FormData(form);
      const selection = { plan: data.get('plan'), email: data.get('email'), requestId };
      if (!window.paypal) await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        const params = new URLSearchParams({ 'client-id': config.clientId, currency: 'USD', intent: 'capture', components: 'buttons', locale: 'es_ES', 'disable-funding': 'paylater,credit' });
        script.src = 'https://www.paypal.com/sdk/js?' + params;
        script.onload = resolve; script.onerror = () => { script.remove(); reject(new Error('No se pudo cargar PayPal. Inténtalo más tarde.')); };
        document.head.append(script);
      });
      form.querySelectorAll('input').forEach(input => { input.disabled = true; });
      const buttons = window.paypal.Buttons({
        style: { layout: 'vertical', label: 'pay', shape: 'rect' },
        createOrder: async () => {
          order = await api('/api/paypal/orders', selection);
          return order.paypalOrderId;
        },
        onApprove: async (data, actions) => {
          try {
            const receipt = await api('/api/paypal/orders/' + order.id + '/capture', { paypalOrderId: data.orderID });
            showReceipt(receipt);
            await buttons.close();
            const check = document.createElement('button');
            check.type = 'button'; check.textContent = 'Consultar estado del pago de prueba';
            check.addEventListener('click', async () => {
              check.disabled = true;
              try { showReceipt(await api('/api/checkout/orders/' + order.id)); }
              catch (error) { message(error.message); }
              finally { check.disabled = false; }
            });
            container.replaceChildren(check);
          } catch (error) {
            message(error.message);
            if (error.code === 'instrument_declined') return actions.restart();
          }
        },
        onCancel: () => message('Saliste de PayPal sin confirmar esta compra. Puedes continuar con la misma solicitud.'),
        onError: () => message('PayPal no pudo completar la operación. Si ya aprobaste un pago, no lo repitas: conserva la referencia y verifica su estado.'),
      });
      await buttons.render(container); message('Entorno de prueba: usa una cuenta Sandbox. No se cobra dinero real.');
    } catch (error) {
      message(error.message); next.disabled = false;
      form.querySelectorAll('input').forEach(input => { input.disabled = false; });
    }
  });
})();
