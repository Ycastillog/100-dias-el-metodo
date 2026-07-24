# Auditoria funcional y visual

## Embajadores del Dia 1

Fecha: 23 de julio de 2026

## Alcance probado

- Landing principal y bloque de embajadores.
- Pagina publica del programa.
- Simulador de comisiones.
- Formulario de solicitud.
- Pagina de confirmacion.
- Terminos del programa.
- Persistencia de atribucion.
- Enlaces de pago con datos de atribucion.
- Libro financiero de control.

## Resultados visuales

Se probaron los recorridos en:

- Movil: 390 x 844 px.
- Tablet y anchos intermedios: 768 y 960 px.
- Escritorio: 1440 x 900 px.

Resultados:

- Sin desplazamiento horizontal no intencional.
- Sin controles, titulos o textos recortados.
- Sin imagenes rotas.
- Sin identificadores HTML duplicados.
- Sin errores ni advertencias en la consola.
- Todos los campos y botones tienen nombre accesible.
- Tabla de comisiones legible completa en movil.
- Formulario apilado correctamente en movil.

Las capturas de evidencia estan en:

`outputs/embajadores-dia-1/audit`

## Resultados funcionales

### Simulador

Caso probado:

- Plan Premium: USD 297.
- Compras atribuidas: 3.
- Venta bruta: USD 891.00.
- Comision del creador: USD 222.75.
- Parte de la marca antes de costos: USD 668.25.

El calculo corresponde al 25%.

### Solicitud

Se completo el formulario como una creadora real, incluyendo:

- Datos de contacto.
- Plataforma.
- Tamano de audiencia.
- Compromiso con Dia 0 y Dia 1.
- Divulgacion comercial.
- Aceptacion de terminos.

El recorrido llego correctamente a la pagina de confirmacion. Cuando no existe
un endpoint externo, la solicitud queda guardada en el navegador y el sistema
lo comunica sin afirmar que fue enviada.

### Atribucion

Se probo una llegada con:

`?ref=creadoraqa`

Resultados:

- El codigo se normaliza y persiste.
- La landing identifica la invitacion.
- La atribucion de campana dura 30 dias.
- La atribucion del embajador dura 60 dias.
- Un codigo explicito tiene prioridad sobre referencias posteriores.
- Los enlaces PayPal reciben parametros UTM.
- Los enlaces Stripe reciben UTM y `client_reference_id`.

### Libro financiero

Archivo:

`outputs/embajadores-dia-1/EMBAJADORES_CONTROL.xlsx`

Se verificaron:

- Nueve hojas.
- Formulas sin errores.
- Comision del 25%.
- Costo del proveedor.
- Neto de la marca.
- Estado de Dia 1 y Dia 7.
- Control de pagos al embajador.
- Validaciones y hoja de comprobaciones.

## Activaciones externas pendientes

El producto y el codigo estan preparados, pero estos tres puntos requieren
datos o permisos de las cuentas del negocio:

1. Publicar Google Apps Script y colocar su URL en `assets/site-config.js`
   como `leadEndpoint` y `eventEndpoint`.
2. Crear o seleccionar la propiedad GA4 y colocar su identificador en
   `gaMeasurementId`.
3. Conectar webhooks verificados de Stripe y PayPal, o hacer conciliacion
   manual, para declarar una compra como pagada y liquidar comisiones.

Hasta conectar el primer punto, el formulario sirve para demostracion y guarda
la solicitud localmente, pero no notifica al equipo fuera de ese navegador.

## Veredicto

El sistema esta listo para publicarse, presentar la propuesta y seleccionar la
primera cohorte privada de 10 creadores. El reclutamiento operativo debe
comenzar despues de conectar el endpoint de solicitudes para evitar perder
aplicaciones reales.
