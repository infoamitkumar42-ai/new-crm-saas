/**
 * LeadFlow CRM — Google Apps Script
 * Snapchat Lead Sheet → Cloudflare Worker → Supabase
 *
 * SETUP INSTRUCTIONS:
 *  1. Open Google Sheet with Snapchat leads.
 *  2. Extensions → Apps Script → paste this entire file → Save.
 *  3. Fill in WORKER_URL and WEBHOOK_SECRET below.
 *  4. Run createTimeTrigger() ONCE (manually) to set up 1-minute auto-polling.
 *  5. Done. Script runs every minute automatically.
 *
 * The script adds a "Synced" column automatically if it doesn't exist.
 * Rows are marked Synced=TRUE only after successful processing.
 * Errors (network failures) are left unsynced — auto-retried next minute.
 */

// ─────────────────────────────────────────────────────────────
//  CONFIGURE THESE TWO VALUES BEFORE RUNNING
// ─────────────────────────────────────────────────────────────
var WORKER_URL     = 'https://leadflow-snapchat-webhook.YOUR_ACCOUNT.workers.dev';
var WEBHOOK_SECRET = 'MfG48Z4YD1qQHeyUEcfAbs7bM8pqyP79PL7G5UUJ'; // same as Cloudflare Secret

// Name of the sheet tab (default: first sheet)
// Change only if your Snapchat leads are on a differently named tab.
var SHEET_NAME = ''; // leave blank = use first sheet

// Columns the script reads from Snapchat sheet (exact header names)
var COL_FORM_ID    = 'formId';
var COL_FORM_NAME  = 'formName';
var COL_FULL_NAME  = 'fullName';
var COL_PHONE      = 'phoneNumber';
var COL_CITY       = 'customField1';
var COL_SYNCED     = 'Synced';  // added by script if missing
// ─────────────────────────────────────────────────────────────

function syncSnapchatLeads() {
  // ── Lock: prevent two runs overlapping ──────────────────────
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) {
    Logger.log('Another run is still active — skipping this cycle.');
    return;
  }

  try {
    // ── Get sheet ────────────────────────────────────────────────
    var ss    = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = SHEET_NAME
      ? ss.getSheetByName(SHEET_NAME)
      : ss.getSheets()[0];

    if (!sheet) {
      Logger.log('ERROR: Sheet not found. Check SHEET_NAME setting.');
      return;
    }

    var lastRow = sheet.getLastRow();
    if (lastRow < 2) {
      Logger.log('No data rows found.');
      return;
    }

    // ── Read all data in one call (efficient) ────────────────────
    var allData = sheet.getDataRange().getValues();
    var headers = allData[0];

    // Build header → column-index map (0-based)
    var col = {};
    for (var h = 0; h < headers.length; h++) {
      col[headers[h]] = h;
    }

    // Validate required columns exist
    var required = [COL_FORM_ID, COL_FORM_NAME, COL_FULL_NAME, COL_PHONE, COL_CITY];
    for (var r = 0; r < required.length; r++) {
      if (col[required[r]] === undefined) {
        Logger.log('ERROR: Required column "' + required[r] + '" not found in sheet headers.');
        Logger.log('Headers found: ' + JSON.stringify(headers));
        return;
      }
    }

    // Ensure Synced column exists — add it if missing
    var syncedColIdx = col[COL_SYNCED];
    if (syncedColIdx === undefined) {
      syncedColIdx = headers.length; // append after last column
      sheet.getRange(1, syncedColIdx + 1).setValue(COL_SYNCED);
      Logger.log('"Synced" column added at column ' + (syncedColIdx + 1));
    }

    // ── Collect unsynced rows ─────────────────────────────────────
    var unsynced = [];
    for (var i = 1; i < allData.length; i++) {
      var row    = allData[i];
      var synced = row[syncedColIdx];

      // Skip if already marked synced
      if (synced === true || synced === 'TRUE' || synced === 'Synced') continue;

      // Skip completely empty rows (no phone and no name)
      if (!row[col[COL_PHONE]] && !row[col[COL_FULL_NAME]]) continue;

      unsynced.push({
        sheetRow: i + 1, // 1-based row number for sheet.getRange()
        lead: {
          formId:      String(row[col[COL_FORM_ID]]   || '').trim(),
          formName:    String(row[col[COL_FORM_NAME]]  || '').trim(),
          fullName:    String(row[col[COL_FULL_NAME]]  || '').trim(),
          phoneNumber: String(row[col[COL_PHONE]]      || '').trim(),
          customField1: String(row[col[COL_CITY]]      || '').trim(),
        }
      });
    }

    if (unsynced.length === 0) {
      Logger.log('All rows already synced.');
      return;
    }

    Logger.log('Sending ' + unsynced.length + ' unsynced row(s) to Worker...');

    // ── POST to Cloudflare Worker ─────────────────────────────────
    var payload = unsynced.map(function(r) { return r.lead; });

    var fetchOptions = {
      method:           'post',
      contentType:      'application/json',
      headers:          { 'X-Webhook-Secret': WEBHOOK_SECRET },
      payload:          JSON.stringify(payload),
      muteHttpExceptions: true, // don't throw on 4xx/5xx — we handle it below
    };

    var response   = UrlFetchApp.fetch(WORKER_URL, fetchOptions);
    var statusCode = response.getResponseCode();

    if (statusCode !== 200) {
      // Network/auth error — do NOT mark rows synced, retry next minute
      Logger.log('Worker returned HTTP ' + statusCode + ' — rows left unsynced for retry.');
      Logger.log('Response: ' + response.getContentText().slice(0, 500));
      return;
    }

    // ── Parse per-lead results and mark rows ─────────────────────
    var respText = response.getContentText();
    var respJson;
    try {
      respJson = JSON.parse(respText);
    } catch (e) {
      Logger.log('ERROR: Could not parse Worker response: ' + respText.slice(0, 200));
      return;
    }

    var results = respJson.results || [];
    Logger.log('Worker response: processed=' + respJson.processed);

    for (var j = 0; j < unsynced.length; j++) {
      var rowNum    = unsynced[j].sheetRow;
      var leadResult = results[j];
      var status    = leadResult ? leadResult.status : 'Unknown';

      Logger.log('Row ' + rowNum + ' | phone=' + unsynced[j].lead.phoneNumber + ' | status=' + status);

      // Mark Synced for all terminal states.
      // 'Error' = temporary failure → leave unsynced so next run retries.
      if (status !== 'Error') {
        sheet.getRange(rowNum, syncedColIdx + 1).setValue(true);
      }
    }

    Logger.log('Done.');

  } finally {
    lock.releaseLock();
  }
}

/**
 * Run this function ONCE manually to create the 1-minute auto-trigger.
 * After running, check Edit → Triggers to confirm it appears.
 * Do NOT run it again — it deletes existing triggers first to avoid duplicates.
 */
function createTimeTrigger() {
  // Remove any existing triggers for this script to avoid duplicates
  var existing = ScriptApp.getProjectTriggers();
  for (var i = 0; i < existing.length; i++) {
    ScriptApp.deleteTrigger(existing[i]);
  }

  ScriptApp.newTrigger('syncSnapchatLeads')
    .timeBased()
    .everyMinutes(1)
    .create();

  Logger.log('SUCCESS: 1-minute trigger created for syncSnapchatLeads.');
  Logger.log('Check Extensions → Apps Script → Triggers to confirm.');
}
