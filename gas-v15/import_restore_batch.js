import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function importBatch() {
    console.log('\n📥 --- IMPORTING SECOND BATCH (TODAY) ---\n');

    // 1. Identify Targets (Same 4 users)
    const targetEmails = [
        'workwithrajwinder@gmail.com',
        'sunnymehre451@gmail.com',
        'gurnambal01@gmail.com',
        'rajnikaler01@gmail.com'
    ];

    const { data: users } = await supabase
        .from('users')
        .select('id, name, email')
        .in('email', targetEmails);

    if (!users || users.length === 0) {
        console.error("❌ Targets not found in DB!");
        return;
    }

    // Sort to ensure consistent order (optional)
    users.sort((a, b) => a.name.localeCompare(b.name));

    // 2. Parse File
    const rawContent = fs.readFileSync('manual_batch_2.txt', 'utf8');
    const lines = rawContent.split('\n').filter(l => l.trim().length > 0);
    const leadsToImport = [];

    // Skip header if present
    const startLine = lines[0].includes('full_name') ? 1 : 0;

    for (let i = startLine; i < lines.length; i++) {
        const line = lines[i];
        let parts = line.split('\t');
        if (parts.length < 2) continue; // Skip invalid

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

    console.log(`Parsed ${leadsToImport.length} entries.`);

    // 4. Import & RE-DISTRIBUTE
    let userIndex = 0;
    let successCount = 0;
    let duplicateCount = 0;
    let reclaimedCount = 0;

    const distStats = {};
    users.forEach(u => distStats[u.name] = 0);

    for (const l of leadsToImport) {
        let isReclaim = false;

        // Check Dup
        const { data: existing } = await supabase
            .from('leads')
            .select('id, assigned_to')
            .eq('phone', l.phone)
            .maybeSingle();

        // Target User
        const target = users[userIndex];
        userIndex = (userIndex + 1) % users.length; // Rotate

        if (existing) {
            // It exists! 
            // If created today, it's likely the one we reclaimed. 
            // We should MOVE it to the target user. (Force Re-assign)
            // But we check timestamp to be safe? 
            // User provided timestamp: 2026-01-17...
            // If existing.created_at is today, we override.

            // Check if already assigned to one of our 4 targets?
            if (users.some(u => u.id === existing.assigned_to)) {
                // Already assigned to one of the group (maybe from previous batch overlapping?)
                console.log(`ℹ️ ${l.name} -> Already with group (User ID: ${existing.assigned_to}). Skipping.`);
                duplicateCount++;
                continue;
            } else {
                // Assigned to someone else (e.g. Active User). RECLAIM IT!
                // console.log(`♻️ RECLAIMING: ${l.name} (from ${existing.assigned_to}) -> ${target.name}`);
                isReclaim = true;
            }
        }

        // Perform Upsert (Assign to Target)
        // If existing, we update. If new, we insert.
        // We use 'phone' as key? No, upsert needs ID.
        // If existing, update by ID.

        if (existing) {
            const { error: updateError } = await supabase
                .from('leads')
                .update({
                    assigned_to: target.id,
                    user_id: target.id,
                    status: 'Assigned',
                    assigned_at: new Date().toISOString()
                })
                .eq('id', existing.id);

            if (!updateError) {
                console.log(`♻️ UPDATED: ${l.name} -> ${target.name}`);
                reclaimedCount++;
                distStats[target.name]++;
            } else {
                console.error(`❌ Failed to update ${l.name}: ${updateError.message}`);
            }

        } else {
            // Insert New
            const { error: insertError } = await supabase.from('leads').insert({
                name: l.name,
                phone: l.phone,
                city: l.city || 'Unknown',
                state: 'Unknown',
                source: 'Manual Restoration (Jan 17)',
                status: 'Assigned',
                user_id: target.id,
                assigned_to: target.id,
                created_at: l.createdTime, // KEEP ORIGINAL TIME
                assigned_at: new Date().toISOString()
            });

            if (insertError) {
                console.error(`❌ Failed to insert ${l.name}: ${insertError.message}`);
            } else {
                console.log(`✅ INSERTED: ${l.name} -> ${target.name}`);
                successCount++;
                distStats[target.name]++;
            }
        }
    }

    // 5. Update Counters
    console.log("\nUpdating User Counters...");
    for (const u of users) {
        const added = distStats[u.name];
        if (added > 0) {
            const { data: curr } = await supabase.from('users').select('leads_today').eq('id', u.id).single();
            const newTotal = (curr?.leads_today || 0) + added;

            await supabase.from('users').update({ leads_today: newTotal }).eq('id', u.id);
            console.log(`   - ${u.name}: +${added} (Total: ${newTotal})`);
        }
    }

    console.log(`\n🎉 BATCH 2 COMPLETE.`);
    console.log(`Total: ${leadsToImport.length}`);
    console.log(`Inserted (New): ${successCount}`);
    console.log(`Reclaimed (Updated): ${reclaimedCount}`);
    console.log(`Skipped (Already with Group): ${duplicateCount}`);
}

importBatch();
