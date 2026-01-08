/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║  LEADFLOW v15.0 - TRIGGERS.GS (COMPLETE AUTOMATION)                        ║
 * ║  Last Updated: January 2026                                                ║
 * ║  Triggers:                                                                 ║
 * ║  - ✅ Sheet Sync (Every 1 min) - Meta Ads → Supabase                       ║
 * ║  - ✅ Lead Distribution (Every 5 min) - Supabase → Users                   ║
 * ║  - ✅ Midnight Reset (12:05 AM IST)                                        ║
 * ║  - ✅ Health Check (Every 6 hours)                                         ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 */

// ============================================================================
// 🚀 MAIN TRIGGER SETUP - Run this ONCE after deployment
// ============================================================================

/**
 * Setup all production triggers
 * Run this once after deploying v15.0
 */
function setupAllTriggers() {
  Logger.log('');
  Logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  Logger.log('🔧 SETTING UP LEADFLOW v15.0 TRIGGERS');
  Logger.log('   Time: ' + new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
  Logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  // Clear existing triggers first
  clearAllTriggers();
  
  var triggersCreated = 0;
  
  // ═══════════════════════════════════════════════════════════════════════
  // 1️⃣ SHEET SYNC - Every 1 minute (INPUT ENGINE)
  // ═══════════════════════════════════════════════════════════════════════
  try {
    ScriptApp.newTrigger('syncLeadsFromSheetToSupabase')
      .timeBased()
      .everyMinutes(1)
      .create();
    Logger.log('✅ 1. Sheet Sync: Every 1 minute (Meta Ads → Supabase)');
    triggersCreated++;
  } catch (e) {
    Logger.log('❌ Sheet Sync trigger failed: ' + e.message);
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // 2️⃣ LEAD DISTRIBUTION - Every 5 minutes (OUTPUT ENGINE)
  // ═══════════════════════════════════════════════════════════════════════
  try {
    ScriptApp.newTrigger('distributeLeadsV15')
      .timeBased()
      .everyMinutes(5)
      .create();
    Logger.log('✅ 2. Lead Distribution: Every 5 minutes (Supabase → Users)');
    triggersCreated++;
  } catch (e) {
    Logger.log('❌ Distribution trigger failed: ' + e.message);
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // 3️⃣ MIDNIGHT RESET - Daily at 12:05 AM IST
  // ═══════════════════════════════════════════════════════════════════════
  try {
    ScriptApp.newTrigger('midnightReset')
      .timeBased()
      .atHour(0)
      .nearMinute(5)
      .everyDays(1)
      .inTimezone(TIME_CONFIG.TIMEZONE)
      .create();
    Logger.log('✅ 3. Midnight Reset: Daily at 12:05 AM IST');
    triggersCreated++;
  } catch (e) {
    Logger.log('❌ Midnight reset trigger failed: ' + e.message);
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // 4️⃣ HEALTH CHECK - Every 6 hours
  // ═══════════════════════════════════════════════════════════════════════
  try {
    ScriptApp.newTrigger('scheduledHealthCheck')
      .timeBased()
      .everyHours(6)
      .create();
    Logger.log('✅ 4. Health Check: Every 6 hours');
    triggersCreated++;
  } catch (e) {
    Logger.log('❌ Health check trigger failed: ' + e.message);
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // 5️⃣ ON SHEET CHANGE - Instant processing (optional)
  // ═══════════════════════════════════════════════════════════════════════
  try {
    ScriptApp.newTrigger('onSheetChange')
      .forSpreadsheet(SpreadsheetApp.getActiveSpreadsheet())
      .onChange()
      .create();
    Logger.log('✅ 5. On Sheet Change: Instant processing');
    triggersCreated++;
  } catch (e) {
    Logger.log('⚠️ On Change trigger failed (non-critical): ' + e.message);
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // 6️⃣ USER ONBOARDING CHECK - Every hour (create missing sheets)
  // ═══════════════════════════════════════════════════════════════════════
  try {
    ScriptApp.newTrigger('onboardAllMissingUsers')
      .timeBased()
      .everyHours(1)
      .create();
    Logger.log('✅ 6. User Onboarding: Hourly (create missing sheets)');
    triggersCreated++;
  } catch (e) {
    Logger.log('❌ Onboarding trigger failed: ' + e.message);
  }
  
  Logger.log('');
  Logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  Logger.log('🎉 TRIGGER SETUP COMPLETE!');
  Logger.log('   Triggers created: ' + triggersCreated);
  Logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  listAllTriggers();
}

/**
 * Clear all existing triggers
 */
function clearAllTriggers() {
  var triggers = ScriptApp.getProjectTriggers();
  Logger.log('🗑️ Removing ' + triggers.length + ' existing triggers...');
  
  triggers.forEach(function(trigger) {
    ScriptApp.deleteTrigger(trigger);
  });
  
  Logger.log('✅ All triggers cleared');
}

/**
 * List all active triggers
 */
function listAllTriggers() {
  var triggers = ScriptApp.getProjectTriggers();
  
  Logger.log('');
  Logger.log('📋 ACTIVE TRIGGERS: ' + triggers.length);
  Logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  if (triggers.length === 0) {
    Logger.log('   ❌ No triggers found. Run setupAllTriggers()');
    return;
  }
  
  triggers.forEach(function(t, i) {
    Logger.log((i + 1) + '. ' + t.getHandlerFunction());
    Logger.log('   Type: ' + t.getEventType());
    Logger.log('   ID: ' + t.getUniqueId());
  });
  
  Logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

// ============================================================================
// ⏰ SCHEDULED FUNCTIONS
// ============================================================================

/**
 * Midnight reset - Resets daily lead counters
 * Triggered daily at 12:00 AM IST
 */
function midnightReset() {
  Logger.log('');
  Logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  Logger.log('🌙 MIDNIGHT RESET');
  Logger.log('   Time: ' + getTimestampIST());
  Logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  try {
    // Reset counters via RPC
    var resetCount = resetDailyCounters();
    
    Logger.log('✅ Reset complete. Users reset: ' + resetCount);
    
    // Send admin notification
    sendAdminAlert('Daily Reset Complete', 
      'Lead counters have been reset for ' + resetCount + ' users.\n' +
      'New distribution cycle begins at 8:00 AM.'
    );
    
  } catch (e) {
    Logger.log('❌ Midnight reset failed: ' + e.message);
    sendAdminAlert('Midnight Reset FAILED', 'Error: ' + e.message);
  }
}

/**
 * Scheduled health check
 * Triggered every 6 hours
 */
function scheduledHealthCheck() {
  Logger.log('');
  Logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  Logger.log('🏥 SCHEDULED HEALTH CHECK');
  Logger.log('   Time: ' + getTimestampIST());
  Logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  var issues = [];
  
  // Check 1: Supabase connection
  try {
    var users = supabaseSelect(SYSTEM.TABLES.USERS, 'select=id&limit=1');
    if (users.length === 0) {
      issues.push('⚠️ No users in database');
    }
    Logger.log('✅ Supabase connection: OK');
  } catch (e) {
    issues.push('❌ Supabase connection failed: ' + e.message);
    Logger.log('❌ Supabase connection: FAILED');
  }
  
  // Check 2: Pending leads count
  try {
    var pendingLeads = fetchAllUnassignedLeads();
    Logger.log('📥 Pending leads: ' + pendingLeads.length);
    
    if (pendingLeads.length > 100) {
      issues.push('⚠️ High pending leads: ' + pendingLeads.length);
    }
  } catch (e) {
    issues.push('❌ Lead fetch failed: ' + e.message);
  }
  
  // Check 3: Available users
  try {
    var availableUsers = fetchActiveSubscribersByPriority();
    Logger.log('👥 Available users: ' + availableUsers.length);
    
    if (availableUsers.length === 0 && isWithinActiveHours()) {
      issues.push('⚠️ No available users during active hours');
    }
  } catch (e) {
    issues.push('❌ User fetch failed: ' + e.message);
  }
  
  // Check 4: Sheet sync status
  try {
    var unsyncedCount = countUnsyncedLeads();
    Logger.log('📊 Unsynced sheet leads: ' + unsyncedCount);
    
    if (unsyncedCount > 50) {
      issues.push('⚠️ High unsynced leads in sheet: ' + unsyncedCount);
    }
  } catch (e) {
    Logger.log('⚠️ Could not check sheet: ' + e.message);
  }
  
  // Check 5: Trigger status
  var triggers = ScriptApp.getProjectTriggers();
  Logger.log('⏰ Active triggers: ' + triggers.length);
  
  if (triggers.length < 4) {
    issues.push('⚠️ Missing triggers. Expected 4+, found ' + triggers.length);
  }
  
  // Report issues
  if (issues.length > 0) {
    Logger.log('');
    Logger.log('⚠️ ISSUES FOUND:');
    issues.forEach(function(issue) {
      Logger.log('   ' + issue);
    });
    
    sendAdminAlert('Health Check Issues', issues.join('\n'));
  } else {
    Logger.log('');
    Logger.log('✅ All systems healthy!');
  }
  
  Logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

/**
 * On sheet change - Instant sync
 */
function onSheetChange(e) {
  Logger.log('🔔 Sheet change detected');
  
  // Quick sync for new rows
  try {
    // Only run during active hours to save quota
    if (isWithinActiveHours()) {
      Utilities.sleep(2000); // Wait for row to fully populate
      syncLeadsFromSheetToSupabase();
    }
  } catch (e) {
    Logger.log('⚠️ onSheetChange error: ' + e.message);
  }
}

// ============================================================================
// 🧪 MANUAL TRIGGER FUNCTIONS
// ============================================================================

/**
 * Manually trigger Sheet → Supabase sync
 */
function manualSync() {
  Logger.log('🔧 Manual sync triggered');
  syncLeadsFromSheetToSupabase();
}

/**
 * Manually trigger distribution
 */
function manualDistribute() {
  Logger.log('🔧 Manual distribution triggered');
  distributeLeadsV15();
}

/**
 * Manually trigger midnight reset
 */
function manualReset() {
  Logger.log('🔧 Manual reset triggered');
  midnightReset();
}

/**
 * Manually trigger health check
 */
function manualHealthCheck() {
  Logger.log('🔧 Manual health check triggered');
  scheduledHealthCheck();
}

/**
 * Run full pipeline manually (Sync → Distribute)
 */
function runFullPipeline() {
  Logger.log('');
  Logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  Logger.log('🚀 RUNNING FULL PIPELINE');
  Logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  // Step 1: Sync
  Logger.log('');
  Logger.log('📥 STEP 1: SHEET → SUPABASE SYNC');
  var syncResult = syncLeadsFromSheetToSupabase();
  Logger.log('Sync result: ' + JSON.stringify(syncResult));
  
  Utilities.sleep(1000);
  
  // Step 2: Distribute
  Logger.log('');
  Logger.log('📤 STEP 2: SUPABASE → USERS DISTRIBUTION');
  var distResult = distributeLeadsV15();
  Logger.log('Distribution result: ' + JSON.stringify(distResult));
  
  Logger.log('');
  Logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  Logger.log('🎉 FULL PIPELINE COMPLETE');
  Logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

// ============================================================================
// 📊 SYSTEM STATUS
// ============================================================================

/**
 * Get complete system status
 */
function getSystemStatus() {
  Logger.log('');
  Logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  Logger.log('📊 LEADFLOW v' + SYSTEM.VERSION + ' SYSTEM STATUS');
  Logger.log('   Time: ' + getTimestampIST());
  Logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  Logger.log('');
  
  // Time status
  Logger.log('⏰ TIME STATUS:');
  Logger.log('   Current Hour (IST): ' + getCurrentHourIST());
  Logger.log('   Within Active Hours (8-22): ' + isWithinActiveHours());
  Logger.log('   After Backlog Release (11+): ' + isAfterBacklogRelease());
  Logger.log('');
  
  // Config status
  var config = getConfig();
  Logger.log('🔧 CONFIG STATUS:');
  Logger.log('   Supabase URL: ' + (config.SUPABASE_URL ? '✅' : '❌'));
  Logger.log('   Supabase Key: ' + (config.SUPABASE_KEY ? '✅' : '❌'));
  Logger.log('   Admin Email: ' + (config.ADMIN_EMAIL ? '✅' : '⚠️'));
  Logger.log('   WhatsApp API: ' + (config.WHATSAPP_API_URL ? '✅' : '⚠️'));
  Logger.log('');
  
  // Sheet status
  Logger.log('📊 SHEET STATUS:');
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet();
    if (sheet) {
      Logger.log('   Spreadsheet: ✅ ' + sheet.getName());
      var masterSheet = sheet.getSheets()[0];
      Logger.log('   Master Sheet: ' + masterSheet.getName() + ' (' + masterSheet.getLastRow() + ' rows)');
      var unsynced = countUnsyncedLeads();
      Logger.log('   Unsynced leads: ' + unsynced);
    }
  } catch (e) {
    Logger.log('   ⚠️ Could not access sheet');
  }
  Logger.log('');
  
  // Trigger status
  listAllTriggers();
  
  Logger.log('');
  Logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

// ============================================================================
// 🛑 EMERGENCY CONTROLS
// ============================================================================

/**
 * EMERGENCY: Stop all triggers
 */
function emergencyStop() {
  Logger.log('🛑 EMERGENCY STOP - Deleting all triggers');
  clearAllTriggers();
  Logger.log('✅ All triggers deleted. System is now STOPPED.');
  Logger.log('Run setupAllTriggers() to restart.');
}

/**
 * Pause distribution only (keep sync running)
 */
function pauseDistribution() {
  Logger.log('⏸️ Pausing distribution...');
  
  var triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(function(t) {
    if (t.getHandlerFunction() === 'distributeLeadsV15') {
      ScriptApp.deleteTrigger(t);
      Logger.log('✅ Distribution trigger removed');
    }
  });
}

/**
 * Resume distribution
 */
function resumeDistribution() {
  Logger.log('▶️ Resuming distribution...');
  
  ScriptApp.newTrigger('distributeLeadsV15')
    .timeBased()
    .everyMinutes(5)
    .create();
  
  Logger.log('✅ Distribution trigger restored');
}
