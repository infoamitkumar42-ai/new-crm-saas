
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function investigateChirag() {
    console.log("🕵️ INVESTIGATING CHIRAG (chirag01@gmail.com)...");

    // 1. Get Manager Details
    const { data: manager, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', 'chirag01@gmail.com')
        .single();

    if (error || !manager) {
        console.error("❌ Manager not found via email:", error?.message);
        return;
    }

    console.log(`✅ FOUND MANAGER: ${manager.name}`);
    console.log(`   - ID: ${manager.id}`);
    console.log(`   - Team Code in DB: '${manager.team_code}'`);
    console.log(`   - Role: ${manager.role}`);

    // 2. Search Members by Team Code (Exact Match)
    const { count: countByCode } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('team_code', manager.team_code);

    console.log(`\n🔍 Search by Team Code ('${manager.team_code}'): ${countByCode} members found.`);

    // 3. Search Members by Manager ID (if applicable)
    // Some systems link by manager_id column directly
    if (manager.id) {
        // Check if 'manager_id' column exists first to avoid error, 
        // but for now let's try assuming our schema knowledge or just catch error
        const { count: countById, error: errId } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('manager_id', manager.id);

        if (!errId) {
            console.log(`🔍 Search by Manager ID: ${countById} members found.`);
        }
    }

    // 4. List Members if found
    const { data: members } = await supabase
        .from('users')
        .select('name, email, plan_name, is_active')
        .or(`team_code.eq.${manager.team_code},manager_id.eq.${manager.id}`);

    if (members && members.length > 0) {
        console.table(members);
    }
}

investigateChirag();
