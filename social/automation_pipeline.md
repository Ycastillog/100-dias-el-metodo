# Automatizacion de Contenido - V1

## Objetivo

Convertir contenido en conversaciones y conversaciones en usuarios Alpha.

## Flujo manual inicial

```text
Contenido publicado
↓
Comentario CONTROL
↓
DM con mensaje aprobado
↓
Link a landing
↓
Registro
↓
Pago Alpha
↓
Acceso al Metodo
↓
Medicion Dia 1 / Dia 7
```

## Herramientas posibles

No activar todas ahora. Elegir segun necesidad.

### Programacion de contenido

- Meta Business Suite para Instagram/Facebook.
- TikTok Studio para TikTok.
- Buffer o Metricool si se quiere una sola bandeja.

### Automatizacion de DMs

- Manychat para Instagram.
- Respuesta manual al inicio si son pocos comentarios.

### Pagos

- PayPal link.
- Stripe Payment Link.

### Registro

- La landing actual registra localmente para prueba.
- Para produccion real, conectar formulario a:
  - Google Sheets
  - Airtable
  - ConvertKit
  - MailerLite
  - Brevo

## Reglas de automatizacion

1. No automatizar spam.
2. No enviar DMs a quien no interactuo.
3. No prometer transformacion garantizada.
4. No ocultar que es Alpha.
5. No exponer documentos premium publicamente.

## Variables

```text
{LINK_LANDING}
{LINK_ACCESO}
{LINK_PAYPAL_ALPHA}
{LINK_STRIPE_ALPHA}
```

## Secuencia DM automatizable

### Trigger

Comentario contiene:

```text
CONTROL
```

### Mensaje 1

Enviar:

```text
Gracias por escribir CONTROL.

Estoy abriendo el Grupo Alpha de 100 Dias: El Metodo.

14 dias. 10 personas. USD 9.

La meta es simple: completar Dia 0, ejecutar Dia 1 y observar si llegas al Dia 7.

Aqui esta el acceso:
{LINK_LANDING}
```

### Mensaje 2 - 24 horas despues si no responde

```text
Solo para cerrar el ciclo:

Quieres que te guarde un cupo del Alpha o prefieres dejarlo pasar por ahora?
```

### Mensaje 3 - despues de pago

```text
Bienvenido al Alpha.

Tu primera accion:
1. Entra al acceso.
2. Completa Dia 0.
3. Ejecuta Dia 1.

{LINK_ACCESO}
```

## Primera automatizacion recomendada

No empezar con IA compleja.

Empezar con:

1. Calendario de contenido.
2. Respuestas DM guardadas.
3. Tracker de comentarios y pagos.
4. Links PayPal/Stripe conectados.

Despues:

1. Manychat para responder CONTROL.
2. Google Sheets para leads.
3. Email de bienvenida.
