const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkSignupTables() {
    console.log('--- CHECKING SIGNUP LOGS ---');

    // 1. Check for tables that might store signup requests
    const tablesToCheck = ['signup_requests', 'registrations', 'user_sync_logs', 'team_mappings'];
    for (const t of tablesToCheck) {
        const { data, error } = await supabase.from(t).select('*').limit(1);
        if (!error) {
            console.log(`✅ Table found: ${t}`);
            const { data: userRecord } = await supabase.from(t).select('*').ilike('email', 'jashanpreet0479@gmail.com').maybeSingle();
            if (userRecord) console.log(`Data in ${t}:`, userRecord);
        } else {
            // console.log(`❌ Table ${t} not found or inaccessible.`);
        }
    }

    // 2. Check the User's payment again for any "team" reference in the notes or metadata
    const { data: payments } = await supabase.from('payments').select('*').eq('email', 'jashanpreet0479@gmail.com');
    if (payments && payments.length > 0) {
        console.log('\nPayment Metadata:');
        payments.forEach(p => {
            console.log(`- Amount: ${p.amount}, Status: ${p.status}, Notes: ${p.notes || 'None'}`);
        });
    }

    // 3. Confirm the Manager ID relationship for Jashanpreet
    const { data: user } = await supabase.from('users').select('name, manager_id').ilike('email', 'jashanpreet0479@gmail.com').single();
    if (user && user.manager_id) {
        const { data: manager } = await supabase.from('users').select('name, team_code').eq('id', user.manager_id).single();
        console.log(`\nDirect Link Check:`);
        console.log(`- User: ${user.name}`);
        console.log(`- Manager: ${manager?.name}`);
        console.log(`- Manager Team Code: ${manager?.team_code}`);
    }
}

checkSignupTables();
