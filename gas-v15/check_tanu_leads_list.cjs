
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTanuLeads() {
    console.log("🔍 Checking Tanu's Leads for Today...\n");

    const { data: users } = await supabase.from('users').select('id, name').eq('email', 'dhawantanu536@gmail.com').single();
    if (!users) return;

    // Reset Time: Yesterday 18:30 UTC
    const resetTime = '2026-01-17T18:30:00.000Z';

    const { data: leads, error } = await supabase
        .from('leads')
        .select('*')
        .eq('assigned_to', users.id)
        .gte('assigned_at', resetTime)
        .order('assigned_at', { ascending: false });

    console.log(`👤 User: ${users.name}`);
    console.log(`📋 Leads Found: ${leads.length}`);

    leads.forEach(l => {
        console.log(`- [${new Date(l.assigned_at).toLocaleString()}] ${l.name} (${l.status})`);
    });
}

checkTanuLeads();
