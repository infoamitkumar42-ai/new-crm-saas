
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSpecific() {
    console.log("🔍 Checking 6 Specific Leads...\n");

    // Names from previous stuck log
    const names = ['Neha Suthar'];

    // Also try to find by created_at > today to be safe, but names are unique enough for now
    const { data: leads, error } = await supabase
        .from('leads')
        .select(`
            id, name, phone, status, assigned_at,
            users!leads_assigned_to_fkey (name, leads_today, daily_limit)
        `)
        .in('name', names); // Exact match might fail if case differs, but let's try

    if (error) { console.error(error); return; }

    console.log(`📦 Found ${leads.length} matching leads:`);
    leads.forEach(l => {
        const u = l.users;
        const pending = u ? (u.daily_limit - u.leads_today) : 'N/A';
        console.log(`- ${l.name} (${l.status}) -> ${u ? u.name : 'Unassigned'}`);
        console.log(`  Assigned At: ${l.assigned_at}`);
        if (u) console.log(`  User Pending: ${pending}`);
        console.log("---");
    });
}

checkSpecific();
