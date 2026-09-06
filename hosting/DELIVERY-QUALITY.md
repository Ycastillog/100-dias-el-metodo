# Calidad de la entrega · 6 de septiembre de 2026

## Alcance

El producto es un recorrido digital autoguiado, no un libro, una colección de citas ni una promesa de resultados. Cada práctica conecta una explicación, una acción manejable, un criterio de observación y una alternativa reducida. Las cinco áreas siguen disponibles; no se exige completar cinco tareas por día.

## Contenido y compatibilidad

- `curriculum-lessons.json`: 100 entradas editoriales privadas, en el orden y con los identificadores existentes. Los días 8–100 utilizan las nuevas explicaciones y acciones. Los días 1–7 conservan íntegramente sus guías por área, audios y transcripciones aprobados; la alternativa reducida se toma de su propia variante de dos minutos para evitar contradicciones.
- `curriculum.mjs`: conexión de las cinco áreas con las tres etapas y 15 ejemplos ilustrativos. Los ejemplos contextualizan una etapa, no son testimonios, recomendaciones profesionales ni 500 lecciones independientes.
- El contenido completo se incorpora únicamente al Worker. La API entrega el día solicitado después de verificar la compra, el plan, su vencimiento y el estado del cobro. Los nuevos archivos no se sirven como recursos estáticos.
- Se preservan los identificadores de días, precios, ventanas de acceso, registros, revisiones, códigos, PayPal, la base de datos y los nombres de las herramientas. No se ejecutan migraciones ni cobros reales.
- No se añaden audios para los días 8–100 ni se anuncian 100 videoclases.

## Experiencia de uso

La práctica aparece antes de las cinco herramientas de conjunto. Los ejemplos y las ideas de apoyo son opcionales. El registro de un día posterior no se rellena con la primera intención del Día 0; los registros ya guardados se recuperan sin cambios. La revisión distingue inicio, ajuste y cierre según el acceso comprado. El informe descargado separa los datos de la persona de las orientaciones para continuar fuera de la plataforma.

## Criterios editoriales

- Acciones observables y adaptación al tiempo y energía, sin presión para aguantar dolor o situaciones inseguras.
- Finanzas: organización de documentos, importes y fechas propios; sin estrategias de inversión o deuda.
- Relaciones: consentimiento, límites y seguridad; ningún mensaje se envía automáticamente.
- Bienestar: descanso o cuidado cotidiano adaptable; no diagnóstico ni régimen obligatorio.
- Filosofía: las fuentes y adaptaciones existentes siguen separadas de las reflexiones originales del programa.
- No se inventan logros ni se rellenan retrospectivamente días sin datos. El cierre reconoce también dificultades y asuntos pendientes.

## Verificación

Pruebas de los 100 días × cinco áreas × tres duraciones, primeras siete guías y medios conservados, cierre según plan, protección de contenido, conservación de notas, navegación y renderizado mediante adaptadores en memoria. Prueba del Worker compilado sin red, sin escribir datos reales y sin cobrar. La inspección visual en navegador no se realizó porque no fue solicitada en este cambio.
