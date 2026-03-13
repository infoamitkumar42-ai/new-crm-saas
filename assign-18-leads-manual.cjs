/**
 * MANUAL LEAD ASSIGNMENT — 18 Leads
 *
 * Rule:
 *   - Lead 1-10  → Fixed user: 9dd68ace-a5a7-46d8-b677-3483b5bb0841
 *   - Lead 11-18 → gurnoor1311singh@gmail.com + other active users
 *                  (Booster/Turbo plans get 2 leads, others get 1)
 *
 * Run: node assign-18-leads-manual.cjs
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const FIRST_10_USER_ID = '9dd68ace-a5a7-46d8-b677-3483b5bb0841';
const GURNOOR_EMAIL    = 'gurnoor1311singh@gmail.com';
const BOOSTER_PLANS    = ['turbo', 'boost', 'booster', 'premium', 'pro', 'elite'];

// ─── 18 LEADS ─────────────────────────────────────────────────────────────────
const ALL_LEADS = [
  // First 10 → FIRST_10_USER_ID
  { name: 'kabira',                        phone: '9950885477', city: 'Sohna',                    category: '18-25' },
  { name: 'Kuldeep',                       phone: '8527482470', city: 'NCR',                       category: '30-40' },
  { name: 'Ashish Kumar',                  phone: '9140636016', city: 'Lucknow',                   category: '18-25' },
  { name: 'yash',                          phone: '8758626437', city: 'Surat',                     category: '18-25' },
  { name: 'Vinay Keshri',                  phone: '7870054711', city: 'Jharia',                    category: '25-30' },
  { name: 'Mann Saab',                     phone: '7837637320', city: 'Shahid Bhagat Singh Nagar', category: '18-25' },
  { name: 'Raman Rajnish',                 phone: '7719404134', city: 'Ludhiana',                  category: '30-40' },
  { name: 'Vijay Yadav',                   phone: '8882563058', city: 'Ghaziabad',                 category: '18-25' },
  { name: 'Kaushal Srivastav',             phone: '7982247235', city: 'Shahjahanpur',              category: '25-30' },
  { name: 'JASSA',                         phone: '8535085022', city: 'Saharanpur',                category: '18-25' },
  // Remaining 8 → distributed
  { name: 'Sishu Pal',                     phone: '8218388842', city: 'Pilibhit',                  category: '18-25' },
  { name: 'Computer Hardware Engineer',    phone: '9795735440', city: 'Mumbai',                    category: '18-25' },
  { name: 'KR Verma',                      phone: '7275839757', city: 'Lucknow',                   category: '25-30' },
  { name: 'Mohan Ji',                      phone: '9839129717', city: 'Varanasi',                  category: '25-30' },
  { name: 'Divya Saini',                   phone: '7457863761', city: 'Dehradun',                  category: '18-25' },
  { name: 'Shaikh Nazim Shaikh Rafique',   phone: '9657599510', city: 'Jalgaon Maharashtra',       category: '18-25' },
  { name: 'Aryan Sharma',                  phone: '8860979626', city: 'Delhi',                     category: '30-40' },
  { name: 'Sahib Ali',                     phone: '7983413449', city: 'Rampur',                    category: '18-25' },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const cleanPhone = (raw) => raw.replace(/\D/g, '').slice(-10);
const isBooster  = (plan) => plan && BOOSTER_PLANS.some(b => plan.toLowerCase().includes(b));

async function isDuplicate(phone) {
  const { data } = await supabase.from('leads').select('id').eq('phone', phone).limit(1);
  return data && data.length > 0;
}

async function insertLead(lead, userId) {
  return supabase.from('leads').insert({
    name:        lead.name,
    phone:       cleanPhone(lead.phone),
    city:        lead.city,
    category:    lead.category,
    status:      'Fresh',
    source:      'Meta Ads (Manual)',
    user_id:     userId,
    assigned_to: userId,
    notes:       `Age Group: ${lead.category} | Manually assigned batch`,
    created_at:  new Date().toISOString(),
  });
}

async function updateCounters(userId, count) {
  const { data } = await supabase.from('users')
    .select('leads_today, total_leads_received')
    .eq('id', userId).single();

  return supabase.from('users').update({
    leads_today:           (data?.leads_today           || 0) + count,
    total_leads_received:  (data?.total_leads_received  || 0) + count,
  }).eq('id', userId);
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🚀 Starting manual lead assignment — 18 leads\n');

  // ── 1. Verify first-10 user exists ────────────────────────────────────────
  const { data: u10, error: u10Err } = await supabase
    .from('users').select('id, name, email, leads_today').eq('id', FIRST_10_USER_ID).single();

  if (u10Err || !u10) throw new Error('❌ First-10 user not found: ' + u10Err?.message);
  console.log(`✅ First-10 user: ${u10.name} (${u10.email})`);

  // ── 2. Verify gurnoor exists ───────────────────────────────────────────────
  const { data: gurnoor, error: gErr } = await supabase
    .from('users').select('id, name, email, plan_name, leads_today').eq('email', GURNOOR_EMAIL).single();

  if (gErr || !gurnoor) throw new Error('❌ Gurnoor not found: ' + gErr?.message);
  console.log(`✅ Gurnoor: ${gurnoor.name} (${gurnoor.email}) — plan: ${gurnoor.plan_name}`);

  // ── 3. Fetch other active users ────────────────────────────────────────────
  const { data: others, error: oErr } = await supabase
    .from('users')
    .select('id, name, email, plan_name, leads_today')
    .eq('is_active', true)
    .eq('payment_status', 'active')
    .neq('id', FIRST_10_USER_ID)
    .neq('email', GURNOOR_EMAIL)
    .neq('role', 'admin')
    .order('leads_today', { ascending: true });  // fewest leads first = fair

  if (oErr) throw new Error('❌ Failed fetching others: ' + oErr.message);
  console.log(`✅ Other active users: ${others?.length || 0}`);

  // ── 4. Build distribution queue ────────────────────────────────────────────
  // Gurnoor first, then others. Booster users get double slot.
  const queue = [];
  const addWithBoost = (u) => {
    queue.push(u);
    if (isBooster(u.plan_name)) queue.push(u); // 2nd slot for booster
  };
  addWithBoost(gurnoor);
  for (const u of (others || [])) addWithBoost(u);

  console.log(`\n🗂️  Distribution queue (${queue.length} slots):`);
  queue.forEach((u, i) => console.log(`  ${i+1}. ${u.name} — ${u.plan_name || 'N/A'}`));

  // ── 5. Insert first 10 leads ───────────────────────────────────────────────
  console.log(`\n📌 STEP 1: First 10 leads → ${u10.name}`);
  console.log('─'.repeat(55));

  let ins10 = 0, skip10 = 0;
  for (const lead of ALL_LEADS.slice(0, 10)) {
    const phone = cleanPhone(lead.phone);
    if (await isDuplicate(phone)) {
      console.log(`  ⚠️  DUP SKIP: ${lead.name} (${phone})`);
      skip10++;
      continue;
    }
    const { error } = await insertLead(lead, FIRST_10_USER_ID);
    if (error) { console.log(`  ❌ ERR: ${lead.name} — ${error.message}`); }
    else        { console.log(`  ✅ ${lead.name} (${phone}) — ${lead.city}`); ins10++; }
  }
  console.log(`  → Inserted: ${ins10} | Skipped: ${skip10}`);

  if (ins10 > 0) await updateCounters(FIRST_10_USER_ID, ins10);

  // ── 6. Distribute remaining 8 leads ───────────────────────────────────────
  const rem = ALL_LEADS.slice(10);
  console.log(`\n📌 STEP 2: Remaining ${rem.length} leads → distributed`);
  console.log('─'.repeat(55));

  let insR = 0, skipR = 0;
  const perUserCount = {}; // track for counter update

  for (let i = 0; i < rem.length; i++) {
    const lead     = rem[i];
    const assignee = queue[i % queue.length];
    const phone    = cleanPhone(lead.phone);

    if (await isDuplicate(phone)) {
      console.log(`  ⚠️  DUP SKIP: ${lead.name} (${phone})`);
      skipR++;
      continue;
    }
    const { error } = await insertLead(lead, assignee.id);
    if (error) {
      console.log(`  ❌ ERR: ${lead.name} → ${assignee.name} — ${error.message}`);
    } else {
      console.log(`  ✅ ${lead.name} (${phone}) → ${assignee.name}`);
      perUserCount[assignee.id] = (perUserCount[assignee.id] || 0) + 1;
      insR++;
    }
  }
  console.log(`  → Inserted: ${insR} | Skipped: ${skipR}`);

  // ── 7. Update counters for distributed users ───────────────────────────────
  console.log('\n📌 STEP 3: Updating counters...');
  for (const [uid, cnt] of Object.entries(perUserCount)) {
    const u = queue.find(q => q.id === uid);
    const { error } = await updateCounters(uid, cnt);
    if (error) console.log(`  ❌ Counter fail: ${u?.name} — ${error.message}`);
    else        console.log(`  ✅ ${u?.name}: +${cnt} leads`);
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(55));
  console.log('📊 DONE!');
  console.log(`  First 10 → ${u10.name}: ${ins10} inserted, ${skip10} skipped`);
  console.log(`  Remaining → distributed: ${insR} inserted, ${skipR} skipped`);
  console.log(`  Total: ${ins10 + insR} leads assigned`);
  console.log('═'.repeat(55) + '\n');
}

main().catch(err => {
  console.error('\n💥 Failed:', err.message);
  process.exit(1);
});
