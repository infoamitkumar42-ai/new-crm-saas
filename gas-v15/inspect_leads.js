import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function inspectLeadsData() {
    console.log('\n🔍 --- INSPECTING LEADS DATA STRUCTURE ---\n');

    // Get a sample of leads that have notes or other potential metadata
    const { data: leads } = await supabase
        .from('leads')
        .select('*')
        .not('notes', 'is', null) // Check leads with notes
        .limit(5);

    if (leads && leads.length > 0) {
        console.log('✅ Found leads with notes. Checking structure...\n');
        leads.forEach(l => {
            console.log(`Lead ID: ${l.id}`);
            console.log(`Notes: ${JSON.stringify(l.notes)}`);
            console.log(`Updated At: ${l.updated_at}`);
            console.log(`Assigned To: ${l.assigned_to}`);
            console.log('--');
        });
    } else {
        console.log('❌ No leads with notes found in sample.\n');
    }

    // Check if there are any other columns related to 'history' or 'log' in leads table by selecting one record
    // We already listed columns: id, user_id, manager_id, name, phone, city, source, status, notes, distributed_at, contacted_at, closed_at, created_at, updated_at, quality_score, is_valid_phone, phone_type, response_time_hours, is_replaced, replacement_reason, replaced_at, replacement_requested, state, assigned_at, temp_assigned_email, assigned_to, delivered_at

    // Check 'manager_id' - maybe that helps?
    const { count: managerCount } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .not('manager_id', 'is', null);

    console.log(`Leads with manager_id: ${managerCount}`);

    // Check 'temp_assigned_email' - sounds promising!
    const { count: tempKeyCount } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .not('temp_assigned_email', 'is', null);

    console.log(`Leads with temp_assigned_email: ${tempKeyCount}`);

    if (tempKeyCount > 0) {
        const { data: tempSamples } = await supabase
            .from('leads')
            .select('id, temp_assigned_email, user_id')
            .not('temp_assigned_email', 'is', null)
            .limit(5);
        console.log('Temp Email Samples:', tempSamples);
    }
}

inspectLeadsData();
