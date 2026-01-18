import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// COMPLETE LIST - 71 users, 3051 leads
const ALL_USERS = [
    { name: 'Rajbinder', count: 47 },
    { name: 'Gurvinder Matharu', count: 10 },
    { name: 'Nazia Begam', count: 21 },
    { name: 'Kulwant Singh', count: 40 },
    { name: 'Baljeet kaur', count: 34 },
    { name: 'Raveena', count: 28 },
    { name: 'Sonia', count: 28 },
    { name: 'VEERPAL KAUR', count: 58 },
    { name: 'Manbir Singh', count: 46 },
    { name: 'Vinita punjabi', count: 63 },
    { name: 'Tanisha', count: 43 },
    { name: 'Ramandeep Kaur', count: 40 },
    { name: 'Anita', count: 27 },
    { name: 'Princy', count: 40 },
    { name: 'Saloni', count: 51 },
    { name: 'harpreet kaur', count: 1 },
    { name: 'Simran', count: 11 },
    { name: 'Rohit Kumar', count: 52 },
    { name: 'Harwinder kaur', count: 10 },
    { name: 'Akshay Sharma', count: 40 },
    { name: 'Mandeep kaur', count: 58 },
    { name: 'PARAMJIT KAUR', count: 36 },
    { name: 'Drishti Rani', count: 10 },
    { name: 'Navjot Kaur', count: 10 },
    { name: 'ranjodh singh', count: 42 },
    { name: 'Swati', count: 11 },
    { name: 'Sonia Chauhan', count: 56 },
    { name: 'Joyti kaur', count: 1 },
    { name: 'Rahul kumar', count: 51 },
    { name: 'Preeti', count: 48 },
    { name: 'MUSKAN', count: 35 },
    { name: 'Jaspreet Kaur', count: 32 },
    { name: 'Priya Arora', count: 32 },
    { name: 'Akash', count: 49 },
    { name: 'Navjot kaur', count: 29 },
    { name: 'Navjot Kaur', count: 38 },
    { name: 'Babita', count: 49 },
    { name: 'Ravenjeet Kaur', count: 93 },
    { name: 'Balraj singh', count: 66 },
    { name: 'Ajay kumar', count: 67 },
    { name: 'SAMAN', count: 71 },
    { name: 'Jashandeep kaur', count: 71 },
    { name: 'Jasdeep Kaur', count: 36 },
    { name: 'Payal', count: 50 },
    { name: 'Harmandeep kaur', count: 45 },
    { name: 'Neha', count: 65 },
    { name: 'Seerat', count: 42 },
    { name: 'Suman', count: 54 },
    { name: 'Himanshu Sharma', count: 78 },
    { name: 'Simran', count: 46 },
    { name: 'Rimpy Singh', count: 58 },
    { name: 'Sunaina Rani', count: 39 },
    { name: 'Gurdeep Singh', count: 46 },
    { name: 'Akshmala', count: 46 },
    { name: 'Arshdeep kaur', count: 36 },
    { name: 'Tanu Dhawan', count: 52 },
    { name: 'Rajinder', count: 60 },
    { name: 'Tushte', count: 47 },
    { name: 'Loveleen kaur', count: 50 },
    { name: 'Kamal kaur', count: 39 },
    { name: 'Prabhjot kaur', count: 51 },
    { name: 'Mandeep kaur', count: 47 },
    { name: 'Shivani', count: 56 },
    { name: 'Loveleen', count: 43 },
    { name: 'Prince', count: 47 },
    { name: 'Sandeep Rehaan', count: 40 },
    { name: 'Naina Nawani', count: 47 },
    { name: 'Lalit kumar', count: 29 },
    { name: 'Divya Malik', count: 41 },
    { name: 'Prabhjeet kaur', count: 58 },
    { name: 'Gurpreet kaur', count: 58 }
];

async function restoreAllFromHistory() {
    console.log('\n🔄 --- COMPLETE RESTORATION (71 users, 3051 leads) ---\n');

    // Get orphan old leads
    const { data: orphanLeads } = await supabase
        .from('leads')
        .select('id, name, created_at')
        .is('user_id', null)
        .lt('created_at', '2026-01-17T00:00:00.000Z')
        .order('created_at', { ascending: true });

    console.log(`Old orphan leads available: ${orphanLeads.length}\n`);

    let leadIndex = 0;
    let totalRestored = 0;
    let skippedUsers = [];

    for (const mapping of ALL_USERS) {
        if (leadIndex >= orphanLeads.length) {
            console.log(`\n⚠️ Ran out of orphan leads at user: ${mapping.name}\n`);
            break;
        }

        // Find user
        const { data: users } = await supabase
            .from('users')
            .select('id, name, leads_today')
            .ilike('name', mapping.name);

        if (!users || users.length === 0) {
            skippedUsers.push(mapping.name);
            leadIndex += mapping.count; // Skip these leads
            continue;
        }

        const user = users[0];
        const leadsToAssign = orphanLeads.slice(leadIndex, leadIndex + mapping.count);

        if (leadsToAssign.length < mapping.count) {
            console.log(`⚠️ Only ${leadsToAssign.length} leads left for ${user.name} (needed ${mapping.count})`);
        }

        // Assign
        await supabase
            .from('leads')
            .update({
                user_id: user.id,
                assigned_to: user.id,
                status: 'Assigned',
                assigned_at: new Date().toISOString()
            })
            .in('id', leadsToAssign.map(l => l.id));

        totalRestored += leadsToAssign.length;

        // Update counter
        await supabase
            .from('users')
            .update({ leads_today: (user.leads_today || 0) + leadsToAssign.length })
            .eq('id', user.id);

        console.log(`✅ ${user.name}: +${leadsToAssign.length} (total: ${(user.leads_today || 0) + leadsToAssign.length})`);

        leadIndex += mapping.count;
    }

    console.log(`\n✅ COMPLETE RESTORATION DONE!`);
    console.log(`   Restored: ${totalRestored} leads`);
    console.log(`   Skipped users: ${skippedUsers.length}\n`);

    if (skippedUsers.length > 0) {
        console.log(`Skipped: ${skippedUsers.join(', ')}\n`);
    }
}

restoreAllFromHistory();
