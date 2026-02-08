
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// Raw Data stored correctly
const RAW_DATA = `job_person	Anvesh Udrala	p:+919104571837	Dahod
student	Ashvin Chauhan	p:+919099427364	Melan
job_person	Dhruv Bhavsar	p:9265812521	Ahemdabad
job_person	Milan Patel	p:8401551457	Surat
others	Suheb Kaji	p:+919714048074	mahUVA
others	Anil Parmar	p:+918320502901	Dahod
job_person	Bhavesh Prajapati	p:+919537382648	Palanpur
job_person	Savan Thakor	p:+916356397695	Mehsana
job_person	Paras Mehta	p:+919409207019	Jamngar
business_owner	Rashmikant Parekh	p:+919825195037	Mahemdavad
job_person	Sarvaiya Arjunsinh	p:+917069635485	Mahuva
housewife	Riddhil   lathia	p:+919819051025	અમદાવાદ
job_person	Mahes Limbdiya	p:+917990976592	Rajkot
job_person	Jignesh Parma	p:+917990571922	Gujarat
student	gnasva	p:+917016599877	Port Blair
student	Navalsinh	p:+919316599320	Dahod
others	Hardik Suthar	p:8320566532	Himmatnagar
student	MR SMIT GHOGHALIYA	p:+919016592584	Dwarka
student	Navinchaudhary	p:+919157281262	Tharad
job_person	Dhaval Dodiya	p:+918160122436	Junagadh
housewife	Mahesh Patosaniya	p:+918780603391	Ahmedabad
job_person	maahibaba	p:+919909685217	Bhimnath
student	Geeta parmar	p:9724972359	Devbhoomi dwarka
job_person	Mayank Gorwadiya	p:+919137638901	Rajkot
job_person	Akshay Ratod	p:+919462509155	Amdaabad
others	Pravin thakor	p:+919723933944	Palanpur
business_owner	Kamlesh Patel	p:+919904001229	Amadavad
student	Sureshbhai Masrhuji Dhrangi	p:+916352809681	Palnapur
others	Harish	p:+919173317672	Ahmedabad
others	SanjayKumar ravat	p:+919712549108	Limkheda
others	Meet Vekariya	p:+918200331736	Jetpur
student	Ashok	p:+917575829698	Tahrad
student	Pruthvi Aayar	p:+917861954080	Lathi
student	Ajay Pargi	p:+919327832517	meghraj
others	Waghela Mayur	p:+919586956658	Vadodara
job_person	Manoj Doriya	p:+919913865202	Amdabad
others	Parmar Naresh	p:+919687228915	Gujrat
job_person	Mosinkhan	p:+919723762682	Junagadhb
student	OM	p:9978533003	Yes
student	ྀིशिव सदा सहायते ྀི	p:+918469792279	Nisw
job_person	Brijesh	p:+18128638283	bhuj
others	Tejash Chauhan	p:+918141442417	Devaghd baria
others	Dilip Odedra	p:+919106603453	Porbandar
job_person	Ashok, d, Prajapati,	p:+919537664531	Amadavad
housewife	Minaxiben r Prajapati	p:6351287627	Nadiya
housewife	Minaxi Mehta	p:+44919377729888	Surat
student	Soyab Darbar	p:+919870074595	ahemdabad
housewife	Sweta Chauhan	p:+919601848618	Ahmedabad
others	Paresh Bhai Kanabar	p:+919924570956	una
others	Kevin Ghodasara	p:+917874790557	pikhor
job_person	Rohit Thakor	p:+918758231553	Palanpur
job_person	Virendra Rathva	p:+917016263651	Jetpur Pavi
student	DIPAKSINH  ZALA	p:+918799508253	Kalol
business_owner	Jay Goga Reference	p:+919998557161	Surat
others	Suresh	p:9724801248	Tharad
student	𝓅Ⓡυ𝕊н𝐓ｉ	p:+916351391918	Rajkot
others	dipakbhai m.sagar	p:+917405560500	morbi . hadamatiya
others	Virat Prajapati	p:+918799328383	Botad
job_person	Raju desai	p:+919104068662	Sabarmati, ahmedabad
job_person	Jaydip Solanki	p:+919586389185	Ahmedabad
student	Mehul Parmar	p:+919265245427	Vadodara, Gujarat
job_person	Akash Parmar	p:+919925759160	Baroda
job_person	HK Relax	p:7622947663	Mahuva
housewife	Keyuri Patel	p:+919909277458	Vadodara
housewife	Roshni Patel	p:+918866468077	Surat
job_person	Nilesh Gusai	p:+919427818154	Bhuj
housewife	Lata Amrutbhai	p:9265404759	Ahmedabad
business_owner	Dharmesh Donda	p:+919624249683	Surat
business_owner	Francis Broachwala	p:7041846785	Vadodara
job_person	Hunter Lion..	p:+919574490397	Rajula
housewife	Vipul Sodha Vipul Sodha	p:+919265228143	Ahmedabad
business_owner	Kiran Shah	p:+918128153498	દેહ ગામ
housewife	Juhi Tejas Patel	p:+919662624788	Ahmedabad
business_owner	Nitin Patel	p:9106009254	Patan
business_owner	Vadher Hitendrasinh	p:+919016893200	Dwarka
business_owner	!!! दरबार अजय सिंह !!!	p:+919558104758	Raner
others	Kishan Panchasara	p:+919016082256	Bhavnagar
job_person	Maheta Viral	p:+919824394303	Rajkot
job_person	VICKY ZALA	p:9099999820	Rajkot
student	Jitrajsinh Rajendrasinh Gohil	p:+919624567454	Gariyadhar
job_person	Jignesh  N. Patel	p:9173902268	Ahmedabad Gujarat
student	jay	p:+918469851562	Surat
housewife	Jugal Patel	p:+919998985933	Unjha
student	Hi	p:+918866101683	ArifJat
business_owner	VB	p:+918128487117	KHEDA
business_owner	Jαgdiѕh Gαjjαr	p:+919879970888	Palanpur
student	Prince Munnu	p:+919925668718	Bhavanagar
job_person	apps_ king	p:+917600437507	Amadavad
business_owner	Prakash Mithpara	p:+919104552983	Surendranagar
others	Vishal Raval	p:+919313564606	Kadi
others	Vinay Chavda	p:9662170855	Kutch
others	Jigar Ja Ratĥoď	p:+919328298491	Datrai
job_person	Jadeja Pruthavirajsinh	p:+916355680762	Bhuj
housewife	Khushbu	p:+919724212639	Ahmedanad
housewife	Virali shihora	p:8401944047	Surat
student	Vishnu Chaudhari	p:+918320202488	ℂ𝕙𝕒𝕖𝕞𝕓𝕦𝕧𝕒 𝔹𝕙𝕒𝕓𝕙𝕒𝕣 𝔾𝕦𝕛𝕣𝕒𝕥
housewife	Nanda Parmar	p:+917383526338	Vadodara
others	RP__	p:+919727556133	Harij
business_owner	Pradipsinh Vaghela	p:+919825028082	Ahmedabad
job_person	Aman mali	p:+919510238889	Vadodara
housewife	H K.  prajapati 143	p:+918758185046	360055
others	saurin shah	p:+44918928100618	Mumbai
job_person	𝚱 𝚱	p:+918849408951	Kevin
student	તુષારભાઇ ખંમળ આહિર	p:+919726595946	Sihor
job_person	Kiran	p:7069552930	Deodar
others	Mayur Umavanshi	p:+919979973848	Ahmedabad
housewife	Sarvan Thakur Thakur	p:+918849550498	ભાભર
others	Rahul Anand	p:+919898718745	Khambhat
job_person	G.J.BHARWAD	p:+919979255582	Ahmedabad
student	કીરીટ ડાભી	p:+919173211832	Kirit
others	K Vaghela	p:+917201980700	Jetpur
student	3.5	p:+919558907397	Dahod
student	Rohitji Thakor	p:+919099248374	Gandhinagar
job_person	Paresh Kamaliya	p:+99924867150	Gorakhamadhi
others	Prakash Parmar	p:+919510914360	Ahmedabad
student	Chaudhary Shailesh	p:+919714875463	Tharad
others	Kaushik-143	p:+916353197589	Valsad
student	𝕍𝙰𝙽𝚉𝙰𝚁𝙰	p:+919898807732	Ahmedabad
job_person	Jigs Chauhan	p:+919033323181	Rajkot
others	રામજી આહિર	p:9913037692	Kachchh
student	Shivam Parmar	p:+919510321020	Ahmadabad
housewife	Mansi Patel	p:+919426309697	Ahmedabad
student	ANNU_OFFICIAL	p:70691 10187	ᴅᴀʜᴏᴅ
job_person	miss shumi rtw 107	p:+919327007438	Godhra
job_person	Pradip Gohil	p:+917046931109	Gadhada
others	Palas Sanjay Bhai	p:9081729641	Godhra
student	જાદવ સિધ્ધરાજસિહ. બનાસકાંઠાન	p:+919328641204	જાદવ.
others	hitesh patel	p:+919510704748	Mahisagar
others	HITESH	p:+919773191137	HITESH BHIL
student	Jig's Gohel	p:+916351302441	Anand
others	Ramesh Parmar	p:+917567669858	thara
student	___S--R___	p:+919974181272	好吧999
student	Mr.Shiva-124	p:+919824898890	Jamnagar
job_person	Hitesh parmar	p:9624851032	Anand
student	parash bochiya	p:8160675686	રામપુરા થરાદ
job_person	Aravid Bhai Heemat Bhai Tank	p:+918758546381	savar kundla
others	Rajput Bhavesh	p:+919723285871	Gir somnath
student	Kalpesh Rathod	p:+917990581389	Kalpesh
job_person	Ankita Pandya	p:+917383809567	vadodara
job_person	विपुल सथवारा	p:+919974282041	Surendra nagar
student	Manoj Shiyal	p:+919016552138	રરર
others	Popatji Thakor	p:+919586597366	idar
others	Darshan Dhameliya	p:+919712109363	Ahemdabad
job_person	Jignesh Thakor	p:+918849480711	Thangadh
others	Mafabhai Prajapati	p:+919913086245	Tharad
job_person	Brijesh Prajapati	p:+919106767818	Dhrangadhra
student	M Chauhan	p:+919574581560	gujarat
job_person	Hareshbai Ravat	p:+919510679343	mahesana
others	Pravin Galchar	p:+918347062731	Dhanera
job_person	Jodhani Lay	p:+919712299597	Surat
others	Mitesh Rabari	p:+919662427049	Vadodara city
student	Bholu	p:+917203804436	Ahmedabad
housewife	vishubha	p:+919327366186	Vishyrajsinh
job_person	payal kukadiya	p:+919173833111	Tankara
job_person	Nwab Baba Nwab	p:+919687730421	Amreli
job_person	Bhavik	p:+919924475885	Rajkot
others	Umesh Bhabhor Umesh Bhabhor	p:+919016380559	Dahod
others	AR_THAKOR_9094	p:8849540481	મહેસાણા
student	R. A. V. I.	p:+919737309190	Ahmedabad
others	𝕾𝖆𝖓𝖏𝖆𝖞 𝕻𝖆𝖓𝖈𝖍𝖆𝖑	p:+919427257902	Danta
business_owner	Rahul Trivedi	p:+919726235902	Unjha
student	jayraj	p:+919725485305	Surat
housewife	Asha Bhoi	p:+919023488322	Dhesiya
job_person	Dalsukh Rathod	p:+919825889981	Palitana
others	BambhNiya Rajesh B	p:+919904659045	Gir somnath
job_person	Royel Kanudo	p:+919099589163	Vavdi
student	Vishal	p:+919274945864	વિશાલ
business_owner	નરેન્દ્ર કુમાર તખાભાઇ	p:+919023497068	ઠાકોર નરેન્દ્ર કુમાર
student	mr.munna __313	p:+917984777507	Palanpur
others	Imran dubliya	p:+919724701036	Palnpur
housewife	Shebaun chavada	p:+919998703923	गांधीधाम
job_person	ram	p:+919714627137	Junagadh
job_person	52	p:9316424050	Gujrat
student	 Umesh	p:+919316519275	Mandor
student	𝙼𝚁 𝙹𝙰𝙲𝙺	p:+918154838830	Bhavnagar
job_person	Bharat Bharavad	p:7041125577	Gandhinagar
others	𝐘𝐀𝐃𝐀𝐕	p:+917487990698	Keshod
student	Soham Rathod	p:+919537860657	Vansda
others	Naresh Thakor	p:+919512897482	Bhiloda
student	SHRIMALI DHRUV	p:9586390177	Ahmedabad
business_owner	Laljibhai Parmar	p:+919824065025	Khambhat ANAND
business_owner	Hitesh Thakkar	p:+919909210810	Thara
housewife	bareiya prakash	p:+919512126916	Gujarat
student	Omdevsinh Sinh Rana	p:+919773487898	Limbdi
student	⇨ⱽᶤcķ𝓎.	p:+919773452150	Vikram
business_owner	Vivek Kariya	p:7878814320	Veraval
business_owner	Pambhar Lavashik	p:+916352610092	Rajkot
student	RAJVEER	p:+919313909462	Godhra
student	ISHVAR..0786	p:6355231802	Sabarkantha
student	ગૌરાંગ પટેલ	p:+919328455248	Hn ch t
others	Ashvin Chaudhary	p:+919998551252	Dhanera
job_person	Vipul_C_Malotariya007	p:6353696188	Deesa
housewife	Parmar anjuben	p:9913024794	Kapadwanj
others	𝐊 𝐈 𝐒 𝐇 𝐔 ➣	p:+919313067680	Ahmedabad
housewife	NehaNileshVadgama	p:9638188748	Tatala
housewife	parmar  payal	p:919904278809	Dwarka
student	જયેશ પરમાર	p:+919265199229	242886
student	Gopal Bharwad	p:+918487986818	Palitana
student	s p baraiya	p:+918141229424	Bhavnagar
student	Vishal Thakor Vishal Thakor	p:8780475691	Vishal
student	Hiru	p:9512825594	Pindakhai
others	Dipa Chandarana	p:+919377311668	Rajkot
others	Naresh Prajapati	p:+917048381662	Surat
job_person	,mayur  rajput raj meldi	p:+918758211815	Halol
student	Somabhai Raygor	p:9313658204	આશાબેન સોમાભાઈ
job_person	Dhara Sathwara	p:+919714978232	Ahmedabad
student	seju parmar	p:+916355247934	Tana
housewife	Pragna Vora	p:+918433551898	Surat
student	દશરથભાઈ	p:9081720298	ડૌરીયા
housewife	Juhi Pradip Makwana	p:9328619166	Vadodara
housewife	Guddi Guddi	p:+916355774206	Cg Road
housewife	Shital Prajapati	p:+919512405564	surat
job_person	Smeet Patel	p:+919409218149	Ahmedabad
business_owner	Munafkhan Pathan	p:9925119558	Y
others	જય મેલડી માં	p:+919974766439	Dhanera
housewife	Shilesah Shilesh	p:+917359613523	Bicholim
housewife	Aarti Pranami	p:+919099907955	Adipur
housewife	kajalvansh	p:+916353826540	Kodinar
student	ભુપત ભારાઈ	p:+919106415201	9106415201
housewife	Komal Shiyani	p:+918347295955	Surat
student	Hetalvegad	p:9574133536	Bhavnagar
student	raju_creation__08	p:+919016507832	Rauj
housewife	Asha Yogi	p:+916353558660	Mahesana
student	Maheas Maheas	p:+919978293801	મોરબી
housewife	Vasava Manish	p:+918140747035	Surat
housewife	Renu Rajesh Mehta	p:+919374725220	Surat
housewife	MD	p:+919409156202	Mahuva
housewife	Purva patel	p:+19106069259	Rajkot
housewife	urmilaba d hudad	p:+919265762674	Rajkot Gujarat
housewife	Parvati ahir	p:+919512509484	Anjar
housewife	Komal Panchal	p:+919725067412	
housewife	Rathod King	p:+916351328263	Sardargh
housewife	m_A_makrani	p:+918153013575	Junagadh
housewife	Bina Mori	p:+919904490688	Rajkot
housewife	Vinita vadaliya	p:+8488091208	Ahmedabad
housewife	Jyoti Pawar - Khanvilkar	p:+919727819954	Surat
housewife	Anita Patel	p:+918780921878	Surat
housewife	@k@sh ki kir@n	p:+919023313218	Bhavnagar
job_person	Deep Joshi	p:+919327182391	Junagadh
housewife	Sima Bhatesa	p:+919979246209	Ahmedabad
student	kishuu_3010	p:+918980098223	Paradise kudalmal Madina 62
housewife	@od__nishu__9514	p:+917984698158	Ahmedabad
housewife	Anjali Harsh shah	p:+917096710407	Ahmedabad
housewife	Doli Kotak	p:9724715097	Rajkot
housewife	kคຖคຖi.	p:8140298721	Surat
others	Nisha Dobaria	p:+918980042709	Surat
others	Bharat Parmar	p:968786258-	Bhatiya
housewife	Umang Bhanushali	p:+919106974167	Unjha
housewife	꧁༒☬!સ્ટેટ ઓફ રામાધણી!☬༒꧂	p:+919601916383	Patna
student	desai _shakshi	p:9724673646	Gandhinagar
housewife	Aarti Solanki	p:7405915480	Surat gujrat
housewife	Minal Patel	p:+917874864296	Ahmedabad
housewife	Swati Joshi	p:+919427499633	Ahmedabad
business_owner	Prabhu Lal Regar	p:+919680922519	Bhilwara
business_owner	Vaibhavi Raval	p:+917600659402	Vadodara
job_person	Ramoliya pratik	p:+918141268634	Jetpur
job_person	Zala Ramsinh	p:+919624148590	Mahemdavad
job_person	Ramesh Mali	p:+919428196502	ગંભીરપુરા
job_person	Jayesh	p:+919727581524	Amadavad
job_person	Kush@l__P@rm@r	p:+918347915291	mangrol
student	Jay Sikoter	p:+917984502864	જેતપુર
housewife	Vaghela Rasila	p:+919016286774	Rajkot
housewife	Js Patel	p:+917096563688	Junagadh
housewife	Priya Shingala	p:+919727784004	Kamrej
others	RAKESH LADHEL..	p:+919173161790	Gandhinagar
housewife	Ekta Patel	p:+919979427233	Nadiad
housewife	Rami minaxi dharmendara bhai	p:9913363565	Gandhinagar Gujarat
business_owner	Manish.Baldaniya	p:+917434927424	Rajkot
others	Tofik Sarvadi	p:+917600844586	junagadh
job_person	Jignesh Maheta	p:+918401156732	Rajkot
job_person	BHAVADIP Avaiya	p:+918866181406	Ahmedabad`;

async function verifyManualList() {
    console.log("🕵️‍♂️ VERIFYING MANUAL LEADS LIST AGAINST DB...\n");

    // 1. Parse Data
    const validLeads = [];
    const lines = RAW_DATA.split('\n').filter(l => l.trim().length > 0);

    lines.forEach(line => {
        const parts = line.split('\t'); // Tab separated
        if (parts.length < 3) return;

        let phone = parts[2].replace('p:', '').trim().replace(/[\s-]/g, '');
        // Keep +91 format consistent
        if (phone.startsWith('+91')) phone = phone;
        else if (phone.length === 10) phone = '+91' + phone;

        validLeads.push({
            raw: line,
            phone: phone,
            name: parts[1]
        });
    });

    console.log(`📋 Parsed ${validLeads.length} leads. Checking in DB...`);

    // 2. Bulk Check in DB
    const allPhones = validLeads.map(l => l.phone);
    const { data: dbLeads } = await supabase.from('leads')
        .select('phone, created_at, source')
        .in('phone', allPhones);

    const foundPhones = new Set(dbLeads?.map(l => l.phone));

    // 3. Compare
    let missingCount = 0;
    const missingLeads = [];

    validLeads.forEach(l => {
        if (!foundPhones.has(l.phone)) {
            missingCount++;
            missingLeads.push(l);
        }
    });

    console.log(`\n📊 VERIFICATION REPORT:`);
    console.log(`✅ FOUND IN DB:  ${validLeads.length - missingCount}`);
    console.log(`❌ MISSING:      ${missingCount}`);

    if (missingCount > 0) {
        console.log(`\n🚨 THE FOLLOWING LEADS ARE TOTALLY MISSING FROM DB:`);
        console.table(missingLeads.slice(0, 15).map(l => ({ Name: l.name, Phone: l.phone })));

        // Suggestion
        console.log(`\n👉 DO YOU WANT TO INSERT THESE ${missingCount} MISSING LEADS NOW?`);
    } else {
        console.log(`\n🎉 ALL GOOD. All leads in your list are safe in DB.`);
    }
}

verifyManualList();
