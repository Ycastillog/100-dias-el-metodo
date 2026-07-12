(function () {
  const EVENT_KEY = "100dias_events_v1";
  const USER_KEY = "100dias_user_key_v1";
  const ATTRIBUTION_KEY = "100dias_attribution_v1";
  const ACCESS_KEY = "100dias_access_requested";
  const SESSION_KEY = "100dias_session_id_v1";

  const config = window.SITE_CONFIG || {};
  const utmKeys = [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_content",
    "utm_term",
    "fbclid",
    "gclid",
  ];

  function safeJsonRead(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
    } catch {
      return fallback;
    }
  }

  function randomId(prefix) {
    const value = window.crypto?.randomUUID
      ? window.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    return `${prefix}_${value}`;
  }

  function getQuery() {
    return new URLSearchParams(window.location.search);
  }

  function getUserKey() {
    const params = getQuery();
    const fromUrl = params.get("user_key") || params.get("uid") || params.get("client_reference_id");
    if (fromUrl) {
      localStorage.setItem(USER_KEY, fromUrl);
      return fromUrl;
    }

    const stored = localStorage.getItem(USER_KEY);
    if (stored) return stored;

    const created = randomId("u");
    localStorage.setItem(USER_KEY, created);
    return created;
  }

  function getSessionId() {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored) return stored;
    const created = randomId("s");
    sessionStorage.setItem(SESSION_KEY, created);
    return created;
  }

  function getCurrentAttribution() {
    const params = getQuery();
    return Object.fromEntries(
      utmKeys
        .map((key) => [key, params.get(key) || ""])
        .filter(([, value]) => value)
    );
  }

  function getAttribution() {
    const stored = safeJsonRead(ATTRIBUTION_KEY, {});
    const current = getCurrentAttribution();
    const merged = { ...stored, ...current };
    if (Object.keys(current).length) {
      localStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(merged));
    }
    return merged;
  }

  function readEvents() {
    return safeJsonRead(EVENT_KEY, []);
  }

  function getPageType() {
    const file = window.location.pathname.split("/").pop() || "index.html";
    if (file === "acceso.html") return "access";
    if (file === "gracias.html") return "thank_you";
    if (file === "index.html" || file === "") return "landing";
    return file.replace(".html", "");
  }

  function configuredEventEndpoint() {
    return config.eventEndpoint || config.leadEndpoint || "";
  }

  function sendEvent(record) {
    const endpoint = configuredEventEndpoint();
    if (!endpoint) return;

    const payload = JSON.stringify({
      recordType: "event",
      ...record,
    });

    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: "application/json" });
      navigator.sendBeacon(endpoint, blob);
      return;
    }

    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: payload,
      keepalive: true,
      mode: endpoint.includes("script.google") ? "no-cors" : "cors",
    }).catch(() => {});
  }

  function ensureGa4() {
    const id = config.gaMeasurementId;
    if (!id || window.__100diasGaLoaded) return;

    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () {
      window.dataLayer.push(arguments);
    };
    window.gtag("js", new Date());
    window.gtag("config", id, {
      send_page_view: false,
      user_id: getUserKey(),
    });

    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
    document.head.appendChild(script);
    window.__100diasGaLoaded = true;
  }

  function trackEvent(name, details = {}) {
    ensureGa4();
    const record = {
      eventId: randomId("evt"),
      eventName: name,
      details,
      userKey: getUserKey(),
      sessionId: getSessionId(),
      pageType: getPageType(),
      path: window.location.pathname,
      url: window.location.href,
      referrer: document.referrer || "",
      attribution: getAttribution(),
      createdAt: new Date().toISOString(),
    };

    const events = readEvents();
    events.push(record);
    localStorage.setItem(EVENT_KEY, JSON.stringify(events.slice(-300)));

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: name, ...details, user_key: record.userKey });

    if (window.gtag) {
      window.gtag("event", name, {
        ...details,
        user_key: record.userKey,
        page_type: record.pageType,
      });
    }

    sendEvent(record);

    if (config.analyticsDebug) {
      console.info("[100dias:event]", record);
    }

    return record;
  }

  function markAccessGranted(reason = "manual") {
    localStorage.setItem(ACCESS_KEY, "true");
    localStorage.setItem("100dias_access_reason_v1", reason);
  }

  function hasAccess() {
    const params = getQuery();
    const paramName = config.alphaAccessParam || "alpha";
    const paramValue = config.alphaAccessValue || "1";
    const hasToken =
      params.get(paramName) === paramValue ||
      params.get("access") === "alpha" ||
      params.get("payment") === "success" ||
      params.get("paid") === "1";

    if (hasToken) {
      markAccessGranted("access_link");
      return true;
    }

    return localStorage.getItem(ACCESS_KEY) === "true";
  }

  function appendTrackingToUrl(url, params = {}) {
    if (!url) return "";
    try {
      const parsed = new URL(url, window.location.href);
      const attribution = getAttribution();
      Object.entries({
        user_key: getUserKey(),
        ...attribution,
        ...params,
      }).forEach(([key, value]) => {
        if (value && !parsed.searchParams.has(key)) {
          parsed.searchParams.set(key, value);
        }
      });
      return parsed.toString();
    } catch {
      return url;
    }
  }

  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback, { once: true });
    } else {
      callback();
    }
  }

  window.AlphaOps = {
    appendTrackingToUrl,
    getAttribution,
    getUserKey,
    hasAccess,
    markAccessGranted,
    trackEvent,
  };

  ready(() => {
    const pageType = getPageType();
    if (pageType === "thank_you") {
      markAccessGranted("thank_you_page");
    }
    trackEvent("page_view", { page_type: pageType });
  });
})();
