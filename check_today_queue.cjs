
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function checkTodayQueue() {
    console.log("🕵️‍♂️ Checking TODAY's Queue...");

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    // Fetch Orphan/New/Undelivered from TODAY
    const { data: leads } = await supabase
        .from('leads')
        .select('*')
        .or('status.eq.New,status.eq.Orphan,status.eq.Undelivered')
        .gte('created_at', startOfDay.toISOString())
        .order('created_at', { ascending: false });

    if (!leads || leads.length === 0) {
        console.log("✅ Zero queue for today. Clean.");
    } else {
        console.log(`⚠️ FOUND ${leads.length} LEADS IN TODAY'S QUEUE:`);
        console.table(leads.map(l => ({
            ID: l.id,
            Name: l.name,
            Phone: l.phone,
            Source: l.source,
            Status: l.status,
            Time: new Date(l.created_at).toLocaleTimeString()
        })));
    }
}

checkTodayQueue();
