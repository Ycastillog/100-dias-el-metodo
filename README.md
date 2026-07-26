# 100 Dias: El Metodo

## Estado del proyecto

Version: 1.0

Estado: PRODUCTO LISTO PARA VALIDACION ALPHA

Fecha de cierre de construccion: 24/06/2026

Regla: NO AGREGAR NUEVOS MODULOS DEL METODO HASTA TERMINAR EL ALPHA.

Repositorio de la V1.0 cerrada de **100 Dias: El Metodo**, un sistema de dominio personal actualmente en fase de validacion Alpha.

## Punto de partida operativo

Abrir primero:

```text
ALPHA_LAUNCH_READY.md
```

Ese archivo resume que esta listo, que falta conectar y cual es la primera accion real.

## Que incluye

- Programa canonico, recorrido e identidad en `PROGRAMA_100_DIAS.md`.
- Operacion exacta de los cuatro planes en `validation/06_ENTREGA_PLANES.md`.
- Landing de venta en `index.html`.
- Programa publico de creadores en `embajadores.html`.
- Terminos de creadores en `terminos-embajadores.html`.
- Plataforma del participante en `acceso.html`.
- Biblioteca integral y compartible en `biblioteca.html`.
- Sistema canonico de continuidad en `SISTEMA_DE_VIDA_DIARIA.md`.
- Curriculo, guia y modulos en `CURRICULO_INTEGRAL_100_DIAS.md`.
- Recorrido completo con tema, objetivo y tarea diferenciados para cada dia hasta el Dia 100.
- Rutas internas de transformacion para que el participante atraviese etapas, no solo acumule dias.
- Pacto personal con area, meta, senal cotidiana, lugar, accion minima y version de regreso.
- Ritual diario de orientar, ejecutar, registrar y volver.
- Aurelia como voz editorial transparente y ciclo VITAL.
- Practicas de mente, cuerpo, finanzas y vinculos con un foco recomendado.
- Libros, videos y recursos institucionales conectados con cada etapa.
- Avance secuencial de una jornada por fecha calendario.
- Racha real por fechas y dias activos durante los ultimos siete dias.
- Revisiones que se habilitan solo al llegar al hito correspondiente.
- Centro de recordatorios con calendario del dispositivo y avisos del navegador.
- Soporte instalable y nucleo diario sin conexion mediante `manifest.webmanifest` y `sw.js`.
- Diario descargable, copia de seguridad y restauracion del recorrido.
- Estilos en `assets/styles.css`.
- Captura local de interes, activacion y avance en `assets/app.js`.
- Configuracion publica de leads y analitica en `assets/site-config.js`.
- Infraestructura tecnica local en `server.mjs`.
- Registro obligatorio antes de mostrar materiales descargables.
- Archivos descargables en `public/downloads`.
- Kit de validacion Alpha en `validation`.
- Sistema social y contenidos Alpha en `social`.
- Campana completa de 14 dias y 25 artes exportados en `contenido-redes-lanzamiento`.
- Manifiesto del fundador en `MANIFIESTO_DEL_FUNDADOR.md`.
- Centro operativo Alpha en `ALPHA_LAUNCH_READY.md`.
- Biblioteca recomendada y audios complementarios configurables.
- Estado operativo visible en `PROJECT_STATUS.md`.
- Especificacion de recordatorios en `automation/NOTIFICACIONES_100_DIAS.md`.
- Atribucion afiliada persistente y UTMs en `assets/ops.js`.
- Control financiero de embajadores en `outputs/embajadores-dia-1/EMBAJADORES_CONTROL.xlsx`.

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

La entrada privada se entrega solo despues de validar el pago. El bloqueo actual
es una capa de conveniencia para el Alpha; la proteccion comercial definitiva
requiere autenticacion y verificacion de pago en un backend.

## Siguiente accion real

Conseguir 10 usuarios reales para el **Grupo Alpha 100 Dias**.

No agregar nuevos modulos, comunidad, certificaciones ni conceptos hasta completar:

- 10 usuarios reales.
- 14 dias de uso.
- Retroalimentacion recopilada.
- Analisis de comportamiento.

## Venta y medicion

Para activar cobros reales:

1. Crear links PayPal para Alpha, Metodo, Sistema y Premium.
2. Crear Stripe Payment Links para Alpha, Metodo, Sistema y Premium.
3. Pegarlos en `assets/payments.js`.

Estado actual: PayPal y Stripe estan configurados para USD 9, USD 29, USD 79 y USD 297.

Para recibir leads y eventos fuera del navegador:

1. Crear un endpoint en Google Sheets con el Apps Script incluido.
2. Pegar la URL en `assets/site-config.js` como `leadEndpoint`.
3. Pegar la misma URL en `eventEndpoint`.
4. Crear GA4 y pegar el ID en `gaMeasurementId`.

Hay una plantilla lista para Google Sheets en:

```text
automation/google_sheets_leads_apps_script.js
```

La guia de conexion de pagos y registro esta en:

```text
automation/SETUP_PAGOS_REGISTRO.md
```

El sitio guarda eventos locales, envia eventos a Google Sheets si `eventEndpoint` esta configurado y dispara GA4 si `gaMeasurementId` existe. Tambien registra la configuracion, prueba y descarga de recordatorios.

`assets/site-config.js` tambien permite configurar:

- `redirectAfterLead`: URL opcional despues del registro.
- `eventEndpoint`: URL para enviar eventos operativos.
- `whatsappNumber`: numero opcional para mostrar confirmacion por WhatsApp.
- `gaMeasurementId`: ID de GA4.
- `accessGateEnabled`: activa la proteccion suave del acceso.
- `analyticsDebug`: modo de depuracion de eventos en consola.

## Acompanamiento y recordatorios

En `acceso.html#recordatorios` el participante puede:

1. Elegir una hora diaria.
2. Preparar eventos hasta el Dia 14 o el Dia 100.
3. Importar un calendario con titulo y tarea propios para cada dia.
4. Activar y probar un aviso del navegador.

En `acceso.html#mi-sistema` tambien puede:

1. Ver si esta trabajando en linea o con el nucleo local.
2. Descargar su diario personal.
3. Crear una copia de seguridad del recorrido.
4. Restaurar pacto, dias, revisiones y recordatorios.
5. Instalar la experiencia cuando el navegador ofrece esa capacidad.

En `biblioteca.html` puede:

1. Filtrar lecturas, movimiento, finanzas y videos.
2. Ver autor, fuente y razon de uso.
3. Abrir el recurso en su plataforma original.
4. Compartirlo sin divulgar el diario ni el progreso.

Los datos del curriculo y la biblioteca viven en
`assets/life-program.js`. La interfaz publica usa `assets/library.js`.

El calendario sigue funcionando con la pagina cerrada despues de importarlo. El
aviso del navegador de esta version funciona mientras la plataforma esta
abierta. Correo, WhatsApp y push remoto requieren backend, identidad y
consentimiento; no se presentan como funciones activas.

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
- Playbook `Embajadores del Dia 1`.
- Campana de 14 dias para creadores.

## Embajadores del Dia 1

Primera cohorte: 10 creadores.

Oferta:

- 25% de cada compra atribuida.
- 30 dias de atribucion por enlace.
- 60 dias para ascensos de plan.
- Experiencia obligatoria: Dia 0 y Dia 1 antes de recomendar.

Archivos principales:

- `embajadores.html`
- `terminos-embajadores.html`
- `social/EMBAJADORES_DIA_1_PLAYBOOK.md`
- `social/embajadores_14_day_campaign.csv`
- `validation/EMBAJADORES_PIPELINE.csv`
- `outputs/embajadores-dia-1/EMBAJADORES_CONTROL.xlsx`

## Validacion Alpha

Nombre: **GRUPO ALPHA 100 DIAS**

Duracion: 14 dias

Participantes: 10 personas

Costo hipotesis: USD 9

Pregunta clave cuando alguien abandona:

```text
Que paso el dia que dejaste de volver?
```

Archivos operativos principales:

- `validation/03_TRACKING_ALPHA.csv`
- `validation/ALPHA_COMMAND_CENTER.md`
- `validation/ALPHA_MENSAJES_OPERATIVOS.md`
- `validation/ALPHA_OFERTA_CONTINUACION.md`
