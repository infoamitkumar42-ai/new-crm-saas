import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkStorage() {
    console.log('\n🔍 --- CHECKING STORAGE BUCKETS ---\n');

    const { data: buckets, error } = await supabase.storage.listBuckets();

    if (error) {
        console.log('Error fetching buckets:', error.message);
        return;
    }

    if (!buckets || buckets.length === 0) {
        console.log('❌ No storage buckets found.');
        return;
    }

    console.log('Found buckets:', buckets.map(b => b.name));

    for (const bucket of buckets) {
        console.log(`\nChecking bucket: ${bucket.name}`);
        const { data: files } = await supabase.storage.from(bucket.name).list();

        if (files && files.length > 0) {
            console.log(`Found ${files.length} files. Top 5:`);
            console.log(files.slice(0, 5).map(f => f.name));
        } else {
            console.log('Empty bucket.');
        }
    }
}

checkStorage();
