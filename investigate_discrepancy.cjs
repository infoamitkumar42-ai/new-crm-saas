
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function investigateLeadDiscrepancy() {
    const today = new Date().toISOString().split('T')[0];
    console.log(`🔍 Investigating Lead Count Discrepancy for ${today}`);

    // Fetch all leads created today
    const { data: leads, error } = await supabase
        .from('leads')
        .select('id, name, phone, source, status, created_at, notes, form_id')
        .gte('created_at', today + 'T00:00:00Z')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("❌ Error fetching leads:", error);
        return;
    }

    console.log(`Total Leads in System Today: ${leads.length}`);

    const categories = {
        realtime: [],
        duplicates: [],
        invalid: [],
        test: [],
        unknown_source: [],
        web_landing: []
    };

    leads.forEach(l => {
        if (l.status === 'Duplicate') categories.duplicates.push(l);
        else if (l.status === 'Invalid') categories.invalid.push(l);
        else if (l.name.toLowerCase().includes('test') || l.source.includes('Test')) categories.test.push(l);
        else if (l.source.includes('Unknown Page')) categories.unknown_source.push(l);
        else if (l.source.includes('Web Landing Page')) categories.web_landing.push(l);
        else categories.realtime.push(l);
    });

    console.log(`\n--- Breakdown ---`);
    console.log(`Real-time (Active): ${categories.realtime.length}`);
    console.log(`Duplicates: ${categories.duplicates.length}`);
    console.log(`Invalid: ${categories.invalid.length}`);
    console.log(`Test: ${categories.test.length}`);
    console.log(`Unknown Source: ${categories.unknown_source.length}`);
    console.log(`Web Landing: ${categories.web_landing.length}`);

    console.log(`\n--- Real-time Leads (Potential matches with Meta Ad Manager) ---`);
    categories.realtime.forEach((l, i) => {
        console.log(`${i + 1}. [${new Date(l.created_at).toLocaleTimeString()}] ${l.name} (${l.phone}) - Source: ${l.source}`);
    });

    if (categories.unknown_source.length > 0) {
        console.log(`\n--- Unknown Source Leads ---`);
        categories.unknown_source.forEach((l, i) => {
            console.log(`${i + 1}. [${new Date(l.created_at).toLocaleTimeString()}] ${l.name} - ID: ${l.id}`);
        });
    }
}

investigateLeadDiscrepancy();
