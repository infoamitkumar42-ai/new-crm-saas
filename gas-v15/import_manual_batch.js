import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function importBatch() {
    console.log('\n📥 --- IMPORTING MANUAL BATCH (28 LEADS) ---\n');

    // 1. Identify Targets
    const targetEmails = [
        'workwithrajwinder@gmail.com',
        'sunnymehre451@gmail.com',
        'gurnambal01@gmail.com',
        'rajnikaler01@gmail.com'
    ];

    const { data: users, error } = await supabase
        .from('users')
        .select('id, name, email')
        .in('email', targetEmails);

    if (!users || users.length === 0) {
        console.error("❌ Targets not found in DB!");
        return;
    }

    console.log("🎯 Targets:");
    users.forEach(u => console.log(`- ${u.name}`));

    if (users.length !== 4) {
        console.warn(`⚠️ Warning: Found only ${users.length} targets. Distribution will likely be uneven.`);
    }

    // 2. Parse File
    let rawContent;
    try {
        rawContent = fs.readFileSync('manual_batch.txt', 'utf8');
    } catch (e) {
        console.error("Error reading file:", e.message);
        return;
    }

    const lines = rawContent.split('\n').filter(l => l.trim().length > 0);
    const leadsToImport = [];

    // Skip header if present
    const startLine = lines[0].includes('full_name') ? 1 : 0;

    for (let i = startLine; i < lines.length; i++) {
        const line = lines[i];
        // Split by tab or multiple spaces (heuristic)
        // User pasted data might have tabs. Let's try splitting by tab first.
        let parts = line.split('\t');
        if (parts.length < 2) {
            // Try splitting by common separators if tab fails (or mixed)
            // But names have spaces.
            // Regex might be safer: name | phone | city | time
            // Or rely on the fact that phone usually has digits and p: prefix
            // Let's assume Tab for now as headers looked like it.
        }

        const name = parts[0]?.trim();
        let phoneRaw = parts[1]?.trim() || '';
        const city = parts[2]?.trim();
        const createdTime = parts[3]?.trim();

        // 3. Clean Phone
        let phone = phoneRaw.replace('p:', '').replace('+91', '').replace(/[-\s]/g, '');
        // Validate length
        if (phone.length !== 10) {
            console.log(`⚠️ Invalid Phone skipped: ${phoneRaw} (${name})`);
            continue;
        }

        leadsToImport.push({ name, phone, city, createdTime });
    }

    console.log(`\nParsed ${leadsToImport.length} valid entries.`);

    // 4. Import & Distribute
    let userIndex = 0;
    let successCount = 0;
    let duplicateCount = 0;

    // Track stats per user
    const distStats = {};
    users.forEach(u => distStats[u.name] = 0);

    for (const l of leadsToImport) {
        // Check Dup
        const { data: existing } = await supabase
            .from('leads')
            .select('id, assigned_to')
            .eq('phone', l.phone)
            .maybeSingle();

        if (existing) {
            console.log(`🔄 Duplicate: ${l.name} (${l.phone}) -> Exists (Assigned: ${existing.assigned_to})`);
            duplicateCount++;
            continue;
        }

        // Assign
        const target = users[userIndex];
        userIndex = (userIndex + 1) % users.length; // Rotate

        const { error: insertError } = await supabase.from('leads').insert({
            name: l.name,
            phone: l.phone,
            city: l.city || 'Unknown',
            state: 'Unknown',
            source: 'Manual Batch Import (Jan 17)',
            status: 'Assigned',
            user_id: target.id,
            assigned_to: target.id,
            created_at: l.createdTime, // KEEP ORIGINAL TIME
            assigned_at: new Date().toISOString()
        });

        if (insertError) {
            console.error(`❌ Failed to insert ${l.name}: ${insertError.message}`);
        } else {
            console.log(`✅ Assigned: ${l.name} -> ${target.name}`);
            successCount++;
            distStats[target.name]++;
        }
    }

    // 5. Update Counters
    // We should ADD to their existing leads_today
    // Wait, DB has leads_today. We should re-calc to be safe or increment.
    // Let's increment.
    console.log("\nUpdating User Counters...");
    for (const u of users) {
        const added = distStats[u.name];
        if (added > 0) {
            // Fetch current
            const { data: curr } = await supabase.from('users').select('leads_today').eq('id', u.id).single();
            const newTotal = (curr?.leads_today || 0) + added;

            await supabase.from('users').update({ leads_today: newTotal }).eq('id', u.id);
            console.log(`   - ${u.name}: +${added} (Total: ${newTotal})`);
        }
    }

    console.log(`\n🎉 BATCH COMPLETE.`);
    console.log(`Total: ${leadsToImport.length}`);
    console.log(`Imported: ${successCount}`);
    console.log(`Duplicates: ${duplicateCount}`);
}

importBatch();
