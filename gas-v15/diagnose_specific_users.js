import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkSpecific() {
    console.log('\n🕵️ --- DEEP DIVE: SWATI & SIMRAN ---\n');

    // 1. Fetch Users matching names
    const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .or('name.ilike.%Swati%,name.ilike.%Simran%');

    if (error) {
        console.error("Error:", error.message);
        return;
    }

    console.log(`Found ${users.length} users matching 'Swati' or 'Simran'.\n`);

    // 2. For each, count ACTUAL leads in `leads` table today
    const startToday = new Date();
    startToday.setHours(0, 0, 0, 0);

    for (const u of users) {
        // Count actual leads
        const { count, error: countError } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_to', u.id)
            .gte('created_at', startToday.toISOString());

        // Get Plan Name (assuming plan_id is valid, or we infer from limit)
        // If plan table exists, we could join, but let's just show limit/id

        console.log(`👤 Name: ${u.name} (ID: ${u.id})`);
        console.log(`   📧 Email: ${u.email}`);
        console.log(`   📋 Plan Details: Limit=${u.daily_limit}, ValidUntil=${u.valid_until}`);
        console.log(`   🔢 DB Counter (leads_today): ${u.leads_today}`);
        console.log(`   ✅ ACTUAL LEADS FOUND: ${count}`);

        if (count > 0) {
            // Show last lead details
            const { data: lastLead } = await supabase
                .from('leads')
                .select('name, phone, created_at')
                .eq('assigned_to', u.id)
                .order('created_at', { ascending: false })
                .limit(1);
            if (lastLead && lastLead.length > 0) {
                console.log(`      ➡ Last Lead: ${lastLead[0].name} (${lastLead[0].phone}) at ${lastLead[0].created_at}`);
            }
        } else {
            console.log(`      ⚠️ ZERO LEADS FOUND!`);
        }
        console.log('------------------------------------------------');
    }
}

checkSpecific();
