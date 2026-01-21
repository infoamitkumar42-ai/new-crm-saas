/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 🎯 GOOGLE ADS → LEADFLOW INTEGRATION (100% FREE)
 * Automatically sends Google/YouTube leads to Supabase for distribution
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * SETUP INSTRUCTIONS:
 * 1. Create Google Sheet linked to Google Ads Lead Form
 * 2. Open Extensions → Apps Script
 * 3. Paste this code
 * 4. Run setupTrigger() once to enable auto-sync
 * 5. Done! Leads will auto-flow to LeadFlow CRM
 */

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION - CHANGE THESE VALUES
// ═══════════════════════════════════════════════════════════════════════════════

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.sDyBIFZPfHbYboKLVqxJLO0F6gAU2cOpQ9NWqFFa_cA";

// Column mapping - adjust based on your Google Ads form fields
const COLUMN_MAPPING = {
  name: 1,       // Column A = Name
  phone: 2,      // Column B = Phone
  email: 3,      // Column C = Email (optional)
  city: 4,       // Column D = City (optional)
  timestamp: 5   // Column E = Submission Time
};

const LEAD_SOURCE = "Google Ads - YouTube";  // Change based on campaign

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Run this ONCE to set up the automatic trigger
 */
function setupTrigger() {
  // Remove existing triggers
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => ScriptApp.deleteTrigger(trigger));
  
  // Create new trigger - runs when sheet is edited
  ScriptApp.newTrigger('onNewLead')
    .forSpreadsheet(SpreadsheetApp.getActiveSpreadsheet())
    .onEdit()
    .create();
  
  Logger.log("✅ Trigger setup complete! New leads will auto-sync to LeadFlow.");
}

/**
 * Alternative: Run this ONCE for time-based trigger (checks every 1 min)
 * More reliable for Google Ads which might not trigger onEdit
 */
function setupTimeTrigger() {
  // Remove existing triggers
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => ScriptApp.deleteTrigger(trigger));
  
  // Create time-based trigger - runs every 1 minute
  ScriptApp.newTrigger('processNewLeads')
    .timeBased()
    .everyMinutes(1)
    .create();
  
  Logger.log("✅ Time trigger setup! Checking for new leads every 1 minute.");
}

/**
 * Triggered when sheet is edited (new lead added)
 */
function onNewLead(e) {
  try {
    const sheet = e.source.getActiveSheet();
    const row = e.range.getRow();
    
    // Skip header row
    if (row <= 1) return;
    
    // Check if this row was already processed
    const statusCol = 10; // Column J for status
    const status = sheet.getRange(row, statusCol).getValue();
    if (status === "SENT") return;
    
    // Get lead data
    const lead = getLeadFromRow(sheet, row);
    
    // Validate and send
    if (lead && lead.phone && lead.phone.length >= 10) {
      const success = sendToSupabase(lead);
      
      if (success) {
        sheet.getRange(row, statusCol).setValue("SENT");
        sheet.getRange(row, statusCol + 1).setValue(new Date());
        Logger.log("✅ Lead sent: " + lead.name);
      } else {
        sheet.getRange(row, statusCol).setValue("FAILED");
        Logger.log("❌ Failed: " + lead.name);
      }
    }
  } catch (error) {
    Logger.log("Error: " + error.message);
  }
}

/**
 * Time-based processor - checks all unprocessed leads
 */
function processNewLeads() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const lastRow = sheet.getLastRow();
  const statusCol = 10; // Column J for status
  
  let processed = 0;
  
  for (let row = 2; row <= lastRow; row++) {
    const status = sheet.getRange(row, statusCol).getValue();
    
    // Skip already processed
    if (status === "SENT" || status === "FAILED" || status === "INVALID") continue;
    
    // Get lead data
    const lead = getLeadFromRow(sheet, row);
    
    if (!lead || !lead.phone) {
      sheet.getRange(row, statusCol).setValue("INVALID");
      continue;
    }
    
    // Validate phone
    const cleanPhone = lead.phone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10 || !['6','7','8','9'].includes(cleanPhone[0])) {
      sheet.getRange(row, statusCol).setValue("INVALID");
      continue;
    }
    
    // Send to Supabase
    const success = sendToSupabase(lead);
    
    if (success) {
      sheet.getRange(row, statusCol).setValue("SENT");
      sheet.getRange(row, statusCol + 1).setValue(new Date());
      processed++;
    } else {
      sheet.getRange(row, statusCol).setValue("FAILED");
    }
    
    // Rate limit - max 10 per run
    if (processed >= 10) break;
  }
  
  if (processed > 0) {
    Logger.log("✅ Processed " + processed + " new leads");
  }
}

/**
 * Extract lead data from sheet row
 */
function getLeadFromRow(sheet, row) {
  try {
    const name = sheet.getRange(row, COLUMN_MAPPING.name).getValue() || "";
    const phone = String(sheet.getRange(row, COLUMN_MAPPING.phone).getValue() || "");
    const email = sheet.getRange(row, COLUMN_MAPPING.email).getValue() || "";
    const city = sheet.getRange(row, COLUMN_MAPPING.city).getValue() || "Unknown";
    
    return {
      name: name.trim(),
      phone: phone.replace(/\D/g, '').slice(-10),
      email: email.trim(),
      city: city.trim(),
      source: LEAD_SOURCE
    };
  } catch (error) {
    Logger.log("Error extracting lead: " + error.message);
    return null;
  }
}

/**
 * Send lead to Supabase (same endpoint as Meta webhook)
 */
function sendToSupabase(lead) {
  try {
    const payload = {
      name: lead.name,
      phone: lead.phone,
      email: lead.email || null,
      city: lead.city || "Unknown",
      state: detectState(lead.city),
      source: lead.source,
      status: "Fresh"
    };
    
    // Option 1: Direct insert to leads table (simpler)
    const response = UrlFetchApp.fetch(SUPABASE_URL + "/rest/v1/leads", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": "Bearer " + SUPABASE_ANON_KEY,
        "Prefer": "return=minimal"
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
    
    const code = response.getResponseCode();
    
    if (code === 201 || code === 200) {
      return true;
    } else {
      Logger.log("Supabase error: " + response.getContentText());
      return false;
    }
  } catch (error) {
    Logger.log("Send error: " + error.message);
    return false;
  }
}

/**
 * Detect state from city name
 */
function detectState(city) {
  const cityLower = (city || "").toLowerCase();
  
  const punjabCities = ["chandigarh", "ludhiana", "amritsar", "jalandhar", "patiala", "bathinda", "mohali", "pathankot", "hoshiarpur", "moga"];
  const haryanaCities = ["gurugram", "gurgaon", "faridabad", "rohtak", "hisar", "panipat", "karnal", "ambala", "sonipat", "yamunanagar"];
  const delhiCities = ["delhi", "new delhi", "noida", "ghaziabad", "greater noida"];
  const rajasthanCities = ["jaipur", "jodhpur", "udaipur", "kota", "ajmer", "bikaner", "alwar"];
  
  if (punjabCities.some(c => cityLower.includes(c))) return "Punjab";
  if (haryanaCities.some(c => cityLower.includes(c))) return "Haryana";
  if (delhiCities.some(c => cityLower.includes(c))) return "Delhi";
  if (rajasthanCities.some(c => cityLower.includes(c))) return "Rajasthan";
  
  return "India";
}

/**
 * Manual test function - run this to test the integration
 */
function testIntegration() {
  const testLead = {
    name: "Test Lead Google",
    phone: "9876543210",
    email: "test@example.com",
    city: "Chandigarh",
    source: "Google Ads - Test"
  };
  
  const success = sendToSupabase(testLead);
  
  if (success) {
    Logger.log("✅ TEST SUCCESSFUL! Integration is working.");
    Logger.log("Check your LeadFlow dashboard for the test lead.");
  } else {
    Logger.log("❌ TEST FAILED! Check Supabase credentials.");
  }
}

/**
 * Manual sync - process all unprocessed leads now
 */
function manualSync() {
  processNewLeads();
  Logger.log("Manual sync complete!");
}
