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

Las pruebas locales usan SQLite y respuestas PayPal simuladas. Cubren precios,
comercio, importe, firma, reintentos, aislamiento de compras, duración, límites de
plan, conflictos del diario, entrega y recuperación. Las pruebas de interfaz no
realizan cargos y no sustituyen una compra aprobada en PayPal Sandbox.

Completado contra PayPal: autenticación Live y Sandbox, pedidos Sandbox sin
aprobar, registro de webhooks, verificación del comercio Live sin captura.
Pendiente: compra aprobada y capturada con comprador ficticio de Sandbox,
recepción real de sus eventos, recuperación y reembolso de esa misma prueba.
La sesión del panel expiró antes de esa prueba; se pidió al titular volver a
iniciar sesión. No abrir cobros reales ni afirmar una prueba de extremo a extremo
completada hasta obtener esa evidencia. No realizar un cargo o devolución Live
para probar sin una autorización específica del titular.

Publicar requiere: `npm test`, `npm run build:sales`, fuente exacta subida,
archivo creado con el empaquetador oficial de Sites y despliegue de esa versión.
Nunca publicar secretos ni incluir los archivos heredados de acceso del cliente.
Las migraciones 0003/0004 agregan registros y contadores, sin borrar compras o leads.
