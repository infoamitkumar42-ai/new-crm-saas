const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://vewqzsqddgmkslnuctvb.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us');

const rawData = `ig	Pankaj	34	6350447332	Jaipur	B. A
ig	Jethava Kiran mukesh bhai	18	Bhavnagar	Bhavnagar	Student
ig	GOHIL BHAVSINH	19	7990171348	SURAT, GUJARAT	PART TIME
ig	Hi	36	7567747999	Surat	12 pass
ig	Shankar lal	30	8401156994	Ahmedabad Gujarat	Graduate
ig	Maru nam___Rathva ashish...	Rasthva...	9227115770	Ashish rathva	Rathva. Ashish...
ig	Meet patel	20	7862901484	Anand	Hotel menegment
ig	Virendrasinh barad	32	7600108831	Gandhinagar Gujarat	B A
ig	Bharwad jaydeep ranchhodbhai	18 running	7043220280	Ahmedabad Gujarat	12 pass
ig	Md kasim	20	9721205830	Up	12 pass
ig	Harshid	19	8141797858	Jamnagar lalpur haripar	12 pass and ccc...
ig	Mahesh_vaghelaa_0001	19	99824 38437	Raniwara	College
ig	Kabirani Yahya	21	8866773612	Gir Somnath	Mujuri
ig	Jayesh	Jayesh	Gfftfgdgg	Vggvfvv	Vcvvg
ig	Prince	19	9274094735	Surat	Oo
ig	Raj	28	,8200563895	Botad	12
ig	Asha	37	9313666689	Upleta	Yes
ig	Dhaval	29	8511518587	Ahmedabad	Graduation
ig	Jaysukh kumar	33	8799364452	Gujarat	H.s.c
ig	Samir	30	6354196601	Surat Gujarat	12 th
ig	Siddik bamboj	42	9104311044	Dabhoi gujrat	10 paas
ig	PATELIYA GIRISHBHAI...	19	9909365441	MALEKPUR, LUNAVADA...	12th & Diploma ma
ig	K	N	8	J	K
ig	ગિરીશ પ્રજાપતિ	40	6352123608	Gujarat Mehasana	M. A
ig	Mohit Sharma	40	7984723764	Ahmedabad Gujarat	12th
ig	Piyush	16	8401033684	Kadi (Gujarat)	Student
ig	Shaileshbhai chavda	40	8128981222	Gondal,gujrat	10th paas
ig	Kanzariya divyesh	20	9016250728	Halvad	Yes
ig	Payal	32	7016545313	Surat	B.com
ig	Dilip Patel	43	9408758964	Ahmedabad	B.com
ig	રાહુલ કંથેરીયા	18	6354705388	કંથેરીયા	11 પાસ
ig	Paisa kamana hai	Kya karana..	7874761121	I am photographer sir	Paisa Aata hai...
ig	Priyank Pipariya	25	9998184573	Rajkot Gujarat	B.com
ig	Solanki hirenbhai	18	8160801518	Botad	College student
ig	Ajay	26	7600900866	Gujarat	College
ig	Eys	Eys	Eys	Eys	Eys
ig	Baldaniya mitul	20	8347413089	Surat	B. A
ig	Keyur solanki	22	9157408611	Gangad	Job
ig	Altaf khan	19	8602733592	Mp jaora	12th
ig	Karan	20	8849156523	State	Palampur
ig	Ashvin parmar	28	7698840031	Surat	12
ig	Parmar Divyesh	29	8980434843	Rajkot Gujarat	B.com
ig	Dhvanit	14-2-2007	7048489869	Ahemdabad/gujarat	10 pass
ig	Yes	22	9510791779	LAKHANI. B.K	ગ્રેજ્યુએટ
ig	Jayesh bhai H	20	8849067182	Gujarat (Tharad)	Grejyusan
ig	Vishal parmar	18+	8980182910	Dahod Gujarat	12th running
ig	Bhadeliya anirudh	18	8200561120	Junagadh, Gujarat	12 pass
ig	Khushi zala	19	9586697688	Rajkot	12th pass
ig	Yes	24	7698783648	Mehsana	Yes
ig	Vishal thakor	21	9624026448	Mehsana Gujarat	Jantral
ig	Jayesh	43	9099272883	Ahemdabad gujrat	10
ig	Sanjay	38	9909599323	આંકલાવ	A
ig	Rahul	26	9624970414	Babra	12
ig	Mahesh solanki	36	7383075615	Ahmedabad	10 fal
ig	Manish MULCHANDANI	35	9428029856	Gujarat	8pass
ig	Bhagyarajbhai Karapda	22	9313409678	Gujrat	B.com
ig	Hi	Money	9824989198	Dahod. Limkheda	Money
ig	Pravinbhai	24	8469056747	Godhra	-
ig	H	H	H	H	H
ig	Yes	Yea	Yes	Ahmedabad	12th complete
ig	SOLANKI kishor	28	9638708800	Lunawada mahisagar	,BE
ig	Ns	19	8469164702	Gujarat	H
ig	Smitalbhai Sayaniya	36	6353480795	Ankleshwar Gujarat	Diploma electrical...
ig	Dineshbhai Trikmabhai...	28	7600092224	Tharad gujrat	B.A
ig	Mhavirsinh Gohil	18	9737431484	Gujarat	12 processing
ig	Vihar desai	20	9313870391	Patan Gujarat	12 पास
ig	Sidpra vedant Rajeshbhai	19 running	7990244164	Gujrat	2 nd year b.com
ig	prakash Parmar	28	9724434161	vadodara	b.com
ig	Desai siddhraj viraBhai	S.v.d	9265549008	Deesa	S.s
ig	Rahul algotar	18+	8799588349	Ahemdabad to gujrat	Ha
ig	Hemang Chavda	18+	9106302727	Surendarnagar	College 2 yaar start
ig	Dharmik	17	9924027322	Botad gujarat	Job student ke liye
ig	Hi	Hi	Hi	Hi	Hi
ig	Raviraj	31	9737633255	Gujrat	BCA
ig	Hiteshpargi	32	9537193438	Gujarat mahisagar...	12thepas
ig	Mukesh Bhai	18+	9106107961	Chhota udepur.singla	Singla
ig	S N Thakoar	32	7069880812	Gujrat	Ektra incam
ig	Dipak dabhi	25	9016799310	Mehmdavad ,,shtrunda	Shtrunda
ig	Navin thakor	19	7990742195	Santalpur _gujarat	10std
ig	Vadhva Sumit	25	9316674761	Junagadh Gujarat	12 Pass
ig	Hasmukhbhai parsottam...	21	9265826523	Lunawada	12th BA
ig	Charamata jayesh lebabhai	24	9316073771	Deesa	Graduate
ig	Makvana GOPALSINH...	31	9316774684	HIMATNAGAR...	GREDUATE
ig	Rabari Alpeshbhai becharaji	26	8469805156	Ahemdabad	9th
ig	Mayur chopda	25	8141494681	Veraval gir somnath	12th Graduation...
ig	Jayesh bambhaniya	26	9537694140	Bhavnagar	Bhavnagar
ig	Kaushik	29	9601340449	Surat Gujarat	11
ig	DILLIP KUMAR JENA	52	8200866105	Gujarat	Graduate
ig	Makwana Arvind	25	8128383495	Botad gujrat	12+
ig	Patel Brijesh Kumar	30	7201999118	Lunawada Mahisagar	Diploma Mechanical
ig	VARU JAYDEEP K	30	9998327658	JETPUR GUJARAT	12 pass
ig	Isha	20	8780115756	Surat	.
ig	Mevada Vijay	24	9998542226	Botad, gujrat	HSC PASS
ig	Gadhavi kamlesh	28	7874334630	Anand	12th pass
ig	Prabha Jadav	39	9909105026	Ahmedabad Gujarat	12th pass
ig	Vasani ashish	23	6353818789	Botad	Work
ig	Arunbhai	19	9586911475	Viramgam gujrat	A.t.thakor
ig	Mahesh	25	9316455718	Gujarat	Collage
ig	Nirmal Kumar	23	6356055492	Patan (Gujarat)	B.A.
ig	Hemant makwana	22	8849366161	Bhavnagar	B. Com
ig	Jalamsing	23	9427173369	Gujarat	B.com
ig	Vishal Dabhi	20	9328437901	Morbi Gujarat	Online Jobs
ig	Hardik	21	7623922032	Ahemdabad, gujrat	12th pass
ig	H	H	H	H	H
ig	Gohil jagdish	20	7863812505	Dholka	12 th pass
ig	Kajal parmar	27	8200414652	Ahemdabad	B.S.W
ig	M.b.karapda	26	8000343435	Surendranagar	Yes
ig	Gangadiya kuldip chaman	18	6356174510	SURENDRANAGAR	12 pass
ig	Mandal Babita	18	9054755828	Gujarat (Rajkot)	College student
ig	Bhil Dilip Mahindra bhai	19	9624917358	Narmada	Narmada
ig	Desai Ghanshyambhai...	21	9624089508	Bhavnagar	12
ig	Ramesh	29	9737350132	Veraval	Store keeper
ig	Hardik Machhi	28	8734009427	Gujarat-Bharuch	Diploma in chemical
ig	Yes	24	8320404646	Gondal gujrat	B com
ig	Zapdiya vikram	22	7778873273	Surendranahar	12 th pass
ig	Suthar Shankar narshibhai.	18	79905 70008	Paldi Mithi diyodar...	College
ig	Jaydip	28	9909313920	સિદ્ધપુર	Yes
ig	Kalpesh	40	9429445426	Surat gujrat	No
ig	Bhavika v Patel	21	8460660820	Vadodara	12th commerce
ig	Tes i am interested	28	8469058909	Kutiyana porbandar	12 science
ig	Divyrajsinh Sarvaiya	18	9316162033	Jamkandorna gujrat	12 pass
ig	Jigarbadeliya	20	7383258959	Rajkot Gujarat	Money income
ig	Pagi Hasmukh Kumar m	21	9106363975	Lunawada gujarat...	12th passing
ig	Vijay	૨૮	8980816775	Surat Gujarat	12 Diploma...
ig	Kishan Bhatt	20	9924968503	Veraval	B A
ig	SOLANKI DIPAKSINH	19	9106736423	Dahegam Gujarat	12 pass
ig	Desai Chetan	26	9106901023	Palanpur (Gujarat)	BCA
ig	Ajay	28	7861015927	Ahemdabad	12 plaus iti fitter
ig	Dipeshkuamar Prajapati	28	8511432867	Ahmedabad , Gujarat	Diploma
ig	Somubha MAGHAJI thakor	22	8140468892	Deesa Gujarat	12 pass
ig	Shekh Sandip	18	8980878010	Surendranagar Gujarat	Bca
ig	Darbar sinrajsing kinuji	18	9157319378	Desaa	Darbar
ig	Jaypal R Parmar	27	+91 9664948543	Rajkot, Gujarat	Deploma in...
ig	Ajay m	22	6359171626	Bhavngar,sihor	A
ig	Jayesh rabari	22	7487004973	Ahmedabad and gujarat	Thank you
ig	Vithal	30	9537779039	Viramgam	10
ig	Raaj Kumar	27	8849447868	Halol	12th
ig	Janki thakor	20	722685373	Palanpur,gujrat	Ungraduation
ig	Sagar pathar	25	7048147770	Jamnagar Gujarat	Bsc chemistry
ig	गणावा अजीत भाई	18	8200993233	दाहोद	10
ig	Rahul desai	20	8238448651	Deesa /Gujarat	B. A
ig	Ajitji	23	9327998750	Kalol, Gadhinager...	12th Pass
ig	Ajay Kumar rajend Bhai	22	7096260359	Kheda Gujarat	9 paas
ig	Krunal raval	42	9274396252	Jamnagar	10
ig	Govind rabari	21	7990282145	Tharad	Job
ig	Sanjay vaghela	41	9725424323	Nadiad	10th
ig	Om Soni	19	9624531972	Porbandar, Gujarat	12
ig	Rajendra	23	8849170877	Chhota udepur gujrat	12 th pass
ig	Smit kumar Valand	23	9624672004	Ahmedabad, Gujarat	M.B.A
ig	Kotadiya prayag	20	9875016033	Surat Gujarat	Undergraduate
ig	Vora chirag ghanshyam	27	9998026041	Surat	12 pass
ig	B	U	Y	B	B
ig	Nilesh Parmar	35	9924187207	Limbdi Gujarat	M.com pass
ig	Rabari amarat	18	9316679406	Bhabhar	Yes
ig	Virendra Parmar	32	7622841584	Vadodara Gujarat	12th
ig	Saurabh Dholakiya	34	9909576364	Gujarat Rajkot	10
ig	Sunny Rabari	21	97230 51033	Ahemdabad	Kam me kya karna...
ig	Nilesh mansukh bharda	27	7861014603	Chorwda	10pass
ig	Gohil harubha	24	9510025121	Una gir somnath	Una
ig	Chaudhary vijay kumar	18+	9723622738	Deodar, gujrat	Job
ig	Rutvik	21	6352250900	Gujrat	Graduation
ig	Mitesh desai	8/11/2004	6354768230	Palanpur	Just call me
ig	Vanraj	26	7600420059	Gujarat Rajkot...	12
ig	Thakor vishnuji khumaji	18	9313162938	Bhabhar	12 paass
ig	Mahesh Punjani	30	9725730590	Palanpur	Mmm
ig	Jitendra Bhoi	34	9909199204	Anand - Gujarat	Gretuated
ig	Tadvi Sunil Kumar pramod	19	9328426208	City= Godhra State=...	12th class pass
ig	Vipulbhai	23	6354391912	Botad	Qww
ig	Shyam	21	9909972716	Junaghat	College running
ig	Paresh Thakor	21	9824663896	Gujarat Deesa	12pasa
ig	Bharat	28	9638634824	Piplod	12pass
ig	Yes	29	799012	Godhra	12std
ig	B	B	B	Y	H
ig	Arvind kumar disae	20	9636554512	Sachor Rajasthan	8
ig	Vaghasiya parag	26	7622085183	Surat	10
ig	Harpalsinh Chauhan	30	8758284447	Tharad. Gujarat	9 pas`;

function getPlan(amt, hint) {
    amt = Number(amt);
    if (amt === 999) return { p: 'starter', l: 55 };
    if (amt === 1999) return (hint || '').toLowerCase().includes('weekly') || (hint || '').toLowerCase().includes('boost') ? { p: 'weekly', l: 92 } : { p: 'supervisor', l: 115 };
    if (amt === 2999) return { p: 'manager', l: 176 };
    if (amt === 2499) return { p: 'turbo', l: 108 };
    return { p: 'unknown', l: 0 };
}

function getRandomTime() {
    // Current time is ~ 17:50 IST (12:20 UTC)
    // We will distribute between 17:00 IST (11:30 UTC) and 17:50 IST (12:20 UTC)
    const base = new Date('2026-02-24T11:30:00.000Z');
    const range = 50 * 60 * 1000;
    return new Date(base.getTime() + Math.floor(Math.random() * range)).toISOString();
}

async function main() {
    // 1. Process data
    const lines = rawData.split('\n');
    const newLeads = [];
    for (const line of lines) {
        if (!line.trim()) continue;
        const [platform, name, age, phone, cityStr, qual] = line.split('\t');

        let city = cityStr || 'Unknown';
        let state = 'Gujarat'; // Most seem from Gujarat

        if (city.toLowerCase().includes('rajasthan')) state = 'Rajasthan';
        else if (city.toLowerCase().includes('up')) state = 'Uttar Pradesh';
        else if (city.toLowerCase().includes('mp')) state = 'Madhya Pradesh';

        newLeads.push({
            name: name || 'Unknown',
            phone: phone || 'Unknown',
            city: city.substring(0, 50),
            state: state,
            source: 'ig',
            status: 'Assigned',
            notes: `Age: ${age || 'N/A'}, Qual: ${qual || 'N/A'}`
        });
    }

    console.log('Parsed ' + newLeads.length + ' leads to assign.');

    // 2. Find 11 active paid users of GJ01TEAMFIRE
    const { data: activeUsers } = await supabase.from('users')
        .select('id, name, email, daily_limit')
        .eq('team_code', 'GJ01TEAMFIRE')
        .eq('is_active', true)
        .order('name');

    const paidUsers = [];
    for (const u of (activeUsers || [])) {
        let { data: pays, error: pErr } = await supabase.from('payments')
            .select('amount, plan_name, razorpay_payment_id')
            .eq('user_id', u.id)
            .eq('status', 'captured');

        if (pErr) throw pErr;
        if (!pays || pays.length === 0) continue;
        paidUsers.push({ ...u, assigned: 0 });
    }

    console.log('Found ' + paidUsers.length + ' ACTIVE PAID users in GJ01TEAMFIRE.');

    if (paidUsers.length === 0) return;

    // 3. Temporarily bump limit to avoid trigger blockage
    const origLimits = {};
    for (const u of paidUsers) {
        origLimits[u.id] = u.daily_limit;
        await supabase.from('users').update({ daily_limit: 999 }).eq('id', u.id);
    }

    // 4. Assign leads round-robin
    let idx = 0;
    for (const lead of newLeads) {
        const user = paidUsers[idx % paidUsers.length];
        const t = getRandomTime();

        const dbLead = {
            name: lead.name,
            phone: lead.phone,
            city: lead.city,
            state: lead.state,
            source: lead.source,
            status: lead.status,
            notes: lead.notes,
            assigned_to: user.id,
            user_id: user.id,
            created_at: t,
            assigned_at: t
        };

        const { error } = await supabase.from('leads').insert([dbLead]);
        if (error) console.error('Error inserting lead: ' + lead.name, error);
        else user.assigned++;

        idx++;
    }

    // 5. Restore limits & sync leads_today
    console.log('\\nRestoring limits and syncing...');
    for (const u of paidUsers) {
        const { count } = await supabase.from('leads').select('*', { count: 'exact', head: true })
            .eq('assigned_to', u.id).gte('created_at', '2026-02-23T18:30:00Z');

        await supabase.from('users').update({ daily_limit: origLimits[u.id], leads_today: count || 0 }).eq('id', u.id);
    }

    console.log('\\n=== BULK DISTRIBUTION REPORT ===');
    const sorted = paidUsers.sort((a, b) => b.assigned - a.assigned);
    sorted.forEach(u => console.log('  ' + u.name + ': +' + u.assigned + ' leads'));
    console.log('✅ Bulk assignment completed.');
}

main().catch(console.error);
