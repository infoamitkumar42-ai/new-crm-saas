// assign-18-leads-manual.cjs
// Manually assigns up to 18 'New' leads:
//   Leads 1-10  → Himanshu Sharma
//   Leads 11-18 → Gurnoor first, then weighted (turbo/weekly = 2x) among active users

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';

const HIMANSHU_ID  = '9dd68ace-a5a7-46d8-b677-3483b5bb0841';
const GURNOOR_ID   = '6e599815-d631-485d-b701-7d5efd5b9eca';

const HEADERS = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'return=representation'
};

async function supaGet(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers: HEADERS });
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}: ${await res.text()}`);
  return res.json();
}

async function supaRpc(fn, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`RPC ${fn} → ${res.status}: ${await res.text()}`);
  return res.json();
}

async function assignLead(lead, user) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/leads?id=eq.${lead.id}&status=eq.New`,
    {
      method: 'PATCH',
      headers: HEADERS,
      body: JSON.stringify({
        status: 'Assigned',
        user_id: user.id,
        assigned_to: user.id,
        assigned_at: new Date().toISOString()
      })
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(`PATCH lead ${lead.id} → ${res.status}: ${JSON.stringify(data)}`);
  if (!data || data.length === 0) {
    console.log(`  ⚠️  Lead ${lead.phone?.slice(-4)} already taken (race). Skipping.`);
    return false;
  }
  // Increment counters
  try {
    await supaRpc('increment_user_lead_counters', { p_user_id: user.id });
  } catch (e) {
    console.warn(`  ⚠️  Counter RPC failed: ${e.message}`);
  }
  return true;
}

async function main() {
  console.log('🚀 Fetching New leads...');

  // 1. Fetch up to 18 'New' leads, oldest first
  const leads = await supaGet(
    `leads?status=eq.New&order=created_at.asc&limit=18&select=id,phone,state,source,status`
  );
  console.log(`📦 Found ${leads.length} New leads`);
  if (leads.length === 0) { console.log('✅ Nothing to do.'); return; }

  // 2. Fetch fresh active users
  const users = await supaGet(
    `users?is_active=eq.true&select=id,name,email,plan_name,leads_today,daily_limit,total_leads_received,total_leads_promised`
  );

  // Helper: check user has capacity
  function hasCapacity(u) {
    if ((u.leads_today || 0) >= (u.daily_limit || 0)) return false;
    const promised = u.total_leads_promised || 0;
    const received = u.total_leads_received || 0;
    if (promised > 0 && received >= promised) return false;
    return true;
  }

  // Boost plans
  const BOOST_PLANS = ['weekly_boost', 'turbo_boost'];

  // Track local counter increments
  const localCounts = {};
  users.forEach(u => { localCounts[u.id] = u.leads_today || 0; });

  let distributed = 0;
  let himanshuCount = 0;
  let gurnoorUsed = false;

  // Round-robin pool for leads 11-18 (weighted)
  // Build weighted queue: boost plans appear twice
  function buildQueue(excludeIds = []) {
    const pool = users.filter(u => {
      if (excludeIds.includes(u.id)) return false;
      // Use local count for capacity check
      const lc = localCounts[u.id] || 0;
      if (lc >= (u.daily_limit || 0)) return false;
      const promised = u.total_leads_promised || 0;
      const received = (u.total_leads_received || 0) + (lc - (u.leads_today || 0));
      if (promised > 0 && received >= promised) return false;
      return true;
    });
    // Sort: least leads first, then boost plans get priority
    pool.sort((a, b) => {
      const la = localCounts[a.id] || 0;
      const lb = localCounts[b.id] || 0;
      if (la !== lb) return la - lb;
      const wa = BOOST_PLANS.includes(a.plan_name) ? 2 : 1;
      const wb = BOOST_PLANS.includes(b.plan_name) ? 2 : 1;
      return wb - wa;
    });
    return pool;
  }

  for (let i = 0; i < leads.length; i++) {
    const lead = leads[i];
    const idx = i + 1;
    console.log(`\n[${idx}/${leads.length}] Lead ${lead.phone?.slice(-4)} (${lead.state || 'Unknown'})`);

    let targetUser = null;

    if (idx <= 10) {
      // Himanshu
      const himanshu = users.find(u => u.id === HIMANSHU_ID);
      if (!himanshu) { console.log('  ❌ Himanshu not found'); continue; }
      const lc = localCounts[HIMANSHU_ID] || 0;
      if (lc >= (himanshu.daily_limit || 0)) {
        console.log(`  ⚠️  Himanshu at daily limit (${lc}/${himanshu.daily_limit}). Skipping.`);
        continue;
      }
      targetUser = himanshu;
    } else {
      // Lead 11+: Gurnoor first, then weighted pool
      if (!gurnoorUsed) {
        const gurnoor = users.find(u => u.id === GURNOOR_ID);
        if (gurnoor) {
          const lc = localCounts[GURNOOR_ID] || 0;
          if (lc < (gurnoor.daily_limit || 0)) {
            targetUser = gurnoor;
            gurnoorUsed = true;
          } else {
            console.log(`  ℹ️  Gurnoor at daily limit, skipping to pool`);
            gurnoorUsed = true;
          }
        }
      }

      if (!targetUser) {
        const queue = buildQueue([HIMANSHU_ID]);
        if (queue.length === 0) { console.log('  ⚠️  No eligible users. Skipping.'); continue; }
        targetUser = queue[0];
      }
    }

    if (!targetUser) continue;

    console.log(`  → Assigning to ${targetUser.name} (${targetUser.plan_name}, ${localCounts[targetUser.id]}/${targetUser.daily_limit})`);
    const ok = await assignLead(lead, targetUser);
    if (ok) {
      localCounts[targetUser.id] = (localCounts[targetUser.id] || 0) + 1;
      distributed++;
      console.log(`  ✅ Done. ${targetUser.name} now has ${localCounts[targetUser.id]} leads today.`);
    }

    // Small delay to avoid hammering DB
    await new Promise(r => setTimeout(r, 300));
  }

  console.log(`\n🎉 Complete! Distributed: ${distributed}/${leads.length}`);
}

main().catch(e => { console.error('💥 Fatal:', e.message); process.exit(1); });
