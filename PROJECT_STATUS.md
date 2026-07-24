# 100 DIAS: EL METODO

## Version

1.0

## Estado

PRODUCTO LISTO PARA VALIDACION ALPHA

## Estado de negocio

- Producto: LISTO
- Metodo: LISTO
- Sistema: LISTO
- Programa y niveles de entrega: DEFINIDOS
- Experiencia: LISTA
- Operacion: COMPRA ACTIVA / VALIDACION DE PAGO MANUAL
- Mercado: PROGRAMA DE EMBAJADORES PREPARADO / PENDIENTE DE PRIMERA COHORTE
- Validacion: EN CURSO

## Fecha de cierre de construccion

16/06/2026

## Regla operativa

NO AGREGAR NUEVOS MODULOS DEL METODO HASTA TERMINAR EL ALPHA.

Solo se permiten ajustes operativos para que la venta, el acceso y la experiencia del participante funcionen correctamente.

Cada hora adicional de desarrollo debe justificarse con una observacion real de usuario.

No confundir ausencia de funciones con ausencia de valor.

Documento operativo principal: `OPERATING_SYSTEM.md`.

North Star Metric: usuarios que llegan al Dia 7 y deciden continuar voluntariamente.

## Proxima accion

Conectar Google Sheets y GA4. PayPal y Stripe ya estan activos para USD 9, USD 29, USD 79 y USD 297. Durante Alpha, validar cada pago antes de enviar el acceso privado. Luego seleccionar 10 participantes Alpha y 10 creadores para la primera cohorte de Embajadores del Dia 1.

## Roadmap empresarial

1. Usuario descubre el metodo.
2. Usuario compra.
3. Usuario entra.
4. Usuario ejecuta Dia 1.
5. Usuario vuelve Dia 2.
6. Usuario llega Dia 7.
7. Usuario recomienda el metodo.
8. Usuario compra la continuacion.

## Olas de validacion

- Primera ola: 10 usuarios.
- Segunda ola: 30 usuarios.
- Tercera ola: 100 usuarios.

No invertir en anuncios hasta tener senales basicas de retencion, conversion, permanencia y valor percibido.

## Flujo operativo

La experiencia canonica esta definida en `PROGRAMA_100_DIAS.md`. La entrega y los limites de Alpha, Metodo, Sistema y Premium estan definidos en `validation/06_ENTREGA_PLANES.md`.

- Landing de venta: index.html
- Acceso del participante: acceso.html
- Entregables del metodo: public/downloads
- Seguimiento local: navegador del participante
- Eventos preparados: payment_click, access_view, day0_submit, daily_status_submit, day1_submit, day7_submit, weekly_review_submit
- Acceso Alpha: enlace privado enviado solo despues de validar el pago
- Seguridad actual: bloqueo estatico de conveniencia; la automatizacion real requiere webhook y backend
- Programa de creadores: embajadores.html
- Comision: 25% por compra atribuida
- Ventana de click: 30 dias
- Ventana de ascenso: 60 dias
- Control financiero: outputs/embajadores-dia-1/EMBAJADORES_CONTROL.xlsx
- Eventos de creadores: affiliate_landing_view, ambassador_cta_click, ambassador_application_submit, ambassador_thank_you_view

## Objetivo del Alpha

Descubrir comportamiento real:

- Quien completa Dia 0
- Quien completa Dia 1
- Quien llega al Dia 7
- Quien llega al Dia 14
- Donde deja de volver
- Que frases indican recuperacion de control

## Pregunta clave cuando alguien abandona

Que paso el dia que dejaste de volver?

## Criterio

El siguiente aprendizaje no esta en el codigo.

Esta en usuarios reales.
