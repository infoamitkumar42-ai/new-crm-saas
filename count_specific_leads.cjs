const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

const TARGET_USERS = {
    'd0a31bea-8a57-4584-a119-5b8e11140dbb': 'Gurnam',
    '2c905da5-b711-4a9c-9045-488719248bb1': 'Sandeep',
    'e47bb0a8-61de-4cac-8cf1-75048f0383a6': 'Rajwinder'
};

async function countStats() {
    console.log("🕵️ COUNTING LEADS SINCE JAN 31 (YESTERDAY)...\n");

    const startTime = new Date('2026-01-31T00:00:00+05:30');

    const { data: leads, error } = await supabase
        .from('leads')
        .select('assigned_to')
        .in('assigned_to', Object.keys(TARGET_USERS))
        .gt('created_at', startTime.toISOString());

    if (error) return console.error(error);

    const counts = { 'Gurnam': 0, 'Sandeep': 0, 'Rajwinder': 0 };

    leads.forEach(l => {
        const name = TARGET_USERS[l.assigned_to];
        if (name) counts[name]++;
    });

    console.log(`📊 TOTAL LEADS ASSIGNED (Since Jan 31):`);
    console.log(`----------------------------------------`);
    console.log(`Gurnam:    ${counts['Gurnam']}`);
    console.log(`Sandeep:   ${counts['Sandeep']}`);
    console.log(`Rajwinder: ${counts['Rajwinder']}`);
    console.log(`----------------------------------------`);
    console.log(`Total:     ${leads.length}`);
}

countStats();
