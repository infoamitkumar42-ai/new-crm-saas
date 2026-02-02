/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 📺 LEADFLOW - YOUTUBE/GOOGLE ADS INTEGRATION SCRIPT
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * This Google Apps Script receives leads from Google Ads Lead Form Extensions
 * and sends them to LeadFlow for automatic distribution.
 * 
 * SETUP INSTRUCTIONS:
 * 1. Go to script.google.com
 * 2. Create new project
 * 3. Paste this entire script
 * 4. Deploy as Web App (Execute as: Me, Access: Anyone)
 * 5. Copy the Web App URL
 * 6. In Google Ads: Campaigns > Assets > Lead Forms > Webhook URL = Your Web App URL
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 */

// ══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION - Set your Supabase details here
// ══════════════════════════════════════════════════════════════════════════════

const CONFIG = {
  SUPABASE_URL: "https://vewqzsqddgmkslnuctvb.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4",
  
  // Lead Source Name (will appear in dashboard)
  SOURCE_NAME: "YouTube Ads",
  
  // Default status for new leads
  DEFAULT_STATUS: "Fresh",
  
  // Enable logging to Google Sheet (optional)
  LOG_TO_SHEET: true,
  LOG_SHEET_ID: "", // Put your Google Sheet ID here if you want logs
};

// ══════════════════════════════════════════════════════════════════════════════
// MAIN WEBHOOK HANDLER - Receives leads from Google Ads
// ══════════════════════════════════════════════════════════════════════════════

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    // Log raw data for debugging
    console.log("Received data:", JSON.stringify(data));
    
    // Extract lead data from Google Ads format
    const leadData = extractLeadData(data);
    
    if (!leadData.phone) {
      return createResponse(400, { error: "No phone number found" });
    }
    
    // Send to LeadFlow
    const result = sendToLeadFlow(leadData);
    
    // Log to sheet if enabled
    if (CONFIG.LOG_TO_SHEET && CONFIG.LOG_SHEET_ID) {
      logToSheet(leadData, result);
    }
    
    return createResponse(200, { 
      success: true, 
      message: "Lead received",
      lead: leadData
    });
    
  } catch (error) {
    console.error("Error:", error);
    return createResponse(500, { error: error.message });
  }
}

// Handle GET requests (for verification)
function doGet(e) {
  return createResponse(200, { 
    status: "OK",
    message: "LeadFlow YouTube Ads Webhook is active",
    timestamp: new Date().toISOString()
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// EXTRACT LEAD DATA - Parse Google Ads Lead Form data
// ══════════════════════════════════════════════════════════════════════════════

function extractLeadData(data) {
  let name = "";
  let phone = "";
  let email = "";
  let city = "";
  let message = "";
  
  // Google Ads sends data in different formats depending on the form
  // Handle multiple possible formats:
  
  // Format 1: user_column_data array
  if (data.user_column_data) {
    for (const field of data.user_column_data) {
      const fieldName = (field.column_name || field.column_id || "").toLowerCase();
      const value = field.string_value || field.value || "";
      
      if (fieldName.includes("name") || fieldName.includes("full_name")) {
        name = value;
      }
      if (fieldName.includes("phone") || fieldName.includes("mobile") || fieldName.includes("number")) {
        phone = value;
      }
      if (fieldName.includes("email") || fieldName.includes("mail")) {
        email = value;
      }
      if (fieldName.includes("city") || fieldName.includes("location") || fieldName.includes("area")) {
        city = value;
      }
      if (fieldName.includes("message") || fieldName.includes("comment") || fieldName.includes("query")) {
        message = value;
      }
    }
  }
  
  // Format 2: Direct fields
  if (data.full_name) name = data.full_name;
  if (data.name) name = data.name;
  if (data.phone_number) phone = data.phone_number;
  if (data.phone) phone = data.phone;
  if (data.email) email = data.email;
  if (data.city) city = data.city;
  
  // Format 3: Nested lead_data object
  if (data.lead_data) {
    const ld = data.lead_data;
    if (ld.full_name) name = ld.full_name;
    if (ld.phone_number) phone = ld.phone_number;
    if (ld.email) email = ld.email;
    if (ld.city) city = ld.city;
  }
  
  // Format 4: field_data array (similar to Meta)
  if (data.field_data) {
    for (const field of data.field_data) {
      const fieldName = (field.name || "").toLowerCase();
      const value = field.values ? field.values[0] : (field.value || "");
      
      if (fieldName.includes("name")) name = value;
      if (fieldName.includes("phone") || fieldName.includes("mobile")) phone = value;
      if (fieldName.includes("email")) email = value;
      if (fieldName.includes("city")) city = value;
    }
  }
  
  // Clean phone number - extract last 10 digits
  phone = (phone || "").replace(/\D/g, "").slice(-10);
  
  // Validate phone
  if (phone && !/^[6789]\d{9}$/.test(phone)) {
    console.log("Invalid phone format:", phone);
    // Keep it anyway but mark for review
  }
  
  return {
    name: name || "YouTube Lead",
    phone: phone,
    email: email,
    city: city,
    message: message,
    source: CONFIG.SOURCE_NAME,
    raw_data: JSON.stringify(data).substring(0, 500) // Store raw for debugging
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// SEND TO LEADFLOW - Insert lead into Supabase
// ══════════════════════════════════════════════════════════════════════════════

function sendToLeadFlow(leadData) {
  const url = CONFIG.SUPABASE_URL + "/rest/v1/leads";
  
  const payload = {
    name: leadData.name,
    phone: leadData.phone,
    city: leadData.city || "",
    state: detectState(leadData.city),
    email: leadData.email || "",
    source: leadData.source,
    status: CONFIG.DEFAULT_STATUS,
    notes: leadData.message || "",
    created_at: new Date().toISOString()
  };
  
  const options = {
    method: "POST",
    headers: {
      "apikey": CONFIG.SUPABASE_ANON_KEY,
      "Authorization": "Bearer " + CONFIG.SUPABASE_ANON_KEY,
      "Content-Type": "application/json",
      "Prefer": "return=minimal"
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  try {
    const response = UrlFetchApp.fetch(url, options);
    const code = response.getResponseCode();
    
    if (code >= 200 && code < 300) {
      console.log("✅ Lead sent to LeadFlow:", leadData.phone);
      return { success: true, code: code };
    } else {
      console.error("❌ LeadFlow error:", response.getContentText());
      return { success: false, code: code, error: response.getContentText() };
    }
  } catch (error) {
    console.error("❌ Request failed:", error);
    return { success: false, error: error.message };
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ══════════════════════════════════════════════════════════════════════════════

function detectState(city) {
  if (!city) return "";
  
  const cityLower = city.toLowerCase();
  
  // Punjab cities
  const punjabCities = ["chandigarh", "ludhiana", "amritsar", "jalandhar", "patiala", "bathinda", "mohali", "pathankot", "moga", "barnala", "batala", "abohar", "fazilka", "kapurthala", "hoshiarpur", "sangrur", "malerkotla", "khanna", "phagwara", "muktsar", "ferozepur", "gurdaspur", "nawanshahr", "rajpura", "zirakpur", "dera bassi", "kharar", "morinda", "ropar", "nangal", "tarn taran", "goindwal"];
  
  // Haryana cities
  const haryanaCities = ["gurugram", "gurgaon", "faridabad", "panipat", "ambala", "yamunanagar", "rohtak", "hisar", "karnal", "sonipat", "panchkula", "bhiwani", "sirsa", "bahadurgarh", "jind", "thanesar", "kaithal", "rewari", "palwal"];
  
  // Delhi
  const delhiAreas = ["delhi", "new delhi", "noida", "ghaziabad", "greater noida", "ncr"];
  
  // Rajasthan cities
  const rajasthanCities = ["jaipur", "jodhpur", "udaipur", "kota", "bikaner", "ajmer", "alwar", "bhilwara", "sri ganganagar"];
  
  for (const c of punjabCities) {
    if (cityLower.includes(c)) return "Punjab";
  }
  for (const c of haryanaCities) {
    if (cityLower.includes(c)) return "Haryana";
  }
  for (const c of delhiAreas) {
    if (cityLower.includes(c)) return "Delhi";
  }
  for (const c of rajasthanCities) {
    if (cityLower.includes(c)) return "Rajasthan";
  }
  
  return "";
}

function createResponse(code, data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function logToSheet(leadData, result) {
  if (!CONFIG.LOG_SHEET_ID) return;
  
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.LOG_SHEET_ID).getActiveSheet();
    sheet.appendRow([
      new Date(),
      leadData.name,
      leadData.phone,
      leadData.city,
      leadData.email,
      leadData.source,
      result.success ? "✅ Sent" : "❌ Failed",
      result.error || ""
    ]);
  } catch (e) {
    console.error("Sheet log error:", e);
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// TESTING FUNCTION - Run this manually to test
// ══════════════════════════════════════════════════════════════════════════════

function testWebhook() {
  // Simulate a Google Ads lead
  const testData = {
    user_column_data: [
      { column_name: "Full Name", string_value: "Test YouTube Lead" },
      { column_name: "Phone Number", string_value: "+919876543210" },
      { column_name: "City", string_value: "Ludhiana" },
      { column_name: "Email", string_value: "test@example.com" }
    ]
  };
  
  const leadData = extractLeadData(testData);
  console.log("Extracted:", leadData);
  
  // Uncomment to actually send test lead:
  // const result = sendToLeadFlow(leadData);
  // console.log("Result:", result);
}

// ══════════════════════════════════════════════════════════════════════════════
// MANUAL LEAD ENTRY - For adding leads manually
// ══════════════════════════════════════════════════════════════════════════════

function addManualLead(name, phone, city) {
  const leadData = {
    name: name,
    phone: (phone || "").replace(/\D/g, "").slice(-10),
    city: city || "",
    source: "Manual Entry",
    email: "",
    message: ""
  };
  
  return sendToLeadFlow(leadData);
}

// Example usage:
// addManualLead("Rahul Kumar", "9876543210", "Jalandhar");
