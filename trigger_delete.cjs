const URL = "https://vewqzsqddgmkslnuctvb.supabase.co/functions/v1/process-direct-lead";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";

async function deleteLastLead() {
    console.log("🚀 Triggering Delete Action...");

    try {
        const response = await fetch(URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ANON_KEY}`
            },
            body: JSON.stringify({ action: 'delete_last_test' })
        });

        const data = await response.json();
        console.log("✅ Response:", data);
    } catch (error) {
        console.error("❌ Error:", error);
    }
}

deleteLastLead();
