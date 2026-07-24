(function () {
  const status = new URLSearchParams(window.location.search).get("status") || "local";
  const statusText = document.querySelector("[data-application-status]");
  const kicker = document.querySelector("[data-application-kicker]");
  const summary = document.querySelector("[data-application-summary]");

  let application = {};
  try {
    application = JSON.parse(localStorage.getItem("100dias_last_ambassador_application_v1") || "{}");
  } catch {
    application = {};
  }

  if (status === "sent") {
    if (kicker) kicker.textContent = "Solicitud enviada";
    if (statusText) {
      statusText.textContent =
        "Tu informacion llego al equipo. Revisaremos encaje, credibilidad y disposicion para vivir el Metodo.";
    }
  } else {
    if (kicker) kicker.textContent = "Solicitud guardada";
    if (statusText) {
      statusText.textContent =
        "Tu informacion quedo guardada en este dispositivo. El canal externo de solicitudes aun debe conectarse antes del lanzamiento publico.";
    }
  }

  if (summary && application.handle) {
    summary.hidden = false;
    const handle = application.handle.startsWith("@") ? application.handle : `@${application.handle}`;
    const handleTarget = summary.querySelector("[data-summary-handle]");
    const platformTarget = summary.querySelector("[data-summary-platform]");
    const stateTarget = summary.querySelector("[data-summary-status]");
    if (handleTarget) handleTarget.textContent = handle;
    if (platformTarget) platformTarget.textContent = application.platform || "-";
    if (stateTarget) stateTarget.textContent = status === "sent" ? "En revision" : "Pendiente de envio";
  }

  window.AlphaOps?.trackEvent?.("ambassador_thank_you_view", {
    submission_status: status,
    affiliate_id: application.suggestedAffiliateId || "",
  });
})();
