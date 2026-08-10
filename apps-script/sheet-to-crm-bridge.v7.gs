/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  LEADFLOW CRM — Google Sheet → Webhook Bridge
 *  v7  (10 Aug 2026)   ⚠️ Ye poori file Code.gs mein paste karo (purana sab hatao)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  ▶ RUN KARNE KE LIYE: dropdown se  checkNewLeads  chuno aur Run dabao.
 *    Trigger pehle se isi function par lagi hai — DOBARA TRIGGER MAT BANANA.
 *
 *  ─────────────────────────────────────────────────────────────────────────
 *  v6 KYUN TOOTA (asli wajah, taaki dobara na ho):
 *    9 Aug ko Meta ka Google-Sheet authorization expire ho gaya tha. Usse
 *    reconnect karne par Meta ne HAR FORM KA ALAG TAB bana diya
 *    ("new form", "Fresh lead form | ...") aur purana "Sheet1" mar gaya.
 *    v6 sirf Sheet1 padhta tha aur uske column positions par HARDCODED tha —
 *    isliye wo har 10 min "Completed" dikhata raha par 0 leads bheji,
 *    ~30 ghante tak, bina kisi error ke.
 *
 *  v7 MEIN KYA THEEK HUA:
 *    1. SAARE tabs padhta hai (Sheet1 chhod ke). Meta aage naya form banaye
 *       to naya tab apne aap handle ho jayega — code chhune ki zaroorat nahi.
 *    2. Column mapping HEADERS se banti hai, fixed position se nahi. Isliye
 *       ab FORM_OVERRIDES ki zaroorat hi nahi — naye tabs mein har form apne
 *       alag tab mein hai aur headers data se exactly match karte hain
 *       (verify kiya 10-Aug: "new form" 18 cols, "Fresh lead form" 20 cols).
 *    3. HAR TAB ka apna pointer. v6 mein ek global pointer tha jo Sheet1 par
 *       atak gaya aur baaki sab block ho gaya.
 *    4. Ek run mein max MAX_PER_RUN leads — Apps Script ke 6-min timeout se
 *       bachne ke liye. Baaki agli run (10 min baad) mein chali jayengi.
 *
 *  SAFETY (jaan-boojh kar dali gayi):
 *    • Sheet mein kuch LIKHTA nahi — sirf padhta hai.
 *    • Pointer SIRF tab aage badhta hai jab CRM ne 200 diya ho. CRM/network
 *      down ho to pointer wahi rukta hai aur lead agli run mein dobara jayegi.
 *      Lead kabhi chupchaap kho nahi sakti (v6 mein yehi risk tha).
 *    • LockService — do run ek saath chal ke duplicate na bhejein.
 *    • ALREADY_IMPORTED: 10-Aug ko CSV se manually import ho chuki 152 leads
 *      dobara nahi jayengi. Catch-up ke baad ye list bekaar ho jayegi;
 *      chaho to hata dena (ya chhod do, koi nuksaan nahi).
 *
 *  FORM IDs (reference — routing ka faisla CRM side pe hota hai, yahan nahi):
 *    26784403284560247 = WOMEN/GIRLS form → CRM pehle Simar ki team ko deta hai
 *    2419407918566414  = NORMAL form      → CRM Simar ki team ko chhod ke deta hai
 * ═══════════════════════════════════════════════════════════════════════════
 */

var WEBHOOK_URL   = 'https://vewqzsqddgmkslnuctvb.supabase.co/functions/v1/sheet-lead-intake';
var SHARED_SECRET = 'GqzXXirei1LUyizO9I8aNLPd3i3DiW5odaOnS41fSIE';

/** Purana dead tab — ab nahi padhna. Data history ke liye sheet mein rehne do. */
var SKIP_TABS = ['Sheet1'];

/** Ek run mein max kitni leads bhejein (6-min timeout se bachne ke liye). */
var MAX_PER_RUN = 60;

/** 10-Aug ko CSV se manually import ho chuki leads — dobara na bhejo. */
var ALREADY_IMPORTED = {};
(function () {
  var arr = [
  '6006100140','6201820889','6203755636','6263297266','6307702260','6353352721','6375786910','6392943881',
  '7004239061','7004729218','7015185045','7016932761','7017973760','7023230053','7038558387','7054663703',
  '7217734720','7307268060','7408047084','7408667585','7428267445','7492063962','7497884045','7505411905',
  '7505743683','7534824507','7557730012','7607457244','7665238697','7667134942','7738782904','7808456944',
  '7838650614','7857905390','7869084976','7877046947','7888713957','7903586305','7972140246','7974023089',
  '7978949462','7979731590','7999938211','8051404433','8059950895','8077261795','8077393478','8081009648',
  '8081925299','8084546965','8090117336','8102523502','8126830951','8169100867','8210279010','8237374630',
  '8252738012','8273731829','8448424136','8448945538','8452918440','8477070285','8504830523','8528222383',
  '8604450991','8607868105','8707006956','8738952993','8770744806','8780658389','8806322513','8853940644',
  '8865049812','8866130166','8871747025','8881773219','8887977140','8905113717','8905910776','8941096756',
  '8954114284','8954409999','8983030375','8988292989','9013316282','9026483489','9027759421','9039282010',
  '9053392711','9056188996','9058575390','9084402346','9097884444','9110909176','9125191605','9142403022',
  '9142891022','9156820392','9162301522','9166699331','9171924987','9204174123','9304759354','9306088808',
  '9315337244','9341577004','9389706516','9430008200','9510039462','9511109052','9518425098','9528836986',
  '9554633867','9557982670','9568984236','9569367631','9570777168','9575836156','9588837912','9627645065',
  '9650871467','9667406849','9702357307','9713733722','9719893971','9730631416','9756645103','9779293118',
  '9794522357','9794902219','9808810801','9816034018','9821298574','9837943797','9838364883','9852456439',
  '9871823016','9875124014','9889313417','9889369251','9891295745','9910078565','9919501682','9920581007',
  '9927319695','9927516482','9955916338','9956802997','9960522647','9981128097','9997569547','9999569495',
  ];
  for (var i = 0; i < arr.length; i++) ALREADY_IMPORTED[arr[i]] = true;
})();


// ═══════════════════════════════════════════════════════════════════════════
// ▶ MAIN — YAHI RUN KARNA HAI (aur trigger bhi isi par hai)
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

        // Khaali / junk / test row — pointer aage, bhejo mat
        if (!phone || !name || isJunkValue(name) || isJunkValue(rawPhone)) {
          props.setProperty(ptrKey, String(absRow));
          continue;
        }

        // Pehle se import ho chuki (10-Aug CSV) — skip, par pointer aage
        if (ALREADY_IMPORTED[phone]) {
          props.setProperty(ptrKey, String(absRow));
          continue;
        }

        var payload = {
          name:       name,
          phone:      phone,
          form_id:    cellVal(row, colMap, 'form_id').replace(/^f:/, ''),
          city:       cellVal(row, colMap, 'city'),
          state:      cellVal(row, colMap, 'state'),
          education:  cellVal(row, colMap, 'education'),
          profession: cellVal(row, colMap, 'profession'),
          experience: cellVal(row, colMap, 'experience'),
          dob:        cellVal(row, colMap, 'dob')
        };

        // Meta ka "You don't have enough permissions" text kabhi lead detail
        // mein na jaye — warna agent ko bakwas chip dikhega.
        var optional = ['city', 'state', 'education', 'profession', 'experience', 'dob'];
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
          Logger.log('[' + tabName + '] row ' + absRow + ' ERROR: ' + err);
          break;
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
// HELPERS — inhe seedha RUN mat karo
// ═══════════════════════════════════════════════════════════════════════════

/** Header normalize: 'experienced_or_fresher.' aur 'experienced_or_fresher_?'
 *  dono ek hi cheez samjhe jayein. */
function normHeader(h) {
  return String(h == null ? '' : h).toLowerCase().replace(/[^a-z0-9]/g, '');
}

/** Header row se {field: columnIndex} map banata hai (position par nahi, naam par). */
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
    else if (h === 'dateofbirth')       map.dob        = i;
    else if (h === 'currentprofession') map.profession = i;
    // dono forms ka qualification field alag naam se aata hai
    else if (h === 'educationalqualification' || h === 'yourqualification') map.education = i;
    // 'experienced_or_fresher.' aur 'experienced_or_fresher_?' dono
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

/** Har tab ka pointer aur status dikhata hai. Kuch bhejta nahi — sirf padhta hai. */
function showLeadflowStatus() {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var props = PropertiesService.getScriptProperties().getProperties();
  var out   = ['════════ LEADFLOW STATUS ════════', 'Time: ' + new Date()];

  var sheets = ss.getSheets();
  for (var i = 0; i < sheets.length; i++) {
    var sh   = sheets[i];
    var name = sh.getName();
    var lastRow = sh.getLastRow();
    var ptr  = props['PTR_' + name];
    var skip = SKIP_TABS.indexOf(name) !== -1 ? '  [SKIPPED]' : '';
    out.push('');
    out.push('TAB "' + name + '"' + skip);
    out.push('   rows: ' + lastRow + ' | pointer: ' + (ptr === undefined ? '(set nahi)' : ptr)
           + ' | pending: ' + (skip ? 0 : Math.max(0, lastRow - (parseInt(ptr || '1', 10)))));
  }

  out.push('');
  out.push('Triggers:');
  var trs = ScriptApp.getProjectTriggers();
  for (var t = 0; t < trs.length; t++) {
    out.push('   ' + trs[t].getHandlerFunction() + ' (' + trs[t].getEventType() + ')');
  }

  var text = out.join('\n');
  Logger.log(text);
  return text;
}

/**
 * ⚠️ SAAVDHAN: saare pointers mita deta hai. Agli run har tab ko SHURU se
 * padhegi — purani leads DOBARA CRM mein ja sakti hain (duplicates).
 * Sirf tab chalao jab main bolun.
 */
function resetAllPointers() {
  var props = PropertiesService.getScriptProperties();
  var all = props.getProperties();
  var n = 0;
  Object.keys(all).forEach(function (k) {
    if (k.indexOf('PTR_') === 0) { props.deleteProperty(k); n++; }
  });
  Logger.log('Reset ho gaye pointers: ' + n);
}
