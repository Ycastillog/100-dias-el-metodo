(function () {
  const EVENT_KEY = "100dias_events_v1";
  const USER_KEY = "100dias_user_key_v1";
  const ATTRIBUTION_KEY = "100dias_attribution_v1";
  const ACCESS_KEY = "100dias_access_requested";
  const SESSION_KEY = "100dias_session_id_v1";
  const DAY_MS = 24 * 60 * 60 * 1000;
  const CAMPAIGN_WINDOW_MS = 30 * DAY_MS;
  const AFFILIATE_WINDOW_MS = 60 * DAY_MS;

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
  const affiliateKeys = ["ref", "affiliate", "affiliate_code", "creator", "coupon"];

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
    const allKeys = [...utmKeys, ...affiliateKeys];
    return Object.fromEntries(
      allKeys
        .map((key) => [key, normalizedAttributionValue(key, params.get(key) || "")])
        .filter(([, value]) => value)
    );
  }

  function normalizedAttributionValue(key, value) {
    const trimmed = String(value || "").trim().slice(0, 150);
    if (!affiliateKeys.includes(key)) return trimmed;
    return trimmed
      .toLowerCase()
      .replace(/^@/, "")
      .replace(/[^a-z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 64);
  }

  function getAttribution() {
    const now = Date.now();
    const storedRaw = safeJsonRead(ATTRIBUTION_KEY, {});
    const current = getCurrentAttribution();
    const legacyRecord = storedRaw.campaign || storedRaw.affiliate ? {} : storedRaw;
    const storedCampaign =
      storedRaw.campaignExpiresAt > now ? storedRaw.campaign || {} : legacyRecord;
    const storedAffiliate =
      storedRaw.affiliateExpiresAt > now ? storedRaw.affiliate || {} : {};
    const currentCampaign = Object.fromEntries(
      utmKeys.map((key) => [key, current[key]]).filter(([, value]) => value)
    );
    const currentAffiliate = Object.fromEntries(
      affiliateKeys.map((key) => [key, current[key]]).filter(([, value]) => value)
    );

    const hasExplicitCode = Boolean(currentAffiliate.affiliate_code || currentAffiliate.coupon);
    const storedHasExplicitCode = Boolean(storedAffiliate.affiliate_code || storedAffiliate.coupon);
    const shouldReplaceAffiliate =
      hasExplicitCode || (Object.keys(currentAffiliate).length > 0 && !storedHasExplicitCode);

    const campaign = Object.keys(currentCampaign).length ? currentCampaign : storedCampaign;
    const affiliate = shouldReplaceAffiliate ? currentAffiliate : storedAffiliate;
    const campaignExpiresAt = Object.keys(currentCampaign).length
      ? now + CAMPAIGN_WINDOW_MS
      : storedRaw.campaignExpiresAt || now + CAMPAIGN_WINDOW_MS;
    const affiliateExpiresAt = shouldReplaceAffiliate
      ? now + AFFILIATE_WINDOW_MS
      : storedRaw.affiliateExpiresAt || 0;

    if (
      Object.keys(currentCampaign).length ||
      Object.keys(currentAffiliate).length ||
      Object.keys(legacyRecord).length
    ) {
      localStorage.setItem(
        ATTRIBUTION_KEY,
        JSON.stringify({
          campaign,
          campaignExpiresAt,
          affiliate,
          affiliateExpiresAt,
        })
      );
    }

    return {
      ...campaign,
      ...affiliate,
      ...(Object.keys(affiliate).length
        ? {
            affiliate_expires_at: new Date(affiliateExpiresAt).toISOString(),
          }
        : {}),
    };
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
      const affiliateId =
        attribution.affiliate_code ||
        attribution.coupon ||
        attribution.ref ||
        attribution.affiliate ||
        attribution.creator ||
        "";
      const campaignParams = Object.fromEntries(
        utmKeys
          .filter((key) => !["fbclid", "gclid"].includes(key))
          .map((key) => [key, attribution[key]])
          .filter(([, value]) => value)
      );

      if (affiliateId) {
        campaignParams.utm_source = campaignParams.utm_source || affiliateId;
        campaignParams.utm_medium = campaignParams.utm_medium || "affiliate";
        campaignParams.utm_campaign = campaignParams.utm_campaign || "embajadores_dia1";
        campaignParams.utm_content = campaignParams.utm_content || affiliateId;
      }

      let trackingParams = {
        user_key: getUserKey(),
        ...attribution,
        ...params,
      };

      if (parsed.hostname === "buy.stripe.com") {
        trackingParams = {
          client_reference_id: getUserKey().replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 200),
          ...campaignParams,
        };
      } else if (parsed.hostname.endsWith("paypal.com")) {
        trackingParams = campaignParams;
      }

      Object.entries(trackingParams).forEach(([key, value]) => {
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
