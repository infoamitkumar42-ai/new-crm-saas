/**
 * ============================================================================
 * LEADFLOW v15.0 - LEADDISTRIBUTOR.GS
 * ============================================================================
 * THE MAIN DISTRIBUTION ENGINE
 * Implements all 6 rules: Time gates, 2:1 ratio, priority, atomic RPC
 * ============================================================================
 */

// ============================================================================
// 🚀 MAIN DISTRIBUTION FUNCTION (Entry Point)
// ============================================================================

/**
 * Main distribution function - Called by time-based trigger
 * Implements all v15.0 rules
 */
function distributeLeadsV15() {
  Logger.log('');
  Logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  Logger.log('🚀 LEADFLOW v15.0 DISTRIBUTION ENGINE');
  Logger.log('   Time: ' + getTimestampIST());
  Logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  // =========================================================================
  // RULE A: TIME GATE CHECK (8 AM - 10 PM)
  // =========================================================================
  
  // 🔒 PREVENT CONCURRENT EXECUTIONS
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000); 
  } catch (e) {
    Logger.log('⚠️ Could not obtain lock. Another distribution is running.');
    return { success: false, reason: 'Locked', distributed: 0 };
  }

  if (!isWithinActiveHours()) {
    Logger.log('⏰ Outside active hours (8 AM - 10 PM). Exiting.');
    Logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    lock.releaseLock();
    return { success: false, reason: 'Outside active hours', distributed: 0 };
  }
  
  Logger.log('✅ Time gate passed. Current hour: ' + getCurrentHourIST());
  
  // =========================================================================
  // STEP 1: FETCH LEAD QUEUES
  // =========================================================================
  
  Logger.log('');
  Logger.log('📥 FETCHING LEADS...');
  
  var realtimeLeads = fetchRealtimeLeads();
  var backlogLeads = [];
  
  Logger.log('   Real-time leads: ' + realtimeLeads.length);
  
  // =========================================================================
  // RULE B & C: BACKLOG RELEASE & 2:1 RATIO (After 11 AM)
  // =========================================================================
  
  var isAfter11AM = true; // FORCE ENABLE: User Request to disable 11 AM wait time
  var mixedQueue = [];
  
  if (isAfter11AM) {
    Logger.log('   ⏰ After 11 AM - Fetching backlog leads...');
    backlogLeads = fetchBacklogLeads();
    Logger.log('   Backlog leads: ' + backlogLeads.length);
    
    mixedQueue = mixLeadsWithRatio(realtimeLeads, backlogLeads);
  } else {
    Logger.log('   ⏰ Before 11 AM - Only real-time leads');
    mixedQueue = realtimeLeads;
  }
  
  // =========================================================================
  // STEP 2: FILTER JUNK LEADS
  // =========================================================================
  
  Logger.log('');
  Logger.log('🚫 FILTERING JUNK LEADS...');
  
  var validLeads = filterValidLeads(mixedQueue);
  Logger.log('   Valid leads after filter: ' + validLeads.length);
  
  if (validLeads.length === 0) {
    Logger.log('⚠️ No valid leads to distribute.');
    Logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    return { success: true, reason: 'No valid leads', distributed: 0 };
  }
  
  // =========================================================================
  // STEP 3: FETCH USERS BY PRIORITY
  // =========================================================================
  
  Logger.log('');
  Logger.log('👥 FETCHING USERS BY PRIORITY...');
  Logger.log('   Order: Booster(1) > Manager(2) > Supervisor(3) > Starter(4)');
  
  var availableUsers = fetchActiveSubscribersByPriority();
  Logger.log('   Available users: ' + availableUsers.length);
  
  if (availableUsers.length === 0) {
    Logger.log('⚠️ No available users (all at limit or in cooling period).');
    Logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    return { success: true, reason: 'No available users', distributed: 0 };
  }
  
  // =========================================================================
  // STEP 4: DISTRIBUTION LOOP (Strict Round-Robin + Audience Matching)
  // =========================================================================
  
  Logger.log('');
  Logger.log('📤 DISTRIBUTING LEADS (Strict Round-Robin + Audience Match)...');
  
  var distributedCount = 0;
  var failedCount = 0;
  var noMatchCount = 0;
  var leadIndex = 0;
  
  var allAvailableUsers = availableUsers.slice();
  
  while (leadIndex < validLeads.length) {
    var lead = validLeads[leadIndex];
    var assigned = false;
    
    // 1. Filter Users by Audience
    var matchingUsers = filterUsersForLead(allAvailableUsers, lead);
    
    if (matchingUsers.length === 0) {
      Logger.log('🎯 Lead ' + (lead.name || lead.id) + ' (' + (lead.city || 'Unknown') + ') - No matching users');
      noMatchCount++;
      leadIndex++;
      continue;
    }
    
    // 2. Strict Priority Selection (Round-Robin)
    var candidatePool = matchingUsers.slice();
    
    while (candidatePool.length > 0) {
      var selectedUser = getPriorityUser(candidatePool);
      
      if (!selectedUser) break; 
      
      var slotClaimed = tryClaimLeadSlot(selectedUser.user_id);
      
      if (slotClaimed) {
        var assignSuccess = assignLeadToUser(lead.id, selectedUser.user_id, lead.isNightLead);
        
        if (assignSuccess) {
          sendLeadNotification(selectedUser, lead, lead.isNightLead);
          
          Logger.log('✅ Lead → ' + (selectedUser.user_name || selectedUser.email) + 
                    ' (' + selectedUser.plan_name + ')' +
                    ' [' + (selectedUser.target_state || 'All India') + ']' +
                    (lead.isNightLead ? ' 🟦' : ''));
          
          distributedCount++;
          assigned = true;
          
          // CRITICAL FIX: Update in-memory lead count for rotation accuracy
          selectedUser.leads_today = (selectedUser.leads_today || 0) + 1;
          
          var masterUser = allAvailableUsers.find(function(u) { return u.user_id === selectedUser.user_id; });
          if (masterUser) {
            masterUser.leads_today = (masterUser.leads_today || 0) + 1;
          }
          
          Logger.log('🔄 Updated in-memory count: ' + selectedUser.leads_today);
          
          break;
        }
      } else {
        var poolIdx = candidatePool.findIndex(function(u) { return u.user_id === selectedUser.user_id; });
        if (poolIdx !== -1) candidatePool.splice(poolIdx, 1);
        
        var masterIdx = allAvailableUsers.findIndex(function(u) { return u.user_id === selectedUser.user_id; });
        if (masterIdx !== -1) allAvailableUsers.splice(masterIdx, 1);
      }
    }
    
    if (!assigned) {
      Logger.log('⏭️ Lead ' + lead.id + ' skipped - Matching users exhausted/busy');
      failedCount++;
    }
    
    leadIndex++;
    
    if (distributedCount > 0 && distributedCount % 5 === 0) {
      Utilities.sleep(DISTRIBUTION_CONFIG.API_DELAY_MS);
    }
  }
  
  // =========================================================================
  // SUMMARY
  // =========================================================================
  
  Logger.log('');
  Logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  Logger.log('📊 DISTRIBUTION COMPLETE');
  Logger.log('   ✅ Distributed: ' + distributedCount);
  Logger.log('   🎯 No audience match: ' + noMatchCount);
  Logger.log('   ⏭️ Skipped (exhausted): ' + failedCount);
  Logger.log('   📥 Total processed: ' + leadIndex);  
  Logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  try {
    lock.releaseLock();
  } catch (e) {
    Logger.log('⚠️ Error releasing lock: ' + e.message);
  }

  return {
    success: true,
    distributed: distributedCount,
    skipped: failedCount,
    processed: leadIndex
  };
}

// ============================================================================
// 🔄 ALTERNATIVE: Round-Robin Distribution
// ============================================================================

function distributeLeadsRoundRobin() {
  Logger.log('🔄 Running Round-Robin Distribution...');
  
  if (!isWithinActiveHours()) {
    Logger.log('⏰ Outside active hours.');
    return;
  }
  
  var leads = filterValidLeads(fetchAllUnassignedLeads());
  if (leads.length === 0) {
    Logger.log('No leads to distribute.');
    return;
  }
  
  var distributed = 0;
  
  for (var i = 0; i < leads.length; i++) {
    var lead = leads[i];
    var users = fetchActiveSubscribersByPriority();
    
    if (users.length === 0) {
      Logger.log('No more available users. Stopping.');
      break;
    }
    
    var user = users[0];
    
    if (tryClaimLeadSlot(user.user_id)) {
      if (assignLeadToUser(lead.id, user.user_id, isNightLead(lead.created_at))) {
        sendLeadNotification(user, lead, isNightLead(lead.created_at));
        distributed++;
      }
    }
    
    Utilities.sleep(200);
  }
  
  Logger.log('✅ Distributed: ' + distributed + ' leads');
}

// ============================================================================
// 📊 HEALTH CHECK
// ============================================================================

function distributorHealthCheck() {
  Logger.log('========== DISTRIBUTOR HEALTH CHECK ==========');
  Logger.log('Version: ' + SYSTEM.VERSION);
  Logger.log('Time: ' + getTimestampIST());
  Logger.log('');
  
  Logger.log('⏰ Time Status:');
  Logger.log('   Current Hour (IST): ' + getCurrentHourIST());
  Logger.log('   Within Active Hours: ' + isWithinActiveHours());
  Logger.log('   After Backlog Release: ' + isAfterBacklogRelease());
  Logger.log('');
  
  Logger.log('📥 Lead Queues:');
  var rt = fetchRealtimeLeads();
  var bl = fetchBacklogLeads();
  Logger.log('   Real-time: ' + rt.length);
  Logger.log('   Backlog: ' + bl.length);
  Logger.log('');
  
  Logger.log('👥 User Availability:');
  var users = fetchActiveSubscribersByPriority();
  Logger.log('   Available users: ' + users.length);
  
  if (users.length > 0) {
    users.slice(0, 5).forEach(function(u, i) {
      Logger.log('   ' + (i+1) + '. ' + u.plan_name + ' - ' + (u.user_name || u.email) + 
                ' (' + u.leads_sent + '/' + u.daily_limit + ')');
    });
  }
  
  Logger.log('');
  Logger.log('✅ Health check complete.');
}
