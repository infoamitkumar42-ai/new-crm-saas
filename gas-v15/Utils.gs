/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║  LEADFLOW v15.0 - UTILS.GS (PRODUCTION-GRADE)                              ║
 * ║  Last Updated: January 2026                                                ║
 * ║  Contains: City Inference, Phone Cleaning, Matching, Weighted Random       ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 */

// ============================================================================
// ⏰ TIME UTILITIES (IST)
// ============================================================================

/**
 * Get current hour in IST
 */
function getCurrentHourIST() {
  var now = new Date();
  return parseInt(Utilities.formatDate(now, TIME_CONFIG.TIMEZONE, 'HH'), 10);
}

/**
 * Check if within active hours (8 AM - 10 PM)
 */
function isWithinActiveHours() {
  var hour = getCurrentHourIST();
  return hour >= TIME_CONFIG.ACTIVE_START_HOUR && hour < TIME_CONFIG.ACTIVE_END_HOUR;
}

/**
 * Check if after backlog release time (11 AM)
 */
function isAfterBacklogRelease() {
  return getCurrentHourIST() >= TIME_CONFIG.BACKLOG_RELEASE_HOUR;
}

/**
 * Check if lead was created during night hours
 */
function isNightLead(createdAt) {
  if (!createdAt) return false;
  var hour = parseInt(Utilities.formatDate(new Date(createdAt), TIME_CONFIG.TIMEZONE, 'HH'), 10);
  return hour >= TIME_CONFIG.ACTIVE_END_HOUR || hour < TIME_CONFIG.ACTIVE_START_HOUR;
}

/**
 * Get current timestamp in IST
 */
function getTimestampIST() {
  return Utilities.formatDate(new Date(), TIME_CONFIG.TIMEZONE, 'yyyy-MM-dd HH:mm:ss');
}

/**
 * Format date to Indian format
 */
function formatDateIST(date) {
  if (!date) return "";
  var d = new Date(date);
  var options = { 
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  return d.toLocaleString('en-IN', options);
}

// ============================================================================
// 📱 PHONE VALIDATION & CLEANING
// ============================================================================

/**
 * Clean and normalize phone number
 * @param {any} value - Raw phone value
 * @returns {string} - Clean 10-digit phone or empty string
 */
function cleanPhone(value) {
  if (!value) return "";
  
  var cleaned = value.toString().replace(/\D/g, "");
  
  // Remove country code if present
  if (cleaned.length > 10 && cleaned.startsWith("91")) {
    cleaned = cleaned.substring(2);
  }
  
  // Take last 10 digits if still too long
  if (cleaned.length > 10) {
    cleaned = cleaned.substring(cleaned.length - 10);
  }
  
  return cleaned;
}

/**
 * Validate phone format (10 digits, Indian mobile)
 */
function isValidPhone(phone) {
  if (!phone) return false;
  if (phone.length !== 10 || !/^\d+$/.test(phone)) return false;
  if (/^(.)\1{9}$/.test(phone)) return false; // Repeated digits
  if (phone === '1234567890' || phone === '0987654321') return false;
  if (!/^[6-9]/.test(phone)) return false; // Indian mobile prefix
  return true;
}

// ============================================================================
// 👤 NAME VALIDATION
// ============================================================================

/**
 * Clean and normalize name
 */
function cleanName(value) {
  if (!value) return '';
  return value.toString().trim().replace(/\s+/g, ' ').replace(/[^a-zA-Z\s.]/g, '');
}

/**
 * Validate name
 */
function isValidName(name) {
  if (!name || name.length < 2) return true; // Relaxed
  var lower = name.toLowerCase();
  var invalid = ['test', 'testing', 'asdf', 'abc', 'xyz', 'demo'];
  return invalid.indexOf(lower) === -1;
}

/**
 * Validate email format
 */
function isValidEmail(email) {
  if (!email) return false;
  var regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email.trim());
}

// ============================================================================
// 🚫 LEAD VALIDATION
// ============================================================================

/**
 * Validate a lead object
 */
function validateLead(lead) {
  if (!lead) return { isValid: false, reason: 'Lead is null' };
  var phone = cleanPhone(lead.phone);
  var name = cleanName(lead.name);
  if (!isValidPhone(phone)) return { isValid: false, reason: 'Invalid phone' };
  // Name is now optional - if missing, cleanName/filterValidLeads will handle it
  if (name && !isValidName(name)) return { isValid: false, reason: 'Invalid name' };
  return { isValid: true, reason: 'Valid' };
}

/**
 * Filter valid leads from array
 */
function filterValidLeads(leads) {
  if (!leads || !Array.isArray(leads)) {
    Logger.log('❌ Filter Error: Input is not an array');
    return [];
  }
  
  var valid = [];
  Logger.log('🔍 Starting filter for ' + leads.length + ' leads...');
  
  leads.forEach(function(lead, index) {
    if (index < 5) {
      Logger.log('👉 Processing Lead #' + index + ': ' + JSON.stringify(lead).substring(0, 100) + '...');
    }
    
    var validation = validateLead(lead);
    
    if (validation.isValid) {
      var phoneRaw = lead.phone || lead.phone_number || '';
      var nameRaw = lead.name || 'Enquiry';
      
      lead.phone = cleanPhone(phoneRaw);
      lead.name = cleanName(nameRaw) || 'Enquiry';
      valid.push(lead);
    } else {
      if (index < 10) { 
        Logger.log('❌ Reject #' + index + ': Phone=[' + (lead.phone || 'null') + '] Reason=[' + validation.reason + ']');
      }
    }
  });
  
  return valid;
}

// ============================================================================
// 📊 QUALITY SCORING
// ============================================================================

/**
 * Calculate lead quality score (0-100)
 */
function calculateQualityScore(lead) {
  var score = SCORING.QUALITY_BASE; // 50 base
  
  // Valid phone number (+20)
  if (lead.phone && lead.phone.length === 10) {
    score += 20;
  }
  
  // Has proper name (+10)
  if (lead.name && lead.name.length > 3 && lead.name.toLowerCase() !== "unknown") {
    score += 10;
  }
  
  // Has city (+10)
  if (lead.city && lead.city.length > 2 && lead.city.toLowerCase() !== "india") {
    score += 10;
  }
  
  // Has source (+10)
  if (lead.source && lead.source.toLowerCase() !== "sheet") {
    score += 10;
  }
  
  return Math.min(score, 100);
}

// ============================================================================
// 🔢 2:1 RATIO MIXER (v15.0 Rule C)
// ============================================================================

/**
 * Mix real-time and backlog leads with 2:1 ratio
 * For every 2 real-time leads, add 1 backlog lead
 */
function mixLeadsWithRatio(realtimeLeads, backlogLeads) {
  var mixed = [];
  var rtIdx = 0, blIdx = 0;
  var ratio = DISTRIBUTION_CONFIG.REALTIME_TO_BACKLOG_RATIO;
  
  while (rtIdx < realtimeLeads.length || blIdx < backlogLeads.length) {
    // Add 'ratio' number of real-time leads
    for (var i = 0; i < ratio && rtIdx < realtimeLeads.length; i++) {
      mixed.push(realtimeLeads[rtIdx++]);
    }
    // Add 1 backlog lead
    if (blIdx < backlogLeads.length) {
      var bl = backlogLeads[blIdx++];
      bl.isNightLead = true;
      mixed.push(bl);
    }
  }
  
  Logger.log('🔀 Mixed ' + realtimeLeads.length + ' RT + ' + backlogLeads.length + ' BL = ' + mixed.length);
  return mixed;
}

// ============================================================================
// 🗺️ CITY-STATE CACHE (Auto-built on first use)
// ============================================================================

var CITY_STATE_CACHE = null;

// NOTE: STATE_CITIES is defined in Config.gs
// We import it here to build the loopup cache

/**
 * Build city-to-state lookup cache
 */
function buildCityStateCache() {
  if (CITY_STATE_CACHE !== null) return CITY_STATE_CACHE;
  
  CITY_STATE_CACHE = {};
  
  // Ensure STATE_CITIES exists (from Config.gs)
  if (typeof STATE_CITIES === 'undefined') {
    Logger.log('❌ ERROR: STATE_CITIES not found! Check Config.gs');
    return {};
  }
  
  for (var state in STATE_CITIES) {
    var cities = STATE_CITIES[state];
    for (var i = 0; i < cities.length; i++) {
      var city = cities[i].toLowerCase().trim();
      CITY_STATE_CACHE[city] = state;
    }
  }
  
  if (LOG_CONFIG.VERBOSE) {
    Logger.log('✅ City-State cache built: ' + Object.keys(CITY_STATE_CACHE).length + ' entries');
  }
  
  return CITY_STATE_CACHE;
}

// ============================================================================
// 🔤 NORMALIZATION FUNCTIONS
// ============================================================================

/**
 * Normalize city name for matching
 */
function normalizeCity(city) {
  if (!city) return '';
  return city.toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9 ]/g, '')  // Remove special chars
    .replace(/\s+/g, ' ')         // Normalize spaces
    .trim();
}

/**
 * Normalize state name for matching
 */
function normalizeState(state) {
  if (!state) return '';
  return state.toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ============================================================================
// 🔍 FUZZY MATCHING (Dice Coefficient)
// ============================================================================

/**
 * Calculate string similarity using bigram comparison (Dice coefficient)
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} - Similarity score (0-1)
 */
function calculateSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  if (str1 === str2) return 1;
  if (str1.length < 2 || str2.length < 2) return 0;
  
  var bigrams1 = {};
  var bigrams2 = {};
  
  for (var i = 0; i < str1.length - 1; i++) {
    var bigram = str1.substring(i, i + 2);
    bigrams1[bigram] = (bigrams1[bigram] || 0) + 1;
  }
  
  for (var j = 0; j < str2.length - 1; j++) {
    var bigram2 = str2.substring(j, j + 2);
    bigrams2[bigram2] = (bigrams2[bigram2] || 0) + 1;
  }
  
  var intersection = 0;
  for (var key in bigrams1) {
    if (bigrams2[key]) {
      intersection += Math.min(bigrams1[key], bigrams2[key]);
    }
  }
  
  return (2 * intersection) / (str1.length + str2.length - 2);
}

// ============================================================================
// ⭐ SMART CITY-STATE INFERENCE (NEVER FAILS)
// ============================================================================

/**
 * ⭐ MAIN FUNCTION: Infer state from city name
 * 
 * LOGIC (Priority Order):
 * 1. Exact match in cache
 * 2. Check if input is a state name/alias
 * 3. Partial match (city contains or is contained)
 * 4. Fuzzy match (similarity > 80%)
 * 5. Return 'All India' as fallback (NEVER FAILS)
 * 
 * @param {string} city - City name to lookup
 * @returns {string} - State name or 'All India'
 */
function inferStateFromCity(city) {
  if (!city) return 'All India';
  
  var normalized = normalizeCity(city);
  if (!normalized) return 'All India';
  
  // Build cache if not exists
  var cache = buildCityStateCache();
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // STEP 1: Exact Match
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (cache[normalized]) {
    return cache[normalized];
  }
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // STEP 2: Check if input is a state name/alias
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (STATE_ALIASES[normalized]) {
    return STATE_ALIASES[normalized];
  }
  
  // Check direct state names
  for (var state in STATE_CITIES) {
    if (normalizeState(state) === normalized) {
      return state;
    }
  }
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // STEP 3: Partial Match (city name contained in input or vice versa)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  for (var cachedCity in cache) {
    // Input contains city name (e.g., "ludhiana punjab" contains "ludhiana")
    if (normalized.indexOf(cachedCity) !== -1 && cachedCity.length >= 4) {
      return cache[cachedCity];
    }
    // City name contains input (e.g., "chandigarh city" contains "chandigarh")
    if (cachedCity.indexOf(normalized) !== -1 && normalized.length >= 4) {
      return cache[cachedCity];
    }
  }
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // STEP 4: Fuzzy Match (for typos)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  var bestMatch = null;
  var bestScore = 0;
  
  for (var fuzzyCity in cache) {
    var similarity = calculateSimilarity(normalized, fuzzyCity);
    if (similarity > 0.8 && similarity > bestScore) {
      bestScore = similarity;
      bestMatch = cache[fuzzyCity];
    }
  }
  
  if (bestMatch) {
    return bestMatch;
  }
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // STEP 5: Fallback - Unknown (STRICT MODE)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (LOG_CONFIG.VERBOSE) {
    Logger.log('⚠️ City not found, marking as Unknown: ' + city);
  }
  return 'Unknown';
}

/**
 * Check if city belongs to a specific state
 */
function isCityInState(city, state) {
  var inferredState = inferStateFromCity(city);
  return normalizeState(inferredState) === normalizeState(state);
}

/**
 * Get all cities for a state
 */
function getCitiesForState(state) {
  var normalizedState = state;
  
  // Check aliases
  if (STATE_ALIASES[normalizeState(state)]) {
    normalizedState = STATE_ALIASES[normalizeState(state)];
  }
  
  return STATE_CITIES[normalizedState] || [];
}

// ============================================================================
// 🎯 TARGET AUDIENCE MATCHING (v15.0 Critical Logic)
// ============================================================================

/**
 * Check if lead matches user's target audience
 * @param {Object} user - User object with target_gender and target_state
 * @param {Object} lead - Lead object with gender and city/state
 * @returns {Object} - { isMatch: boolean, reason: string }
 */
function isLeadMatchingUserAudience(user, lead) {
  // Get user preferences (default to 'Any' / 'All India')
  var userGender = (user.target_gender || 'Any').toLowerCase();
  var userState = (user.target_state || 'All India').toLowerCase();
  
  // Get lead attributes
  var leadGender = (lead.gender || 'Unknown').toLowerCase();
  var leadCity = lead.city || '';
  var leadState = (lead.state || inferStateFromCity(leadCity)).toLowerCase();
  
  // ========================================
  // GENDER MATCHING
  // ========================================
  var genderMatch = false;
  
  if (userGender === 'any') {
    // User accepts any gender
    genderMatch = true;
  } else if (leadGender === 'unknown') {
    // Lead gender unknown - allow match (benefit of doubt)
    genderMatch = true;
  } else if (userGender === leadGender) {
    // Exact match
    genderMatch = true;
  } else {
    // No match
    genderMatch = false;
  }
  
  if (!genderMatch) {
    return {
      isMatch: false,
      reason: 'Gender mismatch: User wants ' + user.target_gender + ', Lead is ' + lead.gender
    };
  }
  
  // ========================================
  // STATE/LOCATION MATCHING
  // ========================================
  var stateMatch = false;
  
  if (userState === 'all india' || userState === 'pan india' || userState === 'india') {
    // User accepts all locations - MATCH
    stateMatch = true;
  } else if (normalizeState(userState) === normalizeState(leadState)) {
    // Exact state match
    stateMatch = true;
  } else {
    // Fallback: If lead is 'Unknown' or 'All India', DO NOT match with specific state user
    // e.g. Punjab user should NOT get All India lead
    stateMatch = false;
  }
  
  if (!stateMatch) {
    return {
      isMatch: false,
      reason: 'State mismatch: User wants ' + user.target_state + ', Lead is from ' + (leadState === 'unknown' ? 'Unknown (' + leadCity + ')' : leadState)
    };
  }
  
  // Both conditions passed
  return {
    isMatch: true,
    reason: 'Match: Gender OK, State OK'
  };
}

/**
 * Find matching users for a specific lead
 * Filters the user list to only those whose target audience matches the lead
 * @param {Array} users - Array of user objects
 * @param {Object} lead - Lead object
 * @returns {Array} - Filtered array of matching users
 */
function filterUsersForLead(users, lead) {
  return users.filter(function(user) {
    return isLeadMatchingUserAudience(user, lead).isMatch;
  });
}

// ============================================================================
// 📊 SHEET ROW EXTRACTION
// ============================================================================

/**
 * Extract lead object from sheet row
 */
function extractLeadFromRow(row) {
  return {
    name: (row[COLUMNS.NAME - 1] || "Unknown").toString().trim(),
    email: (row[COLUMNS.EMAIL - 1] || "").toString().trim(),
    phone: cleanPhone(row[COLUMNS.PHONE - 1]),
    city: (row[COLUMNS.CITY - 1] || "").toString().trim(),
    source: (row[COLUMNS.SOURCE - 1] || "Sheet").toString().trim()
  };
}
/**
 * Check if row is already processed
 */
function isRowProcessed(status) {
  if (!status) return false;
  
  status = status.toLowerCase();
  
  return (
    status.indexOf("distributed") !== -1 ||
    status.indexOf("duplicate") !== -1 ||
    status.indexOf("missed") !== -1 ||
    status.indexOf("queued") !== -1 ||
    status.indexOf("sent") !== -1 ||
    status.indexOf("error") !== -1
  );
}

// ============================================================================
// 🛠️ MISC UTILITIES
// ============================================================================

function generateUniqueId() { return Utilities.getUuid(); }
function delay(ms) { Utilities.sleep(ms); }

function logInfo(msg) { Logger.log('ℹ️ ' + msg); }
function logWarn(msg) { Logger.log('⚠️ ' + msg); }
function logError(msg) { Logger.log('❌ ' + msg); }

/**
 * Safe JSON parse
 */
function safeJsonParse(str, defaultValue) {
  try {
    return JSON.parse(str);
  } catch (e) {
    return defaultValue || null;
  }
}

// ============================================================================
// 🎲 WEIGHTED RANDOM SELECTION (v15.0 Rule: 3:2:1)
// ============================================================================

/**
 * Select a user from the pool based on plan weights
 * Turbo: 3 | Supervisor: 2 | Starter: 1
 * @param {Array} users - Pool of available users
 * @returns {Object|null} - Selected user
 */
function getWeightedRandomUser(users) {
  if (!users || users.length === 0) return null;
  
  var weightedPool = [];
  var totalWeight = 0;
  
  // 1. Assign weights and calculate total
  for (var i = 0; i < users.length; i++) {
    var user = users[i];
    var weight = 1; // Default (Starter)
    
    var plan = (user.plan_name || '').toLowerCase();

    // 3:2:1 Weighted Logic (Explicit Plan Match)
    if (plan.indexOf('turbo') !== -1 || plan.indexOf('weekly') !== -1) {
      // 🚀 High Priority (Turbo Boost, Weekly Boost)
      weight = 3;
    } else if (plan.indexOf('manager') !== -1 || plan.indexOf('supervisor') !== -1) {
      // 💼 Medium Priority (Manager, Supervisor)
      weight = 2;
    } else {
      // 🌱 Standard Priority (Starter, Others)
      weight = 1;
    }
    
    // Validate: Ensure Manager is definitely captured
    if (plan === 'manager') weight = 2; 

    weightedPool.push({ user: user, weight: weight });
    totalWeight += weight;
  }
  
  // 2. Roll the dice
  var random = Math.random() * totalWeight;
  var cursor = 0;
  
  // 3. Find the winner
  for (var i = 0; i < weightedPool.length; i++) {
    cursor += weightedPool[i].weight;
    if (cursor >= random) {
      return weightedPool[i].user;
    }
  }
  
  return users[0]; // Fallback (should never happen)
}

// ============================================================================
// 🧪 TEST / DEBUG FUNCTIONS
// ============================================================================

/**
 * Test city inference with various inputs
 */
function testCityInference() {
  var testCities = [
    'Ludhiana', 'ludhiyana', 'ldh', 'AMRITSAR', 'jalandhar punjab',
    'Chandigarh', 'chd', 'Panchkula', 'Delhi', 'ncr', 'new delhi',
    'Shimla', 'manali', 'dharamshala', 'mcleodganj',
    'Dehradun', 'rishikesh', 'haridwar', 'nainital',
    'Mumbai', 'pune', 'nashik', 'nagpur',
    'Unknown City', '', 'xyz123', 'random text'
  ];
  
  Logger.log('========== CITY INFERENCE TEST ==========');
  
  testCities.forEach(function(city) {
    var state = inferStateFromCity(city);
    Logger.log(city + ' → ' + state);
  });
  
  Logger.log('==========================================');
}

/**
 * Test audience matching
 */
function testAudienceMatching() {
  Logger.log('========== AUDIENCE MATCHING TEST ==========');
  
  var testUser = {
    target_gender: 'Female',
    target_state: 'Punjab'
  };
  
  var testLeads = [
    { name: 'Test 1', city: 'Ludhiana', gender: 'Female' },
    { name: 'Test 2', city: 'Delhi', gender: 'Female' },
    { name: 'Test 3', city: 'Amritsar', gender: 'Male' },
    { name: 'Test 4', city: 'Jalandhar', gender: 'Unknown' }
  ];
  
  testLeads.forEach(function(lead) {
    var result = isLeadMatchingUserAudience(testUser, lead);
    Logger.log(lead.name + ' (' + lead.city + ', ' + lead.gender + '): ' + 
              (result.isMatch ? '✅ MATCH' : '❌ NO MATCH') + ' - ' + result.reason);
  });
  
  Logger.log('==========================================');
}

/**
 * Full Utils health check
 */
function testUtils() {
  Logger.log('========== UTILS HEALTH CHECK ==========');
  
  // Test phone cleaning
  Logger.log('\n📱 Phone Cleaning:');
  Logger.log('  91987654321 → ' + cleanPhone('91987654321'));
  Logger.log('  +919876543210 → ' + cleanPhone('+919876543210'));
  
  // Test city inference
  Logger.log('\n🗺️ City Inference:');
  testCityInference();
  
  // Test audience matching
  Logger.log('\n🎯 Audience Matching:');
  testAudienceMatching();
  
  Logger.log('==========================================');
}
