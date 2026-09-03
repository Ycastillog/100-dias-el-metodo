# Artefacto de prelanzamiento

La web comercial y el programa original no se sobrescriben. Esta salida conserva su diseño y sus imágenes públicas, con una muestra estática y las redes verificadas. No incluye el programa completo, formularios, checkout ni una barrera de acceso local que pueda confundirse con autenticación.

- `npm run dev:prelaunch`: vista local del candidato en el puerto habitual 8790.
- `npm run build:prelaunch`: Worker y archivos estáticos con lista permitida reducida.
- `npm test`: pruebas de la revisión privada y del candidato público.

El modo predeterminado sigue siendo una revisión privada y **no debe abrirse al público**. Sólo el artefacto generado explícitamente con `build:prelaunch` puede proponerse para publicación pública, tras aprobación del titular y configuración del alojamiento/dominio. La carpeta generada `dist/client` se recrea verificando antes su ubicación y rechazando enlaces simbólicos; así no conserva archivos del programa de una compilación anterior.

Los dos modos mantienen noindex mientras el lanzamiento está en preparación. Cambiar el DNS no implementa autenticación, cobros ni entrega. La exposición previa en el repositorio público y GitHub Pages no desaparece por desplegar este artefacto; debe revisarse separadamente sin eliminar ni privatizar el repositorio sin autorización.

Pendientes para una venta real: titularidad de pagos, webhook verificable, autenticación/autorización en servidor, entrega y recuperación de acceso, tratamiento de datos, soporte y prueba de compra/reembolso autorizada. No prometer disponibilidad de estas funciones antes de completarlas.

## Preparación de pagos únicos

La ruta `/comprar` presenta ahora los cuatro precios de pago único. Las rutas de
PayPal y las tablas de pedidos están implementadas para pruebas, pero permanecen
cerradas sin configuración y bloquean explícitamente el modo de cobros reales
hasta completar la entrega. No se enlazan desde la portada de prelanzamiento.
Consultar `PAYMENTS.md` antes de configurar, probar o proponer su publicación.
