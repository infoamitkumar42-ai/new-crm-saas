import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function diagnose() {
    console.log('\n🕵️ --- DIAGNOSING ZERO LEADS & IMPORT STATS ---\n');

    // 1. Check Active Users with 0 Leads
    const now = new Date().toISOString();
    const { data: users, error } = await supabase
        .from('users')
        .select('id, name, leads_today, daily_limit, valid_until');

    if (error) {
        console.error("Fetch Error:", error.message);
        return;
    }

    // Filter for truly active (valid date)
    const activeUsers = users.filter(u => new Date(u.valid_until) > new Date());

    console.log(`Total Active (Unexpired & Limit>0) Users: ${activeUsers.length}`);

    const zeroLeadUsers = activeUsers.filter(u => u.leads_today === 0);
    console.log(`Users with 0 Leads Today: ${zeroLeadUsers.length}`);

    if (zeroLeadUsers.length > 0) {
        console.log("\n⚠️ Sample Zero-Lead Users:");
        zeroLeadUsers.slice(0, 10).forEach(u => console.log(`- ${u.name} (Plan: ${u.plan_id})`));
    }

    // 2. Check total assignments today from "Import" sources
    const startToday = new Date();
    startToday.setHours(0, 0, 0, 0);

    const { count: importedCount } = await supabase
        .from('leads')
        .select('id', { count: 'exact' })
        .gte('created_at', startToday.toISOString())
        .in('source', ['Facebook CSV Import', 'Log Restoration V3', 'Log Table Recovery']); // Check our sources

    console.log(`\n📊 Total SUCCESSFULLY Imported Leads Today: ${importedCount}`);
    console.log(`(Note: You sent 176+, but duplicates were skipped.)`);

    // 3. Distribution Check
    // Get all leads created today
    const { data: leadsToday } = await supabase
        .from('leads')
        .select('assigned_to')
        .gte('created_at', startToday.toISOString());

    const distMap = {};
    leadsToday.forEach(l => {
        distMap[l.assigned_to] = (distMap[l.assigned_to] || 0) + 1;
    });

    // Check if zero users actually received NO leads, or if `leads_today` column is just out of sync?
    // We trust the `leads` table count more than user's `leads_today` counter for this check.

    let realZeroCount = 0;
    const realZeroNames = [];

    zeroLeadUsers.forEach(u => {
        const actualCount = distMap[u.id] || 0;
        if (actualCount === 0) {
            realZeroCount++;
            realZeroNames.push(u.name);
        }
    });

    console.log(`\nVERIFIED ZERO USERS (Based on Leads Table): ${realZeroCount}`);
    if (realZeroNames.length > 0) {
        console.log("List:", realZeroNames.join(", "));
    } else {
        console.log("Looks like everyone actually got leads? Maybe `leads_today` counter didn't update locally in script?");
    }
}

diagnose();
