# Recordatorios de 100 Dias

Estado: implementado en la plataforma del participante.

## Que funciona hoy

### Calendario del dispositivo

El participante elige una hora y prepara recordatorios hasta el Dia 14 o el
Dia 100. La plataforma descarga un archivo `.ics` con:

- Un evento por cada dia pendiente.
- Titulo y tarea especificos de ese dia.
- Enlace directo a la experiencia diaria.
- Alarma 10 minutos antes.

Una vez importado, el calendario del telefono o computadora puede avisar aunque
la pagina este cerrada. Esta es la capa principal de recordatorio de la version
estatica.

### Aviso del navegador

El participante puede conceder permiso y probar el aviso desde
`acceso.html#recordatorios`.

El aviso:

- Usa la hora elegida.
- Solo se muestra mientras la plataforma esta abierta.
- No se repite el mismo dia.
- No aparece si el participante ya registro una accion ese dia.
- Abre directamente la experiencia diaria al tocarlo.

## Lo que no se afirma

GitHub Pages no ejecuta procesos privados programados. Por eso esta version no
promete enviar por si sola:

- Correos diarios.
- Mensajes de WhatsApp.
- SMS.
- Push remoto con la pagina cerrada.

## Requisitos para recordatorios remotos

Antes de activar una capa remota se necesitan:

1. Identidad y autenticacion del participante.
2. Consentimiento explicito por canal.
3. Zona horaria y hora preferida.
4. Base de datos de progreso.
5. Programador de tareas en backend.
6. Proveedor de correo, WhatsApp o Web Push.
7. Baja inmediata y registro de entregas.

## Evento de medicion

La plataforma deja preparados estos eventos:

- `browser_reminder_enabled`
- `browser_reminder_disabled`
- `browser_reminder_test`
- `daily_reminder_shown`
- `calendar_reminders_download`
- `reminder_time_changed`
- `reminder_duration_changed`

## Prueba operativa

1. Abrir `acceso.html` con acceso de prueba.
2. Ir a `Recordatorios`.
3. Elegir una hora y guardar el aviso del navegador.
4. Pulsar `Probar aviso`.
5. Descargar el calendario hasta el Dia 14.
6. Abrir el `.ics` y confirmar que contiene un evento por dia.
7. Registrar el dia actual y confirmar que no se genera otro aviso ese dia.

## Regla de producto

El recordatorio debe ayudar a volver, no perseguir. No se usan mensajes de
culpa, urgencia falsa ni castigo por perder un dia.
