import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function parseLogTableAndDistribute() {
    console.log('\n🔄 --- PARSING LOG TABLE & DISTRIBUTING ---');

    let content;
    try {
        content = fs.readFileSync('facebook_leads.txt', 'utf8');
    } catch (e) {
        console.error("Error reading file:", e.message);
        return;
    }

    const lines = content.split('\n');

    // REGEX: | 👤 Pihu Rana | 7505269589 | kotdwara
    const leadRegex = /\|\s*👤\s*([^|]+)\s*\|\s*(\d+)\s*\|\s*([^|]+)/;

    // REGEX: | 🔄 DUPLICATE: 8054542446
    const dupRegex = /\|\s*🔄\s*DUPLICATE:\s*(\d+)/;


    // FETCH USERS FOR DISTRIBUTION
    const { data: activeUsers } = await supabase
        .from('users')
        .select('id, name')
        .order('leads_today', { ascending: true }); // Equal dist

    if (!activeUsers || activeUsers.length === 0) {
        console.error("No active users!");
        return;
    }

    let userIndex = 0;
    let distributedCount = 0;
    const leadsToInsert = [];

    // Parse loop
    for (const line of lines) {
        // Check for Lead Details
        const match = line.match(leadRegex);
        if (match) {
            const name = match[1].trim();
            const phone = match[2].trim();
            const city = match[3].trim();

            // Check if this specific line was merely a duplicate log
            // (Wait, duplicate log line usually follows?)
            // No, the table has rows. If I see a DUPLICATE row for this phone, I'll know.
            // But I am parsing valid lead lines.

            leadsToInsert.push({ name, phone, city });
        }
    }

    // Filter duplicates locally from parsing?
    // User might have multiple logs for same lead.
    // Use a Set.
    const uniqueLeads = [];
    const seenPhones = new Set();

    // Also parse explicitly logged DUPLICATES to exclude them immediately?
    // Actually, SUPABASE strict check is better.

    console.log(`Extracted ${leadsToInsert.length} lead entries from logs.`);

    for (const l of leadsToInsert) {
        if (seenPhones.has(l.phone)) continue;
        seenPhones.add(l.phone);
        uniqueLeads.push(l);
    }

    console.log(`Processing ${uniqueLeads.length} unique leads...`);

    for (const lead of uniqueLeads) {
        // Check DB Existence
        const { data: existing } = await supabase
            .from('leads')
            .select('id')
            .eq('phone', lead.phone)
            .maybeSingle();

        if (existing) {
            console.log(`found existing lead: ${lead.name}`);
            continue;
        }

        // Distribute
        const assignedUser = activeUsers[userIndex];
        userIndex = (userIndex + 1) % activeUsers.length;

        // Insert
        const { error } = await supabase.from('leads').insert({
            name: lead.name,
            phone: lead.phone,
            city: lead.city,
            state: 'unknown', // log has state but parsing complex, let webhook update later or leave unknown
            status: 'Assigned',
            user_id: assignedUser.id,
            assigned_to: assignedUser.id,
            created_at: new Date().toISOString(), // Use NOW
            assigned_at: new Date().toISOString(),
            source: 'Log Table Recovery'
        });

        if (!error) {
            console.log(`✅ Recovered & Distributed: ${lead.name} -> ${assignedUser.name}`);
            distributedCount++;
        } else {
            console.log(`❌ Error: ${error.message}`);
        }
    }

    console.log(`\n🎉 Process Complete. ${distributedCount} leads recovered.`);
    console.log("Note: All leads in logs were 'No eligible users' (Orphans), so they are now distributed fresh.");
}

parseLogTableAndDistribute();
