const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
    // 1. Calculate 10 PM IST "Yesterday" (Since it's 12 AM now)
    const now = new Date();
    const cutoff = new Date(now);

    // Adjust for UTC/IST logic safely. 
    // If it's 00:50 AM IST (19th), 10 PM IST (18th) was ~3 hours ago.
    cutoff.setHours(cutoff.getHours() - 4);

    console.log(`=== 🕵️ DEEP AUDIT: NIGHT LEADS (Since ${cutoff.toLocaleTimeString()}) ===`);

    const { data, error } = await supabase
        .from('leads')
        .select('name, source, status, created_at') // Minimal select to avoid join errors
        .gte('created_at', cutoff.toISOString())
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching leads:', error);
        return;
    }

    console.log(`Total Leads Found: ${data.length}`);

    if (data.length === 0) {
        console.log('No leads found in this period. Webhook may not be receiving data.');
    } else {
        console.log('| Time (IST) | Lead Name | Status | Source |');
        console.log('|---|---|---|---|');

        data.forEach(l => {
            // Convert to IST
            const date = new Date(l.created_at);
            const istTime = date.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true });

            console.log(`| ${istTime} | ${l.name} | ${l.status} | ${l.source.substring(0, 20)}... |`);
        });
    }

})();
