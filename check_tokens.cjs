const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkTokens() {
    console.log("🔍 Inspecting Meta Pages Tokens...");

    // 1. Inspect Schema
    const { data: sample, error: sampleError } = await supabase
        .from('meta_pages')
        .select('*')
        .limit(1);

    if (sampleError) {
        console.error("❌ DB Error (Schema):", sampleError);
        return;
    }

    // 2. Determine Columns
    let nameCol = 'name';
    let idCol = 'id';
    let tokenCol = 'access_token';

    if (sample && sample.length > 0) {
        const keys = Object.keys(sample[0]);
        // Prioritize 'page_name' over 'page_id'
        nameCol = keys.find(k => k === 'page_name') || keys.find(k => k === 'name') || keys.find(k => k.includes('name')) || 'id';
        idCol = keys.find(k => k === 'page_id') || keys.find(k => k.includes('id') && k !== 'id' && k !== 'user_id') || 'id';
        tokenCol = keys.find(k => k.includes('token')) || 'access_token';
    }

    console.log(`📌 Using columns - Name: '${nameCol}', ID: '${idCol}'`);

    // 3. Fetch Pages
    const { data: pages, error } = await supabase
        .from('meta_pages')
        .select('*');

    if (error) {
        console.error("❌ DB Error (Fetch):", error);
        return;
    }

    console.log(`📊 Found ${pages.length} Pages. Validating...`);
    console.log('--------------------------------------------------');

    for (const page of pages) {
        const pageName = page[nameCol] || 'Unknown Page';
        const pageId = page[idCol] || 'Unknown ID';
        const token = page[tokenCol];

        let ownerName = '?? (System/Orphan)';
        if (page.user_id) {
            const { data: user } = await supabase.from('users').select('name').eq('id', page.user_id).single();
            if (user) ownerName = user.name;
        }

        if (!token) {
            console.warn(`⚠️ [MISSING TOKEN] ${pageName} | 👤 ${ownerName}`);
            continue;
        }

        try {
            // Test Token
            const url = `https://graph.facebook.com/v19.0/me?access_token=${token}`;
            await axios.get(url);
            console.log(`✅ [VALID] ${pageName} | 👤 Owner: ${ownerName}`);
        } catch (err) {
            const errMsg = err.response?.data?.error?.message || err.message;
            console.log(`❌ [EXPIRED] ${pageName} | 👤 Owner: ${ownerName}`);
            // console.log(`   Detailed Error: ${errMsg}`);
        }
    }
    console.log('--------------------------------------------------');
}

checkTokens();
