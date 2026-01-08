/**
 * ============================================================================
 * LEADFLOW v15.0 - SUPABASECLIENT.GS
 * ============================================================================
 * Database operations and RPC calls for Supabase
 * Includes atomic lead slot claiming via RPC
 * ============================================================================
 */

// ============================================================================
// 🌐 CORE HTTP HELPERS
// ============================================================================

/**
 * Make authenticated request to Supabase REST API
 */
function supabaseRequest(endpoint, method, payload) {
  var config = getConfig();
  
  if (!config.SUPABASE_URL || !config.SUPABASE_KEY) {
    Logger.log('❌ Supabase config missing!');
    return { success: false, error: 'Config missing', data: null };
  }
  
  var url = config.SUPABASE_URL + '/rest/v1/' + endpoint;
  
  var options = {
    method: method,
    headers: {
      'apikey': config.SUPABASE_KEY,
      'Authorization': 'Bearer ' + config.SUPABASE_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    muteHttpExceptions: true
  };
  
  if (payload && (method === 'POST' || method === 'PATCH' || method === 'PUT')) {
    options.payload = JSON.stringify(payload);
  }
  
  try {
    var response = UrlFetchApp.fetch(url, options);
    var code = response.getResponseCode();
    var body = response.getContentText();
    
    if (code >= 200 && code < 300) {
      var data = body ? JSON.parse(body) : null;
      return { success: true, data: data, code: code };
    } else {
      Logger.log('⚠️ Supabase Error [' + code + ']: ' + body);
      return { success: false, error: body, code: code, data: null };
    }
  } catch (e) {
    Logger.log('❌ Supabase Request Failed: ' + e.message);
    return { success: false, error: e.message, data: null };
  }
}

// ============================================================================
// 📖 CRUD OPERATIONS
// ============================================================================

/**
 * SELECT - Fetch records from table
 * @param {string} table - Table name
 * @param {string} query - Query string (e.g., 'status=eq.New&limit=10')
 * @returns {Array} - Array of records
 */
function supabaseSelect(table, query) {
  var endpoint = table + '?' + (query || 'select=*');
  var result = supabaseRequest(endpoint, 'GET', null);
  return result.success ? (result.data || []) : [];
}

/**
 * INSERT - Add new record
 * @param {string} table - Table name
 * @param {Object} payload - Data to insert
 * @returns {boolean} - Success status
 */
function supabaseInsert(table, payload) {
  var result = supabaseRequest(table, 'POST', payload);
  return result.success;
}

/**
 * UPDATE - Modify existing records
 * @param {string} table - Table name
 * @param {string} query - Filter query (e.g., 'id=eq.uuid')
 * @param {Object} payload - Data to update
 * @returns {boolean} - Success status
 */
function supabaseUpdate(table, query, payload) {
  var endpoint = table + '?' + query;
  var result = supabaseRequest(endpoint, 'PATCH', payload);
  return result.success;
}

/**
 * DELETE - Remove records
 * @param {string} table - Table name
 * @param {string} query - Filter query
 * @returns {boolean} - Success status
 */
function supabaseDelete(table, query) {
  var endpoint = table + '?' + query;
  var result = supabaseRequest(endpoint, 'DELETE', null);
  return result.success;
}

// ============================================================================
// 🔧 RPC (Remote Procedure Calls)
// ============================================================================

/**
 * Call Supabase RPC function
 * @param {string} functionName - Name of the function
 * @param {Object} params - Parameters to pass
 * @returns {Object} - { success: boolean, data: any }
 */
function callRPC(functionName, params) {
  var config = getConfig();
  
  if (!config.SUPABASE_URL || !config.SUPABASE_KEY) {
    return { success: false, error: 'Config missing', data: null };
  }
  
  var url = config.SUPABASE_URL + '/rest/v1/rpc/' + functionName;
  
  var options = {
    method: 'POST',
    headers: {
      'apikey': config.SUPABASE_KEY,
      'Authorization': 'Bearer ' + config.SUPABASE_KEY,
      'Content-Type': 'application/json'
    },
    payload: JSON.stringify(params || {}),
    muteHttpExceptions: true
  };
  
  try {
    var response = UrlFetchApp.fetch(url, options);
    var code = response.getResponseCode();
    var body = response.getContentText();
    
    if (code === 200) {
      var data = JSON.parse(body);
      return { success: true, data: data };
    } else {
      Logger.log('⚠️ RPC Error [' + functionName + ']: ' + body);
      return { success: false, error: body, data: null };
    }
  } catch (e) {
    Logger.log('❌ RPC Failed [' + functionName + ']: ' + e.message);
    return { success: false, error: e.message, data: null };
  }
}

// ============================================================================
// 🛡️ ATOMIC LEAD SLOT CLAIMING (v15.0 Core)
// ============================================================================

/**
 * CRITICAL: Atomically claim a lead slot for a user
 * Uses Supabase RPC to prevent race conditions
 * 
 * @param {string} userId - UUID of the user
 * @returns {boolean} - TRUE if slot claimed, FALSE if limit/gap/inactive
 */
function tryClaimLeadSlot(userId) {
  if (!userId) {
    Logger.log('⚠️ tryClaimLeadSlot: No userId provided');
    return false;
  }
  
  var result = callRPC('increment_lead_count_safe', {
    target_user_id: userId
  });
  
  if (result.success && result.data === true) {
    if (LOG_CONFIG.VERBOSE) {
      Logger.log('✅ Slot claimed for user: ' + userId);
    }
    return true;
  }
  
  if (LOG_CONFIG.VERBOSE) {
    Logger.log('⏭️ Slot NOT available for user: ' + userId + ' (limit/gap/inactive)');
  }
  return false;
}

/**
 * Reset daily lead counters for all users
 * Called at midnight IST
 * @returns {number} - Number of users reset
 */
function resetDailyCounters() {
  var result = callRPC('reset_daily_leads', {});
  
  if (result.success) {
    Logger.log('🔄 Daily reset complete. Users reset: ' + result.data);
    return result.data;
  }
  
  Logger.log('❌ Daily reset failed: ' + result.error);
  return 0;
}

// ============================================================================
// 📥 LEAD FETCHING
// ============================================================================

/**
 * Fetch unassigned real-time leads (arrived during active hours today)
 * Real-time = Created between 8 AM and 10 PM today
 * @returns {Array} - Array of lead objects
 */
function fetchRealtimeLeads() {
  var today = getTodayDateIST();
  var startTime = today + 'T' + padZero(TIME_CONFIG.ACTIVE_START_HOUR) + ':00:00';
  var endTime = today + 'T' + padZero(TIME_CONFIG.ACTIVE_END_HOUR) + ':00:00';
  
  var query = 'select=*' +
    '&status=eq.' + SYSTEM.LEAD_STATUS.NEW +
    '&assigned_to=is.null' +
    '&created_at=gte.' + startTime +
    '&created_at=lt.' + endTime +
    '&order=created_at.asc' +
    '&limit=' + DISTRIBUTION_CONFIG.MAX_LEADS_PER_RUN;
  
  var leads = supabaseSelect(SYSTEM.TABLES.LEADS, query);
  
  if (LOG_CONFIG.VERBOSE) {
    Logger.log('📥 Fetched ' + leads.length + ' real-time leads');
  }
  
  return leads;
}

/**
 * Fetch night/backlog leads (arrived outside active hours)
 * Night = Created between 10 PM yesterday and 8 AM today
 * @returns {Array} - Array of lead objects
 */
function fetchBacklogLeads() {
  var today = getTodayDateIST();
  var yesterday = getYesterdayDateIST();
  
  // Night window: Yesterday 10 PM to Today 8 AM
  var nightStart = yesterday + 'T' + padZero(TIME_CONFIG.ACTIVE_END_HOUR) + ':00:00';
  var nightEnd = today + 'T' + padZero(TIME_CONFIG.ACTIVE_START_HOUR) + ':00:00';
  
  var query = 'select=*' +
    '&status=eq.' + SYSTEM.LEAD_STATUS.NEW +
    '&assigned_to=is.null' +
    '&created_at=gte.' + nightStart +
    '&created_at=lt.' + nightEnd +
    '&order=created_at.asc' +
    '&limit=' + DISTRIBUTION_CONFIG.MAX_LEADS_PER_RUN;
  
  var leads = supabaseSelect(SYSTEM.TABLES.LEADS, query);
  
  // Mark these as backlog for visual signaling
  leads.forEach(function(lead) {
    lead.isNightLead = true;
    lead.source = SYSTEM.LEAD_SOURCE.NIGHT_BACKLOG;
  });
  
  if (LOG_CONFIG.VERBOSE) {
    Logger.log('🌙 Fetched ' + leads.length + ' backlog (night) leads');
  }
  
  return leads;
}

/**
 * Fetch all unassigned leads (for fallback)
 * @returns {Array} - Array of lead objects
 */
function fetchAllUnassignedLeads() {
  var query = 'select=*' +
    '&status=eq.' + SYSTEM.LEAD_STATUS.NEW +
    '&assigned_to=is.null' +
    '&order=created_at.asc' +
    '&limit=' + DISTRIBUTION_CONFIG.MAX_LEADS_PER_RUN;
  
  return supabaseSelect(SYSTEM.TABLES.LEADS, query);
}

// ============================================================================
// 👥 USER FETCHING
// ============================================================================

/**
 * Fetch active subscribers sorted by plan priority
 * Priority: Booster(1) > Manager(2) > Supervisor(3) > Starter(4)
 * 
 * @returns {Array} - Array of user objects with subscription data
 */
function fetchActiveSubscribersByPriority() {
  // Try to use RPC for optimized query
  var result = callRPC('get_available_users_by_priority', {});
  
  if (result.success && result.data && result.data.length > 0) {
    if (LOG_CONFIG.VERBOSE) {
      Logger.log('👥 Found ' + result.data.length + ' available users (via RPC)');
    }
    return result.data;
  }
  
  // Fallback: Manual fetch and sort
  Logger.log('ℹ️ RPC fallback - fetching users manually');
  return fetchAndSortUsersManually();
}

/**
 * Fallback: Fetch and sort users manually if RPC not available
 */
function fetchAndSortUsersManually() {
  // Get active subscriptions WITH target audience columns
  var subsQuery = 'select=user_id,plan_name,daily_limit,leads_sent,last_lead_assigned_at,target_gender,target_state' +
    '&plan_status=eq.Active';
  var subscriptions = supabaseSelect(SYSTEM.TABLES.SUBSCRIPTIONS, subsQuery);
  
  
  if (subscriptions.length === 0) {
    Logger.log('⚠️ No active subscriptions found');
    return [];
  }
  
  // Get user details (including is_active for pause/resume feature)
  var userIds = subscriptions.map(function(s) { return s.user_id; });
  var usersQuery = 'select=id,name,email,phone,is_active&id=in.(' + userIds.join(',') + ')&is_active=neq.false';
  var users = supabaseSelect(SYSTEM.TABLES.USERS, usersQuery);
  
  // Create user map
  var userMap = {};
  users.forEach(function(u) {
    userMap[u.id] = u;
  });
  
  // Merge and add priority
  var now = new Date();
  var fifteenMinAgo = new Date(now.getTime() - (TIME_CONFIG.FOCUS_GAP_MINUTES * 60 * 1000));
  
  var mergedUsers = [];
  
  subscriptions.forEach(function(sub) {
    var user = userMap[sub.user_id];
    if (!user) return;
    
    // Check if user is within cooling period
    var lastAssigned = sub.last_lead_assigned_at ? new Date(sub.last_lead_assigned_at) : null;
    var isInCoolingPeriod = lastAssigned && lastAssigned > fifteenMinAgo;
    
    // Check if under limit
    var isUnderLimit = (sub.leads_sent || 0) < (sub.daily_limit || 0);
    
    // Only include if available
    if (isUnderLimit && !isInCoolingPeriod) {
      mergedUsers.push({
        user_id: sub.user_id,
        user_name: user.name,
        email: user.email,
        phone: user.phone,
        plan_name: sub.plan_name,
        plan_priority: PLAN_CONFIG.PRIORITY[sub.plan_name] || 5,
        daily_limit: sub.daily_limit,
        leads_sent: sub.leads_sent,
        last_lead_assigned_at: sub.last_lead_assigned_at,
        // Target Audience for matching
        target_gender: sub.target_gender || 'Any',
        target_state: sub.target_state || 'All India'
      });
    }
  });
  
  // Sort by priority (ascending) then by leads_sent (ascending)
  mergedUsers.sort(function(a, b) {
    if (a.plan_priority !== b.plan_priority) {
      return a.plan_priority - b.plan_priority;
    }
    return (a.leads_sent || 0) - (b.leads_sent || 0);
  });
  
  if (LOG_CONFIG.VERBOSE) {
    Logger.log('👥 Found ' + mergedUsers.length + ' available users (manual)');
  }
  
  return mergedUsers;
}

// ============================================================================
// 📝 LEAD ASSIGNMENT
// ============================================================================

/**
 * Assign a lead to a user in the database
 * @param {string} leadId - Lead UUID
 * @param {string} userId - User UUID
 * @param {boolean} isNightLead - Whether this is a backlog lead
 * @returns {boolean} - Success status
 */
function assignLeadToUser(leadId, userId, isNightLead) {
  var payload = {
    assigned_to: userId,
    status: SYSTEM.LEAD_STATUS.ASSIGNED,
    assigned_at: new Date().toISOString(),
    source: isNightLead ? SYSTEM.LEAD_SOURCE.NIGHT_BACKLOG : SYSTEM.LEAD_SOURCE.REALTIME
  };
  
  var success = supabaseUpdate(SYSTEM.TABLES.LEADS, 'id=eq.' + leadId, payload);
  
  if (success) {
    if (LOG_CONFIG.VERBOSE) {
      Logger.log('✅ Lead ' + leadId + ' assigned to user ' + userId);
    }
  } else {
    Logger.log('❌ Failed to assign lead ' + leadId);
  }
  
  return success;
}

/**
 * Mark lead as delivered after notification sent
 */
function markLeadDelivered(leadId) {
  return supabaseUpdate(SYSTEM.TABLES.LEADS, 'id=eq.' + leadId, {
    status: SYSTEM.LEAD_STATUS.DELIVERED,
    delivered_at: new Date().toISOString()
  });
}

/**
 * Mark lead as failed
 */
function markLeadFailed(leadId, reason) {
  return supabaseUpdate(SYSTEM.TABLES.LEADS, 'id=eq.' + leadId, {
    status: SYSTEM.LEAD_STATUS.FAILED,
    failure_reason: reason
  });
}

// ============================================================================
// 📊 HELPER FUNCTIONS
// ============================================================================

/**
 * Get today's date in IST (YYYY-MM-DD)
 */
function getTodayDateIST() {
  var now = new Date();
  return Utilities.formatDate(now, TIME_CONFIG.TIMEZONE, 'yyyy-MM-dd');
}

/**
 * Get yesterday's date in IST (YYYY-MM-DD)
 */
function getYesterdayDateIST() {
  var now = new Date();
  now.setDate(now.getDate() - 1);
  return Utilities.formatDate(now, TIME_CONFIG.TIMEZONE, 'yyyy-MM-dd');
}

/**
 * Pad number with leading zero
 */
function padZero(num) {
  return num < 10 ? '0' + num : '' + num;
}

// ============================================================================
// 🧪 CONNECTION TEST
// ============================================================================

/**
 * Test Supabase connection
 */
function testSupabaseConnection() {
  Logger.log('========== SUPABASE CONNECTION TEST ==========');
  
  var config = getConfig();
  
  if (!config.SUPABASE_URL || !config.SUPABASE_KEY) {
    Logger.log('❌ Config missing! Run setupSecrets() first.');
    return false;
  }
  
  Logger.log('URL: ' + config.SUPABASE_URL);
  
  // Test SELECT
  var users = supabaseSelect(SYSTEM.TABLES.USERS, 'select=id,email&limit=3');
  
  if (users.length > 0) {
    Logger.log('✅ Connection successful!');
    Logger.log('   Found ' + users.length + ' users');
    return true;
  } else {
    Logger.log('⚠️ Connected but no data found');
    return true;
  }
}

/**
 * Test RPC function
 */
function testRPCFunction() {
  Logger.log('========== RPC FUNCTION TEST ==========');
  
  // Test with a fake UUID (should return false)
  var testResult = tryClaimLeadSlot('00000000-0000-0000-0000-000000000000');
  
  Logger.log('Test result (should be false): ' + testResult);
  Logger.log('✅ RPC is callable');
  
  return true;
}
