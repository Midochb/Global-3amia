/**
 * Zeedna 3amiat — Apps Script endpoint for contributions
 *
 * Features:
 * 1) Saves transliteration (field name: transliteration)
 * 2) Generates a submission_id (UUID) returned to the website
 * 3) Writes a LOG row for every request (success or error)
 * 4) Returns an HTML receipt that postMessage() to the parent page
 *
 * How to deploy:
 * - Apps Script → Deploy → New deployment → Web app
 * - Execute as: Me
 * - Who has access: Anyone
 */

// ====== CONFIG ======
const SPREADSHEET_ID = "PUT_YOUR_SPREADSHEET_ID_HERE";
const SHEET_CONTRIB = "CONTRIBUTIONS";
const SHEET_LOG = "CONTRIBUTIONS_LOG";

// Expected headers in CONTRIBUTIONS (do NOT modify the sheet; we only map values to these headers)
const CONTRIBUTIONS_HEADERS = [
  "contribution_id",
  "mot_arabe",
  "transliteration",
  "sens_fr",
  "categorie_grammaticale",
  "nombre",
  "mot_lie",
  "pays_code",
  "region",
  "exemple_usage",
  "origine_mot",
  "registre",
  "statut_validation",
  "date_contribution",
  "user_id",
  "cle_doublon",
  "doublon?"
];

// Log sheet headers we can ensure exist (safe to append if missing)
const LOG_HEADERS = [
  "received_at",
  "submission_id",
  "status",
  "error",
  "mot_arabe",
  "transliteration",
  "user_id",
  "sens_fr",
  "pays_code",
  "region",
  "source_url",
  "user_agent"
];

function doGet(e) {
  // Simple health check + optional status lookup
  const action = (e && e.parameter && e.parameter.action) ? String(e.parameter.action) : "";

  if (action === "ping") {
    return json_({ ok: true, now: new Date().toISOString() });
  }

  if (action === "status") {
    const id = (e && e.parameter && e.parameter.id) ? String(e.parameter.id) : "";
    if (!id) return json_({ ok: false, error: "Missing id" });

    try {
      const sh = getSheet_(SHEET_LOG);
      const headers = ensureLogHeaders_(sh);
      const idCol = headers.indexOf("submission_id") + 1;
      if (idCol <= 0) return json_({ ok: false, error: "submission_id column not found in log" });

      const lastRow = sh.getLastRow();
      if (lastRow < 2) return json_({ ok: true, found: false });

      const values = sh.getRange(2, idCol, lastRow - 1, 1).getValues();
      const idx = values.findIndex(r => String(r[0]) === id);
      return json_({ ok: true, found: idx >= 0, row: idx >= 0 ? (idx + 2) : null });
    } catch (err) {
      return json_({ ok: false, error: String(err && err.message ? err.message : err) });
    }
  }

  // Default: show minimal info
  return HtmlService.createHtmlOutput(
    "<div style='font-family:system-ui;padding:16px'>Zeedna 3amiat endpoint is running. Use ?action=ping</div>"
  );
}

function doPost(e) {
  const submissionId = Utilities.getUuid();
  const receivedAt = new Date();

  let status = "error";
  let errorMsg = "";

  // We will log the raw payload (limited) for traceability
  let payload = {};

  try {
    const p = (e && e.parameter) ? e.parameter : {};

    // Honeypot anti-bot
    if (p.website && String(p.website).trim() !== "") {
      status = "blocked";
      errorMsg = "Honeypot triggered";
      log_(receivedAt, submissionId, status, errorMsg, p);
      return receiptHtml_({ ok: false, id: submissionId, error: "Blocked" });
    }

    payload = {
      mot_arabe: safe_(p.mot_arabe),
      transliteration: safe_(p.transliteration),
      user_id: safe_(p.user_id),
      sens_fr: safe_(p.sens_fr),
      exemple_usage: safe_(p.exemple_usage),
      pays_code: safe_(p.pays_code),
      region: safe_(p.region),
      source_url: safe_(p.source_url)
    };

    const userAgent = getUserAgent_(e);

    // Basic validation
    if (!payload.mot_arabe) {
      status = "invalid";
      errorMsg = "mot_arabe is required";
      log_(receivedAt, submissionId, status, errorMsg, payload, userAgent);
      return receiptHtml_({ ok: false, id: submissionId, error: errorMsg });
    }

    const sh = getSheet_(SHEET_CONTRIB);
    const headers = getHeaders_(sh);

    // User said they have formulas in these columns, so we NEVER write into them.
    // (Keeping them blank lets ARRAYFORMULA / formulas compute automatically.)
    const FORMULA_HEADERS = new Set([
      "contribution_id", // col A
      "origine_mot",     // col K
      "registre",        // col L
      "statut_validation", // col M
      "cle_doublon",     // col P
      "doublon?"         // col Q
    ]);

    // Build row according to the existing header order in your CONTRIBUTIONS sheet
    const row = headers.map(h => {
      if (FORMULA_HEADERS.has(h)) return "";

      switch (h) {
        case "mot_arabe": return payload.mot_arabe;
        case "transliteration": return payload.transliteration;
        case "sens_fr": return payload.sens_fr;
        case "categorie_grammaticale": return safe_(p.categorie_grammaticale);
        case "nombre": return safe_(p.nombre);
        case "mot_lie": return safe_(p.mot_lie);
        case "pays_code": return payload.pays_code;
        case "region": return payload.region;
        case "exemple_usage": return payload.exemple_usage;
        case "date_contribution": return receivedAt;
        case "user_id": return payload.user_id;
        default:
          // Anything else: leave blank (or you can map more fields later)
          return "";
      }
    });

    // Write the full row (including blank formula cols). We still avoid column A,
    // because it's formula-driven, and Apps Script can overwrite formulas.
    const targetRow = sh.getLastRow() + 1;
    if (headers.length <= 1) {
      sh.appendRow(row);
    } else {
      const valuesFromB = row.slice(1); // columns B..end
      sh.getRange(targetRow, 2, 1, valuesFromB.length).setValues([valuesFromB]);
    }

    status = "ok";
    log_(receivedAt, submissionId, status, "", payload, userAgent);

    return receiptHtml_({ ok: true, id: submissionId, received_at: receivedAt.toISOString() });
  } catch (err) {
    errorMsg = String(err && err.message ? err.message : err);
    try { log_(receivedAt, submissionId, status, errorMsg, payload); } catch (_) {}
    return receiptHtml_({ ok: false, id: submissionId, error: errorMsg });
  }
}

// ====== HELPERS ======

function getSheet_(name) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  return sh;
}

// Read headers from row 1 WITHOUT modifying the sheet.
function getHeaders_(sh) {
  const lastCol = Math.max(sh.getLastColumn(), 1);
  const firstRow = sh.getRange(1, 1, 1, lastCol).getValues()[0];
  return firstRow.map(v => String(v || "").trim());
}

// Ensure LOG sheet has headers (safe to modify LOG only)
function ensureLogHeaders_(sh) {
  const lastCol = Math.max(sh.getLastColumn(), 1);
  const firstRow = sh.getRange(1, 1, 1, lastCol).getValues()[0];
  const isEmpty = firstRow.every(v => String(v || "").trim() === "");
  let headers = isEmpty ? [] : firstRow.map(v => String(v || "").trim());

  let changed = false;
  for (const h of LOG_HEADERS) {
    if (headers.indexOf(h) === -1) {
      headers.push(h);
      changed = true;
    }
  }

  if (isEmpty || changed) {
    sh.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
  return headers;
}

function log_(receivedAt, submissionId, status, errorMsg, payload, userAgent) {
  const sh = getSheet_(SHEET_LOG);
  const headers = ensureLogHeaders_(sh);
  const safePayload = payload ? JSON.stringify(payload).slice(0, 50000) : "";

  const row = headers.map(h => {
    switch (h) {
      case "received_at": return receivedAt;
      case "submission_id": return submissionId;
      case "status": return status;
      case "error": return errorMsg || "";
      case "payload_json": return safePayload;
      case "user_agent": return userAgent || "";
      default: return "";
    }
  });

  sh.appendRow(row);
}

function receiptHtml_(obj) {
  // This runs inside the hidden iframe, but can postMessage to the parent page.
  const msg = JSON.stringify(obj);
  const html = `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:system-ui;padding:14px">
<script>
  try {
    window.parent.postMessage(${msg}, "*");
  } catch (e) {}
</script>
<div>${obj.ok ? "✅ Saved" : "❌ Error"}</div>
<div style="margin-top:6px;font-size:12px;opacity:.75">ID: ${obj.id || ""}</div>
</body></html>`;

  return HtmlService.createHtmlOutput(html);
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function safe_(v) {
  return String(v === undefined || v === null ? "" : v).trim();
}

function getUserAgent_(e) {
  try {
    // Apps Script doesn't always expose UA; we accept from param if sent.
    const p = (e && e.parameter) ? e.parameter : {};
    return safe_(p.user_agent);
  } catch (_) {
    return "";
  }
}
