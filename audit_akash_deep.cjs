
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function deepAudit() {
    const TARGET_EMAIL = 'dbrar8826@gmail.com';
    const TARGET_ID = 'c4b380b5-495b-4b62-ac13-39940023662a';

    console.log(`🕵️‍♂️ Deep Audit for: Akash (${TARGET_EMAIL}) | ID: ${TARGET_ID}`);

    // 1. EXACT LEAD COUNT
    const { count: leadCount, data: leads } = await supabase.from('leads')
        .select('id, name, created_at', { count: 'exact' })
        .eq('assigned_to', TARGET_ID);

    console.log(`\n📊 DASHBOARD LEADS COUNT: ${leadCount}`);
    if (leads && leads.length > 0) {
        // Show first and last lead date
        const sorted = leads.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        console.log(`   - First Lead: ${new Date(sorted[0].created_at).toLocaleDateString()}`);
        console.log(`   - Last Lead:  ${new Date(sorted[sorted.length - 1].created_at).toLocaleDateString()}`);
    }

    // 2. PAYMENT HUNT
    console.log("\n💰 PAYMENTS HUNTING...");

    // A. By User ID (if linked)
    const { data: p1 } = await supabase.from('payments').select('*').eq('user_id', TARGET_ID);
    if (p1.length > 0) console.log("   found by ID:", p1);

    // B. By Email (Exact)
    const { data: p2 } = await supabase.from('payments').select('*').eq('user_email', TARGET_EMAIL);
    if (p2.length > 0) console.log("   found by Email:", p2);

    // C. By Name (Partial)
    const { data: p3 } = await supabase.from('payments').select('*').ilike('user_name', '%Akash%');
    if (p3 && p3.length > 0) {
        console.log(`   found by Name 'Akash' (${p3.length}):`);
        p3.forEach(p => console.log(`   - ₹${p.amount} | Email: ${p.user_email} | Date: ${p.created_at}`));
    }

    // D. By Phone (We need to find user phone first)
    const { data: u } = await supabase.from('users').select('phone').eq('id', TARGET_ID).single();
    if (u && u.phone) {
        console.log(`   User Phone: ${u.phone}`);
        const { data: p4 } = await supabase.from('payments').select('*').or(`user_phone.eq.${u.phone},user_phone.eq.${u.phone.replace('+91', '')}`);
        if (p4 && p4.length > 0) console.log("   found by Phone:", p4);
    } else {
        console.log("   User has no phone number in profile.");
    }
}

deepAudit();
