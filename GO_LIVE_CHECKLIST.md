# Go Live Checklist - 100 Dias: El Metodo

Estado: listo visualmente para iniciar Alpha cuando se conecten pagos y captura de leads.

## 1. Pagos

- Crear link PayPal de USD 9 para Grupo Alpha.
- Crear Stripe Payment Link de USD 9 para Grupo Alpha.
- Pegar ambos enlaces en `assets/payments.js`.
- Probar que los botones abran PayPal y Stripe en una pestana nueva.

## 2. Leads

- Crear Google Sheet o Airtable para registros.
- Publicar el Apps Script incluido en `automation/google_sheets_leads_apps_script.js`.
- Pegar la URL en `assets/site-config.js` como `leadEndpoint`.
- Probar un registro real y confirmar que llega a la hoja.

## 3. Confirmacion Alpha

- Definir canal oficial de confirmacion: WhatsApp, email o DM.
- Pegar el enlace de WhatsApp en `assets/site-config.js` si se usara ese canal.
- Crear mensaje fijo para confirmar pago y enviar acceso.

## 4. Trafico

- Crear Instagram, TikTok y Facebook.
- Publicar desde `social/alpha_14_day_publish_plan.csv`.
- Empezar con `social/week_1_content_pack.md`.
- Usar `social/upload_checklist.md` antes de subir cada pieza.
- Usar `social/dm_scripts.md` para responder interesados.

## 5. Medicion

Medir diariamente:

- Visitas a landing.
- Registros.
- Pagos.
- Entradas a acceso.
- Dia 0 completado.
- Dia 1 completado.
- Dia 7 completado.

Archivo de medicion:

- `social/content_metrics_dashboard.csv`

## 6. Regla de decision

No crear mas producto hasta tener evidencia Alpha:

- 10 usuarios interesados.
- 3 pagos reales.
- 3 personas completando Dia 1.
- 1 persona llegando a Dia 7.
