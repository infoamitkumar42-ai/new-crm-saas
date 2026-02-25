const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

const manualData = [
    { email: 'jashanpreet0479@gmail.com', quota: 50, used: 25 },
    { email: 'jerryvibes.444@gmail.com', quota: 0, used: 28 },
    { email: 'ravenjeetkaur@gmail.com', quota: 105, used: 61 },
    { email: 'vansh.rajni.96@gmail.com', quota: 0, used: 86 },
    { email: 'mandeep.k21@icloud.com', quota: 105, used: 23 },
    { email: 'sakshidigra24@gmail.com', quota: 50, used: 33 },
    { email: 'husanpreetkaur9899@gmail.com', quota: 50, used: 8 },
    { email: 's73481109@gmail.com', quota: 50, used: 37 },
    { email: 'nikkibaljinderkaur@gmail.com', quota: 50, used: 51 },
    { email: 'jass006623@gmail.com', quota: 0, used: 9 },
    { email: 'gurnoor1311singh@gmail.com', quota: 105, used: 56 },
    { email: 'yy861880@gmail.com', quota: 50, used: 36 },
    { email: 'princyrani303@gmail.com', quota: 98, used: 70 },
    { email: 'sejalrani72@gmail.com', quota: 0, used: 28 },
    { email: 'brark5763@gmail.com', quota: 50, used: 38 },
    { email: 'payalpuri3299@gmail.com', quota: 105, used: 61 },
    { email: 'nasib03062003@gmail.com', quota: 0, used: 4 },
    { email: 'hansmanraj88@gmail.com', quota: 50, used: 16 },
    { email: 'nitinanku628@gmail.com', quota: 105, used: 50 },
    { email: 'ssatnam41912@gmail.com', quota: 50, used: 5 },
    { email: 'aansh8588@gmail.com', quota: 105, used: 26 },
    { email: 'my440243@gmail.com', quota: 50, used: 12 },
    { email: 'preetibrarbrar7@gmail.com', quota: 50, used: 37 },
    { email: 'ananyakakkar53b@gmail.com', quota: 105, used: 61 },
    { email: 'vilasraparam@gmail.com', quota: 0, used: 47 },
    { email: 'saijelgoel4@gmail.com', quota: 105, used: 70 },
    { email: 'navpreetkaur95271@gmail.com', quota: 105, used: 67 },
    { email: 'khanrehamdin366@gmail.com', quota: 0, used: 15 },
    { email: 'kulwantsinghdhaliwalsaab668@gmail.com', quota: 155, used: 20 },
    { email: 'shivanilead2026@gmail.com', quota: 0, used: 44 },
    { email: 'harjinderkumarkumar56@gmail.com', quota: 50, used: 14 },
    { email: 'ms0286777@gmail.com', quota: 50, used: 53 },
    { email: 'chouhansab64@gmail.com', quota: 0, used: 2 },
    { email: 'gurdeepgill613@gmail.com', quota: 50, used: 9 },
    { email: 'reshamkaur6@gmail.com', quota: 50, used: 26 },
    { email: 'arshdeepjnvkauni1606@gmail.com', quota: 50, used: 26 },
    { email: 'officialrajinderdhillon@gmail.com', quota: 105, used: 68 },
    { email: 'jasmeensingh188@gmail.com', quota: 50, used: 32 },
    { email: 'arshrandawa29@gmil.com', quota: 0, used: 2 },
    { email: 'sujalsankhla11@gmail.com', quota: 105, used: 25 },
    { email: 'prince@gmail.com', quota: 105, used: 26 },
    { email: 'ranimani073@gmail.com', quota: 50, used: 58 },
    { email: 'chaurasiyasonali56@gmail.com', quota: 50, used: 33 },
    { email: 'priyaarora50505@gmail.com', quota: 50, used: 18 },
    { email: 'rimpy7978@gmail.com', quota: 50, used: 19 },
    { email: 'babitanahar5@gmail.com', quota: 0, used: 39 },
    { email: 'simrankaurdee9@gmail.com', quota: 0, used: 21 },
    { email: 'rupanasameer551@gmail.com', quota: 105, used: 46 },
    { email: 'jollypooja5@gmail.com', quota: 50, used: 26 },
    { email: 'jaspreetkaursarao45@gmail.com', quota: 105, used: 66 },
    { email: 'rohitchandolia1243@gmail.com', quota: 0, used: 1 },
    { email: 'rajveerbrarbrar637@gmail.com', quota: 50, used: 43 },
    { email: 'tushte756@gmail.com', quota: 0, used: 46 },
    { email: 'preetman00001@gmail.com', quota: 0, used: 16 },
    { email: 'goldymahi27@gmail.com', quota: 105, used: 44 },
    { email: 'sainsachin737@gmail.com', quota: 105, used: 14 },
    { email: 'ranjodhmomi@gmail.com', quota: 105, used: 39 },
    { email: 'rrai26597@gmail.com', quota: 0, used: 6 },
    { email: 'rahulkumarrk1111@gmail.com', quota: 0, used: 6 },
    { email: 'loveleensharma530@gmail.com', quota: 50, used: 42 },
    { email: 'ludhranimohit91@gmail.com', quota: 105, used: 71 },
    { email: 'harpreetk61988@gmail.com', quota: 105, used: 27 },
    { email: 'gurteshwargill098@gmail.com', quota: 105, used: 25 },
    { email: 'pjot10096@gmail.com', quota: 0, used: 13 },
    { email: 'paramjitkaur20890@gmail.com', quota: 50, used: 34 },
    { email: 'dhawantanu536@gmail.com', quota: 160, used: 44 },
    { email: 'rajbinderkamboj123@gmail.com', quota: 50, used: 33 },
    { email: 'arshkaur6395@gmail.com', quota: 100, used: 19 },
    { email: 'knavjotkaur113@gmail.com', quota: 50, used: 18 },
    { email: 'sipreet73@gmail.com', quota: 50, used: 28 },
    { email: 'bs0525765349@gmail.com', quota: 0, used: 37 },
    { email: 'mandeepkau340@gmail.com', quota: 160, used: 33 },
    { email: 'surjitsingh1067@gmail.com', quota: 105, used: 65 },
    { email: 'mandeepbrar1325@gmail.com', quota: 155, used: 87 },
    { email: 'muskanchopra376@gmail.com', quota: 50, used: 18 },
    { email: 'sandhu16shivani@gmail.com', quota: 0, used: 17 },
    { email: 'jk419473@gmail.com', quota: 98, used: 72 },
    { email: 'aryansandhu652@gmail.com', quota: 50, used: 9 },
    { email: 'sharmaanjali93962@gmail.com', quota: 50, used: 30 },
    { email: 'lakhveerkaur219@gmail.com', quota: 0, used: 51 },
    { email: 'punjabivinita@gmail.com', quota: 105, used: 59 },
    { email: 'ajayk783382@gmail.com', quota: 105, used: 77 },
    { email: 'dbrar8826@gmail.com', quota: 50, used: 36 },
    { email: 'neharajoria1543@gmail.com', quota: 50, used: 11 },
    { email: 'sumansumankaur09@gmail.com', quota: 100, used: 52 },
    { email: 'samandeepkaur1216@gmail.com', quota: 105, used: 76 },
    { email: 'rohitgagneja69@gmail.com', quota: 105, used: 71 },
    { email: 'harmandeepkaurmanes790@gmail.com', quota: 160, used: 59 },
    { email: 'ashok376652@gmail.com', quota: 105, used: 39 },
    { email: 'kaurdeep06164@gmail.com', quota: 105, used: 37 },
    { email: 'sranjasnoor11@gmail.com', quota: 105, used: 56 },
    { email: 'ziana4383@gmail.com', quota: 105, used: 73 },
    { email: 'rajveerkhattra9999@gmail.com', quota: 50, used: 37 },
    { email: 'jashandeepkaur6444@gmail.com', quota: 50, used: 37 },
    { email: 'jasdeepsra68@gmail.com', quota: 50, used: 38 },
    { email: 'brarmandeepkaur7@gmail.com', quota: 0, used: 38 },
    { email: 'loveleenkaur8285@gmail.com', quota: 105, used: 29 },
    { email: 'sparklingsoulshivani@icloud.com', quota: 0, used: 18 },
    { email: 'singhmanbir938@gmail.com', quota: 105, used: 21 },
    { email: 'mandeepbrar1325@gmail.com', quota: 155, used: 87 } // Duplicate removed in manualData
];

(async () => {
    console.log('--- 🔄 MASTER RECONCILIATION START ---');

    for (const item of manualData) {
        // Find user by email
        const { data: user } = await supabase
            .from('users')
            .select('id, is_active')
            .eq('email', item.email)
            .single();

        if (!user) {
            console.warn(`User not found: ${item.email}`);
            continue;
        }

        const pending = item.quota - item.used;
        const newStatus = pending > 0;

        // Update DB to match manual sheet exactly
        const { error } = await supabase
            .from('users')
            .update({
                total_leads_promised: item.quota,
                total_leads_received: item.used,
                is_active: newStatus // Automatically deactivate those who are DONE
            })
            .eq('id', user.id);

        if (error) {
            console.error(`Error updating ${item.email}:`, error);
        } else {
            console.log(`Synced ${item.email}: Quota=${item.quota}, Used=${item.used}, Pending=${pending}, Active=${newStatus}`);
        }
    }

    console.log('--- ✅ MASTER RECONCILIATION COMPLETE ---');
})();
