
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const LEADS = [
    { name: 'Nilesh Gusai', phone: '9427818154', city: 'Bhuj', status: 'job_person', source: 'Digital Chirag Manual' },
    { name: 'Lata Amrutbhai', phone: '9265404759', city: 'Ahmedabad', status: 'housewife', source: 'Digital Chirag Manual' },
    { name: 'Aman mali', phone: '9510238889', city: 'Vadodara', status: 'job_person', source: 'Digital Chirag Manual' },
    { name: 'Swati Joshi', phone: '9427499633', city: 'Ahmedabad', status: 'housewife', source: 'Digital Chirag Manual' },
    { name: 'Prabhu Lal Regar', phone: '9680922519', city: 'Bhilwara', status: 'business_owner', source: 'Digital Chirag Manual' },
    { name: 'Vaibhavi Raval', phone: '7600659402', city: 'Vadodara', status: 'business_owner', source: 'Digital Chirag Manual' },
    { name: 'Harsh Parmar', phone: '8160325490', city: 'Ahmedabad', status: 'job_person', source: 'Digital Chirag Manual' },
    { name: 'Ashvin Joja', phone: '7802079579', city: 'Tharad', status: 'others', source: 'Digital Chirag Manual' },
    { name: 'Ankit Kalsariya', phone: '9016380438', city: 'Surat', status: 'others', source: 'Digital Chirag Manual' },
    { name: 'VAGHELA NIHAL', phone: '9737170866', city: 'Bayad', status: 'student', source: 'Digital Chirag Manual' },
];

const TARGET_EMAILS = [
    'namratadarjiforever@gmail.com',
    'cmdarji2000@gmail.com',
    'bhumitpatel.0764@gmail.com',
    'kaushalrathod2113@gmail.com'
];

async function distributeManualLeads() {
    console.log("🚀 Starting Manual Distribution for Chirag Team...");

    // 1. Get User IDs
    const { data: users, error } = await supabase
        .from('users')
        .select('id, email, name, leads_today')
        .in('email', TARGET_EMAILS);

    if (error || !users || users.length === 0) {
        console.error("❌ Target Users Not Found!");
        return;
    }

    // Map emails to user objects for order
    const userMap = {};
    users.forEach(u => userMap[u.email] = u);

    // Create ordered list (Round Robin)
    const assigneeList = TARGET_EMAILS.map(e => userMap[e]).filter(u => u);

    if (assigneeList.length === 0) {
        console.error("❌ No valid users found from email list.");
        return;
    }

    console.log(`✅ Distributing to ${assigneeList.length} users: ${assigneeList.map(u => u.name).join(', ')}`);

    let userIndex = 0;

    for (const lead of LEADS) {
        // Pick User
        const targetUser = assigneeList[userIndex];
        userIndex = (userIndex + 1) % assigneeList.length; // Rotate

        // Insert Lead
        const { error: insertError } = await supabase
            .from('leads')
            .insert({
                name: lead.name,
                phone: lead.phone,
                city: lead.city,
                source: lead.source,
                status: 'Assigned', // Directly Assigned
                user_id: targetUser.id,
                assigned_to: targetUser.id,
                created_at: new Date().toISOString()
            });

        if (insertError) {
            console.error(`❌ Failed to insert ${lead.name}:`, insertError.message);
        } else {
            console.log(`✅ Assigned ${lead.name} -> ${targetUser.name}`);

            // Update Count
            await supabase.from('users').update({ leads_today: targetUser.leads_today + 1 }).eq('id', targetUser.id);
            targetUser.leads_today += 1; // Local update
        }
    }

    console.log("\n🎉 Distribution Complete!");
}

distributeManualLeads();
