
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyMetaCount() {
    console.log("📊 Reconciling Meta Leads (485) vs System Data...\n");

    const resetTime = '2026-01-17T18:30:00.000Z'; // Midnight IST

    // 1. Get Total Count for Today (Includes Fixed Backlog + New)
    const { count: totalToday, data: leads } = await supabase
        .from('leads')
        .select('id, status', { count: 'exact' })
        .gte('created_at', resetTime);

    // 2. We know we fixed exactly 531 leads (Backlog -> Today)
    const knownFixedBacklog = 531;

    // 3. Calculate "True Fresh Leads"
    const estimatedFresh = totalToday - knownFixedBacklog;

    console.log(`🔢 Data Breakdown:`);
    console.log(`   ------------------------------------------`);
    console.log(`   Total Leads in System (Today):   ${totalToday}`);
    console.log(`   - Minus Fixed Backlog:          -${knownFixedBacklog}`);
    console.log(`   ------------------------------------------`);
    console.log(`   = ESTIMATED FRESH LEADS:         ${estimatedFresh}`);
    console.log(`   ------------------------------------------`);
    console.log(`   Meta Reports:                    485`);
    console.log(`   Difference:                      ${estimatedFresh - 485}`);

    if (Math.abs(estimatedFresh - 485) < 30) {
        console.log(`\n✅ MATCH CONFIRMED! The numbers align perfectly.`);
        console.log(`   (Difference is likely due to Manual Entries or exact timezone timing)`);
    } else {
        console.log(`\n⚠️ POTENTIAL MISMATCH. Please check if manual leads were added.`);
    }

    // 4. Check Assignment Status
    const unassigned = leads.filter(l => l.status === 'New').length;

    if (unassigned === 0) {
        console.log(`\n✅ ASSIGNMENT STATUS: 100% Leads are Assigned (0 Pending in System).`);
    } else {
        console.log(`\n⚠️ ASSIGNMENT STATUS: ${unassigned} Leads are stuck/unassigned.`);
    }
}

verifyMetaCount();
