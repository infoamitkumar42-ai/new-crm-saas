
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

async function deepDivePayal() {
    console.log("🕵️‍♀️ Forensic Check: Payal Puri Leads (With Creation Dates)...\n");

    // 1. Get User
    const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', 'payalpuri3299@gmail.com');

    if (error || !users.length) { console.error("User Err:", error); return; }
    const u = users[0];
    console.log(`👤 Name: ${u.name} | Counter: ${u.leads_today} | Limit: ${u.daily_limit}`);

    // 2. Fetch Leads (Assigned Today)
    const resetTime = '2026-01-17T18:30:00.000Z'; // Midnight IST

    const { data: leads, error: lErr } = await supabase
        .from('leads')
        .select('id, name, created_at, assigned_at, status, manager_id, phone, city')
        .eq('assigned_to', u.id)
        .gte('assigned_at', resetTime)
        .order('assigned_at', { ascending: false });

    if (lErr) { console.error("Lead Err:", lErr); return; }

    console.log(`\n📦 Actual Leads Assigned Today (Count: ${leads.length}):`);

    leads.forEach((l, i) => {
        const assigned = new Date(l.assigned_at);
        const created = new Date(l.created_at);

        // IST Offset +5.5h
        const assignedIST = new Date(assigned.getTime() + (5.5 * 60 * 60 * 1000));
        const createdIST = new Date(created.getTime() + (5.5 * 60 * 60 * 1000));

        let warning = "";
        const diffHours = (assigned.getTime() - created.getTime()) / (1000 * 60 * 60);
        if (diffHours > 24) warning = "⚠️ OLD LEAD (Backlog)";

        console.log(`${i + 1}. ${l.name} ${warning}`);
        console.log(`   Created  (IST): ${createdIST.toISOString().replace('T', ' ').substring(0, 19)}`);
        console.log(`   Assigned (IST): ${assignedIST.toISOString().replace('T', ' ').substring(0, 19)}`);
        console.log(`   Status: ${l.status}`);
        console.log("---------------------------------------------------");
    });
}

deepDivePayal();
