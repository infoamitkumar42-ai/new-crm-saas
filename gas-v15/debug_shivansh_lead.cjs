
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugShivansh() {
    console.log("🔍 Debugging Lead: Shivansh...\n");

    const { data: leads, error } = await supabase
        .from('leads')
        .select('id, name, created_at, assigned_at, status')
        .or('name.ilike.shivansh%,name.ilike.hundal')
        .order('assigned_at', { ascending: false });

    if (error) { console.error(error); return; }

    console.log(`FOUND ${leads.length} leads:`);
    leads.forEach(l => {
        console.log(`- Name: ${l.name}`);
        console.log(`  Raw Created At (UTC):  ${l.created_at}`);
        console.log(`  Raw Assigned At (UTC): ${l.assigned_at}`);

        // Convert to IST
        const assignedIST = new Date(l.assigned_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
        console.log(`  Assigned IST:          ${assignedIST}`);
        console.log("-----------------------------------------");
    });
}

debugShivansh();
