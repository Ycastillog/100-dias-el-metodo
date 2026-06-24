const STORAGE_KEY = "100dias_participant_state_v1";
const LEADS_KEY = "100dias_sales_leads_v1";
const EVENTS_KEY = "100dias_events_v1";
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

function getDayTheme(day, phase) {
  return dayNarratives[day - 1] || (
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
    ...phaseContent[phase],
  };
});

const defaultState = {
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

function loadState() {
  try {
    return {
      ...defaultState,
      ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"),
    };
  } catch {
    return { ...defaultState };
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
  return Object.keys(state.days)
    .map(Number)
    .filter((day) => day >= 1 && day <= 100)
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

function getStreak() {
  let streak = 0;
  for (let day = 100; day >= 1; day -= 1) {
    const status = state.days[String(day)]?.state;
    if (status === "complete" || status === "partial") {
      streak += 1;
    } else if (streak > 0) {
      break;
    }
  }
  return streak;
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

function renderDayMap() {
  const map = document.querySelector("[data-day-map]");
  if (!map) return;

  map.innerHTML = dailyContent
    .map(({ day }) => {
      const status = state.days[String(day)]?.state || "";
      const label = status ? `Dia ${day}: ${status}` : `Dia ${day}: pendiente`;
      return `<button class="day-dot ${status}" type="button" data-map-day="${day}" aria-label="${label}"></button>`;
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

  setText("[data-current-day]", String(currentDay));
  setText("[data-percent]", `${percent}%`);
  setText("[data-current-phase]", phase);
  setText("[data-training-phase]", phase);
  setText("[data-training-theme]", theme);
  setText("[data-identity-stage]", identity.name);
  setText("[data-identity-line]", identity.line);
  setText("[data-streak]", `${getStreak()} dias`);
  setText("[data-last-activity]", state.lastActivity || "Aun no has vuelto al marco");
  setText("[data-progress-label]", `${completed} de 100`);
  setText("[data-dynamic-phrase]", completed > 0 ? "Vuelve al marco." : "El Dia 1 decide el inicio.");

  const fill = document.querySelector("[data-progress-fill]");
  if (fill) fill.style.width = `${percent}%`;
}

function renderDaily(day = getCurrentDay()) {
  const content = dailyContent[day - 1] || dailyContent[0];
  const identity = getIdentityStage(content.day);
  setText("[data-daily-title]", `Dia ${content.day}: ${content.theme}`);
  setText("[data-daily-theme]", content.theme);
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
  }
}

function renderAll() {
  renderActivation();
  renderDayMap();
  renderDashboard();
  renderDaily();
}

let state = loadState();

const leadForm = document.querySelector("#leadForm");
const planSelect = leadForm?.querySelector("select[name='plan']");
const accessArea = document.querySelector("#accessArea");
const accessMessage = accessArea?.querySelector(".access-message");
const accessLinks = accessArea?.querySelector(".access-links");
const paymentSummary = document.querySelector("[data-payment-summary]");
const paymentNote = document.querySelector("[data-payment-note]");
const paymentActions = document.querySelector("[data-payment-actions]");
const paymentLinks = document.querySelectorAll("[data-payment-provider]");
const externalLinks = document.querySelectorAll("[data-external-link]");

function getStoredArray(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
}

function trackEvent(name, details = {}) {
  const event = {
    name,
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
  const params = new URLSearchParams(window.location.search);
  const keys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid", "gclid"];
  return Object.fromEntries(keys.map((key) => [key, params.get(key) || ""]).filter(([, value]) => value));
}

function getConfiguredWhatsappUrl(data) {
  const number = window.SITE_CONFIG?.whatsappNumber;
  if (!number) return "";
  const message = [
    "Hola, quiero entrar al Grupo Alpha de 100 Dias.",
    `Nombre: ${data.name || ""}`,
    `Email: ${data.email || ""}`,
    `Objetivo: ${data.goal || ""}`,
  ].join("\n");
  return `https://wa.me/${String(number).replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
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
    const url = configuredLinks[provider];
    const isConfigured = Boolean(url);
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
      ? `Pago disponible con ${configuredProviders.join(" y ")}. El dinero ira a la cuenta conectada en esa plataforma.`
      : "Reserva tu cupo Alpha. El pago se confirma por el canal oficial mientras activamos el cobro automatico.";
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

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("No se pudo enviar el lead al endpoint configurado.");
  }

  return { status: "sent" };
}

leadForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const submitButton = event.currentTarget.querySelector("button[type='submit']");
  const plan = getSelectedPlan();
  const data = {
    ...Object.fromEntries(new FormData(event.currentTarget).entries()),
    planKey: plan.key,
    planLabel: plan.label,
    planPrice: plan.price,
    source: "landing",
    attribution: getAttribution(),
    createdAt: new Date().toISOString(),
  };
  const leads = getStoredArray(LEADS_KEY);
  leads.push(data);
  localStorage.setItem(LEADS_KEY, JSON.stringify(leads));
  localStorage.setItem("100dias_access_requested", "true");
  trackEvent("lead_registered", {
    plan: plan.key,
    price: plan.price,
    hasEndpoint: Boolean(window.SITE_CONFIG?.leadEndpoint),
  });

  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = "Registrando...";
  }

  try {
    const result = await sendLead(data);
    event.currentTarget.reset();
    unlockSalesAccess(data);
    setText(
      "#formNote",
      result.status === "sent"
        ? "Solicitud enviada. Tu acceso inicial queda listo para continuar con Dia 0 y Dia 1."
        : "Solicitud guardada en este navegador. Tu acceso inicial queda listo para continuar con Dia 0 y Dia 1."
    );
    window.location.href = window.SITE_CONFIG?.redirectAfterLead || "gracias.html";
  } catch {
    unlockSalesAccess(data);
    setText("#formNote", "Solicitud guardada localmente. Si aun no conectaste el formulario externo, confirma el cupo por el canal oficial.");
    window.location.href = window.SITE_CONFIG?.redirectAfterLead || "gracias.html";
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = "Reservar cupo Alpha";
    }
  }
});

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function unlockSalesAccess(data = {}) {
  if (!accessArea || !accessMessage || !accessLinks) return;
  accessArea.hidden = false;
  accessArea.classList.remove("locked");
  accessMessage.innerHTML = `Acceso inicial activado${data.name ? ` para ${escapeHtml(data.name)}` : ""}. Entra al espacio del participante y ejecuta el Dia 1.`;
  accessLinks.hidden = false;
  const whatsappUrl = getConfiguredWhatsappUrl(data);
  if (whatsappUrl && !accessLinks.querySelector("[data-whatsapp-link]")) {
    const link = document.createElement("a");
    link.className = "button secondary";
    link.href = whatsappUrl;
    link.target = "_blank";
    link.rel = "noopener";
    link.dataset.whatsappLink = "true";
    link.textContent = "Confirmar por WhatsApp";
    accessLinks.appendChild(link);
  }
}

if (localStorage.getItem("100dias_access_requested") === "true") {
  unlockSalesAccess();
}

updatePaymentLinks();
updateExternalLinks();

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

document.querySelector("#dayZeroForm")?.addEventListener("submit", (event) => {
  event.preventDefault();
  state.dayZero = Object.fromEntries(new FormData(event.currentTarget).entries());
  state.activation.day0 = true;
  state.lastActivity = `Decision inicial confirmada: ${todayLabel()}`;
  saveState();
  trackEvent("day0_completed");
  renderAll();
  setText("#dayZeroNote", "Decision confirmada. Ya tienes punto de partida.");
});

document.querySelectorAll("[data-state]").forEach((button) => {
  button.addEventListener("click", () => {
    const reflection = document.querySelector("#dailyReflection");
    const day = reflection?.dataset.day || String(getCurrentDay());
    state.days[day] = {
      state: button.dataset.state,
      reflection: reflection?.value || "",
      updatedAt: new Date().toISOString(),
    };
    if (day === "1") state.activation.day1 = true;
    state.lastActivity = `Dia ${day}: volviste al marco`;
    saveState();
    trackEvent("day_recorded", {
      day,
      state: button.dataset.state,
    });
    renderAll();
  });
});

document.querySelector("[data-day-map]")?.addEventListener("click", (event) => {
  const target = event.target.closest("[data-map-day]");
  if (!target) return;
  renderDaily(Number(target.dataset.mapDay));
  document.querySelector("#dia")?.scrollIntoView({ behavior: "smooth" });
});

document.querySelector("#weeklyReviewForm")?.addEventListener("submit", (event) => {
  event.preventDefault();
  state.reviews.push({
    ...Object.fromEntries(new FormData(event.currentTarget).entries()),
    createdAt: new Date().toISOString(),
  });
  state.lastActivity = `Revision semanal: volviste al marco`;
  saveState();
  trackEvent("weekly_review_saved");
  event.currentTarget.reset();
  renderAll();
  setText("#reviewNote", "Revision guardada. Sosten lo que funciono y vuelve al marco.");
});

document.querySelector(".reset-progress")?.addEventListener("click", () => {
  const confirmed = window.confirm("Esto reinicia tu progreso guardado en este navegador. Continuar?");
  if (!confirmed) return;
  state = { ...defaultState, activation: { ...defaultState.activation }, days: {}, reviews: [] };
  localStorage.removeItem(STORAGE_KEY);
  renderAll();
});

renderAll();
