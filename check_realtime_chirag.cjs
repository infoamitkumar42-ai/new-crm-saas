
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function checkRealtime() {
    console.log("🕵️‍♂️ MONITORING REAL-TIME WEBHOOK LEADS (Chirag Page)...");
    console.log("Current Local Time: 2026-02-05 16:22:00 (approx)\n");

    // Fetch the 10 most recent leads from 'Meta - Digital Chirag' source
    const { data: leads, error } = await supabase.from('leads')
        .select('name, source, status, created_at, assigned_to')
        .eq('source', 'Meta - Digital Chirag')
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) return console.error(error);

    if (leads && leads.length > 0) {
        console.log("Recent Leads Received via Webhook:");
        console.table(leads.map(l => ({
            Name: l.name,
            Time: new Date(l.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
            Status: l.status,
            Assigned: l.assigned_to ? '✅ Yes' : '❌ No'
        })));

        const lastLeadTime = new Date(leads[0].created_at);
        const diffMinutes = Math.floor((new Date('2026-02-05T16:22:12+05:30') - lastLeadTime) / 60000);

        console.log(`\n⏱️ Last lead received ${diffMinutes} minutes ago.`);
    } else {
        console.log("❌ No leads found from 'Meta - Digital Chirag' source today.");
    }
}

checkRealtime();
