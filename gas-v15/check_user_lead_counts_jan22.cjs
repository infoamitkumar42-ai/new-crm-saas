const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkLeadCounts() {
    const today = new Date().toISOString().split('T')[0];

    // Names to check
    const targetNames = [
        'Ajay kumar',
        'Himanshu Sharma',
        'Vinita punjabi',
        'Rahul kumar',
        'Ramandeep Kaur',
        'Neha',
        'Balraj singh',
        'Jashandeep kaur'
    ];

    console.log(`Checking lead counts for ${targetNames.length} users...\n`);

    // 1. Get User IDs
    const { data: users, error: userError } = await supabase
        .from('users')
        .select('id, name, email, plan_name')
        .in('name', targetNames);

    if (userError) {
        console.error('Error fetching users:', userError);
        return;
    }

    // 2. Count leads for each user
    for (const user of users) {
        // Count total leads
        const { count: totalCount, error: totalError } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_to', user.id);

        // Count today's leads
        const { count: todayCount, error: todayError } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_to', user.id)
            .gte('created_at', `${today}T00:00:00`);

        if (totalError || todayError) {
            console.error(`Error counting leads for ${user.name}:`, totalError || todayError);
            continue;
        }

        console.log(`👤 ${user.name} (${user.plan_name || 'No Plan'})`);
        console.log(`   - Total Leads: ${totalCount}`);
        console.log(`   - Today's Leads: ${todayCount}`);
        console.log('-----------------------------------');
    }
}

checkLeadCounts();
