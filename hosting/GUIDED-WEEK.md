# Primera semana guiada — septiembre de 2026

## Alcance entregado

La plataforma permite seleccionar varias áreas y alternar un foco diario. No
limita todo el recorrido a una sola área ni mide la calidad de la vida mediante
una puntuación. Los días 1–7 añaden siete guías, 35 variantes, audios con
transcripción y herramientas privadas. Desde el día 8 se conserva el programa
escrito original, sus recursos opcionales y revisiones. No son 100 videoclases.

Se conserva Alpha (USD 9, 14 días) y Método (USD 29, 100 días), pago único desde
confirmación. No se modifica la configuración de PayPal, sus credenciales,
los códigos de acceso, las fechas ni los registros de compradores existentes.

## Implementación y privacidad

- `guided-week.json`: contenido original de la primera semana; solo el Worker
  entrega una variante diaria después de validar la compra.
- `week-audio/`: siete MP3 y transcripciones incorporados al Worker. No se
  publican como archivos estáticos; `/api/participant/media?day=N` revalida
  pago, reembolso y vencimiento, y admite rangos de bytes.
- `guided-tools.js`: selección de áreas, validación, calendario de hasta tres
  pagos de una misma moneda y resúmenes. No conecta cuentas ni hace pagos.
- `profile.areas`: opcional para compatibilidad con perfiles anteriores.
- `tool:DIA:AREA`: registros separados en la tabla existente. No se necesita
  migración ni se borra contenido anterior. Guardados con revisión optimista.
- Abrir una guía, escuchar un audio o escribir una herramienta no marca por sí
  solo el día como realizado. El usuario registra lo que realmente ocurrió.
- El historial y las descargas incluyen las herramientas guardadas; los
  borradores siguen sin guardarse hasta recibir confirmación del servidor.

## Medios

Audio producido localmente con el proceso de voz aprobado de la serie 04.
Voz sintética declarada y transcripción disponible. No se realizó una escucha
humana completa de todas las piezas durante esta integración.

El vídeo público `first-step-example.mp4` es una versión ligera del S04R01
existente (720×1280, H.264/AAC, 1.14 MB). Es un ejemplo con escenas ilustrativas,
subtítulos y voz sintética; no un testimonio. Su reproducción es opcional.

Fuentes de producción y QA conservadas fuera del checkout, en la carpeta local
`100-dias-operaciones/semana-guiada-2026-09-04`. No incluir cachés o herramientas
de producción en los archivos estáticos del sitio.

## Verificación

Usar `npm test` y `npm run build:sales`. El comando genérico `build` pertenece
al prototipo histórico y no es el destino comercial. Las pruebas cubren
aislamiento por compra, límites del plan, rangos de audio, rechazo de rutas
estáticas privadas, guardados simultáneos, selección multiarea, exportaciones y
regresiones de formularios mediante adaptadores en memoria. No implican un
cobro real ni una prueba visual en navegador.
