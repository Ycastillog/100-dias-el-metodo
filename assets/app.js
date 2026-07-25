const STORAGE_KEY = "100dias_participant_state_v1";
const LEADS_KEY = "100dias_sales_leads_v1";
const EVENTS_KEY = "100dias_events_v1";
const REMINDER_KEY = "100dias_reminders_v1";
const BACKUP_META_KEY = "100dias_backup_meta_v1";
const VALID_DAY_STATES = new Set(["complete", "partial", "missed"]);
const LIFE_AREA_LABELS = {
  mentalidad: "Mentalidad y disciplina",
  bienestar: "Salud y bienestar",
  profesional: "Trabajo, profesion o negocio",
  finanzas: "Finanzas personales",
  relaciones: "Relaciones y vida cotidiana",
};
const PLAN_DETAILS = {
  Alpha: {
    key: "alpha",
    label: "Grupo Alpha",
    price: "USD 9",
  },
  "El Metodo": {
    key: "metodo",
    label: "El Metodo",
    price: "USD 29",
  },
  "El Metodo + Sistema": {
    key: "sistema",
    label: "El Metodo + Sistema",
    price: "USD 79",
  },
  "El Metodo Premium": {
    key: "premium",
    label: "El Metodo Premium",
    price: "USD 297",
  },
};

const dayNarratives = [
  "Recuperar el control",
  "La primera victoria",
  "La primera resistencia",
  "Romper el piloto automatico",
  "Cumplir aunque nadie mire",
  "La incomodidad aparece",
  "Primera revision",
  "Volver sin drama",
  "Proteger una prioridad",
  "Cumplir tu palabra",
  "Ordenar lo esencial",
  "Elegir antes de reaccionar",
  "Sostener lo pequeno",
  "Cerrar el primer ciclo",
];

const alphaDailyContent = [
  {
    guideName: "Marco Aurelio",
    guide: "Tu poder empieza en la respuesta que eliges, no en todo lo que sucede.",
    principle: "Controla una decision antes de intentar controlar el dia.",
    question: "Que accion depende completamente de mi durante los proximos 10 minutos?",
    action: "Retira una distraccion y ejecuta una tarea breve que reduzca caos.",
    task: "Pon un temporizador de 10 minutos, completa una accion pendiente y registra que cambio.",
    companion: "No tienes que rescatar todo el dia. Recupera la siguiente decision.",
  },
  {
    guideName: "Epicteto",
    guide: "La confianza personal crece cuando haces bien la parte que si te corresponde.",
    principle: "Una promesa pequena cumplida vale mas que una intencion enorme.",
    question: "Que promesa pequena puedo cumplir hoy sin depender de mi animo?",
    action: "Define una accion observable y terminala antes de abrir una distraccion.",
    task: "Escribe una promesa de una sola linea, ejecutala y registra la hora en que la cumpliste.",
    companion: "Esta victoria no tiene que impresionar a nadie. Tiene que ser verdadera para ti.",
  },
  {
    guideName: "Seneca",
    guide: "La dificultad pierde poder cuando la observas antes de obedecerla.",
    principle: "La resistencia es informacion, no una orden.",
    question: "Que excusa aparecio justo antes de la accion que dije que haria?",
    action: "Empieza por dos minutos y continua hasta completar el minimo acordado.",
    task: "Nombra tu excusa, inicia de inmediato y sostente durante al menos 10 minutos.",
    companion: "Sentir friccion no significa que elegiste mal. Significa que hoy estas entrenando.",
  },
  {
    guideName: "Marco Aurelio",
    guide: "Entre el impulso y la respuesta existe un espacio que puedes recuperar.",
    principle: "Detectar el automatismo te devuelve la posibilidad de elegir.",
    question: "Que senal activa mi reaccion mas repetida?",
    action: "Interrumpe una reaccion automatica con una pausa y una decision visible.",
    task: "Cuando aparezca el disparador, espera 60 segundos y ejecuta una alternativa que hayas elegido antes.",
    companion: "No necesitas eliminar el impulso. Solo demostrar que no siempre tiene la ultima palabra.",
  },
  {
    guideName: "Epicteto",
    guide: "El caracter se practica tambien cuando nadie puede aplaudirte.",
    principle: "Cumplir en privado fortalece la palabra que te das.",
    question: "Que haria hoy si nadie fuera a verlo, celebrarlo o validarlo?",
    action: "Completa tu accion sin anunciarla antes ni buscar aprobacion durante el proceso.",
    task: "Haz una tarea importante en silencio y escribe que sentiste al terminar sin reconocimiento externo.",
    companion: "Hoy la evidencia no es para las redes. Es para la relacion que estas reconstruyendo contigo.",
  },
  {
    guideName: "Seneca",
    guide: "No necesitas amar la incomodidad; necesitas aprender a no huir automaticamente.",
    principle: "La incomodidad puede acompanarte sin dirigir tu conducta.",
    question: "Que sensacion intento evitar cuando pospongo esta accion?",
    action: "Permanece con la incomodidad mientras ejecutas el minimo posible.",
    task: "Elige algo que has evitado, trabaja 10 minutos y describe la resistencia sin juzgarte.",
    companion: "Puedes sentir cansancio, duda o rechazo y aun asi completar una accion pequena.",
  },
  {
    guideName: "Marco Aurelio",
    guide: "Revisar con honestidad convierte los dias vividos en direccion para los siguientes.",
    principle: "La revision busca patrones, no culpables.",
    question: "Que condicion estuvo presente los dias en que si volvi al marco?",
    action: "Revisa tu evidencia y elige un ajuste concreto para la segunda semana.",
    task: "Cuenta completados, parciales y perdidos; escribe que funciono y decide una regla para los proximos 7 dias.",
    companion: "No necesitas una semana perfecta. Necesitas una lectura honesta que te ayude a continuar.",
  },
  {
    guideName: "Epicteto",
    guide: "Volver empieza cuando dejas de discutir con lo que ya ocurrio.",
    principle: "Un desvio se corrige con la siguiente accion, no con drama.",
    question: "Que necesito reducir para volver hoy sin esperar condiciones ideales?",
    action: "Convierte la accion pendiente en una version de regreso que puedas completar.",
    task: "Escribe tu protocolo en tres pasos: identifica, reduce y vuelve. Ejecuta el ultimo paso hoy.",
    companion: "Regresar pequeno sigue siendo regresar. Lo importante es reconstruir continuidad.",
  },
  {
    guideName: "Marco Aurelio",
    guide: "Lo que consideras importante necesita un lugar protegido en tu dia.",
    principle: "Una prioridad sin espacio reservado termina compitiendo con todo.",
    question: "Que debo proteger hoy para que lo urgente no consuma lo importante?",
    action: "Reserva un bloque breve y elimina una interrupcion antes de comenzar.",
    task: "Bloquea 15 minutos, silencia notificaciones y trabaja solamente en tu prioridad.",
    companion: "Proteger una prioridad no es rigidez. Es darle una oportunidad real de existir.",
  },
  {
    guideName: "Seneca",
    guide: "Tu palabra gana peso cada vez que coincide con una accion verificable.",
    principle: "Promete menos, define mejor y cumple por completo.",
    question: "Que compromiso puedo formular hoy de manera que no admita excusas ambiguas?",
    action: "Convierte una intencion en una promesa binaria: hecha o no hecha.",
    task: "Escribe que haras, cuando termina y como sabras que cumpliste. Luego ejecutalo.",
    companion: "No estas buscando demostrar fuerza infinita. Estas haciendo que tu palabra vuelva a significar algo.",
  },
  {
    guideName: "Epicteto",
    guide: "Ordenar lo que depende de ti despeja energia para decidir con mas claridad.",
    principle: "Lo esencial aparece cuando dejas de alimentar lo innecesario.",
    question: "Que cosa pequena esta ocupando mas atencion de la que merece?",
    action: "Elimina una carga y ordena un espacio directamente relacionado con tu meta.",
    task: "Borra, delega o cierra una distraccion; despues ordena durante 10 minutos tu superficie de trabajo.",
    companion: "No tienes que organizar tu vida completa. Libera el espacio donde ocurrira la siguiente accion.",
  },
  {
    guideName: "Marco Aurelio",
    guide: "Responder con intencion requiere una pausa antes de entregar tu energia.",
    principle: "Primero eliges; despues respondes.",
    question: "Que respuesta repetida me aleja de la persona que quiero construir?",
    action: "Introduce una pausa consciente antes de una reaccion habitual.",
    task: "Ante una interrupcion, respira, escribe que depende de ti y elige una respuesta distinta.",
    companion: "La pausa no te hace lento. Te devuelve la direccion que el impulso intenta tomar.",
  },
  {
    guideName: "Seneca",
    guide: "La constancia se vuelve posible cuando la accion cabe tambien en un dia dificil.",
    principle: "Lo pequeno que se sostiene construye mas que lo intenso que desaparece.",
    question: "Cual es la version minima de mi accion que todavia conserva su significado?",
    action: "Reduce la tarea sin eliminar su proposito y completala hoy.",
    task: "Define tu minimo sostenible en una frase, ejecutalo y decide si podrias repetirlo manana.",
    companion: "Reducir con criterio no es rendirte. Es proteger la continuidad mientras recuperas fuerza.",
  },
  {
    guideName: "Epicteto",
    guide: "El cierre de un ciclo sirve para decidir que merece acompanarte al siguiente.",
    principle: "La evidencia acumulada debe convertirse en una decision de continuidad.",
    question: "Que puedo afirmar hoy sobre mi conducta que no podia afirmar en el Dia 0?",
    action: "Compara tu decision inicial con tus registros y elige como continuar.",
    task: "Resume tus 14 dias, identifica una prueba real, una dificultad y la regla que sostendras desde manana.",
    companion: "No terminaste una fantasia de cambio. Construiste evidencia y ahora puedes decidir con mas verdad.",
  },
];

const journeyArcs = [
  {
    start: 15,
    name: "Base de Control",
    days: [
      ["Ordenar tu entorno", "retirar una fuente visible de caos de tu espacio principal"],
      ["Recuperar tu atencion", "proteger diez minutos sin telefono ni interrupciones"],
      ["Dormir con intencion", "definir una accion de cierre que prepare tu descanso"],
      ["Disenar la manana", "dejar preparada la primera accion del dia siguiente"],
      ["Planificar menos", "reducir tu lista a una prioridad verificable"],
      ["Poner un limite", "decir no a una demanda que desplaza tu prioridad"],
      ["Revisar la base", "medir que condicion facilito cumplir durante esta semana"],
    ],
  },
  {
    start: 22,
    name: "Control Sostenible",
    days: [
      ["Observar tus impulsos", "registrar el momento exacto en que aparece una distraccion"],
      ["Dominar el primer clic", "postergar diez minutos la primera distraccion digital"],
      ["Proteger un bloque", "reservar un espacio breve para tu prioridad antes de responder al ruido"],
      ["Elegir una meta visible", "convertir una intencion en un resultado que puedas observar hoy"],
      ["Cerrar una distraccion", "eliminar una interrupcion que dejas abierta por costumbre"],
      ["Cumplir antes de mejorar", "terminar la version acordada antes de intentar perfeccionarla"],
      ["Volver despues de una interrupcion", "reiniciar tu accion sin convertir la pausa en abandono"],
      ["Preparar un dia dificil", "definir el minimo que mantendra tu continuidad cuando baje la energia"],
      ["Auditar tu Control", "comparar tus decisiones del Dia 1 con la evidencia acumulada"],
    ],
  },
  {
    start: 31,
    name: "Entrada a Fortaleza",
    days: [
      ["Empezar sin ganas", "iniciar una tarea necesaria antes de sentir motivacion"],
      ["Tolerar el aburrimiento", "permanecer en una accion simple sin buscar estimulo inmediato"],
      ["Actuar con incertidumbre", "dar un paso util sin conocer todo el resultado"],
      ["Recibir la frustracion", "continuar despues de un obstaculo sin descargarlo sobre otra persona"],
      ["Terminar lo pendiente", "cerrar una tarea que sigue consumiendo energia mental"],
      ["Pedir ayuda con claridad", "formular una peticion concreta sin entregar tu responsabilidad"],
      ["Revisar la resistencia", "identificar que incomodidad aparecio antes de tus mejores acciones"],
    ],
  },
  {
    start: 38,
    name: "Fortaleza Bajo Presion",
    days: [
      ["Sostener con poca energia", "cumplir tu minimo sin exigir rendimiento perfecto"],
      ["Reparar despues del error", "corregir una consecuencia en lugar de esconder la equivocacion"],
      ["Postergar la recompensa", "completar la accion importante antes del premio inmediato"],
      ["Escuchar una critica", "separar la informacion util de tu reaccion defensiva"],
      ["Poner un limite incomodo", "proteger un compromiso aunque otra persona no lo celebre"],
      ["Tener una conversacion dificil", "decir con respeto algo que has estado evitando"],
      ["Terminar bajo presion", "cerrar una accion importante sin abrir nuevas tareas"],
      ["Auditar la mitad del viaje", "comparar intencion, conducta y evidencia al llegar al Dia 45"],
    ],
  },
  {
    start: 46,
    name: "Caracter en Accion",
    days: [
      ["Pausar antes del impulso", "crear espacio entre una emocion intensa y tu respuesta"],
      ["Soltar la comparacion", "volver a tu propia evidencia despues de mirar el avance ajeno"],
      ["Abandonar el perfeccionismo", "entregar una version util aunque no sea impecable"],
      ["Continuar sin aplausos", "cumplir una accion que nadie mas necesita ver"],
      ["Regular la respuesta al estres", "bajar la velocidad antes de decidir bajo tension"],
      ["Volver despues de perder", "registrar el fallo y ejecutar una accion de regreso"],
      ["Proteger el minimo", "cumplir una version pequena en vez de desaparecer del proceso"],
      ["Revisar tu caracter", "nombrar la capacidad que mas has entrenado con incomodidad"],
    ],
  },
  {
    start: 54,
    name: "Fortaleza Recuperada",
    days: [
      ["Reparar tu palabra", "cumplir o renegociar con honestidad una promesa pendiente"],
      ["Adaptar sin abandonar", "cambiar el metodo de ejecucion sin cambiar el compromiso"],
      ["Reducir y repetir", "convertir una accion exigente en una practica sostenible"],
      ["Descansar sin desconectarte", "recuperar energia sin perder contacto con tu prioridad"],
      ["Preparar una recaida", "escribir que haras cuando reaparezca tu patron principal"],
      ["Elegir tu regla mas fuerte", "conservar la regla que produjo mayor continuidad"],
      ["Cerrar Fortaleza", "medir como respondes ahora frente a cansancio, error e incomodidad"],
    ],
  },
  {
    start: 61,
    name: "Entrada a Direccion",
    days: [
      ["Definir lo que valoras", "traducir un valor importante en una conducta observable"],
      ["Elegir la siguiente prioridad", "decidir que merece tus proximos treinta y nueve dias"],
      ["Aceptar el costo de elegir", "nombrar a que renuncias para proteger una direccion"],
      ["Eliminar un compromiso", "retirar una obligacion que ya no responde a tu prioridad"],
      ["Tomar una decision postergada", "cerrar una eleccion que mantiene tu energia dividida"],
      ["Alinear tu calendario", "dar espacio real a lo que dices que importa"],
      ["Revisar tu direccion", "comprobar si tus acciones semanales coinciden con tus valores"],
    ],
  },
  {
    start: 68,
    name: "Direccion Protegida",
    days: [
      ["Decir no con claridad", "rechazar una solicitud sin inventar una explicacion innecesaria"],
      ["Proteger trabajo profundo", "crear un bloque sin interrupciones para producir avance"],
      ["Cuidar tus entradas", "reducir informacion que alimenta ruido en lugar de criterio"],
      ["Terminar antes de empezar", "cerrar una prioridad antes de abrir otra posibilidad"],
      ["Elegir una oportunidad", "evaluar una opcion segun tu direccion y no solo por entusiasmo"],
      ["Simplificar compromisos", "reducir actividades que fragmentan tu atencion"],
      ["Crear un criterio de decision", "definir una regla para elegir con menos reaccion"],
      ["Auditar tu enfoque", "medir donde fue realmente tu tiempo durante esta etapa"],
    ],
  },
  {
    start: 76,
    name: "Identidad Dirigida",
    days: [
      ["Elevar un estandar", "definir una conducta que ya no quieres negociar"],
      ["Decidir desde tu identidad", "actuar como la persona que estas construyendo antes de sentirte lista"],
      ["Hablar con intencion", "reemplazar una reaccion verbal por una respuesta elegida"],
      ["Usar el dinero con criterio", "registrar una decision de gasto y comprobar si apoya tu prioridad"],
      ["Cuidar el cuerpo como responsabilidad", "ejecutar una accion breve que proteja tu energia"],
      ["Proteger una relacion importante", "dar presencia deliberada a una persona que valoras"],
      ["Revisar tu identidad", "comparar como te describias al inicio con tu conducta actual"],
    ],
  },
  {
    start: 83,
    name: "Sistema Personal",
    days: [
      ["Disenar tu inicio del dia", "crear una secuencia breve que reduzca decisiones innecesarias"],
      ["Disenar tu cierre del dia", "revisar, registrar y preparar la siguiente accion"],
      ["Crear tu revision semanal", "definir las preguntas que mantendran visible tu evidencia"],
      ["Formalizar tu regreso", "convertir el protocolo de vuelta en una regla personal"],
      ["Medir lo que importa", "elegir un indicador que represente conducta y no apariencia"],
      ["Proteger un limite digital", "definir cuando la tecnologia deja de dirigir tu atencion"],
      ["Descansar con intencion", "programar recuperacion sin usarla como abandono"],
      ["Auditar tu sistema", "comprobar que reglas funcionan tambien fuera de un dia perfecto"],
    ],
  },
  {
    start: 91,
    name: "Cierre con Evidencia",
    days: [
      ["Volver al Dia 0", "comparar tu decision inicial con la persona que ha ejecutado hasta hoy"],
      ["Identificar tu patron dominante", "nombrar cuando aparece y que respuesta lo debilita"],
      ["Reconocer tu capacidad", "elegir la habilidad que ahora puedes demostrar con hechos"],
      ["Confrontar tu punto debil", "definir una proteccion concreta para tu riesgo principal"],
      ["Elegir tu regla central", "conservar una regla que ordene decisiones futuras"],
      ["Preparar el proximo dia dificil", "escribir un plan que no dependa de motivacion"],
      ["Definir continuidad", "elegir que practica seguira despues del Dia 100"],
      ["Escribir a tu yo futuro", "dejar una instruccion clara para cuando vuelva la incomodidad"],
      ["Preparar la auditoria final", "reunir evidencia, registros y decisiones del recorrido"],
    ],
  },
  {
    start: 100,
    name: "Dominio Personal",
    days: [
      ["Cerrar con evidencia", "convertir cien dias de registros en una decision de continuidad"],
    ],
  },
];

const practiceModes = [
  {
    guideName: "Marco Aurelio",
    guide: "Observa el hecho antes de construir una historia sobre el.",
    principle: "Lo que puedes observar con claridad deja de dirigirte desde la sombra.",
    question: ({ target }) => `Que ocurre justo antes de intentar ${target}?`,
    action: ({ target }) => `Observa una senal concreta y luego intenta ${target}.`,
    task: ({ target }) => `Registra el disparador, ejecuta durante 10 minutos la accion de ${target} y escribe que cambio.`,
    companion: "Hoy no necesitas resolver el patron completo. Necesitas verlo y responder una vez con intencion.",
  },
  {
    guideName: "Epicteto",
    guide: "La direccion empieza cuando eliges bien la parte que si te corresponde.",
    principle: "Una decision definida reduce el espacio de la negociacion interna.",
    question: ({ target }) => `Que decision depende de mi para poder ${target}?`,
    action: ({ target }) => `Formula una decision en una sola frase y usala para ${target}.`,
    task: ({ target }) => `Escribe que haras, cuando lo haras y completa hoy una prueba de ${target}.`,
    companion: "No necesitas controlar el resultado. Haz completa y honestamente la parte que elegiste.",
  },
  {
    guideName: "Seneca",
    guide: "La accion sostenible se prepara antes de que llegue el cansancio.",
    principle: "Reducir con criterio protege la continuidad sin vaciar el compromiso.",
    question: ({ target }) => `Cual es la version minima que todavia me permite ${target}?`,
    action: ({ target }) => `Reduce el esfuerzo inicial y comienza ahora a ${target}.`,
    task: ({ target }) => `Define un minimo de 10 a 15 minutos, usalo para ${target} y registra si fue suficiente para volver.`,
    companion: "Hacerlo mas pequeno no elimina su valor. Te ayuda a mantener contacto con la persona que estas construyendo.",
  },
  {
    guideName: "Marco Aurelio",
    guide: "Lo importante necesita un lugar protegido, no solo una buena intencion.",
    principle: "Aquello que no reservas termina cediendo ante lo inmediato.",
    question: ({ target }) => `Que debo retirar o limitar para poder ${target}?`,
    action: ({ target }) => `Protege un bloque breve dedicado solamente a ${target}.`,
    task: ({ target }) => `Silencia una interrupcion, reserva 15 minutos y utiliza ese bloque para ${target}.`,
    companion: "Proteger esta accion es una forma concreta de decir que tu direccion tambien merece espacio.",
  },
  {
    guideName: "Seneca",
    guide: "La incomodidad no siempre anuncia peligro; muchas veces anuncia practica.",
    principle: "Puedes sentir resistencia sin entregarle la decision.",
    question: ({ target }) => `Que incomodidad aparece cuando intento ${target}?`,
    action: ({ target }) => `Permite que la incomodidad este presente mientras intentas ${target}.`,
    task: ({ target }) => `Nombra la resistencia, comienza sin discutir con ella y trabaja en ${target} durante 10 minutos.`,
    companion: "No estas fallando porque hoy pese. Estas aprendiendo a actuar sin exigir que el animo te acompanhe.",
  },
  {
    guideName: "Epicteto",
    guide: "El caracter se vuelve visible en aquello que decides terminar.",
    principle: "Cerrar una accion libera atencion y fortalece tu palabra.",
    question: ({ target }) => `Que falta exactamente para considerar completa la accion de ${target}?`,
    action: ({ target }) => `Elimina pasos innecesarios y termina una evidencia de ${target}.`,
    task: ({ target }) => `Define el punto de cierre, completa hoy la accion de ${target} y registra el resultado verificable.`,
    companion: "No abras otra promesa antes de reconocer lo que ya puedes cerrar con dignidad.",
  },
  {
    guideName: "Marco Aurelio",
    guide: "La experiencia se convierte en sabiduria solamente cuando la revisas.",
    principle: "Revisar no es castigarte; es decidir con mejor evidencia.",
    question: ({ target }) => `Que me enseno esta semana sobre mi capacidad para ${target}?`,
    action: ({ target }) => `Compara lo que dijiste con lo que hiciste al intentar ${target}.`,
    task: ({ target }) => `Revisa tus ultimos registros, identifica un patron y decide un ajuste para continuar con ${target}.`,
    companion: "La semana no tiene que verse perfecta para ensenarte exactamente que necesitas proteger.",
  },
];

const milestoneDailyContent = {
  30: {
    guideName: "Marco Aurelio",
    guide: "Treinta dias de evidencia pesan mas que una promesa pronunciada una sola vez.",
    principle: "Control no es dominarlo todo; es gobernar mejor tu siguiente respuesta.",
    question: "Que decision controlo hoy con mas claridad que en el Dia 1?",
    action: "Revisa tus registros de Control y elige la regla que llevaras a Fortaleza.",
    task: "Cuenta completados, parciales y perdidos; identifica tu mayor disparador y escribe tu regla para los Dias 31 a 60.",
    companion: "No necesitas salir invulnerable de esta fase. Sal con una respuesta mas consciente y repetible.",
  },
  45: {
    guideName: "Seneca",
    guide: "La mitad del camino revela si tu estructura resiste la vida real.",
    principle: "La fortaleza se mide por tu capacidad de volver bajo presion.",
    question: "Que tipo de incomodidad ya no decide por mi como antes?",
    action: "Compara tu mejor semana con la mas dificil y encuentra la regla que sostuvo ambas.",
    task: "Escribe tres pruebas de Fortaleza, una resistencia recurrente y el ajuste que usaras durante los proximos 15 dias.",
    companion: "Llegar a la mitad no significa que todo sea facil. Significa que ya tienes evidencia para no empezar de cero.",
  },
  60: {
    guideName: "Seneca",
    guide: "Fortaleza es permanecer fiel a tu direccion sin negar que existen cansancio y error.",
    principle: "Lo que recuperas despues de caer se convierte en capacidad.",
    question: "Como respondo ahora cuando fallo, me canso o pierdo ritmo?",
    action: "Cierra la fase identificando tu protocolo personal de regreso.",
    task: "Resume que te derriba, que te ayuda a volver y que minimo mantendra tu continuidad en Direccion.",
    companion: "No llevas perfeccion a la siguiente fase. Llevas una forma mas madura de regresar.",
  },
  75: {
    guideName: "Epicteto",
    guide: "Elegir una direccion tambien significa aceptar las oportunidades que dejaras pasar.",
    principle: "Una prioridad real organiza tanto tus si como tus no.",
    question: "Que he dejado de hacer para proteger lo que verdaderamente importa?",
    action: "Audita tu calendario y corrige una incoherencia entre valor y tiempo.",
    task: "Identifica donde fueron tus ultimos 7 dias, elimina un compromiso menor y protege el siguiente bloque de direccion.",
    companion: "La claridad no aparece por tener mas opciones. Aparece cuando eliges que merece continuidad.",
  },
  90: {
    guideName: "Marco Aurelio",
    guide: "Un sistema personal sirve cuando puedes usarlo sin depender del entusiasmo inicial.",
    principle: "Integrar significa saber decidir, ejecutar, registrar y volver por cuenta propia.",
    question: "Que parte del Metodo ya funciona como una regla personal?",
    action: "Prueba tu sistema completo en una decision real de hoy.",
    task: "Usa tu secuencia: observa, decide, ejecuta, registra y revisa. Escribe que parte necesita fortalecerse antes del Dia 100.",
    companion: "Los ultimos diez dias no son una carrera. Son una oportunidad para comprobar que el sistema ya te pertenece.",
  },
  100: {
    guideName: "Epicteto",
    guide: "La evidencia final no es un numero; es la relacion nueva entre tu palabra y tu conducta.",
    principle: "Dominio Personal es poder dirigirte, sostenerte y volver.",
    question: "Que puedo demostrar ahora sobre mi conducta que no podia demostrar en el Dia 0?",
    action: "Convierte los cien dias en una decision explicita de continuidad.",
    task: "Realiza tu auditoria final: resume la meta, la evidencia, el patron, la regla mas fuerte y el sistema que mantendras desde manana.",
    companion: "No llegaste para convertirte en una persona perfecta. Llegaste para ser alguien que sabe volver y puede confiar mas en su palabra.",
  },
};

function getJourneyFocus(day) {
  const arc = journeyArcs.find(({ start, days }) => day >= start && day < start + days.length);
  if (!arc) return null;
  const [theme, target] = arc.days[day - arc.start];
  return { arc: arc.name, theme, target };
}

function getJourneyArcName(day) {
  if (day <= 7) return "Activacion de Control";
  if (day <= 14) return "Evidencia Inicial";
  return getJourneyFocus(day)?.arc || "Dominio Personal";
}

function getJourneyDayContent(day) {
  const focus = getJourneyFocus(day);
  if (!focus) return {};
  const mode = practiceModes[(day - 15) % practiceModes.length];
  return {
    guideName: mode.guideName,
    guide: mode.guide,
    principle: mode.principle,
    question: mode.question(focus),
    action: mode.action(focus),
    task: mode.task(focus),
    companion: mode.companion,
    journeyArc: focus.arc,
    ...(milestoneDailyContent[day] || {}),
  };
}

function getDayTheme(day, phase) {
  const journeyFocus = getJourneyFocus(day);
  return dayNarratives[day - 1] || journeyFocus?.theme || (
    phase === "Control" ? "Volver al control" :
    phase === "Fortaleza" ? "Sostener bajo incomodidad" :
    "Vivir con direccion"
  );
}

function getIdentityStage(day) {
  if (day <= 7) {
    return {
      name: "Explorador",
      line: "Estas descubriendo que puedes volver al marco sin esperar sentirte perfecto.",
    };
  }
  if (day <= 21) {
    return {
      name: "Constructor",
      line: "Estas construyendo evidencia diaria de que cumples lo que dices.",
    };
  }
  if (day <= 45) {
    return {
      name: "Resistente",
      line: "Estas aprendiendo a sostener accion cuando aparece incomodidad.",
    };
  }
  if (day <= 70) {
    return {
      name: "Constante",
      line: "Estas dejando de depender del animo y empezando a depender de tu marco.",
    };
  }
  if (day <= 99) {
    return {
      name: "Dirigido",
      line: "Estas tomando decisiones con mas claridad y menos reaccion.",
    };
  }
  return {
    name: "Dominio Personal",
    line: "Estas integrando Control, Fortaleza y Direccion como identidad.",
  };
}

const dailyContent = Array.from({ length: 100 }, (_, index) => {
  const day = index + 1;
  const phase =
    day <= 30 ? "Control" :
    day <= 60 ? "Fortaleza" :
    "Direccion";

  const phaseContent = {
    Control: {
      guideName: "Marco Aurelio",
      guide: "Vuelve a lo que depende de ti: tu juicio, tu accion y tu respuesta.",
      principle: "Controla una decision antes de buscar motivacion.",
      question: "Que parte de este dia depende directamente de mi?",
      action: "Ejecuta una accion pequena que reduzca caos antes de consumir distraccion.",
      task: "Elige una accion de 10 minutos que reduzca caos y hazla antes de consumir distraccion.",
      companion: "No tienes que dominar todo el dia. Solo vuelve a una decision que si depende de ti.",
    },
    Fortaleza: {
      guideName: "Seneca",
      guide: "La incomodidad no es enemiga; es el lugar donde se entrena el caracter.",
      principle: "La incomodidad no decide por ti.",
      question: "Que impulso debo observar sin obedecer automaticamente?",
      action: "Sosten una accion necesaria aunque no tengas ganas de hacerla.",
      task: "Haz una accion necesaria aunque el animo no te acompane y escribe que resistencia aparecio.",
      companion: "Si hoy pesa, no estas fallando. Estas entrenando volver sin negociar con el cansancio.",
    },
    Direccion: {
      guideName: "Epicteto",
      guide: "No todo esta bajo tu control. Tu tarea es elegir bien donde pones tu energia.",
      principle: "Una vida dirigida se construye con decisiones repetidas.",
      question: "Que decision de hoy me acerca a la persona que estoy construyendo?",
      action: "Elige una prioridad concreta y protegela antes de responder al ruido externo.",
      task: "Define una prioridad, elimina una distraccion y protege un bloque corto para avanzar.",
      companion: "Tu direccion no aparece de golpe. Se construye cuando eliges una prioridad y la cuidas.",
    },
  };

  return {
    day,
    phase,
    theme: getDayTheme(day, phase),
    journeyArc: getJourneyArcName(day),
    ...phaseContent[phase],
    ...getJourneyDayContent(day),
    ...(alphaDailyContent[day - 1] || {}),
  };
});

const defaultState = {
  schemaVersion: 2,
  activation: {
    method: false,
    day0: false,
    system: false,
    day1: false,
  },
  dayZero: {},
  days: {},
  reviews: [],
  lastActivity: "",
};

function cleanText(value, maxLength = 10000) {
  return typeof value === "string" ? value.slice(0, maxLength) : "";
}

function normalizeDayZero(value) {
  const source = value && typeof value === "object" ? value : {};
  return {
    lifeArea: LIFE_AREA_LABELS[source.lifeArea] ? source.lifeArea : "",
    goal: cleanText(source.goal, 180),
    control: cleanText(source.control, 600),
    cue: cleanText(source.cue, 120),
    place: cleanText(source.place, 120),
    minimumAction: cleanText(source.minimumAction, 180),
    rescueAction: cleanText(source.rescueAction, 180),
    pattern: cleanText(source.pattern, 500),
  };
}

function normalizeDayEntry(value) {
  const source = value && typeof value === "object" ? value : {};
  const normalized = {
    intention: cleanText(source.intention, 180),
    reflection: cleanText(source.reflection, 10000),
    returns: Math.max(0, Math.min(999, Number(source.returns) || 0)),
    startedAt: cleanText(source.startedAt, 40),
    recordedOn: cleanText(source.recordedOn, 10),
    updatedAt: cleanText(source.updatedAt, 40),
  };
  if (VALID_DAY_STATES.has(source.state)) normalized.state = source.state;
  return normalized;
}

function normalizeReview(value, index) {
  const source = value && typeof value === "object" ? value : {};
  const inferredDay = Math.min((index + 1) * 7, 100);
  const reviewDay = Math.max(1, Math.min(100, Number(source.reviewDay) || inferredDay));
  return {
    reviewDay,
    completed: cleanText(source.completed, 3000),
    avoided: cleanText(source.avoided, 3000),
    pattern: cleanText(source.pattern, 3000),
    next: cleanText(source.next, 3000),
    createdAt: cleanText(source.createdAt, 40),
  };
}

function normalizeState(value) {
  const source = value && typeof value === "object" ? value : {};
  const activationSource = source.activation && typeof source.activation === "object"
    ? source.activation
    : {};
  const daysSource = source.days && typeof source.days === "object" ? source.days : {};
  const days = {};

  Object.entries(daysSource).forEach(([key, entry]) => {
    const day = Number(key);
    if (Number.isInteger(day) && day >= 1 && day <= 100) {
      days[String(day)] = normalizeDayEntry(entry);
    }
  });

  return {
    schemaVersion: 2,
    activation: {
      method: Boolean(activationSource.method),
      day0: Boolean(activationSource.day0),
      system: Boolean(activationSource.system),
      day1: Boolean(activationSource.day1),
    },
    dayZero: normalizeDayZero(source.dayZero),
    days,
    reviews: Array.isArray(source.reviews)
      ? source.reviews.slice(0, 100).map(normalizeReview)
      : [],
    lastActivity: cleanText(source.lastActivity, 300),
  };
}

function loadState() {
  try {
    return normalizeState(JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"));
  } catch {
    return normalizeState(defaultState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function todayLabel() {
  return new Date().toLocaleDateString("es-DO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getCompletedCount() {
  return Object.values(state.days).filter((entry) => entry?.state === "complete").length;
}

function getRecordedDays() {
  return Object.entries(state.days)
    .filter(([, entry]) => VALID_DAY_STATES.has(entry?.state))
    .map(([day]) => Number(day))
    .filter((day) => Number.isInteger(day) && day >= 1 && day <= 100)
    .sort((a, b) => a - b);
}

function getCurrentDay() {
  const recorded = getRecordedDays();
  if (recorded.length === 0) return 1;
  const next = Math.max(...recorded) + 1;
  return Math.min(next, 100);
}

function getPhase(day) {
  return dailyContent[day - 1]?.phase || "Control";
}

function getRecordDate(entry) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(entry?.recordedOn || "")) {
    return entry.recordedOn;
  }
  if (!entry?.updatedAt) return "";
  const updatedAt = new Date(entry.updatedAt);
  return Number.isNaN(updatedAt.getTime()) ? "" : localDateKey(updatedAt);
}

function shiftDateKey(dateKey, delta) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day, 12, 0, 0, 0);
  date.setDate(date.getDate() + delta);
  return localDateKey(date);
}

function getStreak() {
  const today = localDateKey();
  const statusByDate = new Map();

  Object.values(state.days).forEach((entry) => {
    if (!VALID_DAY_STATES.has(entry?.state)) return;
    const date = getRecordDate(entry);
    if (!date) return;
    const previous = statusByDate.get(date);
    const active = entry.state === "complete" || entry.state === "partial";
    statusByDate.set(date, previous === true ? true : active);
  });

  if (statusByDate.has(today) && !statusByDate.get(today)) return 0;
  let cursor = statusByDate.get(today) ? today : shiftDateKey(today, -1);
  let streak = 0;
  while (statusByDate.get(cursor)) {
    streak += 1;
    cursor = shiftDateKey(cursor, -1);
  }
  return streak;
}

function getActiveDaysLast7() {
  const today = localDateKey();
  const activeDates = new Set();
  Object.values(state.days).forEach((entry) => {
    if (entry?.state !== "complete" && entry?.state !== "partial") return;
    const date = getRecordDate(entry);
    if (date) activeDates.add(date);
  });

  let active = 0;
  for (let offset = 0; offset < 7; offset += 1) {
    if (activeDates.has(shiftDateKey(today, -offset))) active += 1;
  }
  return active;
}

function getReturnCount() {
  return Object.values(state.days).reduce(
    (total, entry) => total + Math.max(0, Number(entry?.returns) || 0),
    0
  );
}

function getMaxRecordedDay() {
  const recorded = getRecordedDays();
  return recorded.length ? Math.max(...recorded) : 0;
}

function isJourneyComplete() {
  return VALID_DAY_STATES.has(state.days["100"]?.state);
}

function isCadenceWaiting(day = getCurrentDay()) {
  if (isJourneyComplete()) return false;
  const maxDay = getMaxRecordedDay();
  if (!maxDay || day !== maxDay + 1) return false;
  return getRecordDate(state.days[String(maxDay)]) === localDateKey();
}

function getReviewMilestones() {
  return [...Array.from({ length: 14 }, (_, index) => (index + 1) * 7), 100];
}

function getDueReviewDay() {
  const maxDay = getMaxRecordedDay();
  const reviewed = new Set(state.reviews.map((review) => Number(review.reviewDay)));
  return getReviewMilestones().find(
    (milestone) => milestone <= maxDay && !reviewed.has(milestone)
  ) || 0;
}

function getNextReviewDay() {
  const maxDay = getMaxRecordedDay();
  return getReviewMilestones().find((milestone) => milestone > maxDay) || 100;
}

function getLifeAreaLabel() {
  return LIFE_AREA_LABELS[state.dayZero.lifeArea] || "Completa tu Dia 0";
}

function buildPersonalIfThen(dayZero) {
  const { cue, place, minimumAction } = dayZero;
  if (!cue || !place || !minimumAction) {
    return "Cuando completes tu Dia 0, tu rutina personal aparecera aqui.";
  }
  return `Cuando ${cue}, ${place}, hare esto: ${minimumAction}`;
}

function getPersonalIfThen() {
  return buildPersonalIfThen(state.dayZero);
}

function setText(selector, value) {
  const element = document.querySelector(selector);
  if (element) element.textContent = value;
}

function renderActivation() {
  const completed = Object.entries(state.activation).filter(([, value]) => value).length;

  document.querySelectorAll("[data-step]").forEach((button) => {
    const step = button.dataset.step;
    const done = Boolean(state.activation[step]);
    const card = document.querySelector(`[data-step-card="${step}"]`);
    button.textContent = done ? "Completado" : "Pendiente";
    button.setAttribute("aria-pressed", String(done));
    card?.classList.toggle("done", done);
  });

  const completePanel = document.querySelector("[data-activation-complete]");
  if (completePanel) {
    completePanel.hidden = completed !== 4;
  }
}

function renderDayZero() {
  const form = document.querySelector("#dayZeroForm");
  if (!form) return;
  if (form.dataset.hydrated !== "true") {
    Object.entries(state.dayZero).forEach(([name, value]) => {
      const field = form.elements.namedItem(name);
      if (field) field.value = value;
    });
    form.dataset.hydrated = "true";
  }
  renderPactPreview();
}

function renderPactPreview() {
  const form = document.querySelector("#dayZeroForm");
  if (!form) return;
  const draft = normalizeDayZero(
    Object.fromEntries(new FormData(form).entries())
  );
  const hasPlan = draft.cue && draft.place && draft.minimumAction;
  setText(
    "[data-ifthen-preview]",
    hasPlan
      ? buildPersonalIfThen(draft)
      : "Cuando aparezca tu senal, en tu lugar elegido, haras una accion minima. Si el dia se complica, ejecutaras tu version de 2 minutos."
  );
}

function renderPersonalSystem() {
  setText("[data-personal-area]", getLifeAreaLabel());
  setText(
    "[data-personal-goal]",
    state.dayZero.goal || "Define una direccion que puedas practicar cada dia."
  );
  setText("[data-personal-ifthen]", getPersonalIfThen());
  setText(
    "[data-personal-rescue]",
    state.dayZero.rescueAction ||
      "Una accion de 2 minutos para no convertir un dia dificil en abandono."
  );
}

function renderDayMap() {
  const map = document.querySelector("[data-day-map]");
  if (!map) return;
  const currentDay = getCurrentDay();
  const waiting = isCadenceWaiting(currentDay);

  map.innerHTML = dailyContent
    .map(({ day }) => {
      const status = state.days[String(day)]?.state || "";
      const isCurrent = day === currentDay;
      const isLocked = day > currentDay;
      const isWaiting = isCurrent && waiting;
      const statusLabels = {
        complete: "completado",
        partial: "parcial",
        missed: "perdido",
      };
      const label = isLocked
        ? `Dia ${day}: bloqueado hasta avanzar`
        : isWaiting
          ? `Dia ${day}: disponible manana`
        : status
          ? `Dia ${day}: ${statusLabels[status]}`
          : `Dia ${day}: pendiente`;
      return `<button class="day-dot ${status} ${isCurrent ? "current" : ""} ${isLocked ? "locked" : ""} ${isWaiting ? "waiting" : ""}" type="button" data-map-day="${day}" aria-label="${label}" ${isCurrent ? 'aria-current="step"' : ""} ${isLocked || isWaiting ? "disabled" : ""}></button>`;
    })
    .join("");
}

function renderDashboard() {
  const completed = getCompletedCount();
  const percent = Math.round((completed / 100) * 100);
  const currentDay = getCurrentDay();
  const phase = getPhase(currentDay);
  const identity = getIdentityStage(currentDay);
  const theme = getDayTheme(currentDay, phase);
  const streak = getStreak();
  const weeklyActive = getActiveDaysLast7();
  const waiting = isCadenceWaiting(currentDay);
  const currentEntry = state.days[String(currentDay)] || {};
  let nextAction = `Comenzar el ritual del Dia ${currentDay}`;

  if (!state.activation.day0) {
    nextAction = "Completar tu pacto del Dia 0";
  } else if (isJourneyComplete()) {
    nextAction = "Cerrar el recorrido y descargar tu diario";
  } else if (waiting) {
    nextAction = `Volver manana para abrir el Dia ${currentDay}`;
  } else if (currentEntry.startedAt) {
    nextAction = `Cerrar y registrar el Dia ${currentDay}`;
  }

  setText("[data-current-day]", String(currentDay));
  setText("[data-percent]", `${percent}%`);
  setText("[data-current-phase]", phase);
  setText("[data-current-state]", `Entrenando ${phase}`);
  setText("[data-training-phase]", phase);
  setText("[data-training-theme]", theme);
  setText("[data-training-arc]", `Ruta: ${getJourneyArcName(currentDay)}`);
  setText("[data-identity-stage]", identity.name);
  setText("[data-identity-line]", identity.line);
  setText("[data-streak]", `${streak} ${streak === 1 ? "dia" : "dias"}`);
  setText("[data-weekly-active]", `${weeklyActive} de 7`);
  setText("[data-return-count]", String(getReturnCount()));
  setText("[data-last-activity]", state.lastActivity || "Aun no has vuelto al marco");
  setText("[data-next-action]", nextAction);
  setText("[data-progress-label]", `${completed} de 100`);
  setText(
    "[data-dynamic-phrase]",
    waiting
      ? "Lo de hoy ya esta registrado. Vuelve manana."
      : completed > 0
        ? "Vuelve al marco."
        : "El Dia 1 decide el inicio."
  );

  const fill = document.querySelector("[data-progress-fill]");
  if (fill) fill.style.width = `${percent}%`;
  const progressBar = document.querySelector("[data-progress-bar]");
  if (progressBar) progressBar.setAttribute("aria-valuenow", String(percent));
}

function renderDailyRitual(day) {
  const entry = state.days[String(day)] || {};
  const finalized = VALID_DAY_STATES.has(entry.state);
  const currentDay = getCurrentDay();
  const waiting = day === currentDay && isCadenceWaiting(day);
  const canBegin =
    state.activation.day0 && day === currentDay && !waiting && !finalized;
  const statusLabels = {
    complete: "Dia cerrado: completado",
    partial: "Dia cerrado: parcial",
    missed: "Dia cerrado: perdido",
  };

  let availability = "Disponible para comenzar";
  let note = "Comienza cuando aparezca tu senal cotidiana.";
  if (!state.activation.day0) {
    availability = "Primero confirma tu pacto";
    note = "Completa el Dia 0 para conectar esta practica con tu vida real.";
  } else if (finalized) {
    availability = statusLabels[entry.state];
    note = "Este registro ya forma parte de tu evidencia.";
  } else if (waiting) {
    availability = `El Dia ${day} abre manana`;
    note = "Una jornada por fecha protege la practica. Lo de hoy ya esta hecho.";
  } else if (entry.startedAt) {
    availability = "Ritual en marcha";
    note = "Ejecuta tu minimo, escribe evidencia y cierra el dia con honestidad.";
  }

  setText("[data-daily-availability]", availability);
  setText(
    "[data-daily-cue]",
    state.activation.day0
      ? getPersonalIfThen()
      : "Tu senal personal aparecera aqui despues de completar el Dia 0."
  );
  setText(
    "[data-rescue-action]",
    state.dayZero.rescueAction || "dos minutos honestos"
  );
  setText("[data-ritual-note]", note);

  const intention = document.querySelector("#dailyIntention");
  if (intention) {
    intention.dataset.day = String(day);
    intention.value = entry.intention || "";
    intention.disabled = !canBegin;
  }

  const startButton = document.querySelector("[data-start-ritual]");
  const returnButton = document.querySelector("[data-return-now]");
  if (startButton) {
    startButton.disabled = !canBegin;
    startButton.textContent = entry.startedAt
      ? "Ritual iniciado"
      : "Comenzar mi ritual";
  }
  if (returnButton) returnButton.disabled = !canBegin;

  const returnProtocol = document.querySelector("[data-return-protocol]");
  if (returnProtocol) returnProtocol.hidden = !(Number(entry.returns) > 0);
}

function renderDaily(day = getCurrentDay()) {
  const content = dailyContent[day - 1] || dailyContent[0];
  const identity = getIdentityStage(content.day);
  setText("[data-daily-title]", `Dia ${content.day}: ${content.theme}`);
  setText("[data-daily-theme]", content.theme);
  setText("[data-daily-arc]", content.journeyArc);
  setText("[data-daily-identity]", identity.name);
  setText("[data-daily-guide-name]", content.guideName);
  setText("[data-daily-guide]", content.guide);
  setText("[data-daily-principle]", content.principle);
  setText("[data-daily-question]", content.question);
  setText("[data-daily-action]", content.action);
  setText("[data-daily-task]", content.task);
  setText("[data-daily-companion]", content.companion);

  const reflection = document.querySelector("#dailyReflection");
  if (reflection) {
    reflection.dataset.day = String(content.day);
    reflection.value = state.days[String(content.day)]?.reflection || "";
    reflection.disabled =
      !state.activation.day0 ||
      (content.day === getCurrentDay() && isCadenceWaiting(content.day));
  }

  const entry = state.days[String(content.day)] || {};
  const inaccessible =
    !state.activation.day0 ||
    content.day > getCurrentDay() ||
    (content.day === getCurrentDay() && isCadenceWaiting(content.day));
  document.querySelectorAll("[data-state]").forEach((button) => {
    button.disabled = inaccessible;
    button.setAttribute(
      "aria-pressed",
      String(button.dataset.state === entry.state)
    );
  });
  renderDailyRitual(content.day);
}

function renderWeeklyReview() {
  const form = document.querySelector("#weeklyReviewForm");
  if (!form) return;
  const dueDay = getDueReviewDay();
  const maxDay = getMaxRecordedDay();
  const nextDay = getNextReviewDay();
  const controls = form.querySelectorAll("textarea, button[type='submit']");
  const hiddenDay = form.elements.namedItem("reviewDay");

  controls.forEach((control) => {
    control.disabled = !dueDay;
  });
  if (hiddenDay) hiddenDay.value = dueDay ? String(dueDay) : "";

  if (dueDay) {
    setText("[data-review-heading]", `Revision del Dia ${dueDay}.`);
    setText("[data-review-title]", `Tu revision del Dia ${dueDay} esta lista`);
    setText(
      "[data-review-copy]",
      "Ya existe evidencia suficiente. Observa el patron y decide una regla concreta para continuar."
    );
    setText("#reviewNote", "Responde con honestidad. Esta revision no cambia tu porcentaje.");
  } else if (isJourneyComplete()) {
    setText("[data-review-heading]", "Recorrido revisado.");
    setText("[data-review-title]", "Tus revisiones estan al dia");
    setText(
      "[data-review-copy]",
      "Descarga tu diario y conserva la evidencia de los 100 dias."
    );
    setText("#reviewNote", "No hay revisiones pendientes.");
  } else {
    setText("[data-review-heading]", "Revision cada 7 dias.");
    setText("[data-review-title]", `Proxima revision: Dia ${nextDay}`);
    setText(
      "[data-review-copy]",
      maxDay
        ? `Has registrado hasta el Dia ${maxDay}. El formulario se abre al cerrar el Dia ${nextDay}.`
        : "Completa el recorrido diario. El formulario se habilitara cuando exista evidencia que revisar."
    );
    setText("#reviewNote", `Se habilitara al cerrar el Dia ${nextDay}.`);
  }
  form.classList.toggle("is-disabled", !dueDay);
}

const DEFAULT_REMINDER_SETTINGS = {
  time: "08:00",
  duration: 14,
  browserEnabled: false,
  lastShownDate: "",
};

let deferredInstallPrompt = null;

function normalizeReminderSettings(value) {
  const source = value && typeof value === "object" ? value : {};
  return {
    time: /^\d{2}:\d{2}$/.test(source.time || "")
      ? source.time
      : DEFAULT_REMINDER_SETTINGS.time,
    duration: Number(source.duration) === 100 ? 100 : 14,
    browserEnabled: Boolean(source.browserEnabled),
    lastShownDate: /^\d{4}-\d{2}-\d{2}$/.test(source.lastShownDate || "")
      ? source.lastShownDate
      : "",
  };
}

function loadReminderSettings() {
  try {
    return normalizeReminderSettings(
      JSON.parse(localStorage.getItem(REMINDER_KEY) || "{}")
    );
  } catch {
    return { ...DEFAULT_REMINDER_SETTINGS };
  }
}

function saveReminderSettings() {
  localStorage.setItem(REMINDER_KEY, JSON.stringify(reminderSettings));
}

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function hasRecordToday() {
  const today = localDateKey();
  return Object.values(state.days).some(
    (entry) => VALID_DAY_STATES.has(entry?.state) && getRecordDate(entry) === today
  );
}

function renderReminderCenter() {
  const center = document.querySelector("[data-reminder-center]");
  if (!center) return;

  const timeInput = center.querySelector("#reminderTime");
  const durationSelect = center.querySelector("#reminderDuration");
  const status = center.querySelector("[data-reminder-status]");
  const statusCopy = center.querySelector("[data-reminder-status-copy]");
  const browserButton = center.querySelector("[data-browser-reminder]");
  const calendarButton = center.querySelector("[data-calendar-reminder]");
  const currentDay = getCurrentDay();
  const selectedEndDay = Number(reminderSettings.duration) === 100 || currentDay > 14 ? 100 : 14;

  if (timeInput) timeInput.value = reminderSettings.time;
  if (durationSelect) {
    if (currentDay > 14 && Number(reminderSettings.duration) === 14) {
      reminderSettings.duration = 100;
      saveReminderSettings();
    }
    durationSelect.value = String(reminderSettings.duration);
  }

  if (!("Notification" in window)) {
    if (status) status.textContent = "Avisos no disponibles";
    if (statusCopy) statusCopy.textContent = "Usa el calendario del dispositivo para recibir recordatorios con la pagina cerrada.";
    if (browserButton) browserButton.disabled = true;
  } else if (Notification.permission === "denied") {
    if (status) status.textContent = "Permiso bloqueado";
    if (statusCopy) statusCopy.textContent = "El navegador bloqueo los avisos. Puedes habilitarlos en la configuracion del sitio o usar el calendario.";
    if (browserButton) browserButton.textContent = "Permiso bloqueado";
  } else if (reminderSettings.browserEnabled && Notification.permission === "granted") {
    if (status) status.textContent = `Aviso activo a las ${reminderSettings.time}`;
    if (statusCopy) statusCopy.textContent = "La plataforma te avisara si esta abierta y todavia no registraste el dia.";
    if (browserButton) browserButton.textContent = "Desactivar aviso del navegador";
  } else {
    if (status) status.textContent = "Aviso del navegador sin activar";
    if (statusCopy) statusCopy.textContent = "Activalo para recibir un aviso cuando tengas abierta la plataforma.";
    if (browserButton) browserButton.textContent = "Activar aviso del navegador";
  }

  if (calendarButton) {
    calendarButton.textContent = `Agregar hasta el Dia ${selectedEndDay} al calendario`;
  }
}

async function registerReminderWorker() {
  if (!("serviceWorker" in navigator)) return null;
  try {
    await navigator.serviceWorker.register("./sw.js");
    return navigator.serviceWorker.ready;
  } catch {
    return null;
  }
}

async function showReminderNotification(isTest = false) {
  if (!("Notification" in window) || Notification.permission !== "granted") {
    return false;
  }

  const day = getCurrentDay();
  const content = dailyContent[day - 1] || dailyContent[0];
  const title = isTest ? "Aviso de prueba listo" : `Dia ${day}: ${content.theme}`;
  const body = isTest
    ? `Tu recordatorio diario funcionara a las ${reminderSettings.time}.`
    : state.dayZero.minimumAction
      ? `Tu minimo de hoy: ${state.dayZero.minimumAction}`
      : content.task;
  const options = {
    body,
    icon: "assets/icon-100-dias-192.png",
    badge: "assets/icon-100-dias-192.png",
    tag: isTest ? "100-dias-test" : `100-dias-${localDateKey()}`,
    renotify: false,
    data: {
      url: new URL("acceso.html#dia", window.location.href).href,
    },
  };

  const registration = await registerReminderWorker();
  try {
    if (registration) {
      await registration.showNotification(title, options);
    } else {
      new Notification(title, options);
    }
    trackEvent(isTest ? "browser_reminder_test" : "daily_reminder_shown", {
      day,
      reminder_time: reminderSettings.time,
    });
    return true;
  } catch {
    return false;
  }
}

async function toggleBrowserReminder() {
  const note = document.querySelector("[data-reminder-note]");
  if (!("Notification" in window) || !window.isSecureContext) {
    if (note) note.textContent = "Este navegador no permite avisos aqui. El calendario del dispositivo sigue disponible.";
    return;
  }

  if (reminderSettings.browserEnabled && Notification.permission === "granted") {
    reminderSettings.browserEnabled = false;
    saveReminderSettings();
    trackEvent("browser_reminder_disabled");
    renderReminderCenter();
    if (note) note.textContent = "Aviso del navegador desactivado. Los eventos que hayas agregado al calendario no cambian.";
    return;
  }

  const permission = Notification.permission === "default"
    ? await Notification.requestPermission()
    : Notification.permission;

  if (permission !== "granted") {
    reminderSettings.browserEnabled = false;
    saveReminderSettings();
    renderReminderCenter();
    if (note) note.textContent = "No se concedio permiso. Agrega los recordatorios al calendario para recibirlos con la pagina cerrada.";
    return;
  }

  reminderSettings.browserEnabled = true;
  saveReminderSettings();
  await registerReminderWorker();
  trackEvent("browser_reminder_enabled", {
    reminder_time: reminderSettings.time,
  });
  renderReminderCenter();
  if (note) note.textContent = `Aviso activado a las ${reminderSettings.time}. Puedes probarlo ahora.`;
}

async function testBrowserReminder() {
  const note = document.querySelector("[data-reminder-note]");
  if (!("Notification" in window) || !window.isSecureContext) {
    if (note) note.textContent = "Este navegador no permite probar avisos aqui. Usa el calendario del dispositivo.";
    return;
  }

  const permission = Notification.permission === "default"
    ? await Notification.requestPermission()
    : Notification.permission;
  if (permission !== "granted") {
    renderReminderCenter();
    if (note) note.textContent = "El permiso no esta activo. Habilitalo en el navegador o usa el calendario.";
    return;
  }

  const shown = await showReminderNotification(true);
  if (note) {
    note.textContent = shown
      ? "Aviso enviado. Revisa las notificaciones de tu dispositivo."
      : "El navegador no pudo mostrar el aviso. Usa la opcion de calendario.";
  }
}

function escapeCalendarText(value) {
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function foldCalendarLine(line) {
  const parts = String(line).match(/.{1,72}/g) || [""];
  return parts.join("\r\n ");
}

function calendarDateValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${year}${month}${day}T${hour}${minute}00`;
}

function calendarStartDate(time) {
  const [hour, minute] = time.split(":").map(Number);
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0, 0);
  if (isCadenceWaiting() || start <= now) start.setDate(start.getDate() + 1);
  return start;
}

function downloadReminderCalendar() {
  const currentDay = getCurrentDay();
  let endDay = Math.min(Number(reminderSettings.duration) || 14, 100);
  if (endDay < currentDay) endDay = 100;
  const firstDate = calendarStartDate(reminderSettings.time);
  const generatedAt = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const accessUrl = new URL("acceso.html#dia", window.location.href).href;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//100 Dias El Metodo//Recordatorios ES//",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:100 Dias - El Metodo",
  ];

  for (let day = currentDay; day <= endDay; day += 1) {
    const content = dailyContent[day - 1] || dailyContent[0];
    const eventDate = new Date(firstDate);
    eventDate.setDate(firstDate.getDate() + day - currentDay);
    const personalPlan = state.dayZero.minimumAction
      ? `Mi minimo: ${state.dayZero.minimumAction}\nMi regreso: ${state.dayZero.rescueAction || "dos minutos honestos"}\n`
      : "";
    lines.push(
      "BEGIN:VEVENT",
      `UID:100-dias-${generatedAt}-${day}@elmetodo`,
      `DTSTAMP:${generatedAt}`,
      `DTSTART:${calendarDateValue(eventDate)}`,
      `SUMMARY:${escapeCalendarText(`100 Dias - Dia ${day}: ${content.theme}`)}`,
      `DESCRIPTION:${escapeCalendarText(`${personalPlan}Tarea del Metodo: ${content.task}\nEntra, ejecuta y registra con honestidad.`)}`,
      `URL:${accessUrl}`,
      "STATUS:CONFIRMED",
      "TRANSP:TRANSPARENT",
      "BEGIN:VALARM",
      "TRIGGER:-PT10M",
      "ACTION:DISPLAY",
      `DESCRIPTION:${escapeCalendarText(`Dia ${day}: vuelve al marco`)}`,
      "END:VALARM",
      "END:VEVENT"
    );
  }
  lines.push("END:VCALENDAR");

  const calendar = lines.map(foldCalendarLine).join("\r\n");
  const blob = new Blob([calendar], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `100_DIAS_RECORDATORIOS_DIA_${currentDay}_A_${endDay}.ics`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);

  trackEvent("calendar_reminders_download", {
    start_day: currentDay,
    end_day: endDay,
    reminder_time: reminderSettings.time,
  });
  const note = document.querySelector("[data-reminder-note]");
  if (note) {
    note.textContent = `Calendario preparado del Dia ${currentDay} al ${endDay}. Abre el archivo descargado y confirma la importacion en tu dispositivo.`;
  }
}

async function maybeShowDueReminder() {
  if (!document.querySelector("[data-reminder-center]")) return;
  if (!reminderSettings.browserEnabled || !("Notification" in window) || Notification.permission !== "granted") return;
  if (hasRecordToday() || reminderSettings.lastShownDate === localDateKey()) return;

  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  if (currentTime < reminderSettings.time) return;

  const shown = await showReminderNotification();
  if (shown) {
    reminderSettings.lastShownDate = localDateKey();
    saveReminderSettings();
  }
}

function downloadFile(content, type, filename) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function formatJournalDate(entry) {
  const date = getRecordDate(entry);
  return date || "Fecha no disponible";
}

function buildJournalText() {
  const statusLabels = {
    complete: "Completado",
    partial: "Parcial",
    missed: "Perdido",
  };
  const lines = [
    "100 DIAS: EL METODO",
    "DIARIO PERSONAL",
    `Exportado: ${new Date().toLocaleString("es-DO")}`,
    "",
    "MI PACTO DE 100 DIAS",
    `Area: ${getLifeAreaLabel()}`,
    `Direccion: ${state.dayZero.goal || "Sin definir"}`,
    `Por que importa: ${state.dayZero.control || "Sin definir"}`,
    `Plan si-entonces: ${getPersonalIfThen()}`,
    `Minimo de regreso: ${state.dayZero.rescueAction || "Sin definir"}`,
    `Patron que estoy rompiendo: ${state.dayZero.pattern || "Sin definir"}`,
    "",
    "EVIDENCIA DIARIA",
  ];

  getRecordedDays().forEach((day) => {
    const entry = state.days[String(day)];
    const content = dailyContent[day - 1] || dailyContent[0];
    lines.push(
      "",
      `DIA ${day}: ${content.theme}`,
      `Fecha: ${formatJournalDate(entry)}`,
      `Estado: ${statusLabels[entry.state]}`,
      `Intencion: ${entry.intention || "Sin registrar"}`,
      `Regresos al marco: ${Number(entry.returns) || 0}`,
      `Diario: ${entry.reflection || "Sin reflexion escrita"}`
    );
  });

  lines.push("", "REVISIONES");
  if (!state.reviews.length) {
    lines.push("Aun no hay revisiones guardadas.");
  } else {
    [...state.reviews]
      .sort((a, b) => a.reviewDay - b.reviewDay)
      .forEach((review) => {
        lines.push(
          "",
          `REVISION DEL DIA ${review.reviewDay}`,
          `Complete: ${review.completed || "Sin respuesta"}`,
          `Evite: ${review.avoided || "Sin respuesta"}`,
          `Patron: ${review.pattern || "Sin respuesta"}`,
          `Sostendre: ${review.next || "Sin respuesta"}`
        );
      });
  }

  lines.push(
    "",
    "CIERRE",
    "Este archivo contiene evidencia personal. Guardalo en un lugar privado.",
    ""
  );
  return lines.join("\r\n");
}

function downloadJournal() {
  downloadFile(
    buildJournalText(),
    "text/plain;charset=utf-8",
    `100_DIAS_MI_DIARIO_${localDateKey()}.txt`
  );
  trackEvent("journal_download", {
    recorded_days: getRecordedDays().length,
    review_count: state.reviews.length,
  });
  setText(
    "[data-data-note]",
    "Diario descargado. Contiene tu pacto, evidencia diaria y revisiones."
  );
}

function exportBackup() {
  const exportedAt = new Date().toISOString();
  const backup = {
    schemaVersion: 2,
    product: "100 Dias: El Metodo",
    exportedAt,
    state: normalizeState(state),
    reminderSettings: normalizeReminderSettings(reminderSettings),
  };
  downloadFile(
    `${JSON.stringify(backup, null, 2)}\n`,
    "application/json;charset=utf-8",
    `100_DIAS_COPIA_SEGURIDAD_${localDateKey()}.json`
  );
  localStorage.setItem(
    BACKUP_META_KEY,
    JSON.stringify({ lastExportedAt: exportedAt })
  );
  trackEvent("backup_export", {
    recorded_days: getRecordedDays().length,
  });
  renderDataControl();
  setText(
    "[data-data-note]",
    "Copia creada. Guardala en un lugar privado para restaurar tu recorrido en otro dispositivo."
  );
}

async function importBackup(file) {
  const note = document.querySelector("[data-data-note]");
  try {
    if (file.size > 3_000_000) {
      throw new Error("La copia supera el limite de 3 MB.");
    }
    const parsed = JSON.parse(await file.text());
    const importedState =
      parsed?.state && typeof parsed.state === "object"
        ? parsed.state
        : parsed?.days && parsed?.activation
          ? parsed
          : null;
    if (!importedState) {
      throw new Error("El archivo no contiene un recorrido valido.");
    }

    state = normalizeState(importedState);
    reminderSettings = normalizeReminderSettings(parsed.reminderSettings);
    saveState();
    saveReminderSettings();
    localStorage.setItem(
      BACKUP_META_KEY,
      JSON.stringify({ lastImportedAt: new Date().toISOString() })
    );
    const dayZeroForm = document.querySelector("#dayZeroForm");
    if (dayZeroForm) dayZeroForm.dataset.hydrated = "false";
    renderAll();
    trackEvent("backup_import", {
      recorded_days: getRecordedDays().length,
    });
    if (note) {
      const reviewCount = state.reviews.length;
      note.textContent = `Copia restaurada: ${getRecordedDays().length} dias y ${reviewCount} ${reviewCount === 1 ? "revision disponible" : "revisiones disponibles"}.`;
    }
  } catch (error) {
    if (note) {
      note.textContent =
        error instanceof Error
          ? `No se pudo restaurar: ${error.message}`
          : "No se pudo restaurar esta copia.";
    }
  }
}

function isStandaloneApp() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

function renderDataControl() {
  if (!document.querySelector(".data-control-section")) return;
  const online = navigator.onLine;
  setText("[data-connectivity-status]", online ? "En linea" : "Modo sin conexion");
  setText(
    "[data-connectivity-copy]",
    online
      ? "Tus cambios se guardan de inmediato en este dispositivo."
      : "Puedes continuar tu practica. Los cambios siguen guardandose en este dispositivo."
  );
  setText(
    "[data-data-summary]",
    `${getRecordedDays().length} ${getRecordedDays().length === 1 ? "dia registrado" : "dias registrados"}`
  );

  const installButton = document.querySelector("[data-install-app]");
  if (installButton) {
    installButton.hidden = !deferredInstallPrompt || isStandaloneApp();
  }

  let backupMeta = {};
  try {
    backupMeta = JSON.parse(localStorage.getItem(BACKUP_META_KEY) || "{}");
  } catch {
    backupMeta = {};
  }
  const backupDate = backupMeta.lastExportedAt || backupMeta.lastImportedAt;
  setText(
    "[data-storage-status]",
    backupDate
      ? `Ultima copia o restauracion: ${new Date(backupDate).toLocaleDateString("es-DO")}.`
      : "Todavia no has creado una copia de seguridad."
  );

  if (navigator.storage?.persisted) {
    navigator.storage
      .persisted()
      .then((persisted) => {
        if (persisted) {
          setText(
            "[data-storage-status]",
            backupDate
              ? `Almacenamiento protegido. Ultima copia: ${new Date(backupDate).toLocaleDateString("es-DO")}.`
              : "Almacenamiento protegido. Crea tambien una copia para cambiar de dispositivo."
          );
        }
      })
      .catch(() => {});
  }
}

async function requestPersistentStorage() {
  if (!navigator.storage?.persist) return false;
  try {
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}

function renderAll() {
  renderDayZero();
  renderActivation();
  renderPersonalSystem();
  renderDayMap();
  renderDashboard();
  renderDaily();
  renderWeeklyReview();
  renderReminderCenter();
  renderDataControl();
}

let state = loadState();
let reminderSettings = loadReminderSettings();

const leadForm = document.querySelector("#leadForm");
const planSelect = leadForm?.querySelector("select[name='plan']");
const paymentBox = document.querySelector("[data-payment-box]");
const paymentSummary = document.querySelector("[data-payment-summary]");
const paymentNote = document.querySelector("[data-payment-note]");
const paymentActions = document.querySelector("[data-payment-actions]");
const paymentLinks = document.querySelectorAll("[data-payment-provider]");
const externalLinks = document.querySelectorAll("[data-external-link]");
const resetModal = document.querySelector("#resetModal");
const resetCancel = document.querySelector("[data-reset-cancel]");
const resetConfirm = document.querySelector("[data-reset-confirm]");
const referralArrival = document.querySelector("[data-referral-arrival]");

function getStoredArray(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
}

function trackEvent(name, details = {}) {
  if (window.AlphaOps?.trackEvent) {
    return window.AlphaOps.trackEvent(name, details);
  }

  const event = {
    eventName: name,
    details,
    path: window.location.pathname,
    createdAt: new Date().toISOString(),
  };
  const events = getStoredArray(EVENTS_KEY);
  events.push(event);
  localStorage.setItem(EVENTS_KEY, JSON.stringify(events.slice(-200)));

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: name, ...details });

  if (window.SITE_CONFIG?.analyticsDebug) {
    console.info("[100dias:event]", event);
  }
}

function getAttribution() {
  if (window.AlphaOps?.getAttribution) {
    return window.AlphaOps.getAttribution();
  }

  const params = new URLSearchParams(window.location.search);
  const keys = [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_content",
    "utm_term",
    "fbclid",
    "gclid",
    "ref",
    "affiliate",
    "affiliate_code",
    "creator",
    "coupon",
  ];
  return Object.fromEntries(keys.map((key) => [key, params.get(key) || ""]).filter(([, value]) => value));
}

function renderReferralArrival() {
  if (!referralArrival) return;
  const attribution = getAttribution();
  const affiliateId =
    attribution.affiliate_code ||
    attribution.coupon ||
    attribution.ref ||
    attribution.affiliate ||
    attribution.creator ||
    "";
  if (!affiliateId) return;

  referralArrival.hidden = false;
  referralArrival.textContent = `Invitacion de ${affiliateId}`;
  trackEvent("affiliate_landing_view", {
    affiliate_id: affiliateId,
  });
}

function buildLeadPayload(source = "landing") {
  const plan = getSelectedPlan();
  const formData = leadForm ? Object.fromEntries(new FormData(leadForm).entries()) : {};
  return {
    recordType: "lead",
    ...formData,
    userKey: window.AlphaOps?.getUserKey?.() || "",
    planKey: plan.key,
    planLabel: plan.label,
    planPrice: plan.price,
    source,
    attribution: getAttribution(),
    createdAt: new Date().toISOString(),
  };
}

function storeLeadLocally(data) {
  const leads = getStoredArray(LEADS_KEY);
  leads.push(data);
  localStorage.setItem(LEADS_KEY, JSON.stringify(leads.slice(-100)));
}

document.querySelectorAll("[data-plan]").forEach((button) => {
  button.addEventListener("click", () => {
    if (planSelect) {
      planSelect.value = button.dataset.plan;
      updatePaymentLinks();
    }
  });
});

planSelect?.addEventListener("change", updatePaymentLinks);

function getSelectedPlan() {
  return PLAN_DETAILS[planSelect?.value] || PLAN_DETAILS.Alpha;
}

function updatePaymentLinks() {
  if (!planSelect) return;
  const plan = getSelectedPlan();
  const configuredLinks = window.PAYMENT_LINKS?.[plan.key] || {};
  const configuredProviders = [];

  if (paymentSummary) {
    paymentSummary.textContent = `${plan.label} - ${plan.price}`;
  }

  paymentLinks.forEach((link) => {
    const provider = link.dataset.paymentProvider;
    const baseUrl = configuredLinks[provider];
    const url = window.AlphaOps?.appendTrackingToUrl
      ? window.AlphaOps.appendTrackingToUrl(baseUrl, {
          provider,
          plan: plan.key,
          price: plan.price,
        })
      : baseUrl;
    const isConfigured = Boolean(baseUrl);
    if (isConfigured) {
      link.href = url;
    } else {
      link.removeAttribute("href");
    }
    link.setAttribute("data-disabled", String(!isConfigured));
    link.classList.toggle("disabled", !isConfigured);
    link.target = isConfigured ? "_blank" : "";
    link.rel = isConfigured ? "noopener" : "";
    if (isConfigured) configuredProviders.push(provider === "paypal" ? "PayPal" : "Stripe");
  });

  if (paymentActions) {
    paymentActions.hidden = configuredProviders.length === 0;
  }

  if (paymentNote) {
    paymentNote.textContent = configuredProviders.length
      ? `Pago disponible con ${configuredProviders.join(" y ")}. Seras dirigido a la plataforma elegida para completar la compra.`
      : "Completa tus datos. Si un enlace no aparece, confirmaremos el siguiente paso por el canal oficial.";
  }
}

paymentLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    const plan = getSelectedPlan();
    if (link.dataset.disabled === "true") {
      event.preventDefault();
      trackEvent("payment_missing_link", {
        provider: link.dataset.paymentProvider,
        plan: plan.key,
      });
      if (paymentNote) {
        paymentNote.textContent = "Pago automatico pendiente. Registra tu interes y confirmaremos el siguiente paso por el canal oficial.";
      }
      return;
    }

    if (leadForm && !leadForm.checkValidity()) {
      event.preventDefault();
      leadForm.reportValidity();
      trackEvent("payment_blocked_incomplete_form", {
        provider: link.dataset.paymentProvider,
        plan: plan.key,
      });
      if (paymentNote) {
        paymentNote.textContent = "Completa primero nombre, email y objetivo para poder reconciliar tu pago con tu acceso.";
      }
      return;
    }

    const checkoutLead = buildLeadPayload("checkout_started");
    storeLeadLocally(checkoutLead);
    sendLead(checkoutLead).catch(() => {});
    localStorage.setItem(
      "100dias_checkout_intent_v1",
      JSON.stringify({
        provider: link.dataset.paymentProvider,
        plan: plan.key,
        price: plan.price,
        createdAt: new Date().toISOString(),
      })
    );

    trackEvent("payment_click", {
      provider: link.dataset.paymentProvider,
      plan: plan.key,
      price: plan.price,
    });
  });
});

async function sendLead(data) {
  const endpoint = window.SITE_CONFIG?.leadEndpoint;
  if (!endpoint) {
    return { status: "local" };
  }

  const isGoogleScript = endpoint.includes("script.google");
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    body: JSON.stringify(data),
    mode: isGoogleScript ? "no-cors" : "cors",
  });

  if (isGoogleScript || response.type === "opaque") {
    return { status: "sent" };
  }

  if (!response.ok) {
    throw new Error("No se pudo enviar el lead al endpoint configurado.");
  }

  return { status: "sent" };
}

leadForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const submitButton = event.currentTarget.querySelector("button[type='submit']");
  const plan = getSelectedPlan();
  const data = buildLeadPayload("landing");
  storeLeadLocally(data);
  trackEvent("lead_registered", {
    plan: plan.key,
    price: plan.price,
    hasEndpoint: Boolean(window.SITE_CONFIG?.leadEndpoint),
    user_key: data.userKey,
  });

  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = "Registrando...";
  }

  try {
    const result = await sendLead(data);
    setText(
      "#formNote",
      result.status === "sent"
        ? "Datos recibidos. Elige PayPal o Stripe para completar la compra. El acceso se habilita despues de validar el pago."
        : "Datos guardados en este navegador. Elige PayPal o Stripe para completar la compra y conserva la confirmacion."
    );
  } catch {
    setText(
      "#formNote",
      "Datos guardados localmente. Puedes continuar al pago; conserva la confirmacion para que podamos validar tu acceso."
    );
  } finally {
    if (paymentBox) {
      paymentBox.hidden = false;
      paymentBox.scrollIntoView({ behavior: "smooth", block: "center" });
      paymentBox.focus({ preventScroll: true });
    }
    trackEvent("checkout_ready", {
      plan: plan.key,
      price: plan.price,
      hasEndpoint: Boolean(window.SITE_CONFIG?.leadEndpoint),
    });
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = "Actualizar datos de compra";
    }
  }
});

function enforceAccessGate() {
  const gate = document.querySelector("[data-access-gate]");
  if (!gate) return;

  const gateEnabled = window.SITE_CONFIG?.accessGateEnabled !== false;
  const hasAccess = !gateEnabled || Boolean(window.AlphaOps?.hasAccess?.());

  gate.hidden = hasAccess;
  document.body.classList.toggle("access-locked", !hasAccess);
  trackEvent(hasAccess ? "access_view" : "access_gate_view", {
    has_access: hasAccess,
  });
}

updatePaymentLinks();
updateExternalLinks();
enforceAccessGate();
renderReferralArrival();

function updateExternalLinks() {
  externalLinks.forEach((link) => {
    const key = link.dataset.externalLink;
    const url = window.AFFILIATE_LINKS?.[key];
    const isConfigured = Boolean(url);
    link.href = isConfigured ? url : "#";
    link.target = isConfigured ? "_blank" : "";
    link.rel = isConfigured ? "sponsored noopener" : "";
    link.dataset.disabled = String(!isConfigured);
    link.classList.toggle("disabled", !isConfigured);
  });
}

externalLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    if (link.dataset.disabled === "true") {
      event.preventDefault();
      trackEvent("affiliate_missing_link", {
        key: link.dataset.externalLink,
      });
      const note = link.closest("section")?.querySelector("[data-affiliate-note]");
      if (note) {
        note.textContent = "Enlace pendiente: agrega tu link de Amazon, Spotify o YouTube en assets/affiliate-links.js.";
      }
      return;
    }

    trackEvent("affiliate_click", {
      key: link.dataset.externalLink,
    });
  });
});

document.querySelectorAll("[data-step]").forEach((button) => {
  button.addEventListener("click", () => {
    const step = button.dataset.step;
    state.activation[step] = !state.activation[step];
    state.lastActivity = `Volviste al marco: ${todayLabel()}`;
    saveState();
    trackEvent("activation_step_toggled", {
      step,
      value: state.activation[step],
    });
    renderAll();
  });
});

document.querySelector("#dayZeroForm")?.addEventListener("input", renderPactPreview);

document.querySelector("#dayZeroForm")?.addEventListener("submit", (event) => {
  event.preventDefault();
  state.dayZero = normalizeDayZero(
    Object.fromEntries(new FormData(event.currentTarget).entries())
  );
  state.activation.day0 = true;
  state.lastActivity = `Decision inicial confirmada: ${todayLabel()}`;
  saveState();
  trackEvent("day0_submit", {
    life_area: state.dayZero.lifeArea,
    has_control: Boolean(state.dayZero.control),
    has_pattern: Boolean(state.dayZero.pattern),
    has_minimum_action: Boolean(state.dayZero.minimumAction),
    has_cue: Boolean(state.dayZero.cue),
    has_rescue_action: Boolean(state.dayZero.rescueAction),
  });
  requestPersistentStorage().then(renderDataControl);
  renderAll();
  setText(
    "#dayZeroNote",
    "Pacto confirmado. Tu senal, accion minima y regreso ya acompanaran el recorrido."
  );
});

function getSelectedDailyDay() {
  return Number(
    document.querySelector("#dailyReflection")?.dataset.day || getCurrentDay()
  );
}

function canUseDailyRitual(day) {
  return (
    state.activation.day0 &&
    day === getCurrentDay() &&
    !isCadenceWaiting(day) &&
    !VALID_DAY_STATES.has(state.days[String(day)]?.state)
  );
}

document.querySelector("[data-start-ritual]")?.addEventListener("click", () => {
  const day = getSelectedDailyDay();
  if (!canUseDailyRitual(day)) return;
  const key = String(day);
  const existing = state.days[key] || {};
  const intention = cleanText(
    document.querySelector("#dailyIntention")?.value,
    180
  );
  state.days[key] = normalizeDayEntry({
    ...existing,
    intention,
    startedAt: existing.startedAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  state.lastActivity = `Dia ${day}: ritual iniciado`;
  saveState();
  trackEvent("daily_ritual_started", {
    day,
    phase: getPhase(day),
    has_intention: Boolean(intention),
  });
  renderAll();
  setText(
    "[data-ritual-note]",
    "Ritual iniciado. Ejecuta tu minimo y vuelve para cerrar con evidencia."
  );
});

document.querySelector("[data-return-now]")?.addEventListener("click", () => {
  const day = getSelectedDailyDay();
  if (!canUseDailyRitual(day)) return;
  const key = String(day);
  const existing = state.days[key] || {};
  const intention = cleanText(
    document.querySelector("#dailyIntention")?.value,
    180
  );
  state.days[key] = normalizeDayEntry({
    ...existing,
    intention,
    returns: (Number(existing.returns) || 0) + 1,
    startedAt: existing.startedAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  state.lastActivity = `Dia ${day}: elegiste volver`;
  saveState();
  trackEvent("return_protocol_used", {
    day,
    phase: getPhase(day),
    return_count: state.days[key].returns,
  });
  renderAll();
  setText(
    "[data-ritual-note]",
    "Regreso registrado. Haz ahora tu version minima antes de volver a negociar."
  );
});

document.querySelectorAll("[data-state]").forEach((button) => {
  button.addEventListener("click", () => {
    const reflection = document.querySelector("#dailyReflection");
    const dayNumber = Number(reflection?.dataset.day || getCurrentDay());
    if (
      !state.activation.day0 ||
      dayNumber > getCurrentDay() ||
      (dayNumber === getCurrentDay() && isCadenceWaiting(dayNumber))
    ) {
      return;
    }
    const day = String(dayNumber);
    const existing = state.days[day] || {};
    state.days[day] = normalizeDayEntry({
      ...existing,
      state: button.dataset.state,
      intention:
        document.querySelector("#dailyIntention")?.value ||
        existing.intention ||
        "",
      reflection: reflection?.value || existing.reflection || "",
      startedAt: existing.startedAt || new Date().toISOString(),
      recordedOn: existing.recordedOn || localDateKey(),
      updatedAt: new Date().toISOString(),
    });
    if (day === "1") state.activation.day1 = true;
    state.lastActivity = `Dia ${day}: volviste al marco`;
    saveState();
    const status = button.dataset.state;
    trackEvent("daily_status_submit", {
      day,
      day_number: dayNumber,
      state: status,
      phase: getPhase(dayNumber),
    });
    if (day === "1") {
      trackEvent("day1_submit", { state: status });
    }
    if (day === "7") {
      trackEvent("day7_submit", { state: status });
    }
    renderAll();
  });
});

document.querySelector("[data-day-map]")?.addEventListener("click", (event) => {
  const target = event.target.closest("[data-map-day]");
  if (!target) return;
  const selectedDay = Number(target.dataset.mapDay);
  if (selectedDay > getCurrentDay()) return;
  renderDaily(selectedDay);
  document.querySelector("#dia")?.scrollIntoView({ behavior: "smooth" });
});

document.querySelector("#weeklyReviewForm")?.addEventListener("submit", (event) => {
  event.preventDefault();
  const dueDay = getDueReviewDay();
  const formData = Object.fromEntries(new FormData(event.currentTarget).entries());
  if (!dueDay || Number(formData.reviewDay) !== dueDay) {
    renderWeeklyReview();
    return;
  }
  state.reviews.push(normalizeReview({
    ...formData,
    reviewDay: dueDay,
    createdAt: new Date().toISOString(),
  }, state.reviews.length));
  state.lastActivity = `Revision del Dia ${dueDay}: direccion renovada`;
  saveState();
  trackEvent("weekly_review_submit", {
    review_count: state.reviews.length,
    review_day: dueDay,
  });
  event.currentTarget.reset();
  renderAll();
  setText(
    "#reviewNote",
    "Revision guardada. Tu siguiente regla ya forma parte del recorrido."
  );
});

function closeResetModal() {
  if (resetModal) resetModal.hidden = true;
}

document.querySelector(".reset-progress")?.addEventListener("click", () => {
  if (resetModal) {
    resetModal.hidden = false;
    resetCancel?.focus();
  }
});

resetCancel?.addEventListener("click", closeResetModal);

resetModal?.addEventListener("click", (event) => {
  if (event.target === resetModal) closeResetModal();
});

resetConfirm?.addEventListener("click", () => {
  state = normalizeState(defaultState);
  localStorage.removeItem(STORAGE_KEY);
  const dayZeroForm = document.querySelector("#dayZeroForm");
  if (dayZeroForm) {
    dayZeroForm.reset();
    dayZeroForm.dataset.hydrated = "false";
  }
  trackEvent("participant_progress_reset");
  renderAll();
  closeResetModal();
});

document.querySelector("#reminderTime")?.addEventListener("change", (event) => {
  reminderSettings.time = event.currentTarget.value || DEFAULT_REMINDER_SETTINGS.time;
  reminderSettings.lastShownDate = "";
  saveReminderSettings();
  trackEvent("reminder_time_changed", {
    reminder_time: reminderSettings.time,
  });
  renderReminderCenter();
});

document.querySelector("#reminderDuration")?.addEventListener("change", (event) => {
  reminderSettings.duration = Number(event.currentTarget.value) === 100 ? 100 : 14;
  saveReminderSettings();
  trackEvent("reminder_duration_changed", {
    end_day: reminderSettings.duration,
  });
  renderReminderCenter();
});

document.querySelector("[data-browser-reminder]")?.addEventListener("click", toggleBrowserReminder);
document.querySelector("[data-test-reminder]")?.addEventListener("click", testBrowserReminder);
document.querySelector("[data-calendar-reminder]")?.addEventListener("click", downloadReminderCalendar);
document.querySelector("[data-download-journal]")?.addEventListener("click", downloadJournal);
document.querySelector("[data-export-backup]")?.addEventListener("click", exportBackup);
document.querySelector("[data-import-trigger]")?.addEventListener("click", () => {
  const input = document.querySelector("[data-import-backup]");
  if (!input) return;
  input.value = "";
  input.click();
});
document.querySelector("[data-import-backup]")?.addEventListener("change", (event) => {
  const [file] = event.currentTarget.files || [];
  if (file) importBackup(file);
});

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  renderDataControl();
});

document.querySelector("[data-install-app]")?.addEventListener("click", async () => {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  const choice = await deferredInstallPrompt.userChoice;
  trackEvent("app_install_prompt", {
    outcome: choice.outcome,
  });
  deferredInstallPrompt = null;
  renderDataControl();
});

window.addEventListener("appinstalled", () => {
  deferredInstallPrompt = null;
  trackEvent("app_installed");
  renderDataControl();
  setText(
    "[data-data-note]",
    "Aplicacion instalada. Puedes abrir tu recorrido desde la pantalla de inicio."
  );
});

window.addEventListener("online", renderDataControl);
window.addEventListener("offline", renderDataControl);

renderAll();

registerReminderWorker().then(() => {
  if (document.querySelector("[data-reminder-center]")) maybeShowDueReminder();
});

if (document.querySelector("[data-reminder-center]")) {
  window.setInterval(maybeShowDueReminder, 60_000);
}
