# Experiencia conectada — 6 de septiembre de 2026

La portada muestra qué construye el cliente en disciplina, dinero cotidiano,
relaciones, bienestar y proyectos. La muestra interactiva de los días 0–7 usa
ejemplos ilustrativos sin recoger ni guardar respuestas. No se presenta como
testimonio ni como una secuencia obligatoria: el cliente puede elegir sus áreas.

El espacio comprado integra:

- `profile.baseline`: valoración opcional de las cinco áreas. Puede corregirse;
  no es un diagnóstico ni una puntuación. Los perfiles anteriores siguen válidos.
- `tool:DIA:AREA`: herramientas reutilizables en todos los días del plan (14/100).
  La vista de sistema toma la última actualización confirmada; al abrir otro día
  se ofrece como punto de partida y se guarda una nueva versión solo al solicitarlo.
- `day:DIA.area`: área opcional de los nuevos intentos. No se atribuye un área
  retrospectivamente a registros anteriores sin ese dato.
- `review:DIA.balance`: valoración opcional por área. Revisiones semanales y
  cierre, más hitos 30/60 solo en el recorrido de 100 días.
- `recovery`: obstáculo, acción pequeña, momento y día del plan. No completa
  automáticamente el diario ni modifica el vencimiento.
- Informe de texto descargable: dirección, valoraciones, últimas herramientas,
  revisiones y continuidad. No contiene credenciales, recibos ni borradores.

Persisten como JSON en los registros existentes de D1 con control de revisión,
aislamiento por compra y validación del acceso en cada solicitud. No hay nueva
migración, cuentas, suscripciones ni cambios de secretos o precios. Las guías
con audio siguen limitadas a los días 1–7; las 100 prácticas escritas del programa
original permanecen protegidas en el Worker.

Métricas: `page_view`, `plan_click`, `checkout_view`, `checkout_start`. Se conservan
los nombres previos de prelanzamiento. Clic y apertura no equivalen a personas
únicas ni a ventas; las compras confirmadas se verifican en `purchase_orders`.
El inicio de checkout se cuenta al preparar PayPal, no al aprobar un cobro.
Solo se transmiten nombre del evento, plan, ruta, etiquetas UTM y host de origen;
no correo, código de acceso ni texto del participante.

Imagen nueva: `assets/practice-life-v1.jpg`, generada con imagegen integrado.
Prompt: fotografía editorial natural vertical 4:5 de una mujer adulta trabajando
concentrada en un portátil en casa, luz lateral de mañana, ropa verde bosque,
interior sencillo sin lujo, rostro secundario, textura natural; teléfono apartado,
sin texto, marcas, cuadernos, pantallas legibles ni promesas de riqueza. El teléfono
salió boca arriba; no se hizo otro intento. Se convirtió el PNG a JPEG para web
sin cambiar el contenido. La página la identifica como escena ilustrativa de IA.

Verificación: pruebas de interacciones con adaptadores en memoria, aislamiento,
conflictos, límites del plan, muestras, recursos y compra. No se realizó un cargo
real ni una comprobación visual automatizada en navegador durante esta mejora.
