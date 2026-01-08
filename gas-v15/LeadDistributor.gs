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
  
  if (!isWithinActiveHours()) {
    Logger.log('⏰ Outside active hours (8 AM - 10 PM). Exiting.');
    Logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
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
  
  var isAfter11AM = isAfterBacklogRelease();
  var mixedQueue = [];
  
  if (isAfter11AM) {
    Logger.log('   ⏰ After 11 AM - Fetching backlog leads...');
    backlogLeads = fetchBacklogLeads();
    Logger.log('   Backlog leads: ' + backlogLeads.length);
    
    // Apply 2:1 ratio mixing
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
  // STEP 4: DISTRIBUTION LOOP (Speed Logic + Audience Matching)
  // =========================================================================
  
  Logger.log('');
  Logger.log('📤 DISTRIBUTING LEADS (with Target Audience Matching)...');
  
  var distributedCount = 0;
  var failedCount = 0;
  var noMatchCount = 0;
  var leadIndex = 0;
  
  // Master user list (we'll filter per lead)
  var allAvailableUsers = availableUsers.slice();
  
  while (leadIndex < validLeads.length) {
    var lead = validLeads[leadIndex];
    var assigned = false;
    
    // =====================================================
    // NEW: FILTER USERS BY TARGET AUDIENCE FOR THIS LEAD
    // =====================================================
    // Get users whose target_gender and target_state match this lead
    var matchingUsers = filterUsersForLead(allAvailableUsers, lead);
    
    if (matchingUsers.length === 0) {
      // No users match this lead's profile (gender/state mismatch)
      Logger.log('🎯 Lead ' + (lead.name || lead.id) + ' (' + (lead.city || 'Unknown') + ') - No matching users');
      noMatchCount++;
      leadIndex++;
      continue;
    }
    
    // Try each MATCHING user in priority order
    for (var i = 0; i < matchingUsers.length; i++) {
      var user = matchingUsers[i];
      
      // RULE F: Atomic slot claiming via RPC
      // This checks: Active + Under limit + 15-min gap
      var slotClaimed = tryClaimLeadSlot(user.user_id);
      
      if (slotClaimed) {
        // Assign lead to this user
        var assignSuccess = assignLeadToUser(lead.id, user.user_id, lead.isNightLead);
        
        if (assignSuccess) {
          // RULE D: Send notification with visual signaling
          sendLeadNotification(user, lead, lead.isNightLead);
          
          Logger.log('✅ Lead → ' + (user.user_name || user.email) + 
                    ' (' + user.plan_name + ')' +
                    ' [' + (user.target_state || 'All India') + ']' +
                    (lead.isNightLead ? ' 🟦' : ''));
          
          distributedCount++;
          assigned = true;
          
          // Remove this user from master list (they're now in cooling period)
          var userIdx = allAvailableUsers.findIndex(function(u) { return u.user_id === user.user_id; });
          if (userIdx !== -1) {
            allAvailableUsers.splice(userIdx, 1);
          }
          
          break;
        }
      } else {
        // User is not available (limit/gap/inactive)
        // Speed Logic: DO NOT WAIT - Remove from master list and try next
        var userIdx = allAvailableUsers.findIndex(function(u) { return u.user_id === user.user_id; });
        if (userIdx !== -1) {
          allAvailableUsers.splice(userIdx, 1);
        }
      }
    }
    
    if (!assigned) {
      // No matching user could take this lead
      Logger.log('⏭️ Lead ' + lead.id + ' skipped - Matching users exhausted');
      failedCount++;
    }
    
    leadIndex++;
    
    // Small delay to prevent API rate limiting
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

/**
 * Distribute leads using round-robin among available users
 * Ensures fair distribution across all priority levels
 */
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
    
    // Get fresh list of available users for each lead
    var users = fetchActiveSubscribersByPriority();
    
    if (users.length === 0) {
      Logger.log('No more available users. Stopping.');
      break;
    }
    
    // Try the highest priority available user
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
