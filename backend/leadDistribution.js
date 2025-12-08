function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    var data = JSON.parse(e.postData.contents);
    var action = data.action;
    
    // Check Action Type
    if (action === "createSheet") {
      return createUserSheet(data);
    }
    
    return sendResponse({ "result": "error", "message": "Unknown action" });
    
  } catch (err) {
    return sendResponse({ "result": "error", "error": err.toString() });
  } finally {
    lock.releaseLock();
  }
}

function createUserSheet(data) {
  var email = data.email;
  var name = data.name;
  
  if (!email) return sendResponse({ "result": "error", "message": "Email is required" });

  try {
    // 1. Create New Sheet
    var ss = SpreadsheetApp.create("LeadFlow - " + (name || "User"));
    var sheet = ss.getActiveSheet();
    
    // 2. Add Headers
    var headers = ["Date", "Name", "Phone", "City", "Status", "Notes", "Source"];
    sheet.appendRow(headers);
    
    // 3. Style Headers (Blue Background)
    var range = sheet.getRange(1, 1, 1, headers.length);
    range.setBackground("#2563eb").setFontColor("white").setFontWeight("bold");
    
    // 4. Add User as Editor (Share Sheet)
    try {
      ss.addEditor(email);
    } catch (e) {
      // Sometimes fails if email is not Google, but we proceed anyway
      Logger.log("Could not share sheet: " + e.toString());
    }
    
    // 5. Return Success
    return sendResponse({
      "result": "success",
      "sheetUrl": ss.getUrl(),
      "sheetId": ss.getId()
    });
    
  } catch (e) {
    return sendResponse({ "result": "error", "error": e.toString() });
  }
}

function sendResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}