// Server-only teaching material. Never stage this file as a public asset.
const contexts = {
  mentalidad: {
    bridge: 'Conecta la idea con un hábito o una decisión propia. La herramienta te permite preparar una acción y una alternativa; no tienes que añadir una segunda tarea.',
    safety: 'Puedes pausar una reflexión si te resulta abrumadora. Este material educativo no sustituye apoyo profesional.',
    examples: [
      'Ejemplo ilustrativo de esta etapa: antes de una tarea aparece «voy a hacerlo mal». La persona anota ese pensamiento en privado, sin convertirlo en una conclusión sobre su capacidad.',
      'Ejemplo ilustrativo de esta etapa: al escribir, una persona quiere corregir cada palabra. Conserva una frase imperfecta como registro de su intento, en lugar de descartar todo.',
      'Ejemplo ilustrativo de esta etapa: después de revisar intentos y pausas, una persona elige una sola pregunta para su próximo registro. Puede cambiarla si deja de servirle.'
    ]
  },
  finanzas: {
    bridge: 'Puedes usar tu tabla para comprobar un compromiso propio, su importe y su fecha. Si la práctica de hoy trata otro tema, guarda solo la conexión que te resulte útil.',
    safety: 'Organiza documentos y fechas propios. No incluyas números de cuenta. No se ofrecen decisiones de inversión, estrategias de deuda ni promesas de ingresos.',
    examples: [
      'Ejemplo ilustrativo de esta etapa: una persona localiza una factura y copia su fecha exacta. Deja el importe pendiente si todavía no puede comprobarlo, en vez de escribirlo de memoria.',
      'Ejemplo ilustrativo de esta etapa: tras una interrupción, una persona archiva una factura propia en la carpeta elegida. No necesita organizar todo el historial para retomar.',
      'Ejemplo ilustrativo de esta etapa: una persona compara sus revisiones de documentos, incluidas las que no hizo. Elige un próximo momento que encaje con su horario real.'
    ]
  },
  relaciones: {
    bridge: 'Conecta la idea con una necesidad, un límite o una conversación segura. Tu herramienta es un borrador privado: no se envía ni obliga a contactar con nadie.',
    safety: 'Respeta el consentimiento y los límites. Si hay amenazas o violencia, prioriza tu seguridad y apoyo adecuado; no tienes que confrontar a nadie.',
    examples: [
      'Ejemplo ilustrativo de esta etapa: una invitación coincide con un descanso previsto. La persona reconoce su preferencia en privado antes de decidir si quiere comunicarla.',
      'Ejemplo ilustrativo de esta etapa: si es seguro, una persona prepara «ahora no puedo responder; retomaré cuando tenga disponibilidad». No exige que la otra persona esté de acuerdo.',
      'Ejemplo ilustrativo de esta etapa: al revisar conversaciones y asuntos pendientes, una persona elige un límite que quiere mantener. Reconoce que la respuesta ajena no depende de ella.'
    ]
  },
  bienestar: {
    bridge: 'Puedes aplicar la idea a una pausa, al descanso o a una preparación cotidiana de cuidado. Elige algo compatible con tus necesidades; no es un entrenamiento obligatorio.',
    safety: 'Adapta cualquier movimiento y descanso a tus necesidades. Detente ante dolor o malestar y sigue las indicaciones profesionales que correspondan a tu situación.',
    examples: [
      'Ejemplo ilustrativo de esta etapa: una persona prueba una pausa cómoda entre actividades. La termina si la postura resulta incómoda; no tiene que aguantar para completar el registro.',
      'Ejemplo ilustrativo de esta etapa: la pausa elegida coincide repetidamente con una responsabilidad. La persona cambia el momento, sin acumular descansos pendientes como tareas.',
      'Ejemplo ilustrativo de esta etapa: al revisar sus notas, una persona conserva una opción de descanso que le resulta accesible. La adapta cuando cambian sus necesidades.'
    ]
  },
  profesional: {
    bridge: 'Lleva la idea a un proyecto, una tarea de trabajo o una prioridad de estudio. Prepara un siguiente paso concreto, respetando tus responsabilidades y acuerdos.',
    safety: 'Respeta los compromisos laborales y la confidencialidad. No incluyas información de clientes. El ejercicio no garantiza empleo, ascensos ni ingresos.',
    examples: [
      'Ejemplo ilustrativo de esta etapa: en vez de «avanzar con todo», una persona escribe el título de un documento pendiente. Ese inicio no equivale a haber terminado el documento.',
      'Ejemplo ilustrativo de esta etapa: si sus responsabilidades lo permiten, una persona silencia una alerta opcional durante un bloque breve de trabajo y después restablece su disponibilidad.',
      'Ejemplo ilustrativo de esta etapa: una persona revisa tareas completadas y pendientes. Conserva una herramienta que le ayudó a saber por dónde continuar, sin afirmar que solucionó todo.'
    ]
  }
};

export function curriculumGuide(curriculum, lessons, day, area, minutes, energy) {
  const entry = curriculum?.find(item => item.day === day);
  const context = Object.hasOwn(contexts, area) ? contexts[area] : null;
  const lesson = lessons?.find(item => item.day === day);
  if (!entry || !context || !lesson) return null;
  const reduced = minutes === 2 || energy === 'low';
  return {
    title: 'La idea detrás de la práctica',
    explanation: entry.explanation,
    task: entry.action,
    activity: reduced ? entry.smaller : 'Trabaja en una parte de esta acción durante tu bloque disponible. Si no cabe completa, utiliza la versión pequeña que aparece debajo; no añadas otra tarea.',
    reflection: '¿Qué situación concreta de tu vida quieres trabajar con esta idea?',
    evidence: entry.evidence,
    smaller: entry.smaller,
    bridge: context.bridge,
    example: context.examples[day <= 30 ? 0 : day <= 60 ? 1 : 2],
    safety: context.safety + ' Puedes registrar un intento parcial, una pausa o que hoy no empezaste.',
    audio: null, transcript: '', video: null,
  };
}

