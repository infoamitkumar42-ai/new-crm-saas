/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  LeadFlow — Google Sheet → CRM bridge
 *  SHEET: "new kirti sheet ads"   ·   TEAM: UNITEDECOSYSTEM (Kirti giri)
 *  v1 · 2026-08-19
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  SETUP (ek hi baar karna hai)
 *  ────────────────────────────
 *   1. "new kirti sheet ads" spreadsheet kholo
 *   2. Extensions → Apps Script
 *   3. Jo bhi purana code ho use hata do, ye poori file paste karo, Save karo
 *   4. Left sidebar → ⏰ Triggers → "+ Add Trigger":
 *          Function            : checkNewLeads
 *          Event source        : Time-driven
 *          Type                : Minutes timer
 *          Interval            : Every 10 minutes
 *      → Save (Google permission maangega, allow kar dena)
 *   5. Ek baar `checkNewLeads` khud chala ke Execution log dekh lo
 *
 *  ⚠️ SIRF EK TRIGGER banana. Do trigger = ek hi lead do baar ja sakti hai.
 *
 *  ⚠️ YE SCRIPT SIRF IS SHEET KE LIYE HAI. Simarjit waali purani sheet ka
 *     apna alag script hai (`sheet-to-crm-bridge.v7.gs`) aur uska SHARED_SECRET
 *     alag hai. Dono ko aapas mein mat badalna — secret hi decide karta hai ki
 *     lead kis team ko jaayegi.
 *
 *  YE KAISE KAAM KARTA HAI
 *  ───────────────────────
 *   • Sheet ke HAR tab ko padhta hai (Meta har form ke liye naya tab banata
 *     hai, to naya form aane par yahan kuch badalna nahi padta)
 *   • Column position par nahi, HEADER KE NAAM par chalta hai — Meta column
 *     order badal de to bhi nahi tootega
 *   • Har tab ka apna pointer rakhta hai (kaunsi row tak bhej chuke hain)
 *   • Pointer sirf HTTP 200 par aage badhta hai — CRM down ho to lead agli
 *     run mein dobara jaayegi, chupchaap gum nahi hogi
 *   • MAX_PER_RUN se Apps Script ka 6-minute timeout nahi lagta
 *   • LockService se do run kabhi overlap nahi karte
 *
 *  ⚠️ SKIP_TABS KHAALI HAI — JAAN-BOOJH KAR
 *     Purani (Simarjit) sheet mein "Sheet1" ek dead legacy tab tha, isliye
 *     wahan use skip kiya jaata hai. IS sheet mein Meta ne live leads "Sheet1"
 *     mein hi likhi hain. Yahan 'Sheet1' skip kar diya to EK BHI LEAD NAHI
 *     AAYEGI. Isliye ye list khaali hai — koi purana script copy karke yahan
 *     'Sheet1' mat daal dena.
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ── CONFIG ─────────────────────────────────────────────────────────────────

var WEBHOOK_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co/functions/v1/sheet-lead-intake';

/** Is sheet ka apna intake secret. CRM isse pehchanta hai ki leads
 *  UNITEDECOSYSTEM (Kirti giri ki team) ki hain. Kisi aur sheet mein
 *  ye secret mat daalna. */
var SHARED_SECRET = 'zeeT4qriZiHfKAmLeox-IN8oZvvyXLGWR2fPMtVZDOI';

/** Koi tab skip nahi karna — upar wala note padho. */
var SKIP_TABS = [];

/** Ek run mein zyada se zyada itni leads (6-min timeout se bachne ke liye). */
var MAX_PER_RUN = 60;


// ═══════════════════════════════════════════════════════════════════════════
// MAIN — trigger isi function ko chalati hai
// ═══════════════════════════════════════════════════════════════════════════

function checkNewLeads() {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
  } catch (e) {
    Logger.log('Dusra run already chal raha hai, skip.');
    return 0;
  }

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) {
      Logger.log('❌ Spreadsheet nahi mila. Script sheet se bound honi chahiye '
               + '(sheet me Extensions → Apps Script se kholo).');
      return 0;
    }

    var props  = PropertiesService.getScriptProperties();
    var sheets = ss.getSheets();
    var sentTotal = 0;

    for (var s = 0; s < sheets.length; s++) {
      if (sentTotal >= MAX_PER_RUN) break;

      var sh      = sheets[s];
      var tabName = sh.getName();
      if (SKIP_TABS.indexOf(tabName) !== -1) continue;

      var lastRow = sh.getLastRow();
      var lastCol = sh.getLastColumn();
      if (lastRow < 2 || lastCol < 1) continue;

      var colMap = buildColMap(sh.getRange(1, 1, 1, lastCol).getValues()[0]);
      if (colMap.phone === undefined || colMap.name === undefined) {
        Logger.log('[' + tabName + '] full_name/phone_number column nahi mila — skip');
        continue;
      }

      // ── Per-tab pointer (row number) ──
      var ptrKey = 'PTR_' + tabName;
      var ptr = parseInt(props.getProperty(ptrKey) || '1', 10);
      if (isNaN(ptr) || ptr < 1) ptr = 1;
      if (ptr > lastRow) ptr = 1;      // rows delete hui to reset
      if (ptr >= lastRow) continue;    // is tab mein kuch naya nahi

      var startRow = ptr + 1;
      var data = sh.getRange(startRow, 1, lastRow - ptr, lastCol).getValues();

      for (var r = 0; r < data.length; r++) {
        if (sentTotal >= MAX_PER_RUN) break;

        var row    = data[r];
        var absRow = startRow + r;

        var name     = cellVal(row, colMap, 'name');
        var rawPhone = cellVal(row, colMap, 'phone');
        var phone    = cleanPhone(rawPhone);

        // Khaali / junk / test row — pointer aage badhao, bhejo mat
        if (!phone || phone.length < 10 || isJunkValue(name) || isJunkValue(rawPhone)) {
          props.setProperty(ptrKey, String(absRow));
          continue;
        }

        var payload = {
          name:       name,
          phone:      phone,
          // Meta "f:1377999317060769" likhta hai — prefix hata do
          form_id:    cellVal(row, colMap, 'form_id').replace(/^f:/, ''),
          city:       cellVal(row, colMap, 'city'),
          state:      cellVal(row, colMap, 'state'),
          education:  cellVal(row, colMap, 'education'),
          profession: cellVal(row, colMap, 'profession'),
          experience: cellVal(row, colMap, 'experience'),
          dob:        cellVal(row, colMap, 'dob'),
          email:      cellVal(row, colMap, 'email')
        };

        // Meta ka "You don't have enough permissions" text kabhi lead detail
        // mein na jaye — warna agent ko bakwas chip dikhega.
        var optional = ['city', 'state', 'education', 'profession', 'experience', 'dob', 'email'];
        for (var o = 0; o < optional.length; o++) {
          if (isJunkValue(payload[optional[o]])) payload[optional[o]] = '';
        }

        try {
          var resp = UrlFetchApp.fetch(WEBHOOK_URL, {
            method: 'post',
            contentType: 'application/json',
            headers: { 'x-intake-secret': SHARED_SECRET },
            payload: JSON.stringify(payload),
            muteHttpExceptions: true
          });

          if (resp.getResponseCode() === 200) {
            props.setProperty(ptrKey, String(absRow));   // sirf success par aage
            sentTotal++;
            Logger.log('[' + tabName + '] row ' + absRow + ' ' + phone
                     + ' -> ' + resp.getContentText());
          } else {
            Logger.log('[' + tabName + '] row ' + absRow + ' FAIL '
                     + resp.getResponseCode() + ' ' + resp.getContentText());
            break;   // is tab par ruko, agli run mein dobara koshish
          }
        } catch (err) {
          Logger.log('[' + tabName + '] row ' + absRow + ' ERROR ' + err);
          break;     // network error — pointer aage NAHI badhega
        }
      }
    }

    Logger.log('✅ Is run mein bheji gayi leads: ' + sentTotal);
    return sentTotal;

  } finally {
    lock.releaseLock();
  }
}


// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function normHeader(h) {
  return String(h == null ? '' : h).toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Header row se {field: columnIndex} map banata hai — position par nahi, NAAM par.
 *
 * Is sheet ke actual headers:
 *   id · created_time · ad_id · ad_name · adset_id · adset_name · campaign_id ·
 *   campaign_name · form_id · form_name · is_organic · platform ·
 *   experienced_or_fresher_? · educational_qualification_? · full_name ·
 *   phone_number · state · lead_status
 *
 * Jo headers yahan list nahi hain (ad_id, campaign_name, platform...) wo
 * jaan-boojh kar ignore hote hain — CRM unhe use nahi karta.
 */
function buildColMap(headerRow) {
  var map = {};
  for (var i = 0; i < headerRow.length; i++) {
    var h = normHeader(headerRow[i]);
    if (!h) continue;

    if      (h === 'formid')            map.form_id    = i;
    else if (h === 'fullname')          map.name       = i;
    else if (h === 'phonenumber')       map.phone      = i;
    else if (h === 'city')              map.city       = i;
    else if (h === 'state')             map.state      = i;
    else if (h === 'email')             map.email      = i;
    else if (h === 'dateofbirth')       map.dob        = i;
    else if (h === 'currentprofession') map.profession = i;
    // "educational_qualification_?" -> educationalqualification
    else if (h === 'educationalqualification' || h === 'yourqualification') map.education = i;
    // "experienced_or_fresher_?" -> experiencedorfresher
    else if (h.indexOf('experiencedorfresher') === 0) map.experience = i;
  }
  return map;
}

function cellVal(row, map, key) {
  if (map[key] === undefined) return '';
  var v = row[map[key]];
  return (v === null || v === undefined) ? '' : String(v).trim();
}

/** "p:+919711263337" -> "9711263337" */
function cleanPhone(raw) {
  var d = String(raw == null ? '' : raw).replace(/\D/g, '');
  return d.length >= 10 ? d.slice(-10) : d;
}

/** Meta ke permission-errors aur test rows ko lead mat samjho. */
function isJunkValue(v) {
  if (!v) return false;
  var s = String(v).toLowerCase();
  return s.indexOf("don't have enough permission") !== -1 ||
         s.indexOf('dont have enough permission')  !== -1 ||
         s.indexOf('<test lead')                   !== -1;
}


// ═══════════════════════════════════════════════════════════════════════════
// UTILITIES — zaroorat pade to hi chalana
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Har tab ka status dikhata hai: kitni rows hain, pointer kahan hai, kitni
 * pending hain. Sabse pehle yahi chalao agar "leads nahi aa rahi" lage.
 */
function showLeadflowStatus() {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var props = PropertiesService.getScriptProperties();
  var out   = ['LEADFLOW STATUS — ' + ss.getName(), ''];

  ss.getSheets().forEach(function (sh) {
    var name    = sh.getName();
    var lastRow = sh.getLastRow();
    var ptr     = parseInt(props.getProperty('PTR_' + name) || '1', 10);
    var pending = Math.max(0, lastRow - ptr);
    var skip    = SKIP_TABS.indexOf(name) !== -1 ? '  [SKIPPED]' : '';
    out.push('"' + name + '"  rows: ' + lastRow + '  pointer: ' + ptr
           + '  pending: ' + pending + skip);
  });

  out.push('');
  out.push('pending = 0 matlab sab bhej chuke hain (koi backlog nahi).');
  Logger.log(out.join('\n'));
}

/**
 * ⚠️ KHATARNAK — saare pointers reset kar deta hai, jisse HAR row DOBARA
 * bhej di jayegi. Sirf tab chalao jab CRM se sach mein saari leads dobara
 * chahiye hon. CRM ka 10-minute duplicate guard sirf turant-dobara-bheji gayi
 * leads rokta hai, purani nahi.
 */
function resetAllPointers() {
  var props = PropertiesService.getScriptProperties();
  var all   = props.getProperties();
  Object.keys(all).forEach(function (k) {
    if (k.indexOf('PTR_') === 0) props.deleteProperty(k);
  });
  Logger.log('Saare pointers reset ho gaye. Agli run HAR row dobara bhejegi.');
}

/**
 * Ek test lead bhej kar poora rasta check karta hai (sheet chhue bina).
 * CRM ka jawab Execution log mein dikhega.
 */
function sendTestLead() {
  var resp = UrlFetchApp.fetch(WEBHOOK_URL, {
    method: 'post',
    contentType: 'application/json',
    headers: { 'x-intake-secret': SHARED_SECRET },
    payload: JSON.stringify({
      name: 'ZZ Test Lead (delete me)',
      phone: '9000000001',
      form_id: '1377999317060769',
      state: 'Test State',
      education: 'graduate',
      experience: 'Fresher'
    }),
    muteHttpExceptions: true
  });
  Logger.log(resp.getResponseCode() + ' ' + resp.getContentText());
}
