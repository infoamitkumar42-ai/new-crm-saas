
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function findManager() {
    const { data: manager } = await supabase.from('users').select('*').eq('team_code', 'TEAMFIRE').eq('role', 'manager').single();
    if (manager) {
        console.log(`Himanshu ID: ${manager.id}`);
        const { count } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('manager_id', manager.id);
        console.log(`Members under this manager: ${count}`);
    } else {
        console.log("No manager found for TEAMFIRE");
    }
}
findManager();
