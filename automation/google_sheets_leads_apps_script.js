/**
 * Google Apps Script endpoint for 100 Dias leads.
 *
 * Setup:
 * 1. Create a Google Sheet with a tab named "Leads".
 * 2. Extensions -> Apps Script.
 * 3. Paste this file.
 * 4. Deploy -> New deployment -> Web app.
 * 5. Execute as: Me. Access: Anyone.
 * 6. Paste the web app URL into assets/site-config.js as leadEndpoint.
 */

const SHEET_NAME = "Leads";

function doPost(event) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) {
    return jsonResponse({ ok: false, error: `Missing sheet: ${SHEET_NAME}` }, 500);
  }

  const payload = JSON.parse(event.postData.contents || "{}");
  ensureHeaders(sheet);

  sheet.appendRow([
    new Date(),
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

  return jsonResponse({ ok: true });
}

function ensureHeaders(sheet) {
  if (sheet.getLastRow() > 0) return;
  sheet.appendRow([
    "received_at",
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

function jsonResponse(data, statusCode = 200) {
  return ContentService
    .createTextOutput(JSON.stringify({ statusCode, ...data }))
    .setMimeType(ContentService.MimeType.JSON);
}
