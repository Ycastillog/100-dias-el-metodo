(() => {
  const resources = [
    {
      id: "meditaciones",
      category: "lectura",
      format: "Libro de dominio publico",
      title: "Meditaciones",
      author: "Marco Aurelio",
      description:
        "Un diario de reflexion sobre responsabilidad, perspectiva y conducta.",
      source: "Biblioteca Virtual del Ministerio de Educacion de Republica Dominicana",
      url: "https://ministeriodeeducacion.gob.do/docs/biblioteca-virtual/F7v3-aurelio-marco-meditacionespdf.pdf",
      use: "Lee una seccion breve y convierte una idea en una conducta observable.",
    },
    {
      id: "manual_epicteto",
      category: "lectura",
      format: "Libro de dominio publico",
      title: "Enquiridion o Manual de Epicteto",
      author: "Epicteto",
      description:
        "Una introduccion directa a distinguir lo que depende de ti de lo que no.",
      source: "PruébaT, Fundacion Carlos Slim",
      url: "https://cdn.pruebat.org/libros/pdf/Enquiridion-o-manual-de-epicteto-Epicteto.pdf",
      use: "Lee uno o dos apartados y aplicalos a una decision de hoy.",
    },
    {
      id: "cartas_lucilio",
      category: "lectura",
      format: "Lectura abierta",
      title: "Cartas a Lucilio",
      author: "Seneca",
      description:
        "Cartas practicas sobre tiempo, caracter, amistad, temor y vida consciente.",
      source: "Wikisource",
      url: "https://es.wikisource.org/wiki/Cartas_a_Lucilio",
      use: "Elige una carta por semana. No leas para acumular; lee para practicar.",
    },
    {
      id: "actividad_oms",
      category: "movimiento",
      format: "Guia institucional",
      title: "Actividad fisica",
      author: "Organizacion Mundial de la Salud",
      description:
        "Beneficios, niveles recomendados y principio de que toda actividad cuenta.",
      source: "OMS",
      url: "https://www.who.int/es/news-room/fact-sheets/detail/physical-activity",
      use: "Usa la guia para elegir movimiento seguro y gradual segun tu capacidad.",
    },
    {
      id: "directrices_oms",
      category: "movimiento",
      format: "Directrices en PDF",
      title: "Actividad fisica y habitos sedentarios",
      author: "Organizacion Mundial de la Salud",
      description:
        "Resumen en espanol de recomendaciones basadas en evidencia para distintas edades y capacidades.",
      source: "OMS",
      url: "https://iris.who.int/bitstream/handle/10665/349729/9789240032194-spa.pdf?sequence=1",
      use: "Consulta las recomendaciones generales y adapta el ritmo a tu realidad.",
    },
    {
      id: "bienestar_financiero",
      category: "finanzas",
      format: "Evaluacion educativa",
      title: "Calcule su bienestar financiero",
      author: "Oficina para la Proteccion Financiera del Consumidor",
      description:
        "Diez preguntas para observar control, seguridad y libertad de eleccion financiera.",
      source: "CFPB",
      url: "https://www.consumerfinance.gov/es/herramientas-del-consumidor/bienestar-financiero/",
      use: "Completa la evaluacion al inicio y repitela al final sin compartir datos privados.",
    },
    {
      id: "dinero_metas",
      category: "finanzas",
      format: "Kit educativo en PDF",
      title: "Su dinero, sus metas",
      author: "Oficina para la Proteccion Financiera del Consumidor",
      description:
        "Herramientas para revisar ingresos, gastos, facturas, deuda y objetivos.",
      source: "CFPB",
      url: "https://www.consumerfinance.gov/documents/6676/bcfp_your-money-goals_a-financial-empowerment-toolkit_es.pdf",
      use: "Trabaja solamente la herramienta relacionada con la etapa actual.",
    },
    {
      id: "plan_deuda",
      category: "finanzas",
      format: "Hoja educativa en PDF",
      title: "Planear para liberarse de deudas",
      author: "Oficina para la Proteccion Financiera del Consumidor",
      description:
        "Una hoja breve para observar deudas, presupuesto y posibles pasos.",
      source: "CFPB",
      url: "https://files.consumerfinance.gov/f/documents/cfpb_planning-to-become-debt-free_handout_es.pdf",
      use: "Usala para ordenar informacion, no para sustituir asesoramiento profesional.",
    },
    {
      id: "video_habitos",
      category: "video",
      format: "Video",
      title: "Los 5 habitos que transforman tu vida",
      author: "David Samra, TEDx",
      description:
        "Una charla en espanol para reflexionar sobre habitos y efecto en otras personas.",
      source: "TED",
      url: "https://www.ted.com/talks/david_samra_los_5_habitos_que_transforman_tu_vida_y_la_de_los_que_te_rodean",
      use: "Mira con una pregunta: que accion concreta merece llegar a tu rutina?",
    },
    {
      id: "video_disciplina",
      category: "video",
      format: "Video",
      title: "El poder de la disciplina",
      author: "Gabriel Batistuta, TEDx",
      description:
        "Una experiencia personal sobre objetivo, humildad, practica y disciplina.",
      source: "TED",
      url: "https://www.ted.com/talks/gabriel_batistuta_el_poder_de_la_disciplina",
      use: "Extrae una idea aplicable; no compares tu proceso con la carrera del expositor.",
    },
    {
      id: "video_mal_habito",
      category: "video",
      format: "Video educativo",
      title: "Por que es tan dificil romper un mal habito?",
      author: "TED-Ed",
      description:
        "Una explicacion visual sobre formacion de habitos y cambio de respuesta.",
      source: "TED",
      url: "https://www.ted.com/talks/ted_ed_why_is_it_so_hard_to_break_a_bad_habit",
      use: "Identifica disparador, respuesta y recompensa de un patron propio.",
    },
    {
      id: "video_cambio",
      category: "video",
      format: "Video",
      title: "Dime como es tu relacion con el cambio",
      author: "Karina Petrovich, TEDx",
      description:
        "Una reflexion sobre transiciones, identidad y crecimiento continuo.",
      source: "TED",
      url: "https://www.ted.com/talks/karina_petrovich_dime_como_es_tu_relacion_con_el_cambio_y_te_dire_como_creceras",
      use: "Observa que parte del cambio estas intentando evitar o acelerar.",
    },
    {
      id: "video_medicion",
      category: "video",
      format: "Video",
      title: "Que ocurrio cuando empece a medir mi vida",
      author: "Chris Musser, TED",
      description:
        "Una experiencia sobre registrar dimensiones de vida sin reducirlas a productividad.",
      source: "TED",
      url: "https://www.ted.com/talks/chris_musser_what_happened_when_i_started_measuring_my_life_every_day",
      use: "Compara el registro con tus valores, no con una idea de perfeccion.",
    },
    {
      id: "video_james_clear",
      category: "video",
      format: "Podcast en video",
      title: "Como desarrollar los habitos que quieres",
      author: "James Clear y Chris Duffy, TED",
      description:
        "Conversacion sobre comportamiento, contexto y acumulacion de acciones pequenas.",
      source: "TED",
      url: "https://www.ted.com/talks/how_to_be_a_better_human_how_to_develop_the_habits_you_want_and_get_rid_of_the_ones_you_don_t_w_james_clear",
      use: "Elige una modificacion del entorno que facilite tu accion minima.",
    },
  ];

  const modules = [
    {
      week: 1,
      start: 1,
      end: 7,
      title: "Volver al control",
      outcome: "Observar tu realidad y ejecutar una primera accion verificable.",
      guide:
        "No necesitas cambiar toda tu vida esta semana. Necesitas verla con honestidad y recuperar la siguiente decision.",
      reading: "manual_epicteto",
      video: "video_habitos",
      movement: "caminar o realizar movilidad suave durante 5 minutos a un ritmo comodo",
      finance: "anotar cada gasto de hoy sin juzgarlo ni intentar corregirlo todavia",
      connection: "contarle a una persona de confianza que accion pequena estas intentando sostener",
    },
    {
      week: 2,
      start: 8,
      end: 14,
      title: "Confiar en tu palabra",
      outcome: "Hacer que una promesa pequena coincida con tu conducta.",
      guide:
        "La confianza personal no se declara. Se reconstruye cuando tus palabras encuentran una accion.",
      reading: "meditaciones",
      video: "video_disciplina",
      movement: "moverte de forma segura durante 8 minutos y observar tu energia antes y despues",
      finance: "usar una pausa de 10 minutos antes de una compra no esencial",
      connection: "cumplir una promesa pequena hecha a otra persona o renegociarla con honestidad",
    },
    {
      week: 3,
      start: 15,
      end: 21,
      title: "Ordenar entorno y atencion",
      outcome: "Reducir friccion visible para que lo importante tenga un lugar.",
      guide:
        "Tu entorno participa en cada decision. Ordenar no es decorar; es facilitar la conducta que quieres repetir.",
      reading: "cartas_lucilio",
      video: "video_mal_habito",
      movement: "realizar 10 minutos de caminata, movilidad o movimiento sentado segun tu capacidad",
      finance: "agrupar los gastos observados en necesidades, compromisos y elecciones",
      connection: "proteger un limite breve para escuchar o trabajar sin interrupcion",
    },
    {
      week: 4,
      start: 22,
      end: 28,
      title: "Construir energia util",
      outcome: "Tratar cuerpo, descanso y atencion como parte del cumplimiento.",
      guide:
        "El cuerpo no es un vehiculo que puedes ignorar. Es el lugar desde donde decides, trabajas, cuidas y vuelves.",
      reading: "actividad_oms",
      video: "video_cambio",
      movement: "acumular 12 minutos de movimiento agradable, incluso en bloques pequenos",
      finance: "identificar un gasto que aumenta cuando estas cansado, apurado o reaccionando",
      connection: "pedir apoyo concreto para proteger una rutina saludable o un momento de descanso",
    },
    {
      week: 5,
      start: 29,
      end: 35,
      title: "Mirar el dinero sin miedo",
      outcome: "Cambiar ansiedad difusa por informacion privada y ordenada.",
      guide:
        "No tienes que resolver hoy toda tu vida financiera. Primero necesitas dejar de esconderte de los numeros.",
      reading: "bienestar_financiero",
      video: "video_medicion",
      movement: "realizar 15 minutos de movimiento moderado o una version adaptada que puedas sostener",
      finance: "comparar ingreso neto, gastos esenciales y gastos variables de un periodo real",
      connection: "definir con respeto un limite economico que proteja tu realidad actual",
    },
    {
      week: 6,
      start: 36,
      end: 42,
      title: "Sostener bajo incomodidad",
      outcome: "Evitar que cansancio, error o verguenza se conviertan en abandono.",
      guide:
        "Fortaleza no significa sentir menos. Significa poder elegir una accion aun cuando la incomodidad esta presente.",
      reading: "cartas_lucilio",
      video: "video_disciplina",
      movement: "repetir 15 minutos de movimiento seguro y reducirlos sin culpa si el dia se complica",
      finance: "crear una lista privada de deudas con saldo, pago minimo, tasa si la conoces y fecha",
      connection: "pedir ayuda con una pregunta concreta sin entregar tu responsabilidad",
    },
    {
      week: 7,
      start: 43,
      end: 49,
      title: "Regular tu respuesta",
      outcome: "Crear espacio entre impulso, emocion y conducta.",
      guide:
        "Una emocion puede ser verdadera sin convertirse en la unica directora de la siguiente decision.",
      reading: "manual_epicteto",
      video: "video_mal_habito",
      movement: "combinar una pausa activa con 15 a 18 minutos de movimiento elegido",
      finance: "revisar costos y opciones de una deuda sin aceptar ofertas impulsivas",
      connection: "tener una conversacion breve usando hechos, necesidad y peticion concreta",
    },
    {
      week: 8,
      start: 50,
      end: 56,
      title: "Fortalecer relaciones",
      outcome: "Practicar presencia, limites, reparacion y apoyo reciproco.",
      guide:
        "Crecimiento personal no significa aislarte. Tambien se demuestra en como escuchas, reparas y proteges.",
      reading: "meditaciones",
      video: "video_habitos",
      movement: "elegir una actividad de 18 minutos que puedas hacer solo o acompanado",
      finance: "definir un monto realista para regalos, ayuda o compromisos sociales",
      connection: "escuchar durante diez minutos sin preparar tu respuesta mientras la otra persona habla",
    },
    {
      week: 9,
      start: 57,
      end: 63,
      title: "Elegir direccion",
      outcome: "Traducir valores en decisiones visibles de tiempo y energia.",
      guide:
        "Un valor que nunca ocupa tiempo sigue siendo una idea. Esta semana lo conviertes en calendario.",
      reading: "meditaciones",
      video: "video_cambio",
      movement: "reservar 20 minutos para movimiento que apoye tu energia y tu capacidad actual",
      finance: "definir una meta financiera de 30 dias con cantidad, fecha y primera accion",
      connection: "preguntar a alguien importante que necesita de ti en esta etapa y escuchar la respuesta",
    },
    {
      week: 10,
      start: 64,
      end: 70,
      title: "Aprender y producir",
      outcome: "Convertir informacion en una habilidad o resultado concreto.",
      guide:
        "No necesitas consumir mas contenido. Necesitas hacer algo distinto con una idea que ya entendiste.",
      reading: "manual_epicteto",
      video: "video_james_clear",
      movement: "interrumpir periodos sedentarios y acumular 20 minutos de movimiento durante el dia",
      finance: "identificar una habilidad que puede aumentar tu valor profesional y su costo de aprendizaje",
      connection: "pedir retroalimentacion especifica sobre una pieza de trabajo o una habilidad",
    },
    {
      week: 11,
      start: 71,
      end: 77,
      title: "Usar el dinero con criterio",
      outcome: "Hacer que una decision financiera apoye tus prioridades reales.",
      guide:
        "El dinero no define tu valor. Sin embargo, observar como lo usas puede revelar que estas protegiendo o evitando.",
      reading: "dinero_metas",
      video: "video_medicion",
      movement: "sostener entre 20 y 25 minutos de actividad adecuada o dividirla en bloques",
      finance: "elegir una regla de ahorro, gasto o deuda que puedas probar durante siete dias",
      connection: "hablar de una expectativa economica antes de que se convierta en resentimiento",
    },
    {
      week: 12,
      start: 78,
      end: 84,
      title: "Disenar tu sistema personal",
      outcome: "Unir senales, agenda, energia, dinero y relaciones en reglas simples.",
      guide:
        "Un sistema personal sirve cuando sigue funcionando fuera de un dia perfecto y sin depender de entusiasmo.",
      reading: "directrices_oms",
      video: "video_james_clear",
      movement: "disenar una semana de movimiento sostenible con dias, duracion y alternativas",
      finance: "programar o calendarizar una accion financiera recurrente que ya decidiste",
      connection: "elegir una persona de rendicion de cuentas y acordar una pregunta semanal",
    },
    {
      week: 13,
      start: 85,
      end: 91,
      title: "Contribuir sin perderte",
      outcome: "Compartir progreso, servicio y presencia sin abandonar tus limites.",
      guide:
        "Tu crecimiento se vuelve mas humano cuando mejora la forma en que participas en la vida de otros.",
      reading: "cartas_lucilio",
      video: "video_habitos",
      movement: "elegir una actividad agradable de 25 minutos que quieras conservar despues del programa",
      finance: "definir una forma de generosidad o contribucion que no rompa tu estabilidad",
      connection: "realizar un acto de apoyo concreto sin prometer mas de lo que puedes sostener",
    },
    {
      week: 14,
      start: 92,
      end: 98,
      title: "Integrar una vida dirigida",
      outcome: "Convertir la evidencia en un plan realista para los proximos 90 dias.",
      guide:
        "No cierres intentando conservarlo todo. Elige pocas reglas que ya demostraron que caben en tu vida.",
      reading: "dinero_metas",
      video: "video_cambio",
      movement: "probar tu plan semanal de movimiento y ajustar lo que no cabe en la vida real",
      finance: "escribir un plan de 90 dias con una meta, una regla, una fecha de revision y un limite",
      connection: "agradecer, reparar o cerrar una conversacion necesaria antes del Dia 100",
    },
    {
      week: 15,
      start: 99,
      end: 100,
      title: "Cerrar y continuar",
      outcome: "Reconocer la transformacion demostrada y elegir como seguira.",
      guide:
        "El Dia 100 no te entrega una identidad perfecta. Te entrega evidencia y responsabilidad para continuar.",
      reading: "meditaciones",
      video: "video_medicion",
      movement: "elegir la practica corporal minima y la practica completa que mantendras",
      finance: "resumir tu realidad, tu siguiente meta y la fecha de tu proxima revision",
      connection: "compartir con una persona que aprendiste y que compromiso llevaras contigo",
    },
  ];

  const rhythms = [
    {
      name: "Ver",
      focus: "learning",
      label: "Mente",
      message:
        "Hoy observa antes de corregir. Una realidad vista con claridad deja de crecer en la sombra.",
    },
    {
      name: "Integrar",
      focus: "movement",
      label: "Cuerpo",
      message:
        "Hoy prepara el entorno. Lo que dejas listo reduce decisiones cuando llegue el cansancio.",
    },
    {
      name: "Tomar accion",
      focus: "finance",
      label: "Finanzas",
      message:
        "Hoy produce una evidencia concreta. Entender sin practicar todavia no cambia conducta.",
    },
    {
      name: "Anotar",
      focus: "connection",
      label: "Vinculos",
      message:
        "Hoy lleva el Metodo a una relacion real. Crecer tambien cambia como escuchas y respondes.",
    },
    {
      name: "Levantarte",
      focus: "learning",
      label: "Aprendizaje",
      message:
        "Hoy repite sin buscar novedad. La profundidad aparece cuando una idea sobrevive al entusiasmo.",
    },
    {
      name: "Tomar accion",
      focus: "connection",
      label: "Integracion",
      message:
        "Hoy comparte una idea util o una accion cumplida sin convertirla en una actuacion.",
    },
    {
      name: "Anotar",
      focus: "all",
      label: "Revision",
      message:
        "Hoy no agregues mas exigencias. Revisa que funciono y que debe hacerse mas pequeno.",
    },
  ];

  const templates = {
    movement: [
      (base) => `Observa tu energia antes y despues de ${base}.`,
      (base) => `Deja listo el lugar o la ropa y luego intenta ${base}.`,
      (base) => `Completa hoy esta practica: ${base}.`,
      (base) => `Si el dia se complica, reduce sin abandonar: intenta ${base}.`,
      (base) => `Repite con ritmo comodo: ${base}.`,
      (base) => `Si es seguro y te ayuda, comparte esta practica con alguien: ${base}.`,
      (base) => `Revisa que facilito o dificulto ${base}.`,
    ],
    finance: [
      (base) => `Observa sin juicio: ${base}.`,
      (base) => `Prepara la informacion necesaria para ${base}.`,
      (base) => `Realiza una accion privada para ${base}.`,
      (base) => `Reduce la tarea a cinco minutos y empieza a ${base}.`,
      (base) => `Repite o termina la accion de ${base}.`,
      (base) => `Comparte solo la leccion, nunca tus datos: practica ${base}.`,
      (base) => `Revisa que aprendiste al ${base}.`,
    ],
    connection: [
      (base) => `Observa que sientes antes de ${base}.`,
      (base) => `Prepara una frase honesta para ${base}.`,
      (base) => `Practica hoy: ${base}.`,
      (base) => `Haz una version breve y respetuosa de ${base}.`,
      (base) => `Sosten tu intencion al ${base}.`,
      (base) => `Convierte el aprendizaje en una accion: ${base}.`,
      (base) => `Revisa que cambio despues de ${base}.`,
    ],
  };

  const byId = Object.fromEntries(resources.map((resource) => [resource.id, resource]));
  const focusLabels = {
    learning: "Mente",
    movement: "Cuerpo",
    finance: "Finanzas",
    connection: "Vinculos",
    all: "Integracion",
  };
  const lifeAreaProfiles = {
    mentalidad: {
      primary: "learning",
      label: "Mentalidad y disciplina",
      message: "construir confianza en tu palabra y una respuesta mas consciente",
    },
    bienestar: {
      primary: "movement",
      label: "Salud y bienestar",
      message: "proteger energia, movimiento y una relacion mas amable con tu cuerpo",
    },
    profesional: {
      primary: "learning",
      secondary: "finance",
      label: "Trabajo y profesion",
      message: "convertir atencion, aprendizaje y decisiones en trabajo visible",
    },
    finanzas: {
      primary: "finance",
      label: "Finanzas personales",
      message: "cambiar evitacion por informacion, criterio y decisiones pequenas",
    },
    relaciones: {
      primary: "connection",
      label: "Relaciones y vida cotidiana",
      message: "practicar presencia, limites, escucha y reparacion",
    },
  };

  function getSessionMinutes(value) {
    const minutes = Number(value);
    return [2, 10, 20].includes(minutes) ? minutes : 10;
  }

  function getFocus(safeDay, rhythm, profile) {
    if (!profile) return rhythm.focus;
    if (rhythm.focus === "all") return profile.primary;
    const slot = (safeDay - 1) % rhythms.length;
    if (slot === 0 || slot === 3) return profile.primary;
    if (slot === 5 && profile.secondary) return profile.secondary;
    return rhythm.focus;
  }

  function doseAction(type, defaultAction, baseAction, minutes, energy) {
    if (minutes === 2) {
      return {
        learning:
          "Lee un solo parrafo o apartado. Escribe una idea que puedas aplicar antes de cerrar esta sesion.",
        movement:
          "Haz dos minutos de movimiento suave y seguro. La meta de hoy es activar, no exigirte.",
        finance:
          "Abre la informacion necesaria y registra un solo dato financiero sin intentar resolverlo todo.",
        connection:
          "Prepara o envia una sola frase honesta que cuide el vinculo y tambien tu limite.",
      }[type];
    }
    if (minutes === 20) {
      const closing = {
        learning: "Usa los minutos restantes para escribir como aplicaras la idea.",
        movement: "Si tu cuerpo responde bien, continua de forma gradual y termina observando tu energia.",
        finance: "Usa los minutos restantes para ordenar la siguiente decision y su fecha.",
        connection: "Usa los minutos restantes para escuchar, responder o reparar sin apresurarte.",
      }[type];
      return `${defaultAction} ${closing}`;
    }
    if (energy === "low" && type === "movement") {
      return `Elige la version mas suave y segura de esta practica: ${baseAction}.`;
    }
    return defaultAction;
  }

  function getModule(day) {
    const safeDay = Math.max(1, Math.min(100, Number(day) || 1));
    return modules.find(({ start, end }) => safeDay >= start && safeDay <= end) || modules[0];
  }

  function getLifeProgram(day, options = {}) {
    const safeDay = Math.max(1, Math.min(100, Number(day) || 1));
    const module = getModule(safeDay);
    const rhythm = rhythms[(safeDay - 1) % rhythms.length];
    const profile = lifeAreaProfiles[options.lifeArea] || null;
    const minutes = getSessionMinutes(options.minutes);
    const energy = ["low", "steady", "high"].includes(options.energy)
      ? options.energy
      : "steady";
    const focus = getFocus(safeDay, rhythm, profile);
    const reading = byId[module.reading];
    const video = byId[module.video];
    const slot = (safeDay - 1) % rhythms.length;
    const learningAction =
      slot === 6
        ? `Revisa una idea que ya marcaste de ${reading.title} y escribe como aparecio en tu semana.`
        : `Dedica de 5 a 10 minutos a ${reading.title}. ${reading.use}`;
    const movementAction = templates.movement[slot](module.movement);
    const financeAction = templates.finance[slot](module.finance);
    const connectionAction = templates.connection[slot](module.connection);
    const trackMessage = profile
      ? `Tu direccion elegida es ${profile.label.toLowerCase()}: hoy la conectamos con ${profile.message}.`
      : "Hoy conectas el Metodo con una dimension concreta de tu vida.";

    return {
      day: safeDay,
      week: module.week,
      module: module.title,
      outcome: module.outcome,
      guideMessage: `${rhythm.message} ${module.guide} ${trackMessage}`,
      rhythm: rhythm.name,
      focus,
      focusLabel: focusLabels[focus] || rhythm.label,
      track: profile
        ? { label: profile.label, message: profile.message }
        : { label: "Dominio personal", message: "integrar las cuatro dimensiones" },
      dose: { minutes, energy },
      learning: {
        title: `Aprende con ${reading.title}`,
        action: doseAction(
          "learning",
          learningAction,
          reading.use,
          minutes,
          energy
        ),
        resource: reading,
      },
      movement: {
        title: "Cuida tu cuerpo",
        action: doseAction(
          "movement",
          movementAction,
          module.movement,
          minutes,
          energy
        ),
      },
      finance: {
        title: "Ordena tu dinero",
        action: doseAction(
          "finance",
          financeAction,
          module.finance,
          minutes,
          energy
        ),
      },
      connection: {
        title: "Fortalece un vinculo",
        action: doseAction(
          "connection",
          connectionAction,
          module.connection,
          minutes,
          energy
        ),
      },
      video: {
        title: video.title,
        action: video.use,
        resource: video,
      },
      safety:
        "Adapta el movimiento a tu capacidad. Detente ante dolor, mareo o malestar y consulta a un profesional cuando corresponda. Las acciones de dinero son educativas y no constituyen asesoria financiera.",
    };
  }

  window.LIFE_RESOURCES = resources;
  window.LIFE_MODULES = modules;
  window.getLifeProgram = getLifeProgram;
})();
