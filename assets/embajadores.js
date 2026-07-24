(function () {
  const APPLICATIONS_KEY = "100dias_ambassador_applications_v1";
  const COMMISSION_RATE = 0.25;
  const plans = {
    alpha: { label: "Alpha", price: 9 },
    metodo: { label: "El Metodo", price: 29 },
    sistema: { label: "El Metodo + Sistema", price: 79 },
    premium: { label: "Premium", price: 297 },
  };

  const planSelect = document.querySelector("#commissionPlan");
  const salesInput = document.querySelector("#commissionSales");
  const applicationForm = document.querySelector("#ambassadorForm");
  const applicationNote = document.querySelector("[data-application-note]");

  function formatUsd(value) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(value);
  }

  function setText(selector, value) {
    const element = document.querySelector(selector);
    if (element) element.textContent = value;
  }

  function normalizedSales() {
    const raw = Number(salesInput?.value || 1);
    const value = Number.isFinite(raw) ? Math.round(raw) : 1;
    return Math.min(500, Math.max(1, value));
  }

  function updateCommission() {
    const plan = plans[planSelect?.value] || plans.sistema;
    const sales = normalizedSales();
    const gross = plan.price * sales;
    const commission = gross * COMMISSION_RATE;

    if (salesInput) salesInput.value = String(sales);
    setText("[data-gross-sales]", formatUsd(gross));
    setText("[data-creator-commission]", formatUsd(commission));
    setText("[data-brand-share]", formatUsd(gross - commission));
  }

  function readStoredApplications() {
    try {
      return JSON.parse(localStorage.getItem(APPLICATIONS_KEY) || "[]");
    } catch {
      return [];
    }
  }

  function creatorSlug(handle) {
    return String(handle || "")
      .trim()
      .toLowerCase()
      .replace(/^@/, "")
      .replace(/[^a-z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48);
  }

  async function sendApplication(payload) {
    const endpoint = window.SITE_CONFIG?.leadEndpoint;
    if (!endpoint) return { status: "local" };

    const googleScript = endpoint.includes("script.google");
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify(payload),
      mode: googleScript ? "no-cors" : "cors",
    });

    if (googleScript || response.type === "opaque") return { status: "sent" };
    if (!response.ok) throw new Error("No se pudo enviar la solicitud.");
    return { status: "sent" };
  }

  planSelect?.addEventListener("change", updateCommission);
  salesInput?.addEventListener("input", updateCommission);
  salesInput?.addEventListener("change", updateCommission);

  document.querySelectorAll("[data-sales-step]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!salesInput) return;
      const step = Number(button.dataset.salesStep || 0);
      salesInput.value = String(normalizedSales() + step);
      updateCommission();
    });
  });

  document.querySelectorAll("[data-ambassador-cta]").forEach((link) => {
    link.addEventListener("click", () => {
      window.AlphaOps?.trackEvent?.("ambassador_cta_click", {
        placement: link.dataset.ambassadorCta || "unknown",
      });
    });
  });

  applicationForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitButton = event.currentTarget.querySelector("button[type='submit']");
    const formData = Object.fromEntries(new FormData(event.currentTarget).entries());
    const slug = creatorSlug(formData.handle);
    const payload = {
      recordType: "ambassador_application",
      ...formData,
      experienceCommitment: Boolean(formData.experienceCommitment),
      disclosureCommitment: Boolean(formData.disclosureCommitment),
      termsAccepted: Boolean(formData.termsAccepted),
      suggestedAffiliateId: slug,
      suggestedLink: slug
        ? `https://ycastillog.github.io/100-dias-el-metodo/?ref=${encodeURIComponent(slug)}&utm_source=${encodeURIComponent(slug)}&utm_medium=affiliate&utm_campaign=embajadores_dia1`
        : "",
      commissionRate: COMMISSION_RATE,
      userKey: window.AlphaOps?.getUserKey?.() || "",
      attribution: window.AlphaOps?.getAttribution?.() || {},
      source: "embajadores_page",
      createdAt: new Date().toISOString(),
    };

    const stored = readStoredApplications();
    stored.push(payload);
    localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(stored.slice(-50)));

    window.AlphaOps?.trackEvent?.("ambassador_application_submit", {
      platform: payload.platform,
      audience_size: payload.audienceSize,
      affiliate_id: payload.suggestedAffiliateId,
    });

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Enviando...";
    }
    if (applicationNote) {
      applicationNote.className = "ambassador-form-note";
      applicationNote.textContent = "Guardando tu solicitud...";
    }

    try {
      const result = await sendApplication(payload);
      localStorage.setItem("100dias_last_ambassador_application_v1", JSON.stringify(payload));
      const status = result.status === "sent" ? "sent" : "local";
      window.location.href = `gracias-embajador.html?status=${status}`;
    } catch {
      if (applicationNote) {
        applicationNote.className = "ambassador-form-note error";
        applicationNote.textContent =
          "La solicitud quedo guardada en este navegador, pero el envio externo fallo. Intenta nuevamente cuando tengas conexion.";
      }
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "Reintentar envio";
      }
    }
  });

  updateCommission();
})();
