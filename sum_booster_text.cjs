const fs = require('fs');

const manualText = `
Jashandeep singh	jashanpreet0479@gmail.com	starter	Active	6/2/2026(â‚¹999)	â‚¹999	50	25	25
Akshay Sharma	jerryvibes.444@gmail.com	supervisor	Inactive	N/A	â‚¹0	0	28	0
Ravenjeet Kaur	ravenjeetkaur@gmail.com	weekly_boost	Active	3/2/2026(â‚¹1999)	â‚¹1999	105	61	44
Rajni	vansh.rajni.96@gmail.com	weekly_boost	Active	N/A	â‚¹0	0	86	0
Mandeep kaur	mandeep.k21@icloud.com	supervisor	Active	9/2/2026(â‚¹1999)	â‚¹1999	105	23	82
Sakshi	sakshidigra24@gmail.com	starter	Active	5/2/2026(â‚¹999)	â‚¹999	50	33	17
Husanpreet kaur	husanpreetkaur9899@gmail.com	starter	Active	14/2/2026(â‚¹999)	â‚¹999	50	8	42
Sonia Chauhan	s73481109@gmail.com	starter	Active	4/2/2026(â‚¹999)	â‚¹999	50	37	13
Baljinder kaur	nikkibaljinderkaur@gmail.com	starter	Active	1/2/2026(â‚¹999)	â‚¹999	50	51	0
Jashandeep singh	jass006623@gmail.com	starter	Active	N/A	â‚¹0	0	9	0
Mandeep kaur	gurnoor1311singh@gmail.com	supervisor	Active	4/2/2026(â‚¹1999)	â‚¹1999	105	56	49
Yash yadav	yy861880@gmail.com	starter	Active	3/2/2026(â‚¹999)	â‚¹999	50	36	14
Princy	princyrani303@gmail.com	turbo_boost	Active	5/2/2026(â‚¹2499)	â‚¹2499	98	70	28
Sejal	sejalrani72@gmail.com	starter	Active	N/A	â‚¹0	0	28	0
Kiran Brar	brark5763@gmail.com	starter	Active	8/2/2026(â‚¹999)	â‚¹999	50	38	12
Payal	payalpuri3299@gmail.com	weekly_boost	Active	4/2/2026(â‚¹1999)	â‚¹1999	105	61	44
Joyti kaur	nasib03062003@gmail.com	starter	Active	N/A	â‚¹0	0	4	0
Davinderpal kaur	hansmanraj88@gmail.com	starter	Active	10/2/2026(â‚¹999)	â‚¹999	50	16	34
Nitinluthra	nitinanku628@gmail.com	weekly_boost	Active	10/2/2026(â‚¹1999)	â‚¹1999	105	50	55
SEEMA RANI	ssatnam41912@gmail.com	starter	Active	9/2/2026(â‚¹999)	â‚¹999	50	5	45
Ansh	aansh8588@gmail.com	weekly_boost	Active	8/2/2026(â‚¹1999)	â‚¹1999	105	26	79
Manish	my440243@gmail.com	starter	Active	12/2/2026(â‚¹999)	â‚¹999	50	12	38
Preeti	preetibrarbrar7@gmail.com	starter	Active	4/2/2026(â‚¹999)	â‚¹999	50	37	13
Saloni	ananyakakkar53b@gmail.com	supervisor	Active	1/2/2026(â‚¹1999)	â‚¹1999	105	61	44
Paramjeet kaur	vilasraparam@gmail.com	starter	Inactive	N/A	â‚¹0	0	47	0
Saijel Goel	saijelgoel4@gmail.com	weekly_boost	Active	3/2/2026(â‚¹1999)	â‚¹1999	105	70	35
Navpreet kaur	navpreetkaur95271@gmail.com	weekly_boost	Active	4/2/2026(â‚¹1999)	â‚¹1999	105	67	38
Raveena	khanrehamdin366@gmail.com	supervisor	Inactive	N/A	â‚¹0	0	15	0
Kulwant Singh	kulwantsinghdhaliwalsaab668@gmail.com	supervisor	Active	12/2/2026(â‚¹999) | 12/2/2026(â‚¹1999)	â‚¹2998	155	20	135
Shivani	shivanilead2026@gmail.com	supervisor	Active	N/A	â‚¹0	0	44	0
Priyanka	harjinderkumarkumar56@gmail.com	starter	Active	9/2/2026(â‚¹999)	â‚¹999	50	14	36
Rahul	ms0286777@gmail.com	starter	Active	1/2/2026(â‚¹999)	â‚¹999	50	53	0
Rimpy Singh	chouhansab64@gmail.com	starter	Inactive	N/A	â‚¹0	0	2	0
Gurdeep Singh	gurdeepgill613@gmail.com	starter	Active	14/2/2026(â‚¹999)	â‚¹999	50	9	41
Resham kaur	reshamkaur6@gmail.com	starter	Active	6/2/2026(â‚¹999)	â‚¹999	50	26	24
Arshdeep singh	arshdeepjnvkauni1606@gmail.com	starter	Active	8/2/2026(â‚¹999)	â‚¹999	50	26	24
Rajinder	officialrajinderdhillon@gmail.com	weekly_boost	Active	3/2/2026(â‚¹1999)	â‚¹1999	105	68	37
Jasmeen singh	jasmeensingh188@gmail.com	starter	Active	3/2/2026(â‚¹999)	â‚¹999	50	32	18
Mandeep kaur	arshrandawa29@gmil.com	starter	Active	N/A	â‚¹0	0	2	0
Sujal Sankhla	sujalsankhla11@gmail.com	supervisor	Active	4/2/2026(â‚¹1999)	â‚¹1999	105	25	80
Prince	prince@gmail.com	weekly_boost	Active	9/2/2026(â‚¹1999)	â‚¹1999	105	26	79
Mani kaur	ranimani073@gmail.com	starter	Inactive	1/2/2026(â‚¹999)	â‚¹999	50	58	0
Sonali	chaurasiyasonali56@gmail.com	starter	Active	3/2/2026(â‚¹999)	â‚¹999	50	33	17
Priya Arora	priyaarora50505@gmail.com	starter	Inactive	13/2/2026(â‚¹999)	â‚¹999	50	18	32
Jyoti	rimpy7978@gmail.com	starter	Active	4/2/2026(â‚¹999)	â‚¹999	50	19	31
Babita	babitanahar5@gmail.com	starter	Active	N/A	â‚¹0	0	39	0
Simran	simrankaurdee9@gmail.com	starter	Active	N/A	â‚¹0	0	21	0
Sameer	rupanasameer551@gmail.com	weekly_boost	Active	8/2/2026(â‚¹1999)	â‚¹1999	105	46	59
Pooja jolly	jollypooja5@gmail.com	starter	Active	12/2/2026(â‚¹999)	â‚¹999	50	26	24
Jaspreet Kaur	jaspreetkaursarao45@gmail.com	weekly_boost	Active	4/2/2026(â‚¹1999)	â‚¹1999	105	66	39
Rohit Kumar	rohitchandolia1243@gmail.com	starter	Active	N/A	â‚¹0	0	1	0
Manjinder	rajveerbrarbrar637@gmail.com	starter	Active	2/2/2026(â‚¹999)	â‚¹999	50	43	7
Tushte	tushte756@gmail.com	starter	Active	N/A	â‚¹0	0	46	0
HARDEEP KAUR	preetman00001@gmail.com	starter	Active	N/A	â‚¹0	0	16	0
Komal	goldymahi27@gmail.com	weekly_boost	Active	5/2/2026(â‚¹1999)	â‚¹1999	105	44	61
Swati	sainsachin737@gmail.com	supervisor	Active	11/2/2026(â‚¹1999)	â‚¹1999	105	14	91
ranjodh singh	ranjodhmomi@gmail.com	supervisor	Active	4/2/2026(â‚¹1999)	â‚¹1999	105	39	66
Rahul Rai	rrai26597@gmail.com	weekly_boost	Inactive	N/A	â‚¹0	0	6	0
Rahul kumar	rahulkumarrk1111@gmail.com	supervisor	Inactive	N/A	â‚¹0	0	6	0
Loveleen	loveleensharma530@gmail.com	starter	Active	3/2/2026(â‚¹999)	â‚¹999	50	42	8
MOHIT LUDHRANI	ludhranimohit91@gmail.com	weekly_boost	Active	3/2/2026(â‚¹1999)	â‚¹1999	105	71	34
Harpreet kaur	harpreetk61988@gmail.com	supervisor	Active	4/2/2026(â‚¹1999)	â‚¹1999	105	27	78
Gurteshwar Singh	gurteshwargill098@gmail.com	supervisor	Active	5/2/2026(â‚¹1999)	â‚¹1999	105	25	80
Prabhjot kaur	pjot10096@gmail.com	supervisor	Inactive	N/A	â‚¹0	0	13	0
PARAMJIT KAUR	paramjitkaur20890@gmail.com	starter	Active	4/2/2026(â‚¹999)	â‚¹999	50	34	16
Tanu Dhawan	dhawantanu536@gmail.com	manager	Active	13/2/2026(â‚¹2999)	â‚¹2999	160	44	116
Gurpreet kaur	gjama1979@gmail.com	starter	Active	10/2/2026(â‚¹999)	â‚¹999	50	33	17
Dinesh Monga	dineshmonga22@gmail.com	supervisor	Inactive	N/A	â‚¹0	0	30	0
Amritpal Kaur	amritpalkaursohi358@gmail.com	weekly_boost	Active	3/2/2026(â‚¹1999)	â‚¹1999	105	66	39
Arshdeep kaur	arshkaur6395@gmail.com	starter	Active	12/2/2026(â‚¹999) | 12/2/2026(â‚¹1999)	â‚¹1998	100	19	81
Rajbinder	rajbinderkamboj123@gmail.com	supervisor	Inactive	N/A	â‚¹0	0	16	0
Lalit kumar	rasganiya98775@gmail.com	starter	Inactive	N/A	â‚¹0	0	7	0
Gurvinder Matharu	gurvindermatharu061@gmail.com	starter	Inactive	N/A	â‚¹0	0	8	0
Seerat	bamniyareeta57@gmail.om	starter	Inactive	N/A	â‚¹0	0	5	0
Navjot Kaur	knavjotkaur113@gmail.com	starter	Active	9/2/2026(â‚¹999)	â‚¹999	50	18	32
Sandeep Rehaan	sipreet73@gmail.com	starter	Active	9/2/2026(â‚¹999)	â‚¹999	50	28	22
Sonia	bangersonia474@gmail.com	starter	Inactive	N/A	â‚¹0	0	15	0
Bhawna	bhawna1330@gmail.com	starter	Inactive	N/A	â‚¹0	0	12	0
Balraj singh	bs0525765349@gmail.com	supervisor	Active	N/A	â‚¹0	0	37	0
Mandeep kaur	mandeepkau340@gmail.com	manager	Active	7/2/2026(â‚¹2999)	â‚¹2999	160	33	127
VEERPAL KAUR	surjitsingh1067@gmail.com	weekly_boost	Active	4/2/2026(â‚¹1999)	â‚¹1999	105	65	40
Mandeep kaur	mandeepbrar1325@gmail.com	weekly_boost	Active	1/2/2026(â‚¹999) | 2/2/2026(â‚¹1999)	â‚¹2998	155	87	68
MUSKAN	muskanchopra376@gmail.com	starter	Active	13/2/2026(â‚¹999)	â‚¹999	50	18	32
Naina Nawani	navaninaina@gmail.com	starter	Inactive	N/A	â‚¹0	0	4	0
Shivani	sandhu16shivani@gmail.com	starter	Active	N/A	â‚¹0	0	17	0
Jashandeep kaur	jk419473@gmail.com	turbo_boost	Active	3/2/2026(â‚¹2499)	â‚¹2499	98	72	26
Yuail arian	aryansandhu652@gmail.com	starter	Active	13/2/2026(â‚¹999)	â‚¹999	50	9	41
Kanchan sharma	sharmaanjali93962@gmail.com	starter	Active	5/2/2026(â‚¹999)	â‚¹999	50	30	20
Test	test@gmail.com	starter	Active	N/A	â‚¹0	0	2	0
Navjot kaur	rajbirsingh97843@gmail.com	starter	Inactive	N/A	â‚¹0	0	10	0
Lakhveer kaur	lakhveerkaur219@gmail.com	starter	Active	N/A	â‚¹0	0	51	0
Kirandeep kaur	kirandeepkaur7744@gmail.com	starter	Inactive	N/A	â‚¹0	0	20	0
Lovepreet singh	lovepreetsinghvicky05@gmail.com	starter	Active	N/A	â‚¹0	0	2	0
Tanisha	tanishakaur4095@gmail.com	supervisor	Inactive	N/A	â‚¹0	0	4	0
Mandeep kaur	arshrandhawaarshrandhawa29@gmail.com	starter	Active	N/A	â‚¹0	0	2	0
Vinita punjabi	punjabivinita@gmail.com	weekly_boost	Active	6/2/2026(â‚¹1999)	â‚¹1999	105	59	46
Sunita jhatta	jhattasunita@gmail.com	starter	Active	N/A	â‚¹0	0	2	0
Simranpreet kaur	simransidhu792005@gmail.com	starter	Active	N/A	â‚¹0	0	2	0
Kiran	kiran@gmail.com	starter	Active	N/A	â‚¹0	0	23	0
Ajay kumar	ajayk783382@gmail.com	weekly_boost	Active	7/2/2026(â‚¹1999)	â‚¹1999	105	77	28
Akash	dbrar8826@gmail.com	starter	Active	5/2/2026(â‚¹999)	â‚¹999	50	36	14
Palak	palakgharu2025@gmail.com	weekly_boost	Inactive	N/A	â‚¹0	0	3	0
Krishn kumari	kumarikrishna4962@gmail.com	starter	Active	N/A	â‚¹0	0	4	0
Neha	neharajoria1543@gmail.com	starter	Active	15/2/2026(â‚¹999)	â‚¹999	50	11	39
JASPREET	jaspreet@gmail.com	starter	Active	N/A	â‚¹0	0	23	0
Lovepreet singh	lovepreetsinghvicky05@gamil.com	starter	Active	N/A	â‚¹0	0	2	0
Swinky	swinkychiku@gmail.com	starter	Active	N/A	â‚¹0	0	2	0
Anita	neetteji@gmail.com	supervisor	Inactive	N/A	â‚¹0	0	9	0
Suman	sumansumankaur09@gmail.com	starter	Active	9/2/2026(â‚¹999) | 12/2/2026(â‚¹1999)	â‚¹1998	100	52	48
SAMAN	samandeepkaur1216@gmail.com	weekly_boost	Active	14/2/2026(â‚¹1999)	â‚¹1999	105	76	29
Akshmala	akshmala8550@gmail.com	starter	Inactive	N/A	â‚¹0	0	5	0
Kamal kaur	ks6485422@gmail.com	supervisor	Inactive	N/A	â‚¹0	0	26	0
Rohit Kumar	rohitgagneja69@gmail.com	weekly_boost	Active	4/2/2026(â‚¹1999)	â‚¹1999	105	71	34
Punam	kalyanj739@gmail.com	starter	Active	N/A	â‚¹0	0	2	0
Shivani Gupta	shivanigupta0276@gmail.com	starter	Active	N/A	â‚¹0	0	2	0
Sohan singh	singhsohan58857@gmail.com	starter	Active	N/A	â‚¹0	0	2	0
Sunaina Rani	sunainakambojk@gmail.com	supervisor	Inactive	N/A	â‚¹0	0	15	0
Harmandeep kaur	harmandeepkaurmanes790@gmail.com	manager	Active	13/2/2026(â‚¹2999)	â‚¹2999	160	59	101
Harwinder kaur	manatsingh5600@gmail.com	starter	Inactive	N/A	â‚¹0	0	13	0
Simran	ashok376652@gmail.com	supervisor	Active	5/2/2026(â‚¹1999)	â‚¹1999	105	39	66
Prabhjeet kaur	kaurdeep06164@gmail.com	supervisor	Active	6/2/2026(â‚¹1999)	â‚¹1999	105	37	68
Jasnoor Kaur	sranjasnoor11@gmail.com	supervisor	Active	2/2/2026(â‚¹1999)	â‚¹1999	105	56	49
Baljeet kaur	diljots027@gmail.com	starter	Inactive	N/A	â‚¹0	0	6	0
Nazia Begam	ziana4383@gmail.com	weekly_boost	Active	4/2/2026(â‚¹1999)	â‚¹1999	105	73	32
Rajveer kaur	rajveerkhattra9999@gmail.com	starter	Active	3/2/2026(â‚¹999)	â‚¹999	50	37	13
Ramandeep Kaur	ramansransran6@gmail.com	supervisor	Inactive	N/A	â‚¹0	0	31	0
Jashandeep Kaur	jashandeepkaur6444@gmail.com	starter	Active	4/2/2026(â‚¹999)	â‚¹999	50	37	13
Harpreet Kaur	sarojbhatti066@gmail.com	starter	Inactive	N/A	â‚¹0	0	20	0
Jasdeep Kaur	jasdeepsra68@gmail.com	starter	Active	3/2/2026(â‚¹999)	â‚¹999	50	38	12
Himanshu Sharma	sharmahimanshu9797@gmail.com	turbo_boost	Active	N/A	â‚¹0	0	55	0
Mandeep kaur	brarmandeepkaur7@gmail.com	starter	Active	N/A	â‚¹0	0	38	0
Loveleen kaur	loveleenkaur8285@gmail.com	weekly_boost	Active	12/2/2026(â‚¹1999)	â‚¹1999	105	29	76
Shivani	sparklingsoulshivani@icloud.com	starter	Active	N/A	â‚¹0	0	18	0
Manbir Singh	singhmanbir938@gmail.com	supervisor	Active	12/2/2026(â‚¹1999)	â‚¹1999	105	21	84
`.trim();

const lines = manualText.split('\n');
let boosterPendingSum = 0;
let boosterUsedSum = 0;
let boosterCount = 0;

lines.forEach(line => {
    const parts = line.split('\t');
    if (parts.length >= 9) {
        const plan = parts[2].toLowerCase();
        if (plan.includes('boost')) {
            const used = parseInt(parts[7]) || 0;
            const pending = parseInt(parts[8]) || 0;
            boosterPendingSum += pending;
            boosterUsedSum += used;
            boosterCount++;
        }
    }
});

console.log('--- BOOSTER SUM FROM USER MESSAGE TEXT ---');
console.log('Total Booster Rows Parsed:', boosterCount);
console.log('Sum of Booster Leads Used:', boosterUsedSum);
console.log('Sum of Booster Pending:', boosterPendingSum);
