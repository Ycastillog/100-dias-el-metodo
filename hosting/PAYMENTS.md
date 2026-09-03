# Pagos únicos — estado y activación

Decisiones del titular, 2 de septiembre de 2026:

- Alpha: USD 9; Método: USD 29; Sistema: USD 79; Premium: USD 297.
- Un solo pago por el plan elegido. No hay suscripciones, cuotas mensuales/anuales,
  cobros futuros automáticos ni obligación de comprar todos los planes.
- Todos los planes son digitales y autoguiados. Se retiraron las promesas de
  clínicas grupales, asesorías, sesiones privadas y seguimiento personal.
- La duración del recorrido sigue siendo 14 días Alpha / 100 días otros planes;
  pago único no significa acceso vitalicio.

## Implementado, todavía no activado

`/comprar` presenta los cuatro importes y explica el estado real del checkout.
Sin configuración muestra **ventas cerradas**, no crea cookies de compra y no
puede contactar PayPal. No se enlazó desde la portada de prelanzamiento.

El servidor prepara pedidos de PayPal Orders v2 con `intent: CAPTURE`, registra
la solicitud antes de enviarla y calcula el importe desde su propio catálogo.
Solo verifica un pago si coinciden pedido, plan, referencia interna, moneda,
importe y comercio receptor. Usa identificadores estables para los reintentos.
Las notificaciones se verifican con PayPal, se procesan en transacciones y
consultan el estado actual antes de registrar un pago, reembolso o reversión.

Una cookie HttpOnly vincula esta sesión de checkout a sus recibos. No es una
cuenta de participante ni un sistema de recuperación. Los recibos y pedidos se
guardan en D1; nunca se concede acceso con `?alpha=1`, localStorage o la URL de
retorno. `delivery_status` permanece `not_ready` o `revoked`.

Las 42 pruebas automatizadas locales usan SQLite en memoria y respuestas PayPal
simuladas. NO son una compra real ni demuestran recepción de fondos. La comprobación
adicional contra la API Sandbox se detalla abajo. Los enlaces NCP antiguos se conservan, pero no se usan como
confirmación de compra ni se asume que sus eventos pertenezcan a esta aplicación.

## Configuración Sandbox realizada, 2 de septiembre de 2026

El titular confirmó que la cuenta receptora pertenece a YC Systems LLC y autorizó
crear la aplicación de prueba, aceptar el acuerdo de desarrollador de PayPal y
guardar sus credenciales protegidas. Se creó **100 Dias El Metodo - Sandbox**,
de tipo Merchant, con una cuenta empresarial de prueba. No se creó una aplicación
Live ni se modificaron los cobros reales de la empresa.

Se guardaron Client ID, secreto, comercio y webhook como secretos de Sites.
`PAYPAL_ENV=sandbox` y `CHECKOUT_ENABLED=false`. La revisión de entorno guardada
es la 3; todavía no está aplicada a la publicación, que conserva la revisión 0.
Aplicarla requiere una nueva publicación aprobada; no equivale a abrir ventas.
No guardar valores de credenciales en Git, HTML, capturas ni mensajes del chat.

Prueba real contra **api-m.sandbox.paypal.com** con el adaptador de la aplicación:

- Autenticación de la aplicación: aceptada.
- Webhook de los seis eventos de captura: creado y verificado en la respuesta de
  PayPal, con la URL propia indicada abajo.
- Pedidos de USD 9, 29, 79 y 297: creados y consultados correctamente; se verificó
  comercio, moneda, importe, referencia interna, plan e intención `CAPTURE`.
- Una repetición de cada solicitud devolvió el mismo pedido de PayPal.
- Los cuatro quedaron `PAYER_ACTION_REQUIRED`, sin aprobación ni captura.
  No se movió dinero, ni real ni de prueba. No se han probado todavía el pago
  aprobado, la recepción de webhooks en la web pública o la entrega de contenido.
- Las 42 pruebas automatizadas siguen pasando.

`hosting/sandbox-check.mjs` permite repetir estas comprobaciones solo con una
operación explícita (`--register-webhook` o `--create-orders`). Restringe el destino
a Sandbox, recibe secretos solo en el entorno del proceso y nunca los imprime.
Reutilizar el mismo `PAYPAL_TEST_RUN_ID` para reintentar el mismo lote. No forma
parte de la aplicación pública ni se ejecuta con `npm test`.

Configuración necesaria para una futura prueba integral:

| Variable | Valor |
| --- | --- |
| CHECKOUT_ENABLED | `true` únicamente para una prueba autorizada |
| CHECKOUT_ORIGIN | Origen HTTPS exacto, sin barra final |
| PAYPAL_ENV | `sandbox` |
| PAYPAL_CLIENT_ID | Client ID de la aplicación Sandbox |
| PAYPAL_CLIENT_SECRET | Secreto de esa misma aplicación; marcar como secreto |
| PAYPAL_MERCHANT_ID | ID del comercio Sandbox vinculado a la aplicación |
| PAYPAL_WEBHOOK_ID | ID del webhook de esa misma aplicación y entorno |

Webhook: `https://100diaselmetodo.com/api/paypal/webhook`. Registrar solo los
eventos `PAYMENT.CAPTURE.COMPLETED`, `PENDING`, `DENIED`/`DECLINED` según los que
ofrezca el panel, `REFUNDED` y `REVERSED`. No activar suscripciones ni Vault.
El registro ya existe en la aplicación Sandbox. Con el checkout desactivado,
el receptor público también permanece cerrado; registrar la URL no demuestra
que las notificaciones lleguen ni que se procesen correctamente.
Una URL pública para Sandbox y las escrituras de secretos necesitan aprobación
de su publicación/configuración. No enviar compradores reales a una prueba.

La revisión privada y el prelanzamiento comparten el handler, pero no incorporan
secretos. El servidor Vite local conserva cabeceras y cuerpo; no tiene una DB
de producción ni credenciales. Para las pruebas automatizadas: `npm test`.

## Bloqueo de cobros reales, intencional

`LIVE_FULFILLMENT_READY = false` hace que el modo `live` siga cerrado aunque se
configuren claves. No retirar esta protección solo para mostrar un botón activo.
Faltan los siguientes requisitos para abrir ventas:

1. Materiales finales por plan: el proyecto contiene un prototipo del recorrido,
   pero `public/downloads` solo contiene un aviso; no hay paquetes finales.
   Las nuevas descripciones digitales de Sistema y Premium son una propuesta
   de contenido, no una afirmación de que ya se produjo.
2. Acceso protegido en servidor, almacenamiento duradero del progreso, entrega
   y recuperación de acceso. El prototipo usa datos locales y no es un área de
   cliente segura. Confirmar con Sites una vía de autenticación adecuada para
   compradores externos antes de implementar cuentas; no imponer ChatGPT ni
   construir autenticación propia como si ya estuviera resuelta.
3. Correo de soporte confirmado, aviso de privacidad para compradores, condiciones
   definitivas de entrega y reembolsos. El aviso actual cubre solo la lista de espera.
4. Prueba Sandbox real de los cuatro precios, rechazo/cancelación, doble clic,
   respuesta perdida, webhook duplicado y reembolso, comprobando el área del cliente.
5. Configuración Live de la misma cuenta receptora, permiso de publicación pública
   y una comprobación autorizada de compra/entrega/reembolso. No hacer un cargo
   real ni un reembolso automáticamente durante una revisión técnica.

## Migraciones y seguridad

`0002_chubby_sumo.sql` agrega `purchase_orders` y `payment_events`; no modifica
ni elimina leads o métricas existentes. No editar migraciones ya publicadas.
Se guardan correo de contacto, referencias, importes y estados; no tarjetas,
contraseñas, cuerpos completos de webhooks ni IP en tablas de aplicación.
El límite por sesión es una defensa básica; añadir rate limiting operativo
antes del lanzamiento, pues cambiar de cookie no representa una identidad.

Fuentes técnicas primarias:

- https://developer.paypal.com/studio/checkout/standard/integrate
- https://developer.paypal.com/api/rest/reference/idempotency/
- https://developer.paypal.com/api/rest/webhooks/rest/
- https://developer.paypal.com/api/rest/webhooks/event-names/
