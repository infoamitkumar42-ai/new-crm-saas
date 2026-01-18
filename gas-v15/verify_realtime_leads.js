import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function verifyRealtime() {
    console.log('\n📡 --- LIVE CHECK: REALTIME LEADS ---\n');

    // Check last 20 minutes
    const now = new Date(); // 2026-01-17 16:13
    const startTime = new Date(now.getTime() - 20 * 60000); // 15:53

    console.log(`Scanning for leads created after: ${startTime.toLocaleTimeString()}`);

    const { data: leads, error } = await supabase
        .from('leads')
        .select('id, name, phone, created_at, assigned_to, source')
        .gt('created_at', startTime.toISOString())
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error:", error.message);
        return;
    }

    if (!leads || leads.length === 0) {
        console.log("❌ No new leads found in the last 20 minutes.");
        console.log("   (If ads are active, verify Webhook status).");
    } else {
        console.log(`✅ FOUND ${leads.length} NEW LEADS!`);

        for (const l of leads) {
            // Get assignee name
            let assigneeName = 'Unassigned';
            if (l.assigned_to) {
                const { data: u } = await supabase.from('users').select('name').eq('id', l.assigned_to).single();
                if (u) assigneeName = u.name;
            }

            const time = new Date(l.created_at).toLocaleTimeString();
            console.log(`   🕒 ${time} | ${l.name} -> ${assigneeName} (${l.source})`);
        }
    }
}

verifyRealtime();
