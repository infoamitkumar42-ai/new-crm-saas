/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║  LEADFLOW v15.0 - USERONBOARDING.GS                                        ║
 * ║  Purpose: New User Sheet Creation & Onboarding (Web App API)               ║
 * ║  Version: Integrated with v15.0 (No conflicts)                            ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 * 
 * FLOW:
 * 1. Frontend calls Web App URL with action=createSheet
 * 2. Creates personal Google Sheet for new user
 * 3. Sets up headers, formatting, status dropdowns
 * 4. Shares with user, updates Supabase, sends welcome email
 * 
 * NOTE: This module uses v15.0 Config.gs for getConfig() - no duplicate config!
 */

// ============================================================================
// 🌐 WEB APP HANDLERS (Entry Points)
// ============================================================================

/**
 * Handle GET requests to the Web App
 * Used for health checks and simple actions
 */
function doGet(e) {
  Logger.log('========== doGet ==========');
  
  var params = e ? (e.parameter || {}) : {};
  Logger.log('Params: ' + JSON.stringify(params));
  
  try {
    var action = params.action || 'health';
    
    // Health check
    if (action === 'health' || action === 'test') {
      return createJsonResponse({
        success: true,
        message: 'LeadFlow v15.0 Onboarding Service is running!',
        version: SYSTEM.VERSION,
        timestamp: new Date().toISOString()
      });
    }
    
    // Create sheet via GET (for simple testing)
    if (action === 'createSheet') {
      if (!params.userId || !params.email) {
        return createJsonResponse({
          success: false,
          error: 'Missing userId or email'
        });
      }
      
      var result = onboardNewUser(params.userId, params.email, params.name || 'User');
      return createJsonResponse(result);
    }
    
    return createJsonResponse({ success: false, error: 'Unknown action' });
    
  } catch (error) {
    Logger.log('doGet Error: ' + error.message);
    return createJsonResponse({ success: false, error: error.message });
  }
}

/**
 * Handle POST requests to the Web App
 * Primary method for sheet creation
 */
function doPost(e) {
  Logger.log('========== doPost ==========');
  
  try {
    var data = {};
    
    // Parse request body
    if (e && e.postData && e.postData.contents) {
      Logger.log('Raw body: ' + e.postData.contents);
      try {
        data = JSON.parse(e.postData.contents);
      } catch (parseErr) {
        data = e.parameter || {};
      }
    } else if (e && e.parameter) {
      data = e.parameter;
    }
    
    Logger.log('Data: ' + JSON.stringify(data));
    
    // Handle createSheet action
    if (data.action === 'createSheet') {
      if (!data.userId || !data.email) {
        return createJsonResponse({
          success: false,
          error: 'Missing userId or email'
        });
      }
      
      var result = onboardNewUser(data.userId, data.email, data.name || 'User');
      return createJsonResponse(result);
    }
    
    // Health check
    if (data.action === 'health') {
      return createJsonResponse({ success: true, message: 'API healthy' });
    }
    
    return createJsonResponse({ success: false, error: 'Unknown action' });
    
  } catch (error) {
    Logger.log('doPost Error: ' + error.message);
    return createJsonResponse({ success: false, error: error.message });
  }
}

/**
 * Create JSON response for Web App
 */
function createJsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================================
// 📊 USER ONBOARDING - MAIN LOGIC
// ============================================================================

/**
 * Main function to onboard a new user
 * Creates their personal Google Sheet
 * 
 * @param {string} userId - Supabase user ID
 * @param {string} email - User's email
 * @param {string} name - User's name
 * @returns {Object} - Result with sheetUrl or error
 */
function onboardNewUser(userId, email, name) {
  Logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  Logger.log('📊 ONBOARDING NEW USER');
  Logger.log('   userId: ' + userId);
  Logger.log('   email: ' + email);
  Logger.log('   name: ' + name);
  Logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  try {
    // Validate inputs
    if (!userId || userId === 'undefined' || userId === 'null') {
      Logger.log('❌ Invalid userId');
      return { success: false, error: 'Invalid userId' };
    }
    
    if (!email || !email.includes('@')) {
      Logger.log('❌ Invalid email');
      return { success: false, error: 'Invalid email' };
    }
    
    // Check if sheet already exists
    Logger.log('🔍 Checking existing sheet...');
    var existingUrl = getUserSheetUrl(userId);
    
    if (existingUrl) {
      Logger.log('ℹ️ Sheet already exists: ' + existingUrl);
      return {
        success: true,
        sheetUrl: existingUrl,
        message: 'Sheet already exists',
        isNew: false
      };
    }
    
    // Create new Google Sheet
    Logger.log('📝 Creating new spreadsheet...');
    var sheetData = createUserSpreadsheet(email, name);
    
    if (!sheetData.success) {
      Logger.log('❌ Sheet creation failed: ' + sheetData.error);
      return { success: false, error: sheetData.error };
    }
    
    Logger.log('✅ Sheet created: ' + sheetData.url);
    
    // Update Supabase with sheet URL
    Logger.log('💾 Updating Supabase...');
    var updateResult = saveUserSheetUrl(userId, sheetData.url);
    
    if (!updateResult.success) {
      Logger.log('⚠️ Supabase update failed: ' + updateResult.error);
      return {
        success: true,
        sheetUrl: sheetData.url,
        warning: 'Sheet created but DB update failed: ' + updateResult.error,
        manualUpdate: "UPDATE users SET sheet_url = '" + sheetData.url + "' WHERE id = '" + userId + "';",
        isNew: true
      };
    }
    
    Logger.log('✅ Supabase updated successfully');
    
    // Send welcome email
    try {
      sendOnboardingEmail(email, name, sheetData.url);
      Logger.log('✅ Welcome email sent');
    } catch (emailErr) {
      Logger.log('⚠️ Email failed (non-critical): ' + emailErr.message);
    }
    
    Logger.log('🎉 ONBOARDING COMPLETE!');
    
    return {
      success: true,
      sheetUrl: sheetData.url,
      message: 'Sheet created and linked successfully',
      isNew: true
    };
    
  } catch (error) {
    Logger.log('❌ onboardNewUser Error: ' + error.message);
    Logger.log('Stack: ' + error.stack);
    return { success: false, error: error.message };
  }
}

// ============================================================================
// 🔍 CHECK EXISTING SHEET
// ============================================================================

/**
 * Get existing sheet URL for a user
 * Uses v15.0 getConfig() from Config.gs
 */
function getUserSheetUrl(userId) {
  try {
    var config = getConfig(); // From Config.gs
    
    if (!config.SUPABASE_URL || !config.SUPABASE_KEY) {
      Logger.log('⚠️ Supabase config missing');
      return null;
    }
    
    var url = config.SUPABASE_URL + '/rest/v1/users?id=eq.' + userId + '&select=sheet_url';
    
    var response = UrlFetchApp.fetch(url, {
      method: 'GET',
      headers: {
        'apikey': config.SUPABASE_KEY,
        'Authorization': 'Bearer ' + config.SUPABASE_KEY,
        'Content-Type': 'application/json'
      },
      muteHttpExceptions: true
    });
    
    var code = response.getResponseCode();
    var body = response.getContentText();
    
    Logger.log('Supabase GET: ' + code);
    
    if (code === 200) {
      var data = JSON.parse(body);
      if (data && data.length > 0 && data[0].sheet_url) {
        return data[0].sheet_url;
      }
    }
    
    return null;
    
  } catch (e) {
    Logger.log('getUserSheetUrl error: ' + e.message);
    return null;
  }
}

// ============================================================================
// 📝 CREATE USER GOOGLE SHEET
// ============================================================================

/**
 * Create a new Google Sheet for the user
 * Includes headers, formatting, and status dropdowns
 */
function createUserSpreadsheet(email, name) {
  try {
    var timestamp = Utilities.formatDate(new Date(), 'Asia/Kolkata', 'dd-MMM-yy');
    var sheetName = (name || 'User') + ' - Leads (' + timestamp + ')';
    
    Logger.log('Creating spreadsheet: ' + sheetName);
    
    // Create spreadsheet
    var spreadsheet = SpreadsheetApp.create(sheetName);
    var sheet = spreadsheet.getActiveSheet();
    sheet.setName('My Leads');
    
    // Add headers
    var headers = [
      'Lead ID', 'Name', 'Phone', 'Email', 'City', 'State',
      'Status', 'Notes', 'Assigned Date', 'Last Updated'
    ];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    // Style headers
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground('#1a73e8');
    headerRange.setFontColor('#ffffff');
    headerRange.setFontWeight('bold');
    headerRange.setHorizontalAlignment('center');
    sheet.setFrozenRows(1);
    
    // Set column widths
    sheet.setColumnWidth(1, 100);  // Lead ID
    sheet.setColumnWidth(2, 150);  // Name
    sheet.setColumnWidth(3, 120);  // Phone
    sheet.setColumnWidth(4, 180);  // Email
    sheet.setColumnWidth(5, 100);  // City
    sheet.setColumnWidth(6, 100);  // State
    sheet.setColumnWidth(7, 100);  // Status
    sheet.setColumnWidth(8, 200);  // Notes
    sheet.setColumnWidth(9, 120);  // Assigned Date
    sheet.setColumnWidth(10, 120); // Last Updated
    
    // Add status dropdown
    var statusOptions = ['New', 'Contacted', 'Interested', 'Not Interested', 'Closed', 'Follow Up'];
    var statusRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(statusOptions, true)
      .setAllowInvalid(false)
      .build();
    sheet.getRange('G2:G1000').setDataValidation(statusRule);
    
    // Add conditional formatting for status (optional enhancement)
    addStatusConditionalFormatting(sheet);
    
    var sheetUrl = spreadsheet.getUrl();
    var sheetId = spreadsheet.getId();
    
    Logger.log('✅ Spreadsheet created: ' + sheetUrl);
    Logger.log('   Sheet ID: ' + sheetId);
    
    // Share with user
    try {
      spreadsheet.addEditor(email);
      Logger.log('✅ Shared with: ' + email + ' (EDITOR)');
    } catch (shareErr) {
      Logger.log('⚠️ Editor access failed, trying viewer: ' + shareErr.message);
      try {
        spreadsheet.addViewer(email);
        Logger.log('✅ Shared with: ' + email + ' (VIEWER)');
      } catch (viewerErr) {
        Logger.log('⚠️ Sharing completely failed: ' + viewerErr.message);
        Logger.log('   User will need to request access manually');
      }
    }
    
    return {
      success: true,
      url: sheetUrl,
      id: sheetId
    };
    
  } catch (error) {
    Logger.log('❌ createUserSpreadsheet error: ' + error.message);
    Logger.log('Stack: ' + error.stack);
    return { success: false, error: error.message };
  }
}

/**
 * Add conditional formatting to status column
 */
function addStatusConditionalFormatting(sheet) {
  try {
    var statusRange = sheet.getRange('G2:G1000');
    
    // New - Blue
    var newRule = SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo('New')
      .setBackground('#e3f2fd')
      .setRanges([statusRange])
      .build();
    
    // Contacted - Yellow
    var contactedRule = SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo('Contacted')
      .setBackground('#fff9c4')
      .setRanges([statusRange])
      .build();
    
    // Interested - Green
    var interestedRule = SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo('Interested')
      .setBackground('#c8e6c9')
      .setRanges([statusRange])
      .build();
    
    // Closed - Dark Green
    var closedRule = SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo('Closed')
      .setBackground('#4caf50')
      .setFontColor('#ffffff')
      .setRanges([statusRange])
      .build();
    
    // Not Interested - Red
    var notInterestedRule = SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo('Not Interested')
      .setBackground('#ffcdd2')
      .setRanges([statusRange])
      .build();
    
    // Apply rules
    var rules = sheet.getConditionalFormatRules();
    rules.push(newRule, contactedRule, interestedRule, closedRule, notInterestedRule);
    sheet.setConditionalFormatRules(rules);
    
  } catch (e) {
    Logger.log('⚠️ Conditional formatting error (non-critical): ' + e.message);
  }
}

// ============================================================================
// 💾 UPDATE SUPABASE
// ============================================================================

/**
 * Save user's sheet URL to Supabase
 * Uses v15.0 getConfig() from Config.gs
 */
function saveUserSheetUrl(userId, sheetUrl) {
  try {
    var config = getConfig(); // From Config.gs
    
    if (!config.SUPABASE_URL || !config.SUPABASE_KEY) {
      Logger.log('❌ Config missing');
      return { success: false, error: 'Supabase config not found' };
    }
    
    var url = config.SUPABASE_URL + '/rest/v1/users?id=eq.' + userId;
    
    var payload = {
      sheet_url: sheetUrl,
      updated_at: new Date().toISOString()
    };
    
    Logger.log('PATCH URL: ' + url);
    Logger.log('Payload: ' + JSON.stringify(payload));
    
    var response = UrlFetchApp.fetch(url, {
      method: 'PATCH',
      headers: {
        'apikey': config.SUPABASE_KEY,
        'Authorization': 'Bearer ' + config.SUPABASE_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
    
    var code = response.getResponseCode();
    var body = response.getContentText();
    
    Logger.log('PATCH Response Code: ' + code);
    Logger.log('PATCH Response Body: ' + body);
    
    if (code >= 200 && code < 300) {
      Logger.log('✅ Supabase updated successfully');
      return { success: true };
    } else {
      Logger.log('❌ Supabase update failed with code: ' + code);
      return { success: false, error: 'HTTP ' + code + ': ' + body };
    }
    
  } catch (error) {
    Logger.log('❌ saveUserSheetUrl error: ' + error.message);
    Logger.log('Stack: ' + error.stack);
    return { success: false, error: error.message };
  }
}

// ============================================================================
// 📧 WELCOME EMAIL
// ============================================================================

/**
 * Send welcome email to new user
 */
function sendOnboardingEmail(email, name, sheetUrl) {
  try {
    var subject = '🎉 Your LeadFlow Sheet is Ready!';
    var body = 'Hi ' + (name || 'there') + ',\n\n' +
      'Welcome to LeadFlow! Your personal lead tracking sheet is ready.\n\n' +
      '📊 Your Sheet: ' + sheetUrl + '\n\n' +
      'What happens next:\n' +
      '• New leads will appear in your sheet automatically\n' +
      '• Update the Status column after contacting each lead\n' +
      '• Add Notes to track your conversations\n\n' +
      'Need help? Reply to this email.\n\n' +
      'Happy selling! 🚀\n' +
      'Team LeadFlow';
    
    MailApp.sendEmail(email, subject, body);
    Logger.log('✅ Email sent to: ' + email);
    
  } catch (error) {
    Logger.log('❌ Email failed: ' + error.message);
    throw error;
  }
}

// ============================================================================
// 🔄 BATCH ONBOARDING (For users without sheets)
// ============================================================================

/**
 * Create sheets for all users who don't have one
 * Can be run manually or via trigger
 */
function onboardAllMissingUsers() {
  Logger.log('========== BATCH ONBOARDING ==========');
  
  var config = getConfig();
  
  if (!config.SUPABASE_URL || !config.SUPABASE_KEY) {
    Logger.log('❌ Config missing! Run setupSecrets() in Config.gs first.');
    return;
  }
  
  try {
    // Get all members without sheet_url
    Logger.log('📥 Fetching users without sheets...');
    
    var response = UrlFetchApp.fetch(
      config.SUPABASE_URL + '/rest/v1/users?role=eq.member&sheet_url=is.null&select=id,name,email&order=created_at.desc',
      {
        method: 'GET',
        headers: {
          'apikey': config.SUPABASE_KEY,
          'Authorization': 'Bearer ' + config.SUPABASE_KEY
        },
        muteHttpExceptions: true
      }
    );
    
    if (response.getResponseCode() !== 200) {
      Logger.log('❌ Failed to fetch users: ' + response.getContentText());
      return;
    }
    
    var users = JSON.parse(response.getContentText());
    Logger.log('Found ' + users.length + ' users without sheets');
    Logger.log('');
    
    if (users.length === 0) {
      Logger.log('✅ All users already have sheets!');
      return { created: 0, failed: 0 };
    }
    
    var created = 0;
    var failed = 0;
    var warnings = 0;
    
    for (var i = 0; i < users.length; i++) {
      var user = users[i];
      
      Logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      Logger.log('Processing ' + (i + 1) + '/' + users.length);
      Logger.log('   Email: ' + user.email);
      Logger.log('   Name: ' + user.name);
      
      var result = onboardNewUser(user.id, user.email, user.name || 'User');
      
      if (result.success) {
        if (result.warning) {
          warnings++;
          Logger.log('⚠️ Created with warning');
          Logger.log('   Sheet: ' + result.sheetUrl);
          Logger.log('   Issue: ' + result.warning);
        } else {
          created++;
          Logger.log('✅ Created successfully');
          Logger.log('   Sheet: ' + result.sheetUrl);
        }
      } else {
        failed++;
        Logger.log('❌ Failed');
        Logger.log('   Error: ' + result.error);
      }
      
      // Wait 3 seconds between each to avoid rate limits
      if (i < users.length - 1) {
        Logger.log('⏳ Waiting 3 seconds...');
        Utilities.sleep(3000);
      }
    }
    
    Logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    Logger.log('🎉 BATCH COMPLETE!');
    Logger.log('   ✅ Created: ' + created);
    Logger.log('   ⚠️ Warnings: ' + warnings);
    Logger.log('   ❌ Failed: ' + failed);
    Logger.log('   📊 Total: ' + users.length);
    Logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    return { created: created, failed: failed, warnings: warnings };
    
  } catch (e) {
    Logger.log('❌ Batch Error: ' + e.message);
    Logger.log('Stack: ' + e.stack);
    return { error: e.message };
  }
}

// ============================================================================
// 🧪 TEST FUNCTIONS
// ============================================================================

/**
 * Test Supabase connection
 */
function testOnboardingConnection() {
  Logger.log('========== TEST ONBOARDING CONNECTION ==========');
  
  var config = getConfig();
  
  if (!config.SUPABASE_URL || !config.SUPABASE_KEY) {
    Logger.log('❌ Config missing! Run setupSecrets() first.');
    return false;
  }
  
  Logger.log('URL: ' + config.SUPABASE_URL);
  
  try {
    var response = UrlFetchApp.fetch(config.SUPABASE_URL + '/rest/v1/users?limit=5&select=id,email,name,sheet_url,role', {
      method: 'GET',
      headers: {
        'apikey': config.SUPABASE_KEY,
        'Authorization': 'Bearer ' + config.SUPABASE_KEY
      },
      muteHttpExceptions: true
    });
    
    var code = response.getResponseCode();
    
    if (code === 200) {
      var users = JSON.parse(response.getContentText());
      Logger.log('✅ Connected! Found ' + users.length + ' users');
      Logger.log('');
      
      users.forEach(function(u, index) {
        Logger.log((index + 1) + '. ' + u.email + ' (' + u.role + ')');
        Logger.log('   Name: ' + u.name);
        Logger.log('   Sheet: ' + (u.sheet_url ? '✅ YES' : '❌ NO'));
        Logger.log('');
      });
      
      return true;
    } else {
      Logger.log('❌ Error: ' + response.getContentText());
      return false;
    }
  } catch (e) {
    Logger.log('❌ Failed: ' + e.message);
    return false;
  }
}

/**
 * Test sheet creation for a specific user
 */
function testOnboardUser() {
  Logger.log('========== TEST ONBOARD USER ==========');
  
  // Replace with actual test user
  var result = onboardNewUser(
    'TEST-USER-ID',
    'test@example.com',
    'Test User'
  );
  
  Logger.log('');
  Logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  Logger.log('RESULT:');
  Logger.log(JSON.stringify(result, null, 2));
  Logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  return result;
}

/**
 * Onboarding health check
 */
function onboardingHealthCheck() {
  Logger.log('========== ONBOARDING HEALTH CHECK ==========');
  Logger.log('Module: UserOnboarding.gs');
  Logger.log('Integrated with: LeadFlow v' + SYSTEM.VERSION);
  Logger.log('Date: ' + new Date().toISOString());
  Logger.log('');
  
  var config = getConfig();
  
  Logger.log('1. Config Status:');
  Logger.log('   SUPABASE_URL: ' + (config.SUPABASE_URL ? '✅ Set' : '❌ Missing'));
  Logger.log('   SUPABASE_KEY: ' + (config.SUPABASE_KEY ? '✅ Set' : '❌ Missing'));
  Logger.log('   ADMIN_EMAIL: ' + (config.ADMIN_EMAIL ? '✅ Set' : '⚠️ Not set'));
  Logger.log('');
  
  Logger.log('2. Connection Test:');
  var connected = testOnboardingConnection();
  Logger.log('');
  
  Logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  Logger.log('Overall Status: ' + (config.SUPABASE_URL && config.SUPABASE_KEY && connected ? '✅ HEALTHY' : '⚠️ ISSUES DETECTED'));
  Logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}
