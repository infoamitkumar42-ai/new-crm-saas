/**
 * ============================================================================
 * LEADFLOW v15.0 - SUPABASECLIENT.GS
 * ============================================================================
 * Database operations and RPC calls for Supabase
 * Includes atomic lead slot claiming via RPC
 * ============================================================================
 */

// ============================================================================
// 🛡️ FALLBACK DEFINITIONS (In case Config.gs loads after this file)
// ============================================================================

if (typeof SYSTEM === 'undefined') {
  var SYSTEM = {
    VERSION: '15.0',
    NAME: 'LeadFlow',
    TABLES: {
      USERS: 'users',
      LEADS: 'leads',
      SUBSCRIPTIONS: 'users_subscription'
    },
    LEAD_STATUS: {
      NEW: 'New',
      ASSIGNED: 'Assigned',
      DELIVERED: 'Delivered',
      FAILED: 'Failed'
    },
    LEAD_SOURCE: {
      REALTIME: 'Realtime',
      NIGHT_BACKLOG: 'Night_Backlog'
    }
  };
}

if (typeof TIME_CONFIG === 'undefined') {
  var TIME_CONFIG = {
    TIMEZONE: 'Asia/Kolkata',
    ACTIVE_START_HOUR: 8,
    ACTIVE_END_HOUR: 22,
    BACKLOG_RELEASE_HOUR: 11,
    FOCUS_GAP_MINUTES: 15
  };
}

if (typeof DISTRIBUTION_CONFIG === 'undefined') {
  var DISTRIBUTION_CONFIG = {
    MAX_LEADS_PER_RUN: 100,
    API_DELAY_MS: 200,
    REALTIME_TO_BACKLOG_RATIO: 2,
    FOCUS_GAP_MINUTES: 15
  };
}

if (typeof LOG_CONFIG === 'undefined') {
  var LOG_CONFIG = { VERBOSE: true };
}

// ============================================================================
// 🌐 CORE HTTP HELPERS
// ============================================================================

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

function supabaseSelect(table, query) {
  var endpoint = table + '?' + (query || 'select=*');
  var result = supabaseRequest(endpoint, 'GET', null);
  return result.success ? (result.data || []) : [];
}

function supabaseInsert(table, payload) {
  var result = supabaseRequest(table, 'POST', payload);
  return result.success;
}

function supabaseUpdate(table, query, payload) {
  var endpoint = table + '?' + query;
  var result = supabaseRequest(endpoint, 'PATCH', payload);
  return result.success;
}

function supabaseDelete(table, query) {
  var endpoint = table + '?' + query;
  var result = supabaseRequest(endpoint, 'DELETE', null);
  return result.success;
}

// ============================================================================
// 🔧 RPC (Remote Procedure Calls)
// ============================================================================

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

function tryClaimLeadSlot(userId) {
  if (!userId) return false;
  
  // 1. Fetch limit first (to pass to RPC)
  var userQuery = 'select=daily_limit&id=eq.' + userId;
  var users = supabaseSelect(SYSTEM.TABLES.USERS, userQuery);
  if (users.length === 0) return false;
  
  var dailyLimit = users[0].daily_limit || 0;
  if (dailyLimit <= 0) return false;

  // 2. Call Atomic RPC
  var result = callRPC('claim_lead_slot', { 
    p_user_id: userId, 
    p_limit: dailyLimit 
  });
  
  if (result.success && result.data === true) {
    if (LOG_CONFIG.VERBOSE) {
       Logger.log('✅ Slot claimed (Atomic): ' + userId);
    }
    return true;
  }
  
  Logger.log('⏭️ Slot claim failed (Limit Reached): ' + userId);
  return false;
}

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
// 📥 LEAD FETCHING - FIXED TIMEZONE
// ============================================================================

function fetchRealtimeLeads() {
  var today = getTodayDateIST();
  var startHourUTC = TIME_CONFIG.ACTIVE_START_HOUR - 5.5;
  var endHourUTC = TIME_CONFIG.ACTIVE_END_HOUR - 5.5;
  
  var startMin = Math.round((startHourUTC % 1) * 60);
  var startHour = Math.floor(startHourUTC);
  var endMin = Math.round((endHourUTC % 1) * 60);
  var endHour = Math.floor(endHourUTC);
  
  var startTime = today + 'T' + padZero(startHour) + ':' + padZero(startMin) + ':00%2B00:00';
  var endTime = today + 'T' + padZero(endHour) + ':' + padZero(endMin) + ':00%2B00:00';
  
  var query = 'select=*' +
    '&status=eq.' + SYSTEM.LEAD_STATUS.NEW +
    '&user_id=is.null' +
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

function fetchBacklogLeads() {
  var today = getTodayDateIST();
  var yesterday = getYesterdayDateIST();
  var nightStartHourUTC = TIME_CONFIG.ACTIVE_END_HOUR - 5.5;
  var nightEndHourUTC = TIME_CONFIG.ACTIVE_START_HOUR - 5.5;
  
  var startMin = Math.round((nightStartHourUTC % 1) * 60);
  var startHour = Math.floor(nightStartHourUTC);
  var endMin = Math.round((nightEndHourUTC % 1) * 60);
  var endHour = Math.floor(nightEndHourUTC);
  
  var nightStart = yesterday + 'T' + padZero(startHour) + ':' + padZero(startMin) + ':00%2B00:00';
  var nightEnd = today + 'T' + padZero(endHour) + ':' + padZero(endMin) + ':00%2B00:00';
  
  var query = 'select=*' +
    '&status=eq.' + SYSTEM.LEAD_STATUS.NEW +
    '&user_id=is.null' +
    '&created_at=gte.' + nightStart +
    '&created_at=lt.' + nightEnd +
    '&order=created_at.asc' +
    '&limit=' + DISTRIBUTION_CONFIG.MAX_LEADS_PER_RUN;
  
  var leads = supabaseSelect(SYSTEM.TABLES.LEADS, query);
  
  leads.forEach(function(lead) {
    lead.isNightLead = true;
    lead.source = SYSTEM.LEAD_SOURCE.NIGHT_BACKLOG;
  });
  
  if (LOG_CONFIG.VERBOSE) {
    Logger.log('🌙 Fetched ' + leads.length + ' backlog (night) leads');
  }
  
  return leads;
}

function fetchAllUnassignedLeads() {
  var query = 'select=*' +
    '&status=eq.' + SYSTEM.LEAD_STATUS.NEW +
    '&user_id=is.null' +
    '&order=created_at.asc' +
    '&limit=' + DISTRIBUTION_CONFIG.MAX_LEADS_PER_RUN;
  
  return supabaseSelect(SYSTEM.TABLES.LEADS, query);
}

// ============================================================================
// 👥 USER FETCHING (FIXED: Added target_gender and target_state)
// ============================================================================

function fetchActiveSubscribersByPriority() {
  var result = callRPC('get_available_users_by_priority', {});
  
  if (result.success && result.data && result.data.length > 0) {
    if (LOG_CONFIG.VERBOSE) {
      Logger.log('👥 Found ' + result.data.length + ' available users (via RPC)');
    }
    return result.data;
  }
  
  Logger.log('ℹ️ RPC fallback - fetching users manually');
  return fetchAndSortUsersManually();
}

function fetchAndSortUsersManually() {
  // FIXED: Added target_gender and target_state to query
  var usersQuery = 'select=id,name,email,phone,plan_name,daily_limit,leads_today,last_lead_time,is_active,target_gender,target_state' +
    '&payment_status=eq.active' +
    '&role=eq.member' +
    '&is_active=neq.false';
  var users = supabaseSelect(SYSTEM.TABLES.USERS, usersQuery);
  
  if (users.length === 0) {
    Logger.log('⚠️ No active users found');
    return [];
  }
  
  Logger.log('👥 Found ' + users.length + ' active users from users table');
  
  var now = new Date();
  var fifteenMinAgo = new Date(now.getTime() - (TIME_CONFIG.FOCUS_GAP_MINUTES * 60 * 1000));
  
  var availableUsers = [];
  
  users.forEach(function(user) {
    var lastAssigned = user.last_lead_time ? new Date(user.last_lead_time) : null;
    var isInCoolingPeriod = lastAssigned && lastAssigned > fifteenMinAgo;
    
    var leadsToday = user.leads_today || 0;
    var dailyLimit = user.daily_limit || 0;
    var isUnderLimit = leadsToday < dailyLimit;
    
    if (isUnderLimit && !isInCoolingPeriod && dailyLimit > 0) {
      availableUsers.push({
        user_id: user.id,
        user_name: user.name,
        email: user.email,
        phone: user.phone,
        plan_name: user.plan_name,
        plan_priority: getPlanPriority(user.plan_name),
        daily_limit: dailyLimit,
        leads_sent: leadsToday,
        last_lead_assigned_at: user.last_lead_time,
        target_gender: user.target_gender || 'Any',
        target_state: user.target_state || 'All India'
      });
    }
  });
  
  availableUsers.sort(function(a, b) {
    if (a.plan_priority !== b.plan_priority) {
      return a.plan_priority - b.plan_priority;
    }
    return (a.leads_sent || 0) - (b.leads_sent || 0);
  });
  
  if (LOG_CONFIG.VERBOSE) {
    Logger.log('👥 ' + availableUsers.length + ' users available for leads');
  }
  
  return availableUsers;
}

// ============================================================================
// 📝 LEAD ASSIGNMENT
// ============================================================================

function assignLeadToUser(leadId, userId, isNightLead) {
  var payload = {
    user_id: userId,
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

function markLeadDelivered(leadId) {
  return supabaseUpdate(SYSTEM.TABLES.LEADS, 'id=eq.' + leadId, {
    status: SYSTEM.LEAD_STATUS.DELIVERED,
    delivered_at: new Date().toISOString()
  });
}

function markLeadFailed(leadId, reason) {
  return supabaseUpdate(SYSTEM.TABLES.LEADS, 'id=eq.' + leadId, {
    status: SYSTEM.LEAD_STATUS.FAILED,
    failure_reason: reason
  });
}

// ============================================================================
// 📊 HELPER FUNCTIONS
// ============================================================================

function getTodayDateIST() {
  var now = new Date();
  return Utilities.formatDate(now, TIME_CONFIG.TIMEZONE, 'yyyy-MM-dd');
}

function getYesterdayDateIST() {
  var now = new Date();
  now.setDate(now.getDate() - 1);
  return Utilities.formatDate(now, TIME_CONFIG.TIMEZONE, 'yyyy-MM-dd');
}

function padZero(num) {
  return num < 10 ? '0' + num : '' + num;
}

// ============================================================================
// 🧪 CONNECTION TEST
// ============================================================================

function testSupabaseConnection() {
  Logger.log('========== SUPABASE CONNECTION TEST ==========');
  
  var config = getConfig();
  
  if (!config.SUPABASE_URL || !config.SUPABASE_KEY) {
    Logger.log('❌ Config missing! Run setupSecrets() first.');
    return false;
  }
  
  Logger.log('URL: ' + config.SUPABASE_URL);
  Logger.log('SYSTEM.TABLES.USERS: ' + SYSTEM.TABLES.USERS);
  
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

function debugRealtimeQuery() {
  var today = getTodayDateIST();
  var startHourUTC = TIME_CONFIG.ACTIVE_START_HOUR - 5.5;
  var endHourUTC = TIME_CONFIG.ACTIVE_END_HOUR - 5.5;
  
  var startMin = Math.round((startHourUTC % 1) * 60);
  var startHour = Math.floor(startHourUTC);
  var endMin = Math.round((endHourUTC % 1) * 60);
  var endHour = Math.floor(endHourUTC);
  
  var startTime = today + 'T' + padZero(startHour) + ':' + padZero(startMin) + ':00%2B00:00';
  var endTime = today + 'T' + padZero(endHour) + ':' + padZero(endMin) + ':00%2B00:00';
  
  Logger.log('Today IST: ' + today);
  Logger.log('Start UTC: ' + startTime);
  Logger.log('End UTC: ' + endTime);
  Logger.log('Current IST hour: ' + getCurrentHourIST());
  
  var query = 'select=id,name,created_at&status=eq.New&user_id=is.null&order=created_at.desc&limit=5';
  var leads = supabaseSelect(SYSTEM.TABLES.LEADS, query);
  
  Logger.log('Found ' + leads.length + ' unassigned leads');
  leads.forEach(function(l) {
    Logger.log('  - ' + l.name + ' | ' + l.created_at);
  });
}

function testSystem() {
  Logger.log('SYSTEM defined: ' + (typeof SYSTEM !== 'undefined'));
  if (typeof SYSTEM !== 'undefined') {
    Logger.log('TABLES: ' + JSON.stringify(SYSTEM.TABLES));
  }
}
