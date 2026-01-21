
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Hardcoded paths for reliability
const envPath = 'C:\\Users\\HP\\Downloads\\new-crm-saas\\.env';
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, ...parts] = line.split('=');
    if (key && parts.length > 0) env[key.trim()] = parts.join('=').trim().replace(/^["']|["']$/g, '');
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL || env.VITE_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Helper state function from webhook (simplified)
function inferStateFromPhone(phone) {
    if (!phone) return 'Unknown';
    const stateMap = {
        'Punjab': ['9814', '9815', '9855', '9872', '9876', '9878', '9914', '9915', '9988', '9417', '9463', '9464', '9465', '9779', '9780', '9781', '8054', '8146', '8194', '8195', '8196', '8198', '8283', '8284', '8288', '8289', '8427', '8437', '8528', '8556', '8557', '8558', '8559', '8566', '8567', '8568', '8569', '8591', '8699', '8725', '8727', '8728', '8729', '8872', '8968', '9041', '9042', '9056', '9478', '9501', '9592', '9646', '9779', '9803', '9814', '9815', '9855', '9872', '9876', '9878', '9914', '9915', '9988', '7009', '7087', '7307', '7340', '7347', '7355', '7508', '7526', '7527', '7528', '7529', '7589', '7626', '7696', '7710', '7717', '7719', '78440', '78441', '78442', '78443', '78444', '7814', '7837', '7888', '7889', '7930', '7973', '7986', '7652', '7657', '7658', '6239', '6280', '6283', '6284'],
        // ... (truncated for brevity, using same logic as webhook)
        'Delhi': ['9810', '9811', '9818', '9868', '9871', '9873', '9891', '9899', '9910', '9911', '9953', '9958', '9968', '9971', '9990', '9999'],
    };
    for (const [state, prefixes] of Object.entries(stateMap)) {
        if (prefixes.some(p => phone.startsWith(p) || phone.substring(2).startsWith(p) || phone.replace('+91', '').startsWith(p))) return state;
    }
    return 'Unknown';
}

async function debugWebhook() {
    console.log("🔍 Simulating Webhook Logic for Stuck Leads...\n");

    // 1. Pick a specific stuck lead (New status)
    const { data: leads, error: lError } = await supabase
        .from('leads')
        .select('*')
        .eq('status', 'New')
        .limit(1);

    if (lError || !leads || leads.length === 0) {
        console.log("✅ No leads currently stuck to debug. (Good news, but can't debug history easily)");
        return;
    }

    const lead = leads[0];
    console.log(`📦 Analyzing Lead: ${lead.name} (${lead.phone})`);
    console.log(`   - Source: ${lead.source}`);
    console.log(`   - City: ${lead.city}`);
    console.log(`   - State: ${lead.state}`);

    // Mimic the source -> page -> manager logic
    let manager_id = null;
    let page_id = null;

    if (lead.source?.includes("Work With Himanshu Sharma")) {
        console.log("   👉 Detected Page: Work With Himanshu Sharma");
        // Looking up from 'facebook_pages' table (Simulated)
        const { data: page } = await supabase.from('facebook_pages').select('*').ilike('page_name', '%Himanshu%').single();
        if (page) {
            console.log(`   👉 Found Page in DB: ${page.page_name}`);
            console.log(`   👉 Page Manager ID: ${page.manager_id}`);
            manager_id = page.manager_id;
            page_id = page.page_id;
        } else {
            console.log("   ❌ Page NOT found in 'facebook_pages' table. Using defaults or manual map.");
        }
    }

    // 2. Fetch Eligible Users (Raw)
    console.log("\n🕵️ Checking Eligible Users Query...");

    // Core Query
    let query = supabase.from('users').select('*')
        .eq('is_active', true)
        .neq('plan_name', 'none')
        .or('is_plan_pending.is.null,is_plan_pending.eq.false');

    const { data: allUsers, error: uError } = await query;
    if (uError) { console.error("❌ User Query Failed:", uError); return; }

    console.log(`   - Total Active Users: ${allUsers.length}`);

    // 3. Apply Team Filter
    let teamFiltered = allUsers;
    if (manager_id) {
        console.log(`\n   🚧 Filtering by Manager ID: ${manager_id}`);
        console.log(`   ℹ️ (Plus Simran's ID: ff0ead1f...)`);

        teamFiltered = allUsers.filter(u =>
            u.manager_id === manager_id ||
            u.id === manager_id ||
            u.manager_id === 'ff0ead1f-212c-4e89-bc81-dec4185f8853' || // Simran's Team
            u.id === 'ff0ead1f-212c-4e89-bc81-dec4185f8853'    // Simran Herself
        );
    }
    console.log(`   - Users After Team Filter: ${teamFiltered.length}`);
    if (teamFiltered.length === 0) {
        console.log("   ❌ BLOCKED HERE: No users matched the Manager Filter!");
        return;
    }

    // 4. Apply State Filter
    let stateFiltered = [];
    let state = lead.state || 'Unknown';
    if (state === 'Unknown' || !state) {
        state = inferStateFromPhone(lead.phone);
        console.log(`   ℹ️ Inferred State from Phone: ${state}`);
    }

    if (state !== 'Unknown') {
        stateFiltered = teamFiltered.filter(u => {
            if (!u.state_allow_all && (!u.preferred_states || u.preferred_states.length === 0)) return true; // Default allow? Or deny?
            // Webhook logic: if allow_all is true, pass. If preferences exist, check match.
            if (u.state_allow_all) return true;
            return u.preferred_states && u.preferred_states.includes(state);
        });
        console.log(`   - Users matching State '${state}': ${stateFiltered.length}`);

        // If 0, logic typically falls back to ALL users?
        if (stateFiltered.length === 0) {
            console.log("   ⚠️ No one matched State. Fallback to All Eligible?");
            stateFiltered = teamFiltered; // Fallback
        }
    } else {
        stateFiltered = teamFiltered;
        console.log("   ℹ️ State Unknown, skipping state filter.");
    }

    // 5. Apply Capacity Check
    const capacityFiltered = stateFiltered.filter(u => {
        const limit = u.daily_limit || 0;
        const current = u.leads_today || 0;
        return current < limit;
    });

    console.log(`   - Users with Capacity (>0): ${capacityFiltered.length}`);
    if (capacityFiltered.length === 0) {
        console.log("   ❌ BLOCKED HERE: Everyone is Full!");

        // Show who was considered but full
        stateFiltered.forEach(u => console.log(`      - ${u.name}: ${u.leads_today}/${u.daily_limit}`));
        return;
    }

    // 6. Conclusion
    console.log("\n✅ FINAL VERDICT: The following users SHOULD have received this lead:");
    capacityFiltered.forEach(u => {
        console.log(`   👉 ${u.name} (Pending: ${(u.daily_limit || 0) - (u.leads_today || 0)})`);
    });

    console.log("\n❓ If 'FINAL VERDICT' has users, but lead is stuck -> runtime crash or RPC error?");
}

debugWebhook();
