import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function importFacebookLeads() {
    console.log('\n📥 --- IMPORTING FACEBOOK LEADS ---');

    let content;
    try {
        content = fs.readFileSync('facebook_leads.txt', 'utf8');
    } catch (e) {
        console.error("Error reading file:", e.message);
        return;
    }

    const lines = content.split('\n');
    let importedCount = 0;

    // Fetch all users for distribution
    const { data: activeUsers } = await supabase
        .from('users')
        .select('id, name, leads_today, daily_limit')
        .order('leads_today', { ascending: true }); // Distribute to those with least leads first

    if (!activeUsers || activeUsers.length === 0) {
        console.error("No active users found!");
        return;
    }

    console.log(`Distributing among ${activeUsers.length} users...`);

    let userIndex = 0;

    for (const line of lines) {
        const parts = line.split('\t');
        if (parts.length < 3) continue; // Skip bad lines

        const name = parts[0].trim();
        let phone = parts[1].trim();
        const city = parts[2].trim();
        const createdTime = parts[3] ? parts[3].trim() : new Date().toISOString();

        if (name === 'full_name') continue; // Skip header

        // Clean Phone
        phone = phone.replace('p:', '').replace('+91', '').replace(/[\s-]/g, '');

        // Validate
        if (phone.length !== 10) {
            console.log(`⚠️ Invalid Phone (${phone.length} digits): ${phone} - ${name}`);
            continue;
        }

        // Check Duplicate
        const { data: existing } = await supabase
            .from('leads')
            .select('id')
            .eq('phone', phone)
            .maybeSingle();

        if (existing) {
            console.log(`⚠️ Duplicate Skip: ${name} (${phone})`);
            continue;
        }

        // Round Robin Assignment
        const assignedUser = activeUsers[userIndex];
        // Move to next user for next lead
        userIndex = (userIndex + 1) % activeUsers.length;

        // Insert
        const { error } = await supabase.from('leads').insert({
            name: name,
            phone: phone,
            city: city,
            state: 'unknown',
            status: 'Assigned',
            user_id: assignedUser.id,
            assigned_to: assignedUser.id,
            created_at: createdTime,
            assigned_at: new Date().toISOString(),
            source: 'Facebook CSV Import'
        });

        if (error) {
            console.error(`❌ Insert Error: ${error.message}`);
        } else {
            console.log(`✅ Imported & Assigned: ${name} -> ${assignedUser.name}`);
            importedCount++;

            // Update user stats locally (optional, but good for log)
            assignedUser.leads_today++;
        }
    }

    console.log(`\n🎉 IMPORT COMPLETE: ${importedCount} leads added and distributed.`);
}

importFacebookLeads();
