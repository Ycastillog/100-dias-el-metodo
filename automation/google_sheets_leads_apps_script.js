/**
 * Google Apps Script endpoint for 100 Dias Alpha leads and events.
 *
 * Setup:
 * 1. Create a Google Sheet.
 * 2. Extensions -> Apps Script.
 * 3. Paste this file.
 * 4. Deploy -> New deployment -> Web app.
 * 5. Execute as: Me. Access: Anyone.
 * 6. Paste the web app URL into assets/site-config.js as leadEndpoint.
 * 7. You may use the same URL as eventEndpoint.
 */

const LEADS_SHEET_NAME = "Leads";
const EVENTS_SHEET_NAME = "Events";

function doPost(event) {
  const payload = JSON.parse(event.postData.contents || "{}");
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

  if (payload.recordType === "event") {
    const eventsSheet = getOrCreateSheet(spreadsheet, EVENTS_SHEET_NAME);
    appendEvent(eventsSheet, payload);
    return jsonResponse({ ok: true, type: "event" });
  }

  const leadsSheet = getOrCreateSheet(spreadsheet, LEADS_SHEET_NAME);
  appendLead(leadsSheet, payload);
  return jsonResponse({ ok: true, type: "lead" });
}

function appendLead(sheet, payload) {
  ensureLeadHeaders(sheet);

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
    JSON.stringify(payload.attribution || {}),
  ]);
}

function appendEvent(sheet, payload) {
  ensureEventHeaders(sheet);

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
    JSON.stringify(payload.details || {}),
    JSON.stringify(payload.attribution || {}),
  ]);
}

function getOrCreateSheet(spreadsheet, name) {
  return spreadsheet.getSheetByName(name) || spreadsheet.insertSheet(name);
}

function ensureLeadHeaders(sheet) {
  if (sheet.getLastRow() > 0) return;
  sheet.appendRow([
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
    "attribution",
  ]);
}

function ensureEventHeaders(sheet) {
  if (sheet.getLastRow() > 0) return;
  sheet.appendRow([
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
    "details",
    "attribution",
  ]);
}

function jsonResponse(data, statusCode = 200) {
  return ContentService
    .createTextOutput(JSON.stringify({ statusCode, ...data }))
    .setMimeType(ContentService.MimeType.JSON);
}
