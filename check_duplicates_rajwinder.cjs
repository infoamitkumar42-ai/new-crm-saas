const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";

const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function checkDuplicates() {
    console.log("🔍 Checking for Duplicates in Rajwinder's leads (Today)...\n");

    const { data: leads, error } = await supabase
        .from('leads')
        .select('name, phone, created_at')
        .eq('user_id', 'f7022153-3a7e-42b7-8b1b-e307bb9767f2') // Rajinder's ID
        .gte('created_at', '2026-02-03T00:00:00.000Z');

    if (error) {
        console.error("Error:", error.message);
        return;
    }

    const phoneMap = {};
    let dupCount = 0;

    leads.forEach(l => {
        if (phoneMap[l.phone]) {
            phoneMap[l.phone].push(l);
            dupCount++;
        } else {
            phoneMap[l.phone] = [l];
        }
    });

    if (dupCount === 0) {
        console.log("✅ No duplicates found today.");
    } else {
        console.log(`⚠️ FOUND ${dupCount} DUPLICATES!`);
        Object.keys(phoneMap).forEach(phone => {
            if (phoneMap[phone].length > 1) {
                console.log(`\n📱 Phone: ${phone}`);
                phoneMap[phone].forEach(l => {
                    console.log(`   - ${l.name} (${new Date(l.created_at).toISOString()})`);
                });
            }
        });
    }
}

checkDuplicates();
