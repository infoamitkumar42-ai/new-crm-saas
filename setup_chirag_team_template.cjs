const { createClient } = require('@supabase/supabase-js');

// --- CONFIGURATION START (EDIT THIS SECTION) ---

// 1. CHIRAG & MANAGERS
const TEAM_USERS = [
    { email: 'REPLACE_WITH_CHIRAG_EMAIL', name: 'Chirag Darji', role: 'manager' },
    { email: 'REPLACE_WITH_MANAGER_1_EMAIL', name: 'Manager 1', role: 'manager' },
    { email: 'REPLACE_WITH_MANAGER_2_EMAIL', name: 'Manager 2', role: 'manager' }
];

// 2. FACEBOOK PAGE MAPPING (CRITICAL FOR ISOLATION)
const GUJARAT_PAGES = [
    { page_id: 'REPLACE_WITH_PAGE_ID_1', page_name: 'Gujarat Service Page 1' },
    { page_id: 'REPLACE_WITH_PAGE_ID_2', page_name: 'Gujarat Service Page 2' }
];

// --- CONFIGURATION END ---

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function setupGujaratTeam() {
    console.log("🚀 STARTING GUJARAT TEAM SETUP (IRON DOME COMPLIANT)...\n");

    // 1. SETUP USERS
    for (const u of TEAM_USERS) {
        if (u.email.includes('REPLACE')) {
            console.log(`❌ SKIPPING: Valid email not provided for ${u.name}`);
            continue;
        }

        // Check if exists
        const { data: existing } = await supabase.from('users').select('id').eq('email', u.email).single();

        let userId = existing?.id;

        if (!existing) {
            console.log(`🆕 Creating User: ${u.name} (${u.email})...`);
            // Create user logic (Assuming auth exists or just DB entry for now)
            // Note: In Supabase, real users are in Auth. This script assumes we insert into Public.Users manualy or they exist.
            // Simplified for CRM Table logic:
            const { data: newUser, error } = await supabase.from('users').insert({
                email: u.email,
                name: u.name,
                team_id: 'TEAM_GUJ', // IRON DOME TAG
                plan_name: 'manager', // 30 Days Free
                is_active: true,
                daily_limit: 200,
                role: u.role
            }).select().single();

            if (error) console.error(`Error creating user: ${error.message}`);
            else {
                userId = newUser.id;
                console.log(`✅ Created & Tagged TEAM_GUJ`);
            }
        } else {
            console.log(`♻️ Updating Existing User: ${u.name}...`);
            await supabase.from('users').update({
                team_id: 'TEAM_GUJ',
                plan_name: 'manager',
                is_active: true
            }).eq('id', userId);
            console.log(`✅ Updated to TEAM_GUJ`);
        }

        // Grant 30 Days Free Plan (Fake Payment Injection)
        if (userId) {
            await supabase.from('payments').insert({
                user_id: userId,
                amount: 0,
                status: 'captured',
                plan_name: 'manager',
                razorpay_payment_id: 'pay_GUJ_LAUNCH_OFFER',
                created_at: new Date().toISOString()
            });
            console.log(`🎁 Gifted 30 Days Manager Plan`);
        }
    }

    // 2. SETUP PAGES (ISOLATION MAPPING)
    console.log("\n🔗 MAPPING PAGES TO TEAM_GUJ...");
    for (const p of GUJARAT_PAGES) {
        if (p.page_id.includes('REPLACE')) continue;

        const { error } = await supabase.from('meta_pages').upsert({
            page_id: p.page_id,
            page_name: p.page_name,
            team_id: 'TEAM_GUJ', // CRITICAL: This routes leads to Gujarat Users ONLY
            access_token: 'placeholder_token' // Add real if needed
        }, { onConflict: 'page_id' });

        if (error) console.error(`Error mapping page ${p.page_name}: ${error.message}`);
        else console.log(`✅ Page '${p.page_name}' mapped to TEAM_GUJ`);
    }

    console.log("\n✅ SETUP COMPLETE! Gujarat Team is Ready & Isolated.");
}

setupGujaratTeam();
