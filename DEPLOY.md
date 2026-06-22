# Publicacion de 100 Dias: El Metodo

## Carpeta publicable

La carpeta lista para subir es:

```text
dist
```

Incluye:

- `index.html`: landing de venta.
- `acceso.html`: plataforma del participante.
- `assets`: estilos y logica.
- `public/downloads`: entregables del Metodo.
- `_redirects`: soporte basico para Netlify.

No incluye `.env.local`, archivos internos de trabajo ni scripts privados.

## Carpeta GitHub Pages

La carpeta segura para GitHub Pages es:

```text
dist-github-pages
```

Esa version no debe incluir documentos premium reales en `public/downloads`.

## Probar localmente

```powershell
cd dist
python -m http.server 4290 --bind 127.0.0.1
```

Abrir:

```text
http://127.0.0.1:4290/
```

## Publicar rapido

### Netlify Drop

1. Ir a `https://app.netlify.com/drop`.
2. Arrastrar la carpeta `dist`.
3. Esperar el link temporal.
4. Probar landing, registro, acceso y descargas.

### Vercel

1. Crear nuevo proyecto.
2. Subir/importar este proyecto.
3. Configurar como sitio estatico.
4. Usar `dist` como carpeta de salida si lo solicita.

### Hostinger u otro hosting

1. Entrar al administrador de archivos.
2. Subir el contenido de `dist` a `public_html`.
3. Verificar que `index.html` quede en la raiz publica.

## Flujo a probar despues de publicar

1. Abrir la landing.
2. Elegir un plan.
3. Registrar nombre y email.
4. Entrar al acceso del participante.
5. Completar Dia 0.
6. Marcar Dia 1 como completado.
7. Descargar el Metodo Oficial.

## Activar pagos reales

Los botones de PayPal y Stripe leen sus enlaces desde:

```text
assets/payments.js
```

Ejemplo:

```js
window.PAYMENT_LINKS = {
  alpha: {
    paypal: "https://www.paypal.com/ncp/payment/TU_LINK",
    stripe: "https://buy.stripe.com/TU_LINK",
  },
};
```

El dinero no pasa por la pagina. Va directamente a la cuenta conectada en cada plataforma:

- PayPal: a la cuenta PayPal que crea el enlace.
- Stripe: a la cuenta Stripe que crea el Payment Link y luego al banco configurado.

Para Alpha, usar primero:

```text
Grupo Alpha - USD 9
```

## Activar captura externa de leads

El formulario guarda una copia local en el navegador. Para recibir leads en una herramienta externa, configurar:

```text
assets/site-config.js
```

Ejemplo:

```js
window.SITE_CONFIG = {
  leadEndpoint: "https://TU_ENDPOINT_DE_GOOGLE_SHEETS_O_ZAPIER",
  redirectAfterLead: "",
  whatsappNumber: "",
  analyticsDebug: false,
};
```

El endpoint debe aceptar `POST` con JSON.

## Paginas necesarias para anuncios

Mantener publicas estas rutas:

```text
privacidad.html
terminos.html
```

Ayudan a que la landing sea mas confiable para usuarios y plataformas de anuncios.
