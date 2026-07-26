# 100 DIAS: EL METODO

## Version

1.1 Alpha

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
- Contenido de lanzamiento: 14 DIAS LISTOS / 25 PIEZAS VISUALES EXPORTADAS
- Recorrido del participante: 100 DIAS DIFERENCIADOS / 15 MODULOS
- Navegacion del producto: HOY / CAMINO / DIARIO / BIBLIOTECA / MI SISTEMA
- Adaptacion diaria: ENERGIA + DOSIS DE 2, 10 O 20 MINUTOS
- Direcciones personales: MENTALIDAD / BIENESTAR / PROFESION / FINANZAS / RELACIONES
- Recordatorios: CALENDARIO DEL DISPOSITIVO + AVISO DEL NAVEGADOR LISTOS
- Continuidad diaria: PACTO PERSONAL + RITUAL + PROTOCOLO DE REGRESO LISTOS
- Cadencia: UNA JORNADA POR FECHA + RACHA CALENDARIO REAL LISTAS
- Resiliencia: INSTALACION + MODO SIN CONEXION + COPIA Y RESTAURACION LISTOS
- Guia editorial: AURELIA + CICLO VITAL LISTOS
- Curriculo integral: 15 MODULOS / 100 DIAS / 5 DIRECCIONES + 4 PRACTICAS LISTOS
- Biblioteca: 14 RECURSOS INICIALES CON FUENTE Y FUNCION COMPARTIR LISTOS
- QA de producto: 100 DIAS SIMULADOS / 4,500 COMBINACIONES VERIFICADAS
- Validacion de mercado: EN CURSO

## Fecha de cierre de construccion

Construccion inicial: 16/06/2026

Revision integral actual: 26/07/2026

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
- Eventos preparados: payment_click, access_view, day0_submit, daily_ritual_started, return_protocol_used, daily_status_submit, day1_submit, day7_submit, weekly_review_submit, browser_reminder_enabled, daily_reminder_shown, calendar_reminders_download, journal_download, backup_export, backup_import, app_installed
- Acceso Alpha: enlace privado enviado solo despues de validar el pago
- Recorrido completo: 100 dias con tema, objetivo, guia, principio, pregunta, accion, tarea y acompanamiento diferenciados
- Rutas internas: Activacion, Evidencia, Control, Fortaleza, Direccion, Sistema Personal y cierre con evidencia
- Progresion: dias futuros visibles pero bloqueados para evitar saltos accidentales
- Ritmo diario: cerrar una jornada habilita la siguiente en una nueva fecha calendario
- Personalizacion: el Dia 0 alimenta direccion, senal, accion minima, regreso, dashboard, calendario y avisos
- Adaptacion: antes de ejecutar, el participante indica energia y elige una dosis real de 2, 10 o 20 minutos
- Espacios: Hoy concentra la accion; Camino muestra etapas; Diario conserva evidencia; Mi sistema contiene soporte y datos
- Vida integral: cinco direcciones personales y cuatro practicas complementarias con foco diario recomendado
- Acompanamiento: Aurelia organiza la jornada; los filosofos se presentan como mentores historicos
- Recursos: biblioteca publica con lecturas abiertas, OMS, CFPB y videos identificados
- Evidencia diaria: intencion, accion realizada, practicas integrales, reflexion y estado
- Revisiones: se habilitan solo en el hito pendiente y se cierran al guardarse
- Datos del participante: diario en texto y copia JSON restaurable
- Modo sin conexion: nucleo de landing y acceso disponible despues de la primera carga
- Recordatorios actuales: archivo de calendario con tareas diarias y aviso local mientras la plataforma esta abierta
- Especificacion operativa: automation/NOTIFICACIONES_100_DIAS.md
- Seguridad actual: bloqueo estatico de conveniencia; la automatizacion real requiere webhook y backend
- Programa de creadores: embajadores.html
- Comision: 25% por compra atribuida
- Ventana de click: 30 dias
- Ventana de ascenso: 60 dias
- Control financiero: outputs/embajadores-dia-1/EMBAJADORES_CONTROL.xlsx
- Eventos de creadores: affiliate_landing_view, ambassador_cta_click, ambassador_application_submit, ambassador_thank_you_view

## Calidad verificada

- 4,500 combinaciones del programa: 100 dias x 5 direcciones x 3 dosis x 3 niveles de energia.
- Simulacion completa de participante durante 100 fechas consecutivas.
- 100 jornadas, 100 temas, 15 modulos, 15 revisiones y 4 regresos comprobados.
- Exportacion del diario y restauracion de la copia con 100 jornadas comprobadas.
- Protocolo de regreso, racha, revision del Dia 7 e identidad Constructor comprobados.
- Landing, acceso y biblioteca sin errores de consola ni recursos fallidos.
- Nueve paginas sin desbordamiento horizontal a 390 px y 1440 px.
- Lighthouse: Landing 90/100/100/100; Acceso 91/100/100/100; Biblioteca 99/100/100/100.
- HTML semantico, JavaScript, enlaces locales y cache offline validados.

Reporte: `validation/QA_RELEASE_V1_1.md`.

Recorrido completo: `validation/QA_100_DIAS_COMPLETOS.md`.

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
