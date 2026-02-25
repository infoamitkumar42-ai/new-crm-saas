const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
    console.log('--- 🕵️‍♂️ LIVE ASSIGNMENT CHECK (Post-Sync) 🕵️‍♂️ ---');
    console.log('Checking leads from the last 30 minutes...');

    // Approx time since sync (6:15 AM IST approx)
    const timeThreshold = new Date(Date.now() - 30 * 60 * 1000).toISOString();

    const { data: leads, error } = await supabase
        .from('leads')
        .select('id, created_at, assigned_to, name, phone')
        .gte('created_at', timeThreshold)
        .order('created_at', { ascending: false });

    if (error) { console.error(error); return; }

    if (leads.length === 0) {
        console.log('No leads received in the last 30 minutes. System might be quiet or waiting for Inbound.');
        return;
    }

    console.log(`\nFound ${leads.length} NEW leads since sync.`);
    console.log('Verifying recipients are VALID and ACTIVE...\n');

    const assignments = {};

    for (const lead of leads) {
        if (!lead.assigned_to) {
            console.log(`⚠️ Lead ${lead.id} is UNASSIGNED!`);
            continue;
        }

        const { data: user } = await supabase
            .from('users')
            .select('name, email, is_active, total_leads_promised, total_leads_received')
            .eq('id', lead.assigned_to)
            .single();

        if (user) {
            const key = `${user.name} (${user.email})`;
            if (!assignments[key]) assignments[key] = { count: 0, status: user.is_active ? '✅' : '❌' };
            assignments[key].count++;
        } else {
            console.log(`⚠️ Lead ${lead.id} assigned to Unknown User ID: ${lead.assigned_to}`);
        }
    }

    console.table(assignments);
    console.log('\n--- VERDICT ---');
    const inactiveRecipients = Object.entries(assignments).filter(([k, v]) => v.status === '❌');
    if (inactiveRecipients.length > 0) {
        console.log('❌ CRITICAL: Inactive users received leads!');
    } else {
        console.log('✅ PASS: All recipients are Active.');
    }

})();
