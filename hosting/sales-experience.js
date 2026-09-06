(() => {
  const builder = document.querySelector('.route-builder');
  if (!builder) return;

  const areas = {
    disciplina: {
      label: 'Disciplina',
      goal: 'Cumplir una prioridad pequeña aun cuando no tengas ganas.',
      proof: 'terminaste una acción concreta y sabes qué repetir mañana.',
      action: 'reduces una distracción y completas la versión más pequeña de tu prioridad',
    },
    finanzas: {
      label: 'Finanzas',
      goal: 'Ver tus compromisos de dinero antes de decidir qué gastar.',
      proof: 'tienes tus próximos pagos, importes y fechas en un solo lugar.',
      action: 'ordenas un compromiso próximo y tomas una decisión con la información delante',
    },
    relaciones: {
      label: 'Relaciones',
      goal: 'Hablar con más claridad sin ignorar lo que necesitas.',
      proof: 'preparaste una conversación concreta y elegiste cuándo tenerla.',
      action: 'aclaras qué necesitas decir y ensayas una petición o un límite cotidiano',
    },
    bienestar: {
      label: 'Bienestar',
      goal: 'Cuidar tu energía con una acción que sí cabe en tu día.',
      proof: 'hiciste una pausa o cambio de entorno que puedes volver a realizar.',
      action: 'preparas una pausa breve y observas qué ayuda a recuperar capacidad',
    },
    proyectos: {
      label: 'Proyectos',
      goal: 'Mover un proyecto con un siguiente paso visible y manejable.',
      proof: 'un pendiente dejó de ser una idea vaga y tiene una próxima acción.',
      action: 'conviertes un pendiente en una tarea concreta y produces un avance verificable',
    },
  };

  const supportSelect = builder.querySelector('#route-support');
  const output = {
    kicker: builder.querySelector('#route-kicker'),
    goal: builder.querySelector('#route-goal'),
    proof: builder.querySelector('#route-proof'),
    dayZero: builder.querySelector('#route-day-zero'),
    daysOne: builder.querySelector('#route-days-one'),
    daysMiddle: builder.querySelector('#route-days-middle'),
  };

  function updateRoute() {
    const primaryKey = builder.querySelector('[name="route-area"]:checked')?.value || 'disciplina';
    const minutes = builder.querySelector('[name="route-time"]:checked')?.value || '10';
    const primary = areas[primaryKey];
    for (const option of supportSelect.options) option.disabled = option.value === primaryKey;
    if (supportSelect.value === primaryKey) supportSelect.value = [...supportSelect.options].find(option => !option.disabled)?.value || 'finanzas';
    const support = areas[supportSelect.value];

    output.kicker.textContent = `TU PRIMERA SEMANA · ${primary.label.toUpperCase()} + ${support.label.toUpperCase()}`;
    output.goal.textContent = primary.goal;
    output.proof.textContent = primary.proof;
    output.dayZero.textContent = `Defines este norte y la señal concreta que usarás para reconocer avance.`;
    output.daysOne.textContent = `Durante ${minutes} minutos, ${primary.action}; después registras qué ocurrió.`;
    output.daysMiddle.textContent = `Conectas ${support.label.toLowerCase()} con tu norte sin intentar arreglar toda tu vida a la vez.`;
  }

  builder.addEventListener('change', updateRoute);
  updateRoute();
})();
