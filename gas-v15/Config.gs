/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║  LEADFLOW v15.0 - CONFIG.GS (PRODUCTION-GRADE)                             ║
 * ║  Last Updated: January 2026                                                ║
 * ║  Contains: Column Mapping, Plan Rules, City Database, v15.0 Settings      ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 */

// ============================================================================
// 🔧 SYSTEM VERSION & CONSTANTS
// ============================================================================

var SYSTEM = {
  VERSION: '15.0',
  NAME: 'LeadFlow',
  TABLES: {
    USERS: 'users',
    LEADS: 'leads',
    SUBSCRIPTIONS: 'users_subscription',
    ORPHAN_LEADS: 'orphan_leads',
    DUPLICATE_LEADS: 'duplicate_leads',
    DAILY_LOG: 'daily_lead_log'
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

// ============================================================================
// ⭐ GOOGLE SHEET COLUMN MAPPING (Fixed for Deleted Columns)
// ============================================================================

var COLUMNS = {
  DATE: 2,       // created_time (Column B)
  SOURCE: 8,     // campaign_name (Column H)
  
  // 🔥 UPDATED INDICES (Age & Profession Deleted)
  NAME: 13,      // full__name (Column M)
  PHONE: 14,     // phone_number (Column N)
  CITY: 15,      // city (Column O)
  STATUS: 16,    // lead_status (Column P)
  ASSIGNED: 17,  // Assigned User (Script writes here)
  
  EMAIL: 20      // (Extra/Empty mapping just for safety)
};

// ============================================================================
// ⏰ WORKING HOURS (IST) - v15.0 Time Gates
// ============================================================================

var WORKING_HOURS = {
  START: 8,   // 8 AM IST
  END: 22,    // 10 PM IST
  TIMEZONE: 'Asia/Kolkata'
};

var TIME_CONFIG = {
  TIMEZONE: 'Asia/Kolkata',
  ACTIVE_START_HOUR: 8,      // Rule A: Start at 8 AM
  ACTIVE_END_HOUR: 22,       // Rule A: End at 10 PM
  BACKLOG_RELEASE_HOUR: 11,  // Rule B: Night leads released at 11 AM
  FOCUS_GAP_MINUTES: 15      // Rule E: 15-min gap between leads for same user
};

// ============================================================================
// 📦 FINAL PLAN CONFIGURATION (All 5 Plans)
// ============================================================================

var PLAN_CONFIG = {
  // Monthly Plans
  'starter': {
    displayName: 'Starter',
    price: 999,
    duration: 10,
    dailyLeads: 5,
    totalLeads: 50,
    weight: 1,
    priority: 4,
    priorityLabel: 'Standard',
    maxReplacements: 5,
    isBooster: false
  },
  'supervisor': {
    displayName: 'Supervisor',
    price: 1999,
    duration: 15,
    dailyLeads: 7,
    totalLeads: 105,
    weight: 3,
    priority: 3,
    priorityLabel: 'High',
    maxReplacements: 10,
    isBooster: false
  },
  'manager': {
    displayName: 'Manager',
    price: 2999,
    duration: 20,
    dailyLeads: 8,
    totalLeads: 160,
    weight: 5,
    priority: 2,
    priorityLabel: 'Premium',
    maxReplacements: 16,
    isBooster: false
  },
  
  // 7-Day Booster Plans
  'weekly_boost': {
    displayName: 'Weekly Boost',
    price: 1999,
    duration: 7,
    dailyLeads: 12,
    totalLeads: 84,
    weight: 7,
    priority: 1,
    priorityLabel: 'Turbo',
    maxReplacements: 8,
    isBooster: true
  },
  'turbo_boost': {
    displayName: 'Turbo Boost',
    price: 2499,
    duration: 7,
    dailyLeads: 14,
    totalLeads: 98,
    weight: 9,
    priority: 1,
    priorityLabel: 'Ultra',
    maxReplacements: 10,
    isBooster: true
  }
};

// ============================================================================
// 🎯 v15.0 PLAN PRIORITY ORDER (Lower = Higher Priority)
// ============================================================================

var PLAN_PRIORITY = {
  'Booster': 1,
  'Turbo Boost': 1,
  'Weekly Boost': 1,
  'turbo_boost': 1,
  'weekly_boost': 1,
  'Manager': 2,
  'manager': 2,
  'Supervisor': 3,
  'supervisor': 3,
  'Starter': 4,
  'starter': 4
};

// ============================================================================
// 🔢 PLAN WEIGHTS FOR DISTRIBUTION
// ============================================================================

var PLAN_WEIGHTS = {
  'starter': 1,
  'supervisor': 3,
  'manager': 5,
  'weekly_boost': 7,
  'turbo_boost': 9
};

// ============================================================================
// 📊 SCORING CONFIGURATION
// ============================================================================

var SCORING_CONFIG = {
  PLAN_MULTIPLIER: 10,
  CITY_MATCH_BONUS: 50,
  STATE_MATCH_BONUS: 25,
  STARVATION_PENALTY: 2,
  BASE_QUALITY_SCORE: 50
};

var SCORING = {
  PLAN_MULTIPLIER: 10,
  CITY_MATCH_BONUS: 50,
  STATE_MATCH_BONUS: 25,
  STARVATION_PENALTY: 2,
  QUALITY_BASE: 50
};

// ============================================================================
// 🔄 v15.0 DISTRIBUTION SETTINGS
// ============================================================================

var DISTRIBUTION_CONFIG = {
  BATCH_SIZE: 50,
  DUPLICATE_CHECK_DAYS: 30,
  RATE_LIMIT_DELAY_MS: 200,
  MAX_LEADS_PER_RUN: 100,
  API_DELAY_MS: 200,
  
  // v15.0 Rules
  REALTIME_TO_BACKLOG_RATIO: 2,  // Rule C: 2 real-time : 1 backlog
  FOCUS_GAP_MINUTES: 15          // Rule E: 15-min cooling period
};

// ============================================================================
// 🔔 NOTIFICATION SETTINGS
// ============================================================================

var NOTIFICATION_CONFIG = {
  ENABLE_EMAIL: true,
  ENABLE_WHATSAPP: true,
  ENABLE_ADMIN_ALERTS: true,
  
  // v15.0 Rule D: Visual Signaling for Night Leads
  NIGHT_LEAD_ICON: '🟦',
  NIGHT_LEAD_MESSAGE_HINDI: 'Ye raat ki lead hai, please follow up now.',
  
  EMAIL_SUBJECT_REALTIME: '🔥 New Lead Alert: ',
  EMAIL_SUBJECT_NIGHT: '🟦🌙 Night Lead Alert: '
};

// ============================================================================
// 🛠️ ADMIN SETTINGS
// ============================================================================

var ADMIN = {
  ENABLE_EMAIL_ALERTS: true,
  ENABLE_ORPHAN_ALERTS: true,
  ENABLE_ERROR_ALERTS: true
};

// ============================================================================
// 🧪 TEST MODE
// ============================================================================

var TEST_MODE = {
  ENABLED: false,
  SKIP_NOTIFICATIONS: false,
  LOG_VERBOSE: true
};

var LOG_CONFIG = {
  VERBOSE: true
};

// ============================================================================
// ⭐ MASTER CITY-STATE MAPPING (COMPLETE - DO NOT SHORTEN)
// ============================================================================

var STATE_CITIES = {
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PUNJAB - ALL CITIES & TOWNS (75+)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  'Punjab': [
    'ludhiana', 'amritsar', 'jalandhar', 'patiala', 'bathinda', 'mohali',
    'pathankot', 'moga', 'batala', 'abohar', 'malerkotla', 'khanna',
    'phagwara', 'muktsar', 'barnala', 'rajpura', 'firozpur', 'kapurthala',
    'hoshiarpur', 'faridkot', 'sangrur', 'kotkapura', 'sunam', 'gurdaspur',
    'zirakpur', 'dera bassi', 'kharar', 'nangal', 'rupnagar', 'ropar',
    'nawanshahr', 'shaheed bhagat singh nagar', 'sbs nagar', 'anandpur sahib',
    'fatehgarh sahib', 'sirhind', 'bassi pathana', 'mansa', 'budhlada',
    'sardulgarh', 'rampura phul', 'bhadaur', 'dhuri', 'moonak', 'lehra',
    'dirba', 'longowal', 'bhawanigarh', 'samana', 'patran',
    'nabha', 'ghanaur', 'banur', 'lalru', 'dera baba nanak',
    'qadian', 'sri hargobindpur', 'mukerian', 'dasuya', 'garhshankar',
    'balachaur', 'nawan pind', 'nurmahal', 'nakodar', 'phillaur', 'goraya',
    'kartarpur', 'adampur', 'bhogpur', 'sultanpur lodhi', 'makhu', 'zira',
    'talwandi bhai', 'jalalabad', 'fazilka', 'malout', 'gidderbaha',
    'lambi', 'raikot', 'jagraon', 'mullanpur', 'samrala', 'machhiwara',
    'sahnewal', 'doraha', 'payal', 'ahmedgarh', 'amargarh',
    'lehragaga', 'cheema', 'tarn taran', 'patti', 'khadur sahib', 'goindwal',
    'rayya', 'ajnala', 'majitha', 'jandiala guru', 'beas', 'harike',
    'ferozepur city', 'ferozepur cantonment', 'talwara', 'dhariwal',
    'dinanagar', 'sujanpur', 'bhikhi', 'maur', 'jaitu', 'kot ise khan',
    'bareta', 'bhucho mandi', 'goniana', 'raman', 'mandi ahmedgarh',
    'ldh', 'asr', 'jal', 'pat', 'btn', 'sas nagar', 'sahibzada ajit singh nagar',
    'ferozepur', 'ferozpur', 'bhatinda', 'ludhiyana', 'jalandher'
  ],
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // CHANDIGARH (Union Territory)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  'Chandigarh': [
    'chandigarh', 'chd', 'chandigarh city', 'chandigarh ut',
    'sector 17', 'sector 22', 'sector 35', 'manimajra', 'burail',
    'dhanas', 'maloya', 'behlana', 'hallomajra', 'kajheri',
    'chandigarh university', 'chdigarh', 'chandighar', 'chandigadh'
  ],
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // HARYANA - FOCUS ON PANCHKULA & NEARBY
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  'Haryana': [
    'panchkula', 'pinjore', 'kalka', 'barwala', 'raipur rani',
    'morni', 'panchkula urban estate', 'sector 1 panchkula', 'mdc panchkula',
    'ambala', 'ambala city', 'ambala cantonment', 'ambala cantt', 'barara',
    'naraingarh', 'shahzadpur', 'mullana', 'saha',
    'kurukshetra', 'thanesar', 'pehowa', 'shahabad', 'ladwa', 'babain',
    'karnal', 'gharaunda', 'nilokheri', 'indri', 'assandh', 'taraori',
    'panipat', 'samalkha', 'israna', 'madlauda', 'bapoli',
    'yamunanagar', 'jagadhri', 'chhachhrauli', 'radaur', 'sadhaura', 'bilaspur',
    'gurugram', 'gurgaon', 'faridabad', 'rohtak', 'hisar', 'sirsa',
    'sonipat', 'jhajjar', 'rewari', 'mahendragarh', 'bhiwani', 'jind',
    'kaithal', 'fatehabad', 'palwal', 'nuh', 'mewat', 'manesar',
    'bahadurgarh', 'narnaul', 'charkhi dadri', 'tosham', 'loharu',
    'hansi', 'barwala hisar', 'uklana', 'ratia', 'tohana', 'jakhal',
    'safidon', 'julana', 'narwana', 'uchana', 'ellenabad', 'dabwali',
    'rania', 'kalanwali', 'odhan', 'bhattu kalan', 'adampur mandi',
    'panchkula extension', 'peer muchalla', 'dhakoli', 'baltana',
    'nayagaon', 'ramgarh', 'surajpur'
  ],
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // DELHI NCR - ALL AREAS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  'Delhi': [
    'delhi', 'new delhi', 'dilli', 'delhi ncr', 'ncr',
    'connaught place', 'cp', 'rajiv chowk', 'karol bagh', 'paharganj',
    'chandni chowk', 'daryaganj', 'ito', 'mandi house', 'barakhamba',
    'south delhi', 'saket', 'malviya nagar', 'hauz khas', 'green park',
    'lajpat nagar', 'defence colony', 'greater kailash', 'gk1', 'gk2',
    'cr park', 'chittaranjan park', 'nehru place', 'kalkaji', 'govindpuri',
    'okhla', 'jasola', 'sarita vihar', 'badarpur', 'tughlakabad',
    'sangam vihar', 'ambedkar nagar', 'mehrauli', 'vasant kunj', 'vasant vihar',
    'munirka', 'r k puram', 'rkpuram', 'safdarjung', 'safdarjung enclave',
    'north delhi', 'civil lines', 'model town', 'gtb nagar', 'mukherjee nagar',
    'kamla nagar', 'shakti nagar', 'roop nagar', 'gulabi bagh', 'sadar bazar',
    'tis hazari', 'kashmere gate', 'delhi university', 'north campus',
    'hudson lane', 'kingsway camp', 'burari', 'jahangirpuri', 'adarsh nagar',
    'azadpur', 'shalimar bagh', 'ashok vihar', 'wazirpur', 'pitampura',
    'rohini', 'rohini sector', 'rithala', 'badli', 'narela', 'alipur',
    'east delhi', 'preet vihar', 'laxmi nagar', 'nirman vihar', 'v3s mall',
    'anand vihar', 'kaushambi', 'vaishali', 'indirapuram', 'karkardooma',
    'shahdara', 'dilshad garden', 'seelampur', 'welcome', 'jyoti nagar',
    'krishna nagar', 'gandhi nagar', 'patparganj', 'mayur vihar', 'noida border',
    'trilokpuri', 'kalyanpuri', 'kondli', 'khichripur', 'mandawali',
    'geeta colony', 'vivek vihar', 'jhilmil', 'nand nagri', 'bhajanpura',
    'west delhi', 'rajouri garden', 'subhash nagar', 'tagore garden',
    'janakpuri', 'vikaspuri', 'uttam nagar', 'dwarka', 'dwarka sector',
    'palam', 'dabri', 'dashrath puri', 'bindapur', 'kakrola', 'najafgarh',
    'nangloi', 'mundka', 'tikri kalan', 'baprola', 'chhawla', 'dhansa',
    'hari nagar', 'tilak nagar', 'moti nagar', 'kirti nagar', 'patel nagar',
    'rajinder nagar', 'karol bagh west', 'anand parbat', 'baljit nagar',
    'shadipur', 'naraina', 'mayapuri', 'okhla industrial',
    'dwarka expressway', 'palam vihar', 'sector 23 dwarka', 'bijwasan',
    'kapashera', 'mahipalpur', 'aerocity', 'igi airport', 'vasant kunj sector',
    'noida', 'greater noida', 'ghaziabad', 'faridabad haryana', 
    'gurgaon', 'gurugram',
    'newdelhi', 'new-delhi', 'delhi city', 'central delhi', 'south ex',
    'south extension', 'def col', 'jnu', 'iit delhi', 'aiims'
  ],
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // HIMACHAL PRADESH - ALL DISTRICTS & TOWNS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  'Himachal Pradesh': [
    'shimla', 'shimla city', 'kufri', 'fagu', 'narkanda', 'theog',
    'kotkhai', 'jubbal', 'rohru', 'chirgaon', 'rampur bushahr', 'sarahan',
    'jeori', 'kumarsain', 'suni', 'kandaghat', 'solan border', 'chail',
    'mashobra', 'naldehra', 'tattapani', 'chhota shimla', 'sanjauli',
    'lakkar bazar', 'boileauganj', 'summer hill', 'totu', 'dhalli',
    'kangra', 'dharamshala', 'dharamsala', 'mcleodganj', 'mcleod ganj',
    'palampur', 'baijnath', 'bir', 'billing', 'nagrota bagwan', 'jaisinghpur',
    'jawali', 'nurpur', 'indora', 'fatehpur', 'dehra gopipur', 'guler',
    'shahpur', 'nagrota surian', 'pragpur', 'thural', 'yol', 'yol cantonment',
    'chamunda', 'bhagsunag', 'naddi', 'triund', 'kareri', 'kangra town',
    'kullu', 'manali', 'bhuntar', 'kasol', 'manikaran', 'naggar',
    'banjar', 'sainj', 'ani', 'nirmand', 'katrain', 'patlikuhal',
    'raison', 'rohtang', 'solang', 'gulaba', 'sethan', 'hamta',
    'malana', 'tosh', 'kheerganga', 'pulga', 'grahan', 'jari',
    'mandi', 'sundernagar', 'jogindernagar', 'rewalsar', 'karsog',
    'sarkaghat', 'baldwara', 'padhar', 'chachyot', 'thunag', 'gohar',
    'kotli', 'barot', 'tikkan', 'aut', 'pandoh', 'nagwain',
    'solan', 'baddi', 'barotiwala', 'nalagarh', 'parwanoo', 'kasauli',
    'dagshai', 'sabathu', 'subathu', 'arki', 'kunihar', 'dharampur',
    'kandaghat', 'chail', 'waknaghat', 'oachghat', 'chambaghat',
    'una', 'amb', 'gagret', 'haroli', 'bangana', 'mehatpur', 'daulatpur',
    'tahliwal', 'santoshgarh', 'barsar', 'chintpurni',
    'hamirpur', 'nadaun', 'sujanpur', 'bhoranj', 'tira sujanpur',
    'barsar', 'dhaneta', 'bijhari', 'tauni devi', 'bamsan',
    'bilaspur', 'ghumarwin', 'jhandutta', 'naina devi', 'swarghat',
    'talai', 'namhol', 'jukhala', 'berthin',
    'nahan', 'paonta sahib', 'rajgarh', 'sangrah', 'renuka',
    'dadahu', 'kafota', 'nohra', 'shillai', 'pachhad',
    'chamba', 'dalhousie', 'khajjiar', 'banikhet', 'salooni',
    'tissa', 'bharmour', 'churah', 'pangi', 'killar',
    'reckong peo', 'kalpa', 'sangla', 'chitkul', 'nako', 'pooh',
    'moorang', 'nichar', 'tapri', 'kaza',
    'keylong', 'kaza', 'tabo', 'losar', 'kibber', 'langza',
    'komic', 'hikkim', 'demul', 'lhalung', 'dhankar', 'pin valley',
    'udaipur lahaul', 'trilokinath', 'jispa', 'darcha', 'sarchu',
    'hp', 'himachal', 'h.p.', 'mcleod', 'dalhousie', 'khajiar',
    'manali town', 'old manali', 'vashisht', 'prini', 'dhungri'
  ],
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // UTTARAKHAND - ALL DISTRICTS & TOWNS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  'Uttarakhand': [
    'dehradun', 'doon', 'mussoorie', 'rishikesh', 'haridwar',
    'vikasnagar', 'herbertpur', 'doiwala', 'premnagar', 'clement town',
    'rajpur', 'sahastradhara', 'tapkeshwar', 'lachhiwala', 'dakpathar',
    'kalsi', 'chakrata', 'tyuni', 'vikas nagar', 'selaqui', 'raipur',
    'maldevta', 'malsi', 'jhajra', 'nakraunda', 'chandrabani',
    'prem nagar', 'ballupur', 'chukkuwala', 'kanwali', 'majra',
    'nehru colony', 'race course', 'dalanwala', 'karanpur', 'niranjanpur',
    'haridwar', 'roorkee', 'jwalapur', 'bhel', 'ranipur', 'laksar',
    'sultanpur', 'manglaur', 'landhaura', 'bahadrabad', 'kankhal',
    'har ki pauri', 'mansa devi', 'chandi devi', 'bilkeshwar',
    'bhoopatwala', 'jagjeetpur', 'bijnor road', 'pathri', 'narsan',
    'nainital', 'haldwani', 'kathgodam', 'bhimtal', 'naukuchiatal',
    'sattal', 'bhowali', 'ramgarh', 'mukteshwar', 'dhanachuli',
    'ramnagar', 'kaladungi', 'lalkuan', 'kaladhungi', 'bajpur',
    'almora', 'ranikhet', 'kausani', 'binsar', 'jageshwar',
    'bhikiyasain', 'someshwar', 'dwarahat', 'chaukhutia', 'hawalbagh',
    'rudrapur', 'kashipur', 'jaspur', 'khatima', 'sitarganj',
    'bazpur', 'gadarpur', 'sultanpur', 'mahuakheraganj', 'nanakmatta',
    'kichha', 'pantnagar', 'dineshpur', 'shakti farm', 'bhira',
    'pauri', 'kotdwar', 'lansdowne', 'srinagar garhwal', 'satpuli',
    'dugadda', 'yamkeshwar', 'pokhra', 'rikhnikhal', 'kaljikhal',
    'tehri', 'new tehri', 'chamba tehri', 'narendranagar', 'devprayag',
    'pratapnagar', 'ghansali', 'dhanolti', 'kanatal', 'surkanda devi',
    'gopeshwar', 'chamoli', 'joshimath', 'badrinath', 'auli',
    'karnaprayag', 'nandprayag', 'gairsain', 'tharali', 'pokhri',
    'valley of flowers', 'hemkund sahib', 'mana', 'govindghat',
    'rudraprayag', 'kedarnath', 'gaurikund', 'guptkashi', 'ukhimath',
    'augustmuni', 'tilwara', 'chopta', 'tungnath',
    'uttarkashi', 'gangotri', 'yamunotri', 'barkot', 'purola',
    'mori', 'naugaon', 'dunda', 'chinyalisaur', 'harsil', 'dharali',
    'pithoragarh', 'dharchula', 'munsiyari', 'gangolihat', 'berinag',
    'didihat', 'chaukori', 'kanalichina', 'thal', 'jauljibi',
    'champawat', 'tanakpur', 'lohaghat', 'purnagiri', 'banbasa',
    'shyamlatal', 'mayawati ashram', 'abbott mount',
    'bageshwar', 'kanda', 'garur', 'kapkot', 'baijnath bageshwar',
    'uk', 'uttaranchal', 'ua', 'dehradoon', 'dehradin', 'hardwar',
    'haridwar city', 'mussorie', 'nainital lake', 'nainital town'
  ],
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // MAHARASHTRA - ALL MAJOR CITIES & TOWNS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  'Maharashtra': [
    'mumbai', 'bombay', 'bom', 'mumbai city', 'south mumbai', 'colaba',
    'fort', 'churchgate', 'marine drive', 'nariman point', 'cuffe parade',
    'worli', 'lower parel', 'prabhadevi', 'dadar', 'matunga', 'wadala',
    'sion', 'kurla', 'chembur', 'ghatkopar', 'vikhroli', 'powai',
    'andheri', 'andheri east', 'andheri west', 'jogeshwari', 'goregaon',
    'malad', 'kandivali', 'borivali', 'dahisar', 'mira road', 'bhayandar',
    'bandra', 'santacruz', 'vile parle', 'juhu', 'versova', 'lokhandwala',
    'oshiwara', 'four bungalows', 'yari road', 'madh island',
    'mulund', 'thane', 'kalyan', 'dombivli', 'badlapur', 'ambernath',
    'ulhasnagar', 'vasai', 'virar', 'nalasopara', 'palghar', 'boisar',
    'navi mumbai', 'vashi', 'nerul', 'belapur', 'cbd belapur', 'kharghar',
    'panvel', 'airoli', 'ghansoli', 'kopar khairane', 'turbhe', 'sanpada',
    'seawoods', 'palm beach', 'ulwe', 'kamothe', 'kalamboli', 'taloja',
    'uran', 'nhava sheva', 'jnpt',
    'pune', 'poona', 'shivajinagar', 'deccan', 'fc road', 'jm road',
    'koregaon park', 'kalyani nagar', 'viman nagar', 'kharadi', 'hadapsar',
    'magarpatta', 'aundh', 'baner', 'balewadi', 'pashan', 'sus', 'hinjewadi',
    'wakad', 'pimple saudagar', 'pimple nilakh', 'pimple gurav', 'sangvi',
    'dapodi', 'khadki', 'vishrantwadi', 'yerwada', 'mundhwa', 'wadgaon sheri',
    'kondhwa', 'bibvewadi', 'katraj', 'dhankawadi', 'sinhagad road',
    'warje', 'karve nagar', 'kothrud', 'bavdhan', 'lavale', 'pirangut',
    'pimpri', 'chinchwad', 'pcmc', 'nigdi', 'pradhikaran', 'akurdi', 'ravet',
    'punawale', 'tathawade', 'maan', 'mulshi', 'talegaon', 'lonavala',
    'khandala', 'karjat', 'rajgurunagar', 'chakan', 'alandi', 'bhosari',
    'moshi', 'charholi', 'dighi', 'lohegaon', 'wagholi', 'shikrapur',
    'nagpur', 'sitabuldi', 'dharampeth', 'civil lines nagpur', 'sadar',
    'ramdaspeth', 'dhantoli', 'wardha road', 'manewada', 'manish nagar',
    'pratap nagar', 'trimurti nagar', 'laxmi nagar', 'nandanvan', 'ayodhya nagar',
    'hudkeshwar', 'besa', 'narendra nagar', 'jaripatka', 'kamptee',
    'wardha', 'amravati', 'akola', 'yavatmal', 'chandrapur', 'gondia',
    'bhandara', 'gadchiroli', 'buldhana', 'washim', 'hingoli',
    'nashik', 'nasik', 'college road', 'gangapur road', 'panchavati',
    'satpur', 'cidco nashik', 'ambad', 'deolali', 'ozar', 'sinnar',
    'igatpuri', 'ghoti', 'manmad', 'malegaon', 'nandgaon', 'yeola',
    'niphad', 'lasalgaon', 'pimpalgaon', 'dindori', 'trimbakeshwar',
    'dhule', 'jalgaon', 'bhusawal', 'amalner', 'nandurbar', 'shirpur',
    'aurangabad', 'sambhajinagar', 'jalna', 'parbhani', 'latur', 'nanded',
    'osmanabad', 'beed', 'hingoli', 'waluj', 'cidco aurangabad', 'chikalthana',
    'kolhapur', 'sangli', 'satara', 'solapur', 'sholapur', 'ichalkaranji',
    'miraj', 'karad', 'islampur', 'jaysingpur', 'vita', 'tasgaon',
    'ratnagiri', 'sindhudurg', 'malvan', 'vengurla', 'kudal', 'sawantwadi',
    'raigad', 'alibaug', 'alibag', 'murud', 'roha', 'pen', 'khopoli',
    'karjat', 'matheran', 'mahabaleshwar', 'panchgani', 'wai',
    'chiplun', 'lote', 'dapoli', 'khed', 'mahad', 'mangaon', 'shrivardhan',
    'diveagar', 'harihareshwar', 'ganpatipule', 'guhagar',
    'mh', 'maharashtra state', 'mum', 'bombay city', 'punekar', 'mumbaiker',
    'thana', 'kalyan dombivali', 'pcmc area', 'navi mumbai city'
  ],
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ALL INDIA / PAN INDIA (Fallback)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  'All India': [
    'india', 'all india', 'pan india', 'nationwide', 'bharat',
    'anywhere', 'any city', 'any location', 'flexible', 'remote',
    'online', 'work from home', 'wfh', 'all over india'
  ]
};

// ============================================================================
// 🔄 STATE ALIASES (For matching state names)
// ============================================================================

var STATE_ALIASES = {
  'pb': 'Punjab',
  'punjab state': 'Punjab',
  'panjab': 'Punjab',
  
  'chd': 'Chandigarh',
  'chandigrah': 'Chandigarh',
  'chandigar': 'Chandigarh',
  
  'hr': 'Haryana',
  'hariana': 'Haryana',
  
  'dl': 'Delhi',
  'ncr': 'Delhi',
  'delhi ncr': 'Delhi',
  'new delhi': 'Delhi',
  
  'hp': 'Himachal Pradesh',
  'himachal': 'Himachal Pradesh',
  'h.p.': 'Himachal Pradesh',
  'h p': 'Himachal Pradesh',
  
  'uk': 'Uttarakhand',
  'uttaranchal': 'Uttarakhand',
  'ua': 'Uttarakhand',
  'u.k.': 'Uttarakhand',
  
  'mh': 'Maharashtra',
  'maharastra': 'Maharashtra',
  'maharashtra state': 'Maharashtra'
};

// ============================================================================
// 🔧 HELPER FUNCTIONS
// ============================================================================

/**
 * Get Supabase configuration from Script Properties
 */
function getConfig() {
  var props = PropertiesService.getScriptProperties();
  return {
    SUPABASE_URL: props.getProperty('SUPABASE_URL'),
    SUPABASE_KEY: props.getProperty('SUPABASE_KEY'),
    ADMIN_EMAIL: props.getProperty('ADMIN_EMAIL'),
    WHATSAPP_API_URL: props.getProperty('WHATSAPP_API_URL'),
    WHATSAPP_API_KEY: props.getProperty('WHATSAPP_API_KEY')
  };
}

/**
 * Setup Supabase credentials
 */
function setupSecrets() {
  var props = PropertiesService.getScriptProperties();
  props.setProperties({
    'SUPABASE_URL': 'https://YOUR_PROJECT.supabase.co',
    'SUPABASE_KEY': 'YOUR_SERVICE_ROLE_KEY',
    'ADMIN_EMAIL': 'your@email.com'
  });
  Logger.log('✅ Secrets template created! Update with real values.');
}

/**
 * Get current IST time
 */
function getCurrentIST() {
  return new Date(new Date().toLocaleString("en-US", { timeZone: WORKING_HOURS.TIMEZONE }));
}

/**
 * Check if within working hours
 */
function isWithinWorkingHours() {
  var now = getCurrentIST();
  var hour = now.getHours();
  return hour >= WORKING_HOURS.START && hour < WORKING_HOURS.END;
}

/**
 * Get plan weight
 */
function getPlanWeight(planName) {
  if (!planName) return 1;
  var key = planName.toLowerCase().replace(/[\s-]+/g, '_');
  return PLAN_WEIGHTS[key] || 1;
}

/**
 * Get plan config
 */
function getPlanConfig(planName) {
  if (!planName) return null;
  var key = planName.toLowerCase().replace(/[\s-]+/g, '_');
  return PLAN_CONFIG[key] || null;
}

/**
 * Get plan priority (for v15.0 distribution)
 */
function getPlanPriority(planName) {
  if (!planName) return 5;
  return PLAN_PRIORITY[planName] || PLAN_PRIORITY[planName.toLowerCase()] || 5;
}

/**
 * Get all plan names
 */
function getAllPlanNames() {
  return Object.keys(PLAN_CONFIG);
}

/**
 * Get monthly plans
 */
function getMonthlyPlans() {
  var plans = [];
  for (var key in PLAN_CONFIG) {
    if (!PLAN_CONFIG[key].isBooster) {
      plans.push({ id: key, config: PLAN_CONFIG[key] });
    }
  }
  return plans;
}

/**
 * Get booster plans
 */
function getBoosterPlans() {
  var plans = [];
  for (var key in PLAN_CONFIG) {
    if (PLAN_CONFIG[key].isBooster) {
      plans.push({ id: key, config: PLAN_CONFIG[key] });
    }
  }
  return plans;
}

// ============================================================================
// 🧪 TEST / DEBUG FUNCTIONS
// ============================================================================

/**
 * Log city statistics
 */
function logCityStats() {
  Logger.log('========== CITY STATISTICS ==========');
  
  var total = 0;
  for (var state in STATE_CITIES) {
    var count = STATE_CITIES[state].length;
    total += count;
    Logger.log(state + ': ' + count + ' cities');
  }
  
  Logger.log('--------------------------------------');
  Logger.log('TOTAL: ' + total + ' cities mapped');
  Logger.log('======================================');
}

/**
 * Log plan configuration
 */
function logPlanConfig() {
  Logger.log('========== PLAN CONFIGURATION ==========');
  
  Logger.log('\n📦 MONTHLY PLANS:');
  getMonthlyPlans().forEach(function(plan) {
    var c = plan.config;
    Logger.log('  ' + c.displayName + ': ₹' + c.price + ' | ' + c.duration + ' days | ' + c.dailyLeads + '/day | Priority: ' + c.priority);
  });
  
  Logger.log('\n🚀 BOOSTER PLANS:');
  getBoosterPlans().forEach(function(plan) {
    var c = plan.config;
    Logger.log('  ' + c.displayName + ': ₹' + c.price + ' | ' + c.duration + ' days | ' + c.dailyLeads + '/day | Priority: ' + c.priority);
  });
  
  Logger.log('==========================================');
}

/**
 * Health check for Config
 */
function testConfig() {
  Logger.log('========== CONFIG HEALTH CHECK ==========');
  Logger.log('Version: ' + SYSTEM.VERSION);
  Logger.log('');
  
  Logger.log('📊 Column Mapping:');
  Logger.log('   NAME: Column ' + COLUMNS.NAME);
  Logger.log('   PHONE: Column ' + COLUMNS.PHONE);
  Logger.log('   CITY: Column ' + COLUMNS.CITY);
  Logger.log('');
  
  Logger.log('⏰ Time Config:');
  Logger.log('   Active Hours: ' + TIME_CONFIG.ACTIVE_START_HOUR + ' - ' + TIME_CONFIG.ACTIVE_END_HOUR);
  Logger.log('   Backlog Release: ' + TIME_CONFIG.BACKLOG_RELEASE_HOUR + ':00');
  Logger.log('   Focus Gap: ' + TIME_CONFIG.FOCUS_GAP_MINUTES + ' minutes');
  Logger.log('');
  
  logCityStats();
  logPlanConfig();
}
