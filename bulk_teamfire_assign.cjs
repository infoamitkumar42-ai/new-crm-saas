const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://vewqzsqddgmkslnuctvb.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us');

function getPlan(amt, hint) {
    amt = Number(amt);
    if (amt === 999) return { p: 'starter', l: 55 };
    if (amt === 1999) return (hint || '').toLowerCase().includes('weekly') || (hint || '').toLowerCase().includes('boost') ? { p: 'weekly', l: 92 } : { p: 'supervisor', l: 115 };
    if (amt === 2999) return { p: 'manager', l: 176 };
    if (amt === 2499) return { p: 'turbo', l: 108 };
    return { p: 'unknown', l: 0 };
}

function getRandomTime() {
    // 25 Feb, 4:30 PM - 4:50 PM IST (11:00 - 11:20 UTC)
    const base = new Date('2026-02-25T11:00:00.000Z');
    const range = 20 * 60 * 1000;
    return new Date(base.getTime() + Math.floor(Math.random() * range)).toISOString();
}

// Some leads have phone in the "state" column with p: prefix — handle both formats
function parsePhone(phone, state) {
    if (state && state.startsWith('p:')) return state.replace('p:', '').trim();
    return (phone || '').replace(/[^0-9+]/g, '');
}
function parseState(phone, state) {
    if (state && state.startsWith('p:')) return (phone || '').trim(); // phone col has state
    return (state || '').trim();
}

const rawData = `ig	housewife	Mini	41	+917015827489	Haryana
ig	job	Security guard	Karan	Karan	Karan
ig	job	Rajkumar	40+	+917889054744	Punjab
ig	housewife	Ruqqaiya	25	86	83683446
ig	job	Vinay kumar	42	+919988419693	Chandigarh
ig	job	Harveer Kaur	34	+919877910326	Punjab
ig	job	Inderjeet Singh	35	+919910737412	Delhi
ig	student_	Ajay pathak	27	70044140799	Uttar Pradesh
ig	student_	Noman	18	+918273729077	Up
ig	student_	Rahman	23	+918081897331	Delhi
ig	job	Muskan mishra	19	+919310031507	Delhi
ig	housewife	Taran	35	+951318000	Punjab
ig	job	Armaan ali	22	+917900841928	Up
ig	housewife	Poonam	40	+917508927721	Punjab
ig	job	Yash Singh	18	+919289483012	Delhi
ig	job	RAJNEESH	35	+917986443218	Pb
ig	housewife	Veena rani	42	+917837721132	ETA
ig	job	Shivam	19	+918979720295	Rajasthan
ig	job	Davinder singh	18	+919876182819	Indian
ig	job	Varun Kapoor	30	+919953873206	Delhi
ig	student_	Ekanshaa Khurana	30	+918810544564	Delhi
ig	job	Arsh	27	+917986200832	Punjab
ig	student_	Ritu	20	+919812073878	Haryana
ig	student_	Anshchouhan	18	+919056262658	Punjab
ig	job	anand Kumar	28	+919821387118	Up
ig	student_	Nisha	21	+917009917476	Dasuya
ig	job	Surinder	50	79880973	Haryana
ig	job	Kushal	18	+918303917500	Delhi
ig	job	Lucky	30	+919465573056	Pb
ig	job	Riya Sharma	21	+919811364661	Delhi
ig	job	Faiq	18	+919599343825	Delhi
ig	student_	Tarun	22	9090000745 whatsapp me	Haryana
ig	student_	Akash	18	+918872994176	Chandigarh
ig	student_	Uves	18	+917248099517	Sharanpur up
ig	student_	Sarwanpreet kaur	20	+919914577113	Punjab
ig	housewife	Pooja	25	+918146661063	Chandigarh
ig	job	Manish	35	+917988651020	Haryana
ig	student_	ishwer deep singh	16	+918528180082	Punjab moga
ig	student_	kuldeep chaprana	27	+917451808504	meerut
ig	job	Vikas Arora	42	+919873813939	Delhi
ig	job	Arminderjitsingh	25	628044960	Amritsar
ig	job	Vijay kushwaha	22year m	+918707897679	I am from uttarpradesh and city sitapur
ig	student_	Jaideep Singh dara	2 3	+918178509144	Amritsar
ig	job	Rahul	18+	+918881709425	Badaun
ig	job	Ghansham sharma	40	+916239944690	Punjab
ig	job	Vikram Verma	40	+917988186059	Haryana
ig	job	Ajay Sharma	40	+919899670060	Haryana
ig	student_	Sarabjit	20	+918559072000	Punjab
ig	student_	MANJOT	26	+917696469301	Punjab
ig	job	Rana Balkar Singh	45	+919814044206	Punjab
ig	job	Rajkumar Richharia	40	+919802101022	Haryana
ig	student_	Prabhdeep Singh	18	+919855611142	Punjab
ig	job	Mukesh	19	+916377276990	Rajasthan
ig	student_	Tajveer Singh	18	+917888378262	Punjab
ig	housewife	Parveen kaur	30	+917009051447	Punjab
ig	student_	Adish	20	+917696716912	Punjab Amritsar
ig	student_	Rajesh	20	+919719451727	Up
ig	student_	Jashandeep Singh	18	+918427705520	Punjab
ig	student_	Lakshya Sorout	18	+919053893690	Haryana
ig	housewife	Ramandeep Kaur	28	+919815250963	Punjab
ig	student_	Akashdeep	19	+917888867349	Chandigarh
ig	student_	Vashu tanwar	21	+919650361736	Haryana
ig	job	Devesh Kumar	24	Uttar Pradesh	p:+918430491850
ig	student_	Kuldeep Singh	30	Haryana	p:+918930895505
ig	student_	Kanchan	18	Kasganj	p:+919675895961
ig	student_	Dilkhush Mali	21	Sawai Madhopur	p:+918058551760
ig	student_	Luv sharma	27	Anandpur sahib	p:+917717664439
ig	student_	Anurag tiwari	16	Delhi	p:+919140303071
ig	job	Abhay sharma	19	Utar pardesh	p:+919389624535
ig	student_	Rahul	22	Haryana	p:+919812579747
ig	job	Mohd Adil	28	Delhi	p:+919717482214
ig	job	Akashdeep Singh Gill	25	New Delhi	p:+917669793113
ig	job	Ravi kumar	23	Uttar Pradesh	p:+919119096568
ig	housewife	Sonu	40	Panjab	p:+919646299730
ig	job	Jobanjit singh	26	Punjab	p:+918872370236
ig	student_	Nitin	28	Himachal pradesh	p:+917590820212
ig	job	Vashir Ahmad	25	Uttar Pradesh	p:+919927089094
ig	student_	Khushi Ram	22	Haryana	p:+919499256260
ig	job	Nikhil	30	Haryana	p:+919896951360
ig	student_	Rohit	19	Delhi	p:+919355218515
ig	job	Harshit Aggarwal	28	New delhi	p:+919599915001
ig	job	Vikas Sharma	25	Rajasthan	p:+919887730090
ig	job	Balwinder Singh	26	Punjab	p:+917696793853
ig	job	Parwinder singh	32	Punjab	p:+917589149307
ig	student_	Priyanshu	20	Up	p:+919927835998
ig	job	Krishan kumar	28	Uttar pradesh	p:+919528431148
ig	job	Plumber	22	Delhi	p:+919999629557
ig	student_	Juned khan	15	Agra	p:+917409583249
ig	job	Ajay	21	Panjab	p:+919310504855
ig	job	Dinesh Jangir	30	Rajasthan	p:+917733935547
ig	student_	Harpreet Singh	19	Haryana	p:+919813645001
ig	student_	22	22	Nenital	p:+918394052683
ig	job	satpal	45	amritsar	p:+919780545326
ig	student_	Arvind kumar	24	Uttar Pradesh	p:+918957454122
ig	student_	Tasneen ansari	19	Pune	p:+917887988647
ig	student_	Sahil	21	Punjab	p:+918725964867
ig	job	Jobanpreet singh	26	Punjab	p:+917347463395
ig	student_	Krishna Kumar	15	Bihar	p:+919835821001
ig	student_	Sunil saini	20	Rajasthan	p:+917737504190
ig	student_	Shreyansh	18	Shreyansh	p:+919259079330
ig	student_	Amit	Chauhan	Gorakpura	p:+919625156958
ig	student_	Shubham	21	Dehli	p:+919625433403
ig	student_	Ankit singh	26	Uttar Pradesh	p:+918920809513
ig	student_	Deep Masih	24	Jalandhar city Punjab	p:+918360310779
ig	job	Vikas Kumar	24	Dehli	p:+919354330709
ig	student_	Inderjeet singh	25	Punjab	p:+918968373406
ig	student_	Balkar Singh	17	Punjab	p:+917696284544
ig	job	Tarsem Singh	27	Haryana	p:+917082834832
ig	student_	Shivam Singh	19	Rajasthan	p:+917991713133
ig	student_	Bhavesh rajoriya	23	Rajasthan	p:+919509362531
ig	student_	Azaz husain	14+	Uttar pradesh	p:+919628585996
ig	job	Kunal	24	Himachal Pradesh	p:+918278783104
ig	student_	Md Akbar	16	Bihar	p:+919661230136
ig	student_	Harshpreet	21	PUNJAB	p:+917087173824
ig	housewife	Renu	30	Rajasthan	p:+918233311765
ig	student_	Ritesh tomar	11/1/2008	Uttrakhand	p:+919286120185
ig	student_	Gorav	9639549802	9639549802	p:+919639549802
ig	student_	Pawankumar	27	Himchal pardesh	p:+918278865055
ig	job	Waseem qurreshi	40	Dehli india	p:+918448711495
ig	job	7982048744	Kanchan park	Housewife	p:+918882065990
ig	job	yogesh	27	jalandhar	p:+917814854266
ig	student_	Aman kumar	18	Bihar	p:+919693303005
ig	job	Vivek kumar	Jila ludiana	Kila raipur	p:+917973110959
ig	job	amar singh	28	punjab	p:+919781587525
ig	housewife	Jyoti	24	Meerut	p:+918791128802
ig	housewife	Bihar Samastipur	22	Bihar	p:+917561900872
ig	student_	Prabhjot singh	23	Punjab	p:+917696535388
ig	student_	Vikas	27	Delhi	p:+919289678838
ig	student_	Yes	Yes	Yes	p:+919026119304
ig	student_	Harsh jain	19	Haryana	p:+918287568983
ig	job	Deepak kumar	29	Punjaban	p:+917973965340
ig	job	Gurwinder	20	Punjab	p:+919878307009
ig	student_	Manish kumar	19	Bihar	p:+917250052713
ig	student_	Lovepreet singh	15	16	p:+918427165547
ig	student_	Raja Ram meena	18+	Rajsthan	p:+919216214844
ig	job	Sahil	27	Punjab	p:+917340789432
ig	student_	Himanshu Sharma	17	Punjab	p:+919876665693
ig	job	Abhi	29	Haryana	p:+919671769962
ig	housewife	Salma	30	Delhi	p:+918750214216
ig	student_	Bikanshu	17	Ghaziabad	p:+918287351781
ig	student_	Assan	16	Shahjahanpur	p:+918957877140
ig	student_	Sumit Kumar	7739703377	Bihar	p:+917061823234
ig	student_	Ankit yadav	18	Delhi	p:+917870780591
ig	housewife	Vineeta Chauhan	28	Delhi	p:+919761356270
ig	job	Viru	18	Kanpur	p:+916393209025
ig	student_	Anjali	19	Faridabad	p:+917838180037
ig	housewife	Neetu	25	Rajsthan	p:+918512074984
ig	student_	Somya	2	MP sagar	p:+918373922578
ig	job	JD Chandigarh India	22	Chandigarh	p:+919053380546
ig	job	Pankaj choudhary	30	Punjab	p:+918725872235
ig	student_	Y	19	Varanasi	p:+919450308647
ig	job	Sahil Kumar	29	Punjab	p:+917696606423
ig	student_	Md akib	20	Bhair	p:+917042413066
ig	student_	Beda Prakash Sahu	28	Odisha	p:+918144742546
ig	student_	Bhola	Bhola	Bhola	p:+917078951587
ig	student_	Aasif	22	Delhi	p:+918527405167
ig	student_	Kanhaiya Lal	23	Uttar Pradesh	p:+917895524416
ig	student_	Sunil Vishwakarma	16	9	p:+919532272945
ig	student_	Praveen	23	Jodhpur	p:+918955216475
ig	student_	Sukhvir	21	Punjab	p:+918284926098
ig	student_	Money problem	17	Utter Pradesh	p:+916395443717
ig	student_	Shivam Yadav	16	Uttar Pradesh	p:+919691264372
ig	student_	Rinku Mehra	20	Delhi	p:+918700522813
ig	housewife	Kumari rekha	30	Bilaspur Himachal Pradesh	p:+917018828930
ig	student_	Prodip bhumij	25	Golaghat	p:+917896239639
ig	student_	Sunny pardeep	17	Punjab	p:+917837583642
ig	job	Sahnaj khan	22	Noida	p:+918090078932
ig	student_	Ashok	Hii k	Ashok	p:+917388096612
ig	student_	Aryan kumar	18	Ghaziabad	p:+919599568257
ig	student_	Krish kumar	19	Punjab	p:+916239957521
ig	student_	Himanshu Yadav	16y	Uttar Pradesh	p:+919956089157
ig	job	Praval	29	Noida	p:+918979120517
ig	housewife	Sapna	28	Sapna	p:+919041612908
ig	student_	Karan	24	Punjab	p:+919877680868
ig	housewife	Neha kumari	24	U,p	p:+919041612908
ig	student_	Prabhash kumar	24	Jharkhand	p:+919199356386
ig	student_	KAPIL SONI	21	Rajasthan	p:+918529929031
ig	student_	Kishan kumar	19	Muzaffarpur	p:+919262666247
ig	job	Shahib	27	Up	p:+917906465177
ig	student_	Deepak Verma	20	Uttar Pradesh	p:+919818680098
ig	housewife	shagun kalra	29	haryana	p:+919888359918
ig	job	Dharmpreet	21	Punjab	p:+919569019246
ig	student_	Pese kama ne hai	Kese kam hai	Tarikh	p:+918962883727`;

async function main() {
    // ========== STEP 1: ACTIVATE JASHANDEEP ==========
    console.log('=== STEP 1: ACTIVATE JASHANDEEP ===');
    await supabase.from('users').update({ is_active: true }).eq('email', 'jk419473@gmail.com');
    console.log('✅ Jashandeep kaur ACTIVATED');

    // ========== STEP 2: PARSE LEADS ==========
    console.log('\n=== STEP 2: PARSE LEADS ===');
    const lines = rawData.split('\n');
    const newLeads = [];
    for (const line of lines) {
        if (!line.trim()) continue;
        const parts = line.split('\t');
        const [platform, profession, name, age, phoneRaw, stateRaw] = parts;

        const phone = parsePhone(phoneRaw, stateRaw);
        const state = parseState(phoneRaw, stateRaw);

        newLeads.push({
            name: name || 'Unknown',
            phone: phone || 'Unknown',
            city: state.substring(0, 50) || 'Unknown',
            state: state.substring(0, 50) || 'Unknown',
            source: 'ig',
            status: 'Assigned',
            notes: null
        });
    }
    console.log('Parsed ' + newLeads.length + ' leads.');

    // ========== STEP 3: GET ACTIVE TEAMFIRE USERS ==========
    console.log('\n=== STEP 3: GET ACTIVE TEAMFIRE USERS ===');
    const { data: activeUsers, error: uErr } = await supabase.from('users')
        .select('id, name, email, daily_limit')
        .eq('team_code', 'TEAMFIRE')
        .eq('is_active', true)
        .order('name');
    if (uErr) throw uErr;
    console.log('Active TEAMFIRE users: ' + activeUsers.length);

    // ========== STEP 4: BUMP LIMITS & ASSIGN ==========
    console.log('\n=== STEP 4: ASSIGN LEADS ROUND-ROBIN ===');
    const origLimits = {};
    const assigned = {};
    for (const u of activeUsers) {
        origLimits[u.id] = u.daily_limit;
        assigned[u.id] = 0;
        await supabase.from('users').update({ daily_limit: 999 }).eq('id', u.id);
    }

    let idx = 0;
    let successCount = 0;
    for (const lead of newLeads) {
        const user = activeUsers[idx % activeUsers.length];
        const t = getRandomTime();
        const { error } = await supabase.from('leads').insert([{
            name: lead.name, phone: lead.phone, city: lead.city, state: lead.state,
            source: lead.source, status: lead.status, notes: lead.notes,
            assigned_to: user.id, user_id: user.id, created_at: t, assigned_at: t
        }]);
        if (error) console.error('Insert error for ' + lead.name + ':', error.message);
        else { assigned[user.id]++; successCount++; }
        idx++;
    }
    console.log('Successfully inserted: ' + successCount + '/' + newLeads.length);

    // ========== STEP 5: RESTORE LIMITS & SYNC ==========
    console.log('\n=== STEP 5: RESTORE LIMITS & SYNC ===');
    for (const u of activeUsers) {
        const { count } = await supabase.from('leads').select('*', { count: 'exact', head: true })
            .eq('assigned_to', u.id).gte('created_at', '2026-02-24T18:30:00Z'); // 25 Feb IST
        await supabase.from('users').update({ daily_limit: origLimits[u.id], leads_today: count || 0 }).eq('id', u.id);
    }
    console.log('Limits restored & leads_today synced.');

    // ========== STEP 6: DISTRIBUTION REPORT ==========
    console.log('\n=== DISTRIBUTION REPORT ===');
    const sortedUsers = activeUsers.map(u => ({ name: u.name, got: assigned[u.id] })).sort((a, b) => b.got - a.got);
    sortedUsers.forEach(u => { if (u.got > 0) console.log('  ' + u.name + ': +' + u.got + ' leads'); });

    // ========== STEP 7: FINAL QUOTA REPORT ==========
    console.log('\n=== FINAL QUOTA REPORT ===');
    let totalPromised = 0, totalDelivered = 0, totalPending = 0;
    const completed = [], pending = [];

    for (const u of activeUsers) {
        let { data: pays } = await supabase.from('payments')
            .select('amount, plan_name, razorpay_payment_id')
            .eq('user_id', u.id).eq('status', 'captured');

        if (u.email === 'sejalrani72@gmail.com' && (!pays || pays.length === 0))
            pays = [{ amount: 999, plan_name: 'starter', razorpay_payment_id: 'manual_sejal' }];
        if (!pays || pays.length === 0) continue;

        const seen = new Set();
        let promised = 0;
        for (const p of pays) {
            const rp = p.razorpay_payment_id || Math.random();
            if (seen.has(rp)) continue; seen.add(rp);
            promised += getPlan(p.amount, p.plan_name).l;
        }

        const { count: delivered } = await supabase.from('leads')
            .select('*', { count: 'exact', head: true }).eq('assigned_to', u.id);
        const d = delivered || 0;
        const pend = Math.max(0, promised - d);

        totalPromised += promised; totalDelivered += d; totalPending += pend;

        if (pend === 0) completed.push({ name: u.name, promised, delivered: d, over: d - promised });
        else pending.push({ name: u.name, promised, delivered: d, pending: pend });
    }

    console.log('\n[✅ QUOTA COMPLETE - NO MORE LEADS NEEDED]');
    completed.forEach(u => {
        let msg = '  ' + u.name + ' (Promised: ' + u.promised + ', Delivered: ' + u.delivered + ')';
        if (u.over > 0) msg += ' [OVER by ' + u.over + ']';
        console.log(msg);
    });

    console.log('\n[⏳ STILL NEED LEADS]');
    pending.sort((a, b) => b.pending - a.pending).forEach(u => {
        console.log('  ' + u.name + ': Needs ' + u.pending + ' more (Promised: ' + u.promised + ', Delivered: ' + u.delivered + ')');
    });

    console.log('\n=== GRAND TOTAL ===');
    console.log('Active Paid Users: ' + (completed.length + pending.length));
    console.log('Quota Complete: ' + completed.length + ' users');
    console.log('Still Need Leads: ' + pending.length + ' users');
    console.log('Total Promised: ' + totalPromised);
    console.log('Total Delivered: ' + totalDelivered);
    console.log('TOTAL PENDING LEADS STILL NEEDED: ' + totalPending);
    console.log('\n✅ ALL DONE!');
}

main().catch(console.error);
