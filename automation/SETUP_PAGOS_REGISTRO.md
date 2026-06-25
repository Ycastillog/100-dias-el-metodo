# Setup de Pagos y Registro

Este archivo deja lista la parte tecnica que depende de cuentas externas.

## 1. PayPal

Crear un link de pago por:

- Producto: Grupo Alpha 100 Dias
- Precio: USD 9
- Tipo: pago unico
- Redireccion despues de pago: `https://ycastillog.github.io/100-dias-el-metodo/gracias.html`

Cuando tengas el link, pegarlo en:

`assets/payments.js`

```js
window.PAYMENT_LINKS = {
  alpha: {
    paypal: "PEGAR_LINK_PAYPAL_AQUI",
    stripe: "",
  },
};
```

## 2. Stripe

Crear Payment Link por:

- Producto: Grupo Alpha 100 Dias
- Precio: USD 9
- Currency: USD
- Quantity: 1
- Confirmation page: usar pagina propia si Stripe lo permite
- Redirect: `https://ycastillog.github.io/100-dias-el-metodo/gracias.html`

Pegar en:

`assets/payments.js`

```js
window.PAYMENT_LINKS = {
  alpha: {
    paypal: "",
    stripe: "PEGAR_LINK_STRIPE_AQUI",
  },
};
```

## 3. Google Sheets para leads

Ya existe un script base en:

`automation/google_sheets_leads_apps_script.js`

Pasos:

1. Crear Google Sheet.
2. Crear una pestana llamada `Leads`.
3. Ir a Extensions -> Apps Script.
4. Pegar el contenido de `automation/google_sheets_leads_apps_script.js`.
5. Deploy -> New deployment -> Web app.
6. Execute as: Me.
7. Access: Anyone.
8. Copiar la URL del Web App.
9. Pegarla en `assets/site-config.js`.

```js
window.SITE_CONFIG = {
  leadEndpoint: "PEGAR_URL_WEB_APP_AQUI",
  redirectAfterLead: "gracias.html",
  contactEmail: "",
  whatsappNumber: "",
  analyticsDebug: false,
};
```

## 4. WhatsApp

En `assets/site-config.js`, pegar numero con codigo de pais, sin espacios.

Ejemplo:

```js
whatsappNumber: "18090000000",
```

Esto permite generar enlace de confirmacion por WhatsApp despues del registro.

## 5. Prueba final

Antes de publicar anuncios:

1. Abrir landing.
2. Completar formulario con un email propio.
3. Confirmar que llega a Google Sheets.
4. Confirmar que redirige a `gracias.html`.
5. Confirmar que PayPal y Stripe abren correctamente.
6. Confirmar que el acceso funciona.

