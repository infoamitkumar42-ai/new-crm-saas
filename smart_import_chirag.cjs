
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const RAW_INPUT = [
    { name: "Vipul_C_Malotariya007", phone: "6353696188", city: "Deesa" },
    { name: "Parmar anjuben", phone: "9913024794", city: "Kapadwanj" },
    { name: "𝐊 𝐈 𝐒 𝐇 𝐔 ➣", phone: "9313067680", city: "Ahmedabad" },
    { name: "NehaNileshVadgama", phone: "9638188748", city: "Tatala" },
    { name: "parmar  payal", phone: "919904278809", city: "Dwarka" },
    { name: "Nilesh Gusai", phone: "9427818154", city: "Bhuj" },
    { name: "Lata Amrutbhai", phone: "9265404759", city: "Ahmedabad" },
    { name: "Maheas Maheas", phone: "9978293801", city: "મોરબી" },
    { name: "RP__", phone: "9727556133", city: "Harij" },
    { name: "Pradipsinh Vaghela", phone: "9825028082", city: "Ahmedabad" },
    { name: "Aman mali", phone: "9510238889", city: "Vadodara" },
    { name: "Swati Joshi", phone: "9427499633", city: "Ahmedabad" },
    { name: "Prabhu Lal Regar", phone: "9680922519", city: "Bhilwara" },
    { name: "Vaibhavi Raval", phone: "7600659402", city: "Vadodara" },
    { name: "Mayur Umavanshi", phone: "9979973848", city: "Ahmedabad" },
    { name: "Sarvan Thakur Thakur", phone: "8849550498", city: "ભાભર" },
    { name: "Rahul Anand", phone: "9898718745", city: "Khambhat" },
    { name: "G.J.BHARWAD", phone: "9979255582", city: "Ahmedabad" },
    { name: "Rami minaxi dharmendara bhai", phone: "9913363565", city: "Gandhinagar Gujarat" },
    { name: "Manish.Baldaniya", phone: "7434927424", city: "Rajkot" },
    { name: "Tofik Sarvadi", phone: "7600844586", city: "junagadh" },
    { name: "Jignesh Maheta", phone: "8401156732", city: "Rajkot" },
    { name: "BHAVADIP Avaiya", phone: "8866181406", city: "Ahmedabad" }
];

// List of phones to EXCLUDE (Already assigned)
const ALREADY_ASSIGNED = [
    "9427818154", "9265404759", "9510238889", "9427499633",
    "9680922519", "7600659402", "8160325490", "7802079579",
    "9016380438", "9737170866"
];

function cleanPhone(p) {
    return p.replace(/\D/g, '').slice(-10);
}

async function smartImport() {
    console.log("🚀 Starting Smart Import...");

    // 1. FILTER DUPLICATES FROM INPUT
    const leadsToImport = [];
    const duplicates = [];

    for (const lead of RAW_INPUT) {
        const cleanP = cleanPhone(lead.phone);

        // Check Manual List Block
        if (ALREADY_ASSIGNED.includes(cleanP)) {
            duplicates.push(`${lead.name} (In Manual Blocklist)`);
            continue;
        }

        // Check Database for TODAY's leads (Safety Check)
        const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
        const { data: dbDup } = await supabase.from('leads')
            .select('id')
            .eq('phone', cleanP)
            .gte('created_at', startOfDay.toISOString())
            .single();

        if (dbDup) {
            duplicates.push(`${lead.name} (Found in DB Today)`);
            continue;
        }

        leadsToImport.push({ ...lead, phone: cleanP });
    }

    console.log(`\n📊 Analysis:`);
    console.log(`- Total Input: ${RAW_INPUT.length}`);
    console.log(`- Duplicates Found: ${duplicates.length}`);
    console.log(`- Fresh Leads to Import: ${leadsToImport.length}`);

    if (leadsToImport.length === 0) {
        console.log("✅ Nothing to import.");
        return;
    }

    // 2. GET USERS (Prioritize those with 0 leads)
    const { data: users } = await supabase
        .from('users')
        .select('id, name, leads_today, daily_limit')
        .eq('team_code', 'GJ01TEAMFIRE')
        .eq('is_active', true)
        .gt('daily_limit', 0)
        .order('leads_today', { ascending: true }); // Lowest leads first

    if (!users || users.length === 0) {
        console.error("❌ No users found in GJ01TEAMFIRE");
        return;
    }

    // Filter out users who are already full
    const capableUsers = users.filter(u => u.leads_today < u.daily_limit);
    console.log(`\n🎯 Assigning to ${capableUsers.length} Users (Sorted by least leads)...`);

    let userIndex = 0;

    for (const lead of leadsToImport) {
        const user = capableUsers[userIndex];

        // Insert
        await supabase.from('leads').insert({
            name: lead.name,
            phone: lead.phone,
            city: lead.city,
            source: 'Digital Chirag Manual Import',
            status: 'Assigned',
            assigned_to: user.id
        });

        console.log(`✅ Assigned ${lead.name} -> ${user.name} (Leads Today: ${user.leads_today + 1})`);

        // Update Counter
        user.leads_today++;
        await supabase.from('users').update({ leads_today: user.leads_today }).eq('id', user.id);

        // Rotation
        if (user.leads_today >= user.daily_limit) {
            capableUsers.splice(userIndex, 1); // Remove from list if full
            if (capableUsers.length === 0) break;
            userIndex = userIndex % capableUsers.length;
        } else {
            userIndex = (userIndex + 1) % capableUsers.length;
        }
    }

    console.log("\n🎉 Import Complete.");
}

smartImport();
