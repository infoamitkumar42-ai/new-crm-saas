import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkHistory() {
    console.log('\n🕵️ --- CHECKING INACTIVE USERS LAST LEAD ---\n');

    const targets = [
        { email: 'workwithrajwinder@gmail.com', label: 'Rajwinder' },
        { email: 'sunnymehre451@gmail.com', label: 'Sandeep' },
        { email: 'gurnambal01@gmail.com', label: 'Gurnam' },
        { email: 'rajnikaler01@gmail.com', label: 'Rajni' }
    ];

    for (const t of targets) {
        // 1. Find User
        const { data: user, error } = await supabase
            .from('users')
            .select('id, name, email, daily_limit, leads_today, valid_until')
            .eq('email', t.email)
            .maybeSingle();

        if (error) {
            console.log(`❌ Error finding ${t.email}: ${error.message}`);
            continue;
        }

        if (!user) {
            console.log(`⚠️ User not found: ${t.email}`);
            continue;
        }

        console.log(`👤 ${user.name} (${t.label})`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Status: Limit=${user.daily_limit}, ValidUntil=${user.valid_until}`);
        console.log(`   Current Counter: ${user.leads_today}`);

        // 2. Find Last Lead
        const { data: lastLead } = await supabase
            .from('leads')
            .select('created_at, name, phone, source')
            .eq('assigned_to', user.id)
            .order('created_at', { ascending: false })
            .limit(1);

        if (lastLead && lastLead.length > 0) {
            const l = lastLead[0];
            const date = new Date(l.created_at);
            console.log(`   🕒 LAST LEAD: ${l.created_at} (${date.toLocaleString()})`);
            console.log(`      Details: ${l.name} (${l.phone})`);
            console.log(`      Source: ${l.source}`);
        } else {
            console.log(`   🚫 NO LEADS FOUND (Ever).`);
        }
        console.log('------------------------------------------------');
    }
}

checkHistory();
