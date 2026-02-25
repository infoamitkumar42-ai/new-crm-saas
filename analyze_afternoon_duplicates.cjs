const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
    console.log(`--- 🔍 DUPLICATE ANALYSIS (Afternoon Batch) 🔍 ---`);

    // 12 PM Today
    const startTimeKey = '2026-02-19T06:30:00.000Z';

    // 1. Fetch Duplicates
    const { data: duplicates } = await supabase
        .from('leads')
        .select('id, name, phone, created_at, source')
        .eq('status', 'Duplicate')
        .gte('created_at', startTimeKey)
        .limit(20);

    if (!duplicates || duplicates.length === 0) {
        console.log("No duplicates found in this period.");
        return;
    }

    console.log(`Analyzing first ${duplicates.length} duplicates...\n`);

    // 2. Find Originals
    for (const dup of duplicates) {
        // Find the OLDEST lead with this phone number (The Original)
        // We exclude the current duplicate ID
        const { data: original } = await supabase
            .from('leads')
            .select('id, created_at, status, assigned_to, source')
            .eq('phone', dup.phone)
            .neq('id', dup.id) // Not this one
            .order('created_at', { ascending: true }) // Oldest first
            .limit(1)
            .single();

        if (original) {
            const origDate = new Date(original.created_at);
            const dupDate = new Date(dup.created_at);

            // Calc Difference
            const diffTime = Math.abs(dupDate - origDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));

            let type = "UNKNOWN";
            if (diffHours < 24) type = "FRESH_DUPLICATE (Same Day)";
            else if (diffDays < 7) type = "RECENT_RETRY (Last 7 Days)";
            else type = "OLD_LEAD_RESUBMISSION (> 7 Days)";

            console.log(`Duplicate: ${dup.name} (${dup.phone})`);
            console.log(`   - Received At: ${dup.created_at}`);
            console.log(`   - Original At: ${original.created_at} (${type})`);
            console.log(`   - Original Status: ${original.status}`);
            console.log(`   - Source Match: ${dup.source === original.source ? 'YES' : 'NO'}`);
            console.log('--------------------------------------------------');
        } else {
            console.log(`⚠️ Weird: ${dup.phone} is marked duplicate but no original found?`);
        }
    }

})();
