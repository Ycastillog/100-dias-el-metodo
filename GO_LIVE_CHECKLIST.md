# Go Live Checklist - 100 Dias: El Metodo

Estado: producto listo para Alpha. Lo pendiente es conectar cuentas externas y ejecutar la primera ola.

## 1. Conexiones obligatorias antes de trafico pago

- Confirmar que PayPal esta activo para USD 9, USD 29, USD 79 y USD 297.
- Confirmar que Stripe esta activo para USD 9, USD 29, USD 79 y USD 297.
- Confirmar que todos los enlaces estan en `assets/payments.js`.
- Crear Google Sheet y publicar `automation/google_sheets_leads_apps_script.js`.
- Pegar la URL del Web App en `leadEndpoint` y `eventEndpoint`.
- Crear GA4 y pegar `gaMeasurementId`.
- Pegar WhatsApp oficial si se usara confirmacion manual.
- Confirmar que `embajadores.html` envia solicitudes a `Ambassador Applications`.
- Confirmar que un enlace con `?ref=creador` conserva la referencia al registrar y pagar.
- Crear GA4 y registrar tambien eventos de embajadores.

## 2. Flujo que debe funcionar

Ruta del Alpha:

`Origen -> Landing -> Datos -> Pago -> Validacion -> Acceso privado -> Dia 0 -> Dia 1 -> Dia 7`

Eventos que deben medirse:

- `page_view`
- `lead_registered`
- `payment_click`
- `access_view`
- `day0_submit`
- `daily_status_submit`
- `day1_submit`
- `day7_submit`
- `weekly_review_submit`
- `affiliate_landing_view`
- `ambassador_cta_click`
- `ambassador_application_submit`
- `ambassador_thank_you_view`

## 3. Prueba antes de publicar

- Abrir landing con `?utm_source=instagram&utm_medium=organic&utm_campaign=alpha_test`.
- Registrar un usuario de prueba.
- Confirmar fila en `Leads`.
- Confirmar eventos en `Events`.
- Confirmar que enviar el formulario solo revela el pago y no concede acceso.
- Confirmar que `gracias.html` no concede acceso.
- Confirmar que `acceso.html` directo muestra el bloqueo.
- Confirmar que el enlace privado Alpha permite entrar despues de validar el pago.
- Completar Dia 0.
- Marcar Dia 1 como completado.
- Simular hasta Dia 7 y guardar revision semanal.
- Revisar visualmente landing, gracias y acceso en movil y desktop.
- Abrir `embajadores.html` en movil y desktop.
- Probar el simulador de comisiones en los cuatro planes.
- Enviar una solicitud de creador de prueba.
- Confirmar fila en `Ambassador Applications`.
- Abrir `?ref=qa_creador&utm_source=qa_creador&utm_medium=affiliate&utm_campaign=embajadores_dia1`.
- Registrar un lead y confirmar `affiliate_id=qa_creador`.

## 4. Primera ola

Objetivo: 10 usuarios Alpha.

Canales:

- Instagram Reels.
- TikTok.
- Facebook.
- DMs manuales.
- Contactos cercanos con perfil adecuado.

Mensaje central:

`No necesitas motivacion. Necesitas estructura diaria para volver al marco. Estoy abriendo el acceso a 100 Dias: El Metodo. Puedes entrar por Alpha USD 9 o elegir una version completa. La meta no es ver contenido: es llegar al Dia 7.`

## 5. Metricas de decision Dia 7

- Pago -> Acceso en 24h: meta minima 85%.
- Acceso -> Dia 0 en 24h: meta minima 75%.
- Dia 0 -> Dia 1 en 24h: meta minima 60%.
- Pago -> Dia 7: meta minima 40%.

Decision:

- Menos de 25% llega a Dia 7: no escalar; corregir puente pago -> Dia 1.
- 25% a 39% llega a Dia 7: mejorar onboarding y recordatorios.
- 40% a 59% llega a Dia 7: pasar a 30 usuarios.
- 60% o mas llega a Dia 7: pasar a 100 usuarios y evaluar persistencia V2.

## 6. Regla de producto

No crear nuevas funciones porque se ven interesantes.

La siguiente mejora debe responder a una friccion observada entre:

`Pago -> Acceso -> Dia 0 -> Dia 1 -> Dia 7`

## 7. Primera cohorte de embajadores

- Seleccionar 10 creadores, no 100.
- Entregar acceso antes de enlace.
- Verificar Dia 0 y Dia 1.
- Revisar las primeras dos piezas.
- Publicar la campana de 14 dias.
- Pagar 25% solo sobre importes elegibles.
- No escalar hasta tener 20 compradores atribuidos, mas de 35% en Dia 7 y 95% de ventas verificables.
