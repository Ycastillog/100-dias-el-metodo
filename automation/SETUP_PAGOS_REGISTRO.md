# Setup de Pagos, Registro y Medicion

Este archivo deja lista la parte tecnica que depende de cuentas externas.

## Estado actual

La plataforma ya tiene preparado:

- `user_key` anonimo por navegador.
- Captura de UTMs: `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`.
- Eventos locales y remotos: `payment_click`, `access_view`, `day0_submit`, `daily_status_submit`, `day1_submit`, `day7_submit`, `weekly_review_submit`.
- Proteccion suave del acceso con `acceso.html?alpha=1`.
- Google Apps Script preparado para dos pestanas: `Leads` y `Events`.

## 1. PayPal

Crear un link de pago por:

- Producto: Grupo Alpha 100 Dias
- Precio: USD 9
- Tipo: pago unico
- Redireccion despues de pago: `https://ycastillog.github.io/100-dias-el-metodo/gracias.html?payment=success`

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
- Confirmation page: pagina propia si Stripe lo permite
- Redirect: `https://ycastillog.github.io/100-dias-el-metodo/gracias.html?payment=success`
- Metadata sugerida si Stripe lo permite: `product=alpha`, `price=9`, `source=landing`.

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

## 3. Google Sheets para leads y eventos

Ya existe un script base en:

`automation/google_sheets_leads_apps_script.js`

Pasos:

1. Crear Google Sheet.
2. Ir a Extensions -> Apps Script.
3. Pegar el contenido de `automation/google_sheets_leads_apps_script.js`.
4. Deploy -> New deployment -> Web app.
5. Execute as: Me.
6. Access: Anyone.
7. Copiar la URL del Web App.
8. Pegarla en `assets/site-config.js` en `leadEndpoint`.
9. Pegar la misma URL en `eventEndpoint`.

El script crea automaticamente:

- `Leads`
- `Events`

Config:

```js
window.SITE_CONFIG = {
  leadEndpoint: "PEGAR_URL_WEB_APP_AQUI",
  eventEndpoint: "PEGAR_URL_WEB_APP_AQUI",
  redirectAfterLead: "gracias.html?payment=manual",
  contactEmail: "",
  whatsappNumber: "",
  gaMeasurementId: "",
  alphaAccessParam: "alpha",
  alphaAccessValue: "1",
  accessGateEnabled: true,
  analyticsDebug: false,
};
```

## 4. GA4

Crear propiedad de Google Analytics 4 y copiar el Measurement ID.

Ejemplo:

```js
gaMeasurementId: "G-XXXXXXXXXX",
```

Eventos clave que deben verse en GA4:

- `page_view`
- `payment_click`
- `access_view`
- `day0_submit`
- `daily_status_submit`
- `day1_submit`
- `day7_submit`
- `weekly_review_submit`

## 5. WhatsApp

En `assets/site-config.js`, pegar numero con codigo de pais, sin espacios.

Ejemplo:

```js
whatsappNumber: "18090000000",
```

Esto permite generar enlace de confirmacion por WhatsApp despues del registro.

## 6. Acceso Alpha

El acceso publico normal es:

`https://ycastillog.github.io/100-dias-el-metodo/acceso.html`

El enlace que se entrega al participante Alpha es:

`https://ycastillog.github.io/100-dias-el-metodo/acceso.html?alpha=1`

Ese parametro activa el acceso en el navegador del participante.

## 7. Prueba final

Antes de publicar anuncios:

1. Abrir landing.
2. Entrar con UTMs de prueba: `?utm_source=instagram&utm_medium=organic&utm_campaign=alpha_01`.
3. Completar formulario con un email propio.
4. Confirmar que llega a `Leads`.
5. Confirmar que los eventos llegan a `Events`.
6. Confirmar que redirige a `gracias.html`.
7. Confirmar que PayPal y Stripe abren correctamente.
8. Confirmar que `acceso.html` directo muestra pantalla Alpha.
9. Confirmar que `acceso.html?alpha=1` permite entrar.
10. Completar Dia 0, Dia 1 y Dia 7 en prueba.
