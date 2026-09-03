# Pago único y entrega protegida — 3 de septiembre de 2026

## Alcance comercial

YC Systems LLC recibe los pagos. Alpha cuesta USD 9 (14 días de acceso);
El Método cuesta USD 29 (100 días de acceso). Son opciones independientes,
digitales y autoguiadas, sin renovaciones, sesiones ni asesoría privada.
Sistema USD 79 y Premium USD 297 no están habilitados: aún faltan sus materiales.
No presentar enlaces externos gratuitos como libros propios de esos paquetes.

El recorrido usa los 100 días de `assets/app.js` y las acciones de
`assets/life-program.js` del repositorio. La compilación `sales` los incluye solo
en el Worker, nunca como archivos públicos del cliente. `prelaunch` y la revisión
privada permanecen separados. No publicar la compilación privada como tienda.

## Entrega y privacidad

Una captura verificada genera un código HMAC limitado a esa compra y entorno.
Se almacena una cookie HttpOnly; cada petición verifica pedido, estado, plan y
vencimiento. Un parámetro `alpha`, un ID de PayPal o localStorage no dan acceso.
No se crea una cuenta con contraseña ni se impone una cuenta de ChatGPT.

El comprador guarda su código desde el checkout y puede volver a descargarlo
desde el recorrido mientras tenga acceso. No existe envío automático de correo.
La referencia local no secreta y la cookie de checkout permiten consultar el
último pedido y recuperar el código después de una respuesta perdida.
Si se pierden también la cookie y el código, la recuperación requiere asistencia
y comprobación del comprador; nunca conceder acceso solo con email e ID público.
No compartir claves de firma ni devolver códigos a un solicitante no verificado.

D1 guarda prioridad, diario y revisiones por pedido con versión optimista. Los
conflictos responden 409 y preservan el borrador del navegador. El vencimiento no
borra automáticamente las notas. El usuario puede descargar su registro; no se
deben introducir datos sensibles ni de otras personas. La web explica esto en
privacidad y condiciones, con soporte por la cuenta oficial de Instagram.

## Configuración separada

- `PAYPAL_ENV`: `live` o `sandbox`.
- `CHECKOUT_ENABLED`: solo controla la creación de compras nuevas. Recibos,
  webhooks, recuperación y compras existentes siguen funcionando al cerrarlo.
- `CHECKOUT_ORIGIN`: origen público exacto.
- `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_MERCHANT_ID`,
  `PAYPAL_WEBHOOK_ID`: configuración Sandbox conservada.
- `PAYPAL_LIVE_CLIENT_ID`, `PAYPAL_LIVE_CLIENT_SECRET`,
  `PAYPAL_LIVE_MERCHANT_ID`, `PAYPAL_LIVE_WEBHOOK_ID`: aplicación Live dedicada.
- `ACCESS_SIGNING_SECRET`: clave aleatoria de 256 bits, protegida en Sites.

Nunca guardar valores de secretos en Git ni en archivos. Cambiar la clave de
firma invalida todos los códigos: no rotarla como solución rutinaria. Live no
puede usar accidentalmente las credenciales Sandbox como respaldo.

Aplicación Live creada: `100 Dias El Metodo - Produccion`. Se comprobó OAuth,
el comercio receptor y el registro del webhook de los seis eventos de captura.
Suscripciones y Payouts están desactivados. Se creó una orden Live sin aprobar
para verificar el receptor predeterminado: no se capturó ni se movió dinero.

Webhook: `https://100diaselmetodo.com/api/paypal/webhook`. Se verifica la firma
con PayPal y se consulta el estado canónico. Reembolsos/reversiones revocan acceso;
una devolución parcial queda para revisión. En cada uso, un estado local de pago
de más de diez minutos se reconcilia con PayPal como respaldo a los webhooks.
Un fallo de esa comprobación no abre el contenido. Contadores HMAC limitan
creaciones de pedidos e intentos de recuperación sin guardar IPs en claro.

## Verificación y estado de lanzamiento

La prueba real de Sandbox usa temporalmente `CHECKOUT_TEST_TOKEN` (256 bits) y
`CHECKOUT_TEST_EXPIRES_AT` (máximo tres horas) solo en peticiones del operador con
la cabecera estándar `Authorization: Bearer sandbox-…`, redactada por el
alojamiento. No usar cabeceras personalizadas para secretos. No se publica el
token ni una tienda Sandbox.
Esas peticiones usan únicamente las credenciales Sandbox existentes; no reciben
las Live. Se quitan ambas variables al finalizar. Los códigos de acceso y pedidos
Sandbox no son válidos en el entorno Live. El webhook existente distingue el
entorno por el host del certificado, pero siempre exige verificar la firma con
PayPal y comprobar el entorno del pedido antes de reconocer cualquier evento.

Las pruebas locales usan SQLite y respuestas PayPal simuladas. Cubren precios,
comercio, importe, firma, reintentos, aislamiento de compras, duración, límites de
plan, conflictos del diario, entrega y recuperación. Las pruebas de interfaz no
realizan cargos y no sustituyen una compra aprobada en PayPal Sandbox.

Completado contra PayPal: autenticación Live y Sandbox, registro de webhooks y
verificación del comercio Live sin captura. El 3 de septiembre se aprobaron y
capturaron dos compras ficticias a través del backend desplegado: Alpha USD 9 y
Método USD 29. Ambas entregaron su código privado y acceso correcto a 14/100 días.
Se verificaron recuperación en otro dispositivo, guardado durable de un perfil
ficticio, conflicto de edición (409), aislamiento entre compras y rechazo de un
código Sandbox por Live (401). Repetir la captura devolvió el mismo recibo.

La devolución Sandbox de Alpha llegó como evento firmado real, revocó el acceso
y bloqueó tanto la sesión como la recuperación (401). Un COMPLETED tardío llegó
después del REFUNDED y no reactivó la compra. No se usaron eventos simulados para
esa prueba ni se hizo una compra con dinero real. La segunda captura y la
devolución del Método también se tramitaron en Sandbox. Los pedidos y eventos de
prueba permanecen identificados por `environment=sandbox`, sin borrar registros.

El transporte PayPal conserva el receptor global de fetch y usa redirect manual:
no sigue redirecciones ni reenvía credenciales. El diagnóstico temporal detallado
se retiró. Los fallos solo registran fase y categorías acotadas, sin mensajes
crudos, claves ni datos del comprador. La primera clave temporal de prueba se
rotó y se cambió a Authorization tras verificar la redacción de logs. Retirar
CHECKOUT_TEST_TOKEN y CHECKOUT_TEST_EXPIRES_AT al habilitar CHECKOUT_ENABLED=true.
PAYPAL_ENV permanece live. No hacer cargos ni devoluciones Live para probar sin
autorización específica del titular. Primera compra real aún no realizada.

Publicar requiere: `npm test`, `npm run build:sales`, fuente exacta subida,
archivo creado con el empaquetador oficial de Sites y despliegue de esa versión.
Nunca publicar secretos ni incluir los archivos heredados de acceso del cliente.
Las migraciones 0003/0004 agregan registros y contadores, sin borrar compras o leads.

## Preparación editorial y operativa posterior al lanzamiento

Se añadió una guía de inicio al recorrido, un mapa ajustado a los días comprados
y una secuencia de tres pasos cuyo tiempo total es 2, 10 o 20 minutos. La tarea
principal usa el objetivo de la lección para no imponer 10–15 minutos a quien
eligió dos. El diario se descarga también como texto legible, manteniendo la
copia JSON. Ninguna descarga incluye el código privado de acceso.

TikTok @100diaselmetodo se incorpora a las cuentas oficiales. La portada anuncia
solo las dos opciones que se pueden comprar; los niveles cerrados siguen
rechazándose en servidor y explicados en las condiciones. No cambiaron precios,
plazos, claves, PayPal, bases de datos ni reglas de autorización.

Verificación del 3 de septiembre: 84 pruebas locales superadas y comprobación del
artefacto comercial compilado, sin red ni cargos. `inspect-product.mjs` comprueba
100 lecciones y temas, fases de 30/30/40 días, los campos de práctica y las
duraciones, además de identificar los 14 recursos externos como opcionales. Es
un inventario estructural, no una certificación pedagógica ni una promesa de
resultados. Los cambios nuevos requieren publicar la versión validada; este
registro por sí solo no afirma que estén en producción.

El alojamiento sirve archivos estáticos antes que el Worker. Por eso la
compilación comercial no coloca `index.html` ni la ruta sin extensión `mi-metodo`
en `dist/client`: ambas se sirven desde el Worker con estado y MIME correctos.
El dominio técnico de Sites redirige esas páginas al dominio público canónico.

La revisión visual incorpora un tema editorial claro independiente del CSS
heredado, imagen ilustrativa original optimizada, menú móvil visible y un diario
con navegación plegable. La imagen está identificada como generada con IA, no
como fotografía de un cliente ni producto físico. `EDITORIAL-IMAGE.md` conserva
el prompt y la procedencia. No hubo pruebas visuales del sitio en navegador;
se comprobaron fuente, recursos, enlaces, estructura, rutas y controles de
seguridad mediante pruebas automatizadas. La salida compilada comercial excluye
el programa fuente y los secretos, y mantiene las páginas de acceso en el Worker.

## Portada conectada con el producto

La mejora de la portada sustituye el protagonismo de una imagen de escritorio
por una vista ilustrativa del diario y una práctica existente. Los ejemplos
no son notas reales de clientes ni campos que guarden datos. El mapa muestra
las tres fases y títulos comprobados contra el programa; Alpha se delimita a
los primeros 14 días. La muestra gratuita aplica el Día 1 a un currículum con
la misma secuencia de 1 + 7 + 2 minutos del espacio privado.

Los botones principales y el cierre llevan a las dos ofertas existentes. Las
redes se conservan en el pie. La entrega por código, el plazo consecutivo, los
pagos únicos y la ausencia de correo automático siguen visibles. No cambian
precios, PayPal, sesiones privadas, base de datos ni reglas de acceso. No se
añaden ofertas, promesas de ingresos, testimonios o resultados inventados.

Las pruebas de sales-product.test.mjs contrastan las afirmaciones principales
con el catálogo, el programa y los tiempos de práctica. La revisión se limita
a código, pruebas y respuestas HTTP: no implica pruebas visuales de navegador
ni demuestra un incremento de conversiones.
