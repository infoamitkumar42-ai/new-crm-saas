
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeDates() {
    console.log("🕵️‍♀️ Sherlock Mode: Inferring Original Dates for Navjot...\n");

    const email = 'knavjotkaur113@gmail.com';
    const resetTime = '2026-01-17T18:30:00.000Z';

    // 1. Get User ID
    const { data: user } = await supabase.from('users').select('id').eq('email', email).single();
    if (!user) { console.log("User not found via email"); return; }

    // 2. Get Her Assigned Leads (Today)
    const { data: leads } = await supabase
        .from('leads')
        .select('id, name, created_at, assigned_at')
        .eq('assigned_to', user.id)
        .gte('assigned_at', resetTime)
        .order('id', { ascending: true }); // Order by ID to see sequence

    if (!leads.length) { console.log("No leads found."); return; }

    console.log(`🔍 Found ${leads.length} Leads. Analyzing IDs...`);

    // 3. Pick the First and Last ID of this batch
    const firstLead = leads[0];
    const lastLead = leads[leads.length - 1];

    console.log(`   Range IDs: ${firstLead.id} ... ${lastLead.id}`);

    // 4. Find NEIGHBORS (IDs close to these) that are NOT owned by her
    // We want to find a lead with ID < firstLead.id to seeing its Original Date.
    // We look for leads where created_at != assigned_at (meaning untouched).

    // Previous Neighbor
    const { data: prevNeighbor } = await supabase
        .from('leads')
        .select('id, created_at, assigned_at')
        .lt('id', firstLead.id)
        .order('id', { ascending: false })
        .limit(1)
        .single();

    // 5. Output Findings
    if (prevNeighbor) {
        // Convert to IST
        const date = new Date(prevNeighbor.created_at);
        const istDate = new Date(date.getTime() + (5.5 * 60 * 60 * 1000));

        console.log(`\n📅 ESTABLISHED TIMELINE:`);
        console.log(`   Based on Lead ID #${prevNeighbor.id} (Just before hers):`);
        console.log(`   Original Date: ${istDate.toISOString().replace('T', ' ').substring(0, 19)} IST`);
        console.log(`   (So Navjot's leads are from around this time)`);
    } else {
        console.log("   could not find exact neighbor.");
    }

    // Check if we can infer day
    console.log("\n   Summary:");
    if (prevNeighbor) {
        const date = new Date(prevNeighbor.created_at);
        const day = date.getDate();
        const month = date.toLocaleString('default', { month: 'short' });
        console.log(`   Leads were originally created on: **${day} ${month}**`);
    }

}

analyzeDates();
