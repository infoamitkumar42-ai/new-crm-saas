function doPost(e) {
  try {
    if (!e || !e.postData) return sendResponse({ result: "error", message: "No data" });
    
    var data = JSON.parse(e.postData.contents);
    if (data.action === "createSheet") return createUserSheet(data);
    
    return sendResponse({ result: "success", message: "Ping OK" });
  } catch (err) {
    return sendResponse({ result: "error", error: err.toString() });
  }
}

function createUserSheet(data) {
  var email = data.email;
  var name = data.name || "User";
  
  try {
    // 1. Create Sheet
    var ss = SpreadsheetApp.create("LeadFlow - " + name);
    var sheet = ss.getActiveSheet();
    
    // 2. Setup Columns
    var headers = ["Date", "Name", "Phone", "City", "Status", "Notes", "Source"];
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setBackground("#2563eb").setFontColor("white").setFontWeight("bold");
    
    // 3. PERMISSION FIX (Ye Naya Hai)
    // Sheet ko "Anyone with Link" ke liye open kar do taaki user turant access kar sake
    try {
      ss.setSharing(SpreadsheetApp.Access.ANYONE_WITH_LINK, SpreadsheetApp.Permission.EDITOR);
    } catch (shareErr) {
      // Agar ye fail ho, tabhi specific email add karne ki koshish karo
      try { ss.addEditor(email); } catch (e) {}
    }

    return sendResponse({ result: "success", sheetUrl: ss.getUrl() });
  } catch (e) {
    return sendResponse({ result: "error", error: e.toString() });
  }
}

function sendResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
