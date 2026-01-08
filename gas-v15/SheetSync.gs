/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║  LEADFLOW v15.0 - SHEETSYNC.GS (INPUT ENGINE)                              ║
 * ║  Last Updated: January 2026                                                ║
 * ║  Purpose: Sync leads from Google Sheet (Meta Ads) → Supabase Database     ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 * 
 * FLOW:
 * 1. Meta Ads → Zapier/Webhook → Google Sheet (Master Sheet)
 * 2. SheetSync.gs reads new rows from Sheet
 * 3. Validates & cleans data (junk filter)
 * 4. Batch inserts into Supabase 'leads' table
 * 5. Updates Sheet status column to prevent re-processing
 */

// ============================================================================
// 🔧 SHEET CONFIGURATION
// ============================================================================

var SHEET_CONFIG = {
  MASTER_SHEET_NAME: 'Master Sheet',  // Your main lead sheet name
  BATCH_SIZE: 50,                      // Max leads per batch insert
  SYNC_DELAY_MS: 200,                  // Delay between API calls
  
  // Status values
  STATUS: {
    NEW: '',                // Empty = new lead
    SYNCED: 'Synced',       // Successfully pushed to Supabase
    JUNK: 'Junk',           // Failed validation
    DUPLICATE: 'Duplicate', // Already exists in DB
    ERROR: 'Error'          // API error during sync
  }
};

// ============================================================================
// 🚀 MAIN SYNC FUNCTION (Entry Point)
// ============================================================================

/**
 * Main function to sync leads from Sheet to Supabase
 * Called by time-based trigger every 1 minute
 */
function syncLeadsFromSheetToSupabase() {
  var lock = LockService.getScriptLock();
  
  // Prevent concurrent runs
  if (!lock.tryLock(5000)) {
    Logger.log('⏳ Another sync is running. Skipping.');
    return { success: false, reason: 'Lock not acquired' };
  }
  
  try {
    Logger.log('');
    Logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    Logger.log('📥 SHEET → SUPABASE SYNC');
    Logger.log('   Time: ' + getTimestampIST());
    Logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Get the master sheet
    var sheet = getOrCreateMasterSheet();
    if (!sheet) {
      Logger.log('❌ Master sheet not found!');
      return { success: false, reason: 'Sheet not found' };
    }
    
    // Get all data
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) {
      Logger.log('ℹ️ No data rows in sheet');
      return { success: true, synced: 0, message: 'No data' };
    }
    
    var lastCol = sheet.getLastColumn();
    var dataRange = sheet.getRange(2, 1, lastRow - 1, lastCol);
    var data = dataRange.getValues();
    
    Logger.log('📊 Total rows: ' + data.length);
    
    // Process rows
    var stats = processSheetRows(sheet, data);
    
    Logger.log('');
    Logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    Logger.log('📊 SYNC COMPLETE');
    Logger.log('   ✅ Synced: ' + stats.synced);
    Logger.log('   🚫 Junk: ' + stats.junk);
    Logger.log('   🔁 Duplicate: ' + stats.duplicate);
    Logger.log('   ⏭️ Skipped: ' + stats.skipped);
    Logger.log('   ❌ Errors: ' + stats.errors);
    Logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    return stats;
    
  } catch (e) {
    Logger.log('❌ Sync error: ' + e.message);
    return { success: false, error: e.message };
  } finally {
    lock.releaseLock();
  }
}

// ============================================================================
// 📊 PROCESS SHEET ROWS
// ============================================================================

/**
 * Process all rows and sync valid leads
 */
function processSheetRows(sheet, data) {
  var stats = {
    synced: 0,
    junk: 0,
    duplicate: 0,
    skipped: 0,
    errors: 0
  };
  
  var leadsToInsert = [];
  var rowUpdates = []; // Track row updates for batch writing
  
  for (var i = 0; i < data.length; i++) {
    var row = data[i];
    var rowIndex = i + 2; // Row number in sheet (1-indexed, skip header)
    
    // Get current status
    var currentStatus = (row[COLUMNS.STATUS - 1] || '').toString().trim();
    
    // Skip already processed rows
    if (isRowAlreadyProcessed(currentStatus)) {
      stats.skipped++;
      continue;
    }
    
    // Extract lead data using COLUMNS config
    var lead = extractLeadData(row);
    
    // Validate lead
    var validation = validateLeadForSync(lead);
    
    if (!validation.isValid) {
      // Mark as Junk in sheet
      rowUpdates.push({
        row: rowIndex,
        status: SHEET_CONFIG.STATUS.JUNK + ': ' + validation.reason
      });
      stats.junk++;
      continue;
    }
    
    // Check for duplicate phone in this batch
    var isDuplicateInBatch = leadsToInsert.some(function(l) {
      return l.phone === lead.phone;
    });
    
    if (isDuplicateInBatch) {
      rowUpdates.push({
        row: rowIndex,
        status: SHEET_CONFIG.STATUS.DUPLICATE + ' (Batch)'
      });
      stats.duplicate++;
      continue;
    }
    
    // Add to batch
    leadsToInsert.push({
      lead: lead,
      rowIndex: rowIndex
    });
    
    // Process in batches
    if (leadsToInsert.length >= SHEET_CONFIG.BATCH_SIZE) {
      var batchResult = insertLeadsBatch(leadsToInsert);
      updateStats(stats, batchResult);
      rowUpdates = rowUpdates.concat(batchResult.rowUpdates);
      leadsToInsert = [];
      
      Utilities.sleep(SHEET_CONFIG.SYNC_DELAY_MS);
    }
  }
  
  // Process remaining leads
  if (leadsToInsert.length > 0) {
    var batchResult = insertLeadsBatch(leadsToInsert);
    updateStats(stats, batchResult);
    rowUpdates = rowUpdates.concat(batchResult.rowUpdates);
  }
  
  // Apply all status updates to sheet
  applyRowUpdates(sheet, rowUpdates);
  
  return stats;
}

/**
 * Check if row was already processed
 */
function isRowAlreadyProcessed(status) {
  if (!status) return false;
  
  var s = status.toLowerCase();
  return (
    s.indexOf('synced') !== -1 ||
    s.indexOf('junk') !== -1 ||
    s.indexOf('duplicate') !== -1 ||
    s.indexOf('sent') !== -1 ||
    s.indexOf('assigned') !== -1 ||
    s.indexOf('distributed') !== -1 ||
    s.indexOf('error') !== -1
  );
}

// ============================================================================
// 📋 EXTRACT LEAD DATA
// ============================================================================

/**
 * Extract lead data from row using COLUMNS config
 */
function extractLeadData(row) {
  // Get raw values using column indices from Config.gs
  var rawPhone = row[COLUMNS.PHONE - 1] || '';
  var rawName = row[COLUMNS.NAME - 1] || '';
  var rawCity = row[COLUMNS.CITY - 1] || '';
  var rawSource = row[COLUMNS.SOURCE - 1] || '';
  var rawDate = row[COLUMNS.DATE - 1] || '';
  
  return {
    name: cleanName(rawName) || 'Enquiry',
    phone: cleanPhone(rawPhone),
    city: normalizeCity(rawCity) || 'India',
    source: rawSource.toString().trim() || 'Meta Ads',
    created_at: parseDate(rawDate) || new Date().toISOString(),
    state: inferStateFromCity(rawCity),
    status: SYSTEM.LEAD_STATUS.NEW,
    assigned_to: null
  };
}

/**
 * Parse date from various formats
 */
function parseDate(dateValue) {
  if (!dateValue) return null;
  
  try {
    if (dateValue instanceof Date) {
      return dateValue.toISOString();
    }
    
    var d = new Date(dateValue);
    if (!isNaN(d.getTime())) {
      return d.toISOString();
    }
  } catch (e) {
    // Ignore parsing errors
  }
  
  return new Date().toISOString();
}

// ============================================================================
// ✅ LEAD VALIDATION
// ============================================================================

/**
 * Validate lead for sync
 */
function validateLeadForSync(lead) {
  // Phone validation
  if (!lead.phone) {
    return { isValid: false, reason: 'No phone' };
  }
  
  if (lead.phone.length !== 10) {
    return { isValid: false, reason: 'Invalid phone length' };
  }
  
  if (!/^\d{10}$/.test(lead.phone)) {
    return { isValid: false, reason: 'Non-numeric phone' };
  }
  
  // Repeated digits check
  if (/^(.)\1{9}$/.test(lead.phone)) {
    return { isValid: false, reason: 'Repeated digits' };
  }
  
  // Indian mobile prefix check
  if (!/^[6-9]/.test(lead.phone)) {
    return { isValid: false, reason: 'Invalid mobile prefix' };
  }
  
  // Test numbers
  if (lead.phone === '1234567890' || lead.phone === '0987654321') {
    return { isValid: false, reason: 'Test number' };
  }
  
  // Name validation (optional but good)
  var invalidNames = ['test', 'testing', 'asdf', 'abc', 'xyz', 'null', 'undefined', 'demo', 'na', 'n/a'];
  if (lead.name && invalidNames.indexOf(lead.name.toLowerCase()) !== -1) {
    return { isValid: false, reason: 'Invalid name' };
  }
  
  return { isValid: true, reason: 'OK' };
}

// ============================================================================
// 📤 BATCH INSERT TO SUPABASE
// ============================================================================

/**
 * Insert leads in batch to Supabase
 */
function insertLeadsBatch(leadsData) {
  var result = {
    synced: 0,
    duplicate: 0,
    errors: 0,
    rowUpdates: []
  };
  
  if (leadsData.length === 0) return result;
  
  var config = getConfig();
  
  if (!config.SUPABASE_URL || !config.SUPABASE_KEY) {
    Logger.log('❌ Supabase config missing!');
    leadsData.forEach(function(item) {
      result.rowUpdates.push({
        row: item.rowIndex,
        status: SHEET_CONFIG.STATUS.ERROR + ': Config missing'
      });
      result.errors++;
    });
    return result;
  }
  
  // Check for duplicates first
  var phones = leadsData.map(function(item) { return item.lead.phone; });
  var existingPhones = checkExistingPhones(phones);
  
  // Filter out duplicates
  var newLeads = [];
  leadsData.forEach(function(item) {
    if (existingPhones.indexOf(item.lead.phone) !== -1) {
      result.rowUpdates.push({
        row: item.rowIndex,
        status: SHEET_CONFIG.STATUS.DUPLICATE
      });
      result.duplicate++;
    } else {
      newLeads.push(item);
    }
  });
  
  if (newLeads.length === 0) {
    return result;
  }
  
  // Prepare payload for batch insert
  var payload = newLeads.map(function(item) {
    return {
      name: item.lead.name,
      phone: item.lead.phone,
      city: item.lead.city,
      state: item.lead.state,
      source: item.lead.source,
      status: item.lead.status,
      created_at: item.lead.created_at,
      assigned_to: null
    };
  });
  
  // Batch insert
  var url = config.SUPABASE_URL + '/rest/v1/leads';
  
  try {
    var response = UrlFetchApp.fetch(url, {
      method: 'POST',
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
    
    if (code >= 200 && code < 300) {
      // Success - mark all as synced
      newLeads.forEach(function(item) {
        result.rowUpdates.push({
          row: item.rowIndex,
          status: SHEET_CONFIG.STATUS.SYNCED
        });
        result.synced++;
      });
      
      if (LOG_CONFIG.VERBOSE) {
        Logger.log('✅ Batch inserted: ' + newLeads.length + ' leads');
      }
    } else {
      // Error
      Logger.log('⚠️ Supabase batch error [' + code + ']: ' + body);
      
      // Try individual inserts as fallback
      newLeads.forEach(function(item) {
        var singleResult = insertSingleLead(item.lead);
        if (singleResult.success) {
          result.rowUpdates.push({
            row: item.rowIndex,
            status: SHEET_CONFIG.STATUS.SYNCED
          });
          result.synced++;
        } else {
          result.rowUpdates.push({
            row: item.rowIndex,
            status: SHEET_CONFIG.STATUS.ERROR + ': ' + singleResult.error
          });
          result.errors++;
        }
      });
    }
    
  } catch (e) {
    Logger.log('❌ Batch insert failed: ' + e.message);
    
    // Mark all as error
    newLeads.forEach(function(item) {
      result.rowUpdates.push({
        row: item.rowIndex,
        status: SHEET_CONFIG.STATUS.ERROR + ': API fail'
      });
      result.errors++;
    });
  }
  
  return result;
}

/**
 * Insert single lead (fallback)
 */
function insertSingleLead(lead) {
  var config = getConfig();
  var url = config.SUPABASE_URL + '/rest/v1/leads';
  
  try {
    var response = UrlFetchApp.fetch(url, {
      method: 'POST',
      headers: {
        'apikey': config.SUPABASE_KEY,
        'Authorization': 'Bearer ' + config.SUPABASE_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      payload: JSON.stringify({
        name: lead.name,
        phone: lead.phone,
        city: lead.city,
        state: lead.state,
        source: lead.source,
        status: lead.status,
        created_at: lead.created_at
      }),
      muteHttpExceptions: true
    });
    
    var code = response.getResponseCode();
    
    if (code >= 200 && code < 300) {
      return { success: true };
    } else {
      return { success: false, error: 'HTTP ' + code };
    }
    
  } catch (e) {
    return { success: false, error: e.message };
  }
}

/**
 * Check which phones already exist in database
 */
function checkExistingPhones(phones) {
  if (!phones || phones.length === 0) return [];
  
  var config = getConfig();
  if (!config.SUPABASE_URL || !config.SUPABASE_KEY) return [];
  
  // Build query for phone check
  var phoneList = phones.map(function(p) { return '"' + p + '"'; }).join(',');
  var url = config.SUPABASE_URL + '/rest/v1/leads?phone=in.(' + phones.join(',') + ')&select=phone';
  
  try {
    var response = UrlFetchApp.fetch(url, {
      method: 'GET',
      headers: {
        'apikey': config.SUPABASE_KEY,
        'Authorization': 'Bearer ' + config.SUPABASE_KEY
      },
      muteHttpExceptions: true
    });
    
    if (response.getResponseCode() === 200) {
      var data = JSON.parse(response.getContentText());
      return data.map(function(item) { return item.phone; });
    }
  } catch (e) {
    Logger.log('⚠️ Duplicate check failed: ' + e.message);
  }
  
  return [];
}

// ============================================================================
// 📝 UPDATE SHEET STATUS
// ============================================================================

/**
 * Apply status updates to sheet (batch)
 */
function applyRowUpdates(sheet, updates) {
  if (!updates || updates.length === 0) return;
  
  var statusCol = COLUMNS.STATUS;
  
  updates.forEach(function(update) {
    try {
      sheet.getRange(update.row, statusCol).setValue(update.status);
    } catch (e) {
      Logger.log('⚠️ Failed to update row ' + update.row + ': ' + e.message);
    }
  });
  
  if (LOG_CONFIG.VERBOSE) {
    Logger.log('📝 Updated ' + updates.length + ' row statuses');
  }
}

/**
 * Update stats from batch result
 */
function updateStats(stats, batchResult) {
  stats.synced += batchResult.synced || 0;
  stats.duplicate += batchResult.duplicate || 0;
  stats.errors += batchResult.errors || 0;
}

// ============================================================================
// 📄 SHEET HELPERS
// ============================================================================

/**
 * Get or create master sheet
 */
function getOrCreateMasterSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  if (!ss) {
    Logger.log('❌ No active spreadsheet');
    return null;
  }
  
  // Try exact name match
  var sheet = ss.getSheetByName(SHEET_CONFIG.MASTER_SHEET_NAME);
  
  if (sheet) {
    return sheet;
  }
  
  // Try case-insensitive match
  var sheets = ss.getSheets();
  for (var i = 0; i < sheets.length; i++) {
    var name = sheets[i].getName().toLowerCase();
    if (name.indexOf('master') !== -1 || name.indexOf('lead') !== -1) {
      return sheets[i];
    }
  }
  
  // Return first sheet as fallback
  if (sheets.length > 0) {
    Logger.log('ℹ️ Using first sheet as fallback: ' + sheets[0].getName());
    return sheets[0];
  }
  
  return null;
}

/**
 * Get sheet by name
 */
function getSheetByName(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss ? ss.getSheetByName(name) : null;
}

// ============================================================================
// 🧪 TEST FUNCTIONS
// ============================================================================

/**
 * Test sync manually
 */
function testSheetSync() {
  Logger.log('========== TEST SHEET SYNC ==========');
  
  var result = syncLeadsFromSheetToSupabase();
  
  Logger.log('');
  Logger.log('Result: ' + JSON.stringify(result, null, 2));
  Logger.log('======================================');
}

/**
 * Test column mapping
 */
function testColumnMapping() {
  Logger.log('========== COLUMN MAPPING TEST ==========');
  
  var sheet = getOrCreateMasterSheet();
  if (!sheet) {
    Logger.log('❌ No sheet found');
    return;
  }
  
  Logger.log('Sheet: ' + sheet.getName());
  Logger.log('');
  
  // Get headers
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  Logger.log('Headers:');
  headers.forEach(function(h, i) {
    Logger.log('  Column ' + (i + 1) + ': ' + h);
  });
  
  Logger.log('');
  Logger.log('Config Mapping:');
  Logger.log('  NAME: Column ' + COLUMNS.NAME);
  Logger.log('  PHONE: Column ' + COLUMNS.PHONE);
  Logger.log('  CITY: Column ' + COLUMNS.CITY);
  Logger.log('  STATUS: Column ' + COLUMNS.STATUS);
  Logger.log('  SOURCE: Column ' + COLUMNS.SOURCE);
  
  Logger.log('');
  
  // Sample first data row
  if (sheet.getLastRow() >= 2) {
    var firstRow = sheet.getRange(2, 1, 1, sheet.getLastColumn()).getValues()[0];
    Logger.log('First Data Row:');
    Logger.log('  Name: ' + firstRow[COLUMNS.NAME - 1]);
    Logger.log('  Phone: ' + firstRow[COLUMNS.PHONE - 1]);
    Logger.log('  City: ' + firstRow[COLUMNS.CITY - 1]);
    Logger.log('  Status: ' + firstRow[COLUMNS.STATUS - 1]);
  }
  
  Logger.log('==========================================');
}

/**
 * Reset all statuses (for testing - USE WITH CAUTION)
 */
function resetAllStatuses() {
  Logger.log('⚠️ Resetting all statuses...');
  
  var sheet = getOrCreateMasterSheet();
  if (!sheet) return;
  
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return;
  
  var statusRange = sheet.getRange(2, COLUMNS.STATUS, lastRow - 1, 1);
  statusRange.clearContent();
  
  Logger.log('✅ Cleared statuses for ' + (lastRow - 1) + ' rows');
}

/**
 * Count unsynced leads
 */
function countUnsyncedLeads() {
  var sheet = getOrCreateMasterSheet();
  if (!sheet) return 0;
  
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return 0;
  
  var data = sheet.getRange(2, COLUMNS.STATUS, lastRow - 1, 1).getValues();
  
  var unsynced = 0;
  data.forEach(function(row) {
    var status = (row[0] || '').toString().trim();
    if (!isRowAlreadyProcessed(status)) {
      unsynced++;
    }
  });
  
  Logger.log('📊 Unsynced leads: ' + unsynced);
  return unsynced;
}

/**
 * Manual sync with detailed logging
 */
function manualSyncWithLogs() {
  TEST_MODE.ENABLED = false;
  LOG_CONFIG.VERBOSE = true;
  
  Logger.log('🔧 Running manual sync with detailed logging...');
  var result = syncLeadsFromSheetToSupabase();
  
  Logger.log('');
  Logger.log('📊 FINAL RESULT:');
  Logger.log(JSON.stringify(result, null, 2));
}
