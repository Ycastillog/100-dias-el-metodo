# QA Release 1.1 Alpha

Fecha: 26/07/2026

## Alcance

Revision funcional, visual y tecnica de la landing, la plataforma del
participante, la biblioteca, el programa de embajadores y las paginas legales.

## Recorrido simulado

Se ejecuto un participante durante diez jornadas mediante controles reales de
la interfaz:

| Dia | Estado |
| --- | --- |
| 1 | Completado |
| 2 | Parcial |
| 3 | Perdido |
| 4 | Completado |
| 5 | Completado |
| 6 | Parcial |
| 7 | Completado |
| 8 | Completado |
| 9 | Perdido |
| 10 | Completado |

Resultado comprobado al abrir el Dia 11:

- Identidad Constructor.
- Diez entradas de diario.
- Seis dias completados.
- Dos parciales y dos perdidos.
- Un regreso al marco registrado.
- Revision del Dia 7 guardada y siguiente revision ubicada en el Dia 14.

Tambien se comprobo que un dia completo exige evidencia y que un estado parcial
no aumenta el porcentaje completado.

## Matriz del programa

Se verificaron 4,500 combinaciones:

`100 dias x 5 direcciones x 3 dosis x 3 niveles de energia`

Cada combinacion devolvio modulo, resultado, guia, ritmo, foco, cuatro
practicas, recurso de lectura, recurso audiovisual y nota de seguridad.

## Revision web

- Diez paginas HTML validadas sin errores estructurales.
- 110 referencias locales verificadas.
- JavaScript de aplicacion y curriculo validado sintacticamente.
- Cero errores de consola en landing, acceso y biblioteca.
- Todos los recursos solicitados respondieron HTTP 200 en el servidor local.
- Nueve paginas sin desbordamiento horizontal a 390 px y 1440 px.
- Navegacion instalada y notificaciones alineadas con `#hoy` y `#sistema`.
- Cache offline actualizado a `100-dias-shell-v6`.

## Lighthouse

| Pagina | Rendimiento | Accesibilidad | Buenas practicas | SEO |
| --- | ---: | ---: | ---: | ---: |
| Landing | 90 | 100 | 100 | 100 |
| Acceso | 91 | 100 | 100 | 100 |
| Biblioteca | 99 | 100 | 100 | 100 |

El aviso de back-forward cache observado pertenece a las cabeceras `no-store`
del servidor local de prueba y no es una falla del producto.

## Pendientes externos

- Endpoint de Google Sheets o Airtable.
- GA4 y pixeles publicitarios.
- Autenticacion privada y entrega automatica validada por webhook.
- Prueba de compra real por cada proveedor de pago.
- Primera cohorte de usuarios y creadores.

Estos puntos requieren cuentas, credenciales o comportamiento de usuarios
reales. No bloquean la prueba Alpha manual, pero si el escalado de anuncios.
