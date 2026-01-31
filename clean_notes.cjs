const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function cleanNotes() {
    console.log("🧹 Cleaning up Reassignment Notes...");

    // Find leads with the specific note text
    const { data: leads, error } = await supabase
        .from('leads')
        .select('id, notes')
        .ilike('notes', '%Reassigned from Pradeep%');

    if (error) return console.error(error);
    if (!leads || leads.length === 0) return console.log("✅ No matching notes found to clean.");

    console.log(`Found ${leads.length} leads to clean.`);

    for (const lead of leads) {
        // Remove the text
        const { error: updateError } = await supabase
            .from('leads')
            .update({ notes: null }) // Clearing notes completely as requested "isko hta do"
            .eq('id', lead.id);

        if (updateError) console.error(`Failed to clean lead ${lead.id}`);
    }

    console.log("✅ All notes cleaned successfully.");
}

cleanNotes();
