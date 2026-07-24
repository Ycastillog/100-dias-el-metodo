/**
 * Google Apps Script endpoint for 100 Dias leads, events and ambassador applications.
 *
 * Setup:
 * 1. Create a Google Sheet.
 * 2. Extensions -> Apps Script.
 * 3. Paste this file.
 * 4. Deploy -> New deployment -> Web app.
 * 5. Execute as: Me. Access: Anyone.
 * 6. Paste the web app URL into assets/site-config.js as leadEndpoint.
 * 7. Use the same URL as eventEndpoint.
 *
 * This endpoint records marketing attribution. It does not confirm payments.
 * Stripe or PayPal payment confirmation must come from a verified webhook or
 * manual reconciliation against the provider dashboard.
 */

const LEADS_SHEET_NAME = "Leads";
const EVENTS_SHEET_NAME = "Events";
const AMBASSADOR_APPLICATIONS_SHEET_NAME = "Ambassador Applications";

const LEAD_HEADERS = [
  "received_at",
  "created_at",
  "user_key",
  "name",
  "email",
  "whatsapp",
  "goal",
  "plan_key",
  "plan_label",
  "plan_price",
  "source",
  "affiliate_id",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "attribution",
];

const EVENT_HEADERS = [
  "received_at",
  "created_at",
  "event_id",
  "event_name",
  "user_key",
  "session_id",
  "page_type",
  "path",
  "url",
  "referrer",
  "affiliate_id",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "details",
  "attribution",
];

const AMBASSADOR_HEADERS = [
  "received_at",
  "created_at",
  "user_key",
  "name",
  "email",
  "whatsapp",
  "handle",
  "suggested_affiliate_id",
  "platform",
  "audience_size",
  "decision",
  "fit",
  "experience_commitment",
  "disclosure_commitment",
  "terms_accepted",
  "commission_rate",
  "suggested_link",
  "source",
  "attribution",
  "status",
  "notes",
];

function doPost(event) {
  const lock = LockService.getScriptLock();

  try {
    lock.waitLock(10000);
    const payload = JSON.parse(event.postData.contents || "{}");
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

    if (payload.recordType === "event") {
      const sheet = getOrCreateSheet(spreadsheet, EVENTS_SHEET_NAME);
      ensureHeaders(sheet, EVENT_HEADERS);
      appendEvent(sheet, payload);
      return jsonResponse({ ok: true, type: "event" });
    }

    if (payload.recordType === "ambassador_application") {
      const sheet = getOrCreateSheet(spreadsheet, AMBASSADOR_APPLICATIONS_SHEET_NAME);
      ensureHeaders(sheet, AMBASSADOR_HEADERS);
      appendAmbassadorApplication(sheet, payload);
      return jsonResponse({ ok: true, type: "ambassador_application" });
    }

    const sheet = getOrCreateSheet(spreadsheet, LEADS_SHEET_NAME);
    ensureHeaders(sheet, LEAD_HEADERS);
    appendLead(sheet, payload);
    return jsonResponse({ ok: true, type: "lead" });
  } catch (error) {
    return jsonResponse({
      ok: false,
      error: String(error && error.message ? error.message : error),
    });
  } finally {
    if (lock.hasLock()) lock.releaseLock();
  }
}

function appendLead(sheet, payload) {
  const attribution = payload.attribution || {};
  sheet.appendRow([
    new Date(),
    payload.createdAt || "",
    payload.userKey || "",
    payload.name || "",
    payload.email || "",
    payload.whatsapp || "",
    payload.goal || "",
    payload.planKey || "",
    payload.planLabel || "",
    payload.planPrice || "",
    payload.source || "",
    getAffiliateId(attribution),
    attribution.utm_source || "",
    attribution.utm_medium || "",
    attribution.utm_campaign || "",
    attribution.utm_content || "",
    JSON.stringify(attribution),
  ]);
}

function appendEvent(sheet, payload) {
  const attribution = payload.attribution || {};
  sheet.appendRow([
    new Date(),
    payload.createdAt || "",
    payload.eventId || "",
    payload.eventName || "",
    payload.userKey || "",
    payload.sessionId || "",
    payload.pageType || "",
    payload.path || "",
    payload.url || "",
    payload.referrer || "",
    getAffiliateId(attribution),
    attribution.utm_source || "",
    attribution.utm_medium || "",
    attribution.utm_campaign || "",
    JSON.stringify(payload.details || {}),
    JSON.stringify(attribution),
  ]);
}

function appendAmbassadorApplication(sheet, payload) {
  sheet.appendRow([
    new Date(),
    payload.createdAt || "",
    payload.userKey || "",
    payload.name || "",
    payload.email || "",
    payload.whatsapp || "",
    payload.handle || "",
    payload.suggestedAffiliateId || "",
    payload.platform || "",
    payload.audienceSize || "",
    payload.decision || "",
    payload.fit || "",
    Boolean(payload.experienceCommitment),
    Boolean(payload.disclosureCommitment),
    Boolean(payload.termsAccepted),
    payload.commissionRate || 0.25,
    payload.suggestedLink || "",
    payload.source || "",
    JSON.stringify(payload.attribution || {}),
    "Nueva",
    "",
  ]);
}

function getAffiliateId(attribution) {
  return (
    attribution.affiliate_code ||
    attribution.coupon ||
    attribution.ref ||
    attribution.affiliate ||
    attribution.creator ||
    ""
  );
}

function getOrCreateSheet(spreadsheet, name) {
  return spreadsheet.getSheetByName(name) || spreadsheet.insertSheet(name);
}

function ensureHeaders(sheet, headers) {
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.setFrozenRows(1);
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
