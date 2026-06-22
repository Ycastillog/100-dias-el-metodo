# 100 Dias: El Metodo

## Estado del proyecto

Version: 1.0

Estado: VALIDACION

Fecha de cierre de construccion: 16/06/2026

Regla: NO AGREGAR NUEVOS MODULOS DEL METODO HASTA TERMINAR EL ALPHA.

Repositorio de la V1.0 cerrada de **100 Dias: El Metodo**, un sistema de dominio personal actualmente en fase de validacion Alpha.

## Que incluye

- Landing de venta en `index.html`.
- Plataforma del participante en `acceso.html`.
- Estilos en `assets/styles.css`.
- Captura local de interes, activacion y avance en `assets/app.js`.
- Configuracion publica de leads y analitica en `assets/site-config.js`.
- Infraestructura tecnica local en `server.mjs`.
- Registro obligatorio antes de mostrar materiales descargables.
- Archivos descargables en `public/downloads`.
- Kit de validacion Alpha en `validation`.
- Sistema social y contenidos Alpha en `social`.
- Biblioteca recomendada y audios complementarios configurables.
- Estado operativo visible en `PROJECT_STATUS.md`.

## Ejecutar localmente

```powershell
powershell -ExecutionPolicy Bypass -File .\run-server.ps1
```

Luego abrir:

```text
http://127.0.0.1:4289
```

Acceso del participante:

```text
http://127.0.0.1:4289/acceso.html
```

## Siguiente accion real

Conseguir 10 usuarios reales para el **Grupo Alpha 100 Dias**.

No agregar nuevos modulos, comunidad, certificaciones ni conceptos hasta completar:

- 10 usuarios reales.
- 14 dias de uso.
- Retroalimentacion recopilada.
- Analisis de comportamiento.

## Venta y medicion

Para activar cobros reales:

1. Crear link PayPal Alpha de USD 9.
2. Crear Stripe Payment Link Alpha de USD 9.
3. Pegarlos en `assets/payments.js`.

Para recibir leads fuera del navegador:

1. Crear un endpoint en Google Sheets, Airtable, Make, Zapier o Apps Script.
2. Pegar la URL en `assets/site-config.js` como `leadEndpoint`.

Hay una plantilla lista para Google Sheets en:

```text
automation/google_sheets_leads_apps_script.js
```

El sitio guarda eventos locales y envia eventos a `window.dataLayer` si luego se instala Google Tag Manager.

`assets/site-config.js` tambien permite configurar:

- `redirectAfterLead`: URL opcional despues del registro.
- `whatsappNumber`: numero opcional para mostrar confirmacion por WhatsApp.
- `analyticsDebug`: modo de depuracion de eventos en consola.

Para anuncios, mantener publicas las paginas:

- `privacidad.html`
- `terminos.html`

## Sistema social

La carpeta `social` contiene:

- Calendario de contenido Alpha.
- Guiones para Reels/TikTok.
- Carruseles de Instagram.
- Scripts de DM.
- Pipeline de automatizacion.
- Tracker de publicaciones.
- Biblioteca afiliada de libros estoicos.
- Plan de audios "Estoicismo para ganadores".

## Validacion Alpha

Nombre: **GRUPO ALPHA 100 DIAS**

Duracion: 14 dias

Participantes: 10 personas

Costo hipotesis: USD 9

Pregunta clave cuando alguien abandona:

```text
Que paso el dia que dejaste de volver?
```
