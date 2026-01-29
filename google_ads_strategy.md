# 🎯 Google Ads Strategy: High Quality Leads (Low Cost)
**Target:** Housewives, Students, Job Seekers
**Goal:** Safe Targeting (No Account Bans) & Auto-Sync to LeadFlow CRM

---

## 🛑 Critical Rules (To Avoid Bans)
Google hates overly aggressive "Get Rich Quick" or "MLM" schemes.
1.  **NEVER Use:** "Work from home", "Easy money", "Get rich", "MLM", "Network Marketing", "Forever Living" in **Ad Text** or **Headlines**.
2.  **USE Instead:** "Digital Project", "Social Media Opportunity", "Part-Time Income", "Start Your Journey", "Business Mentorship".
3.  **Video Content:** Ensure the video doesn't make unrealistic claims (e.g., "Earn ₹1 Lakh in 1 month"). Focus on *learning* and *opportunity*.

---

## 🆚 Critical Decision: Video Action vs. Performance Max (PMax)

**User Question:** *"Should I use PMax? I heard it's good for YouTube."*
**My Recommendation:** **START WITH VIDEO ACTION (VAC) First.**

| Feature | **Video Action (Recommended)** | **Performance Max (PMax)** |
| :--- | :--- | :--- |
| **Control** | High (You pick Audience/Placements) | Low (Google decides everything) |
| **Lead Quality** | **High** (Video filters intent) | **Mixed** (Lots of accidental clicks from Apps/Display) |
| **Safety (Bans)** | **Safer** (Context is clear) | **Risky** (Can show in spammy apps/sites) |
| **Learning** | Works with 0 data | Needs 30+ leads/month to learn |

### 🚀 Why NOT Performance Max **Right Now**?
1.  **Junk Leads:** PMax often dumps budget into "Display Ads" (Mobile Apps/Games) where people click by mistake. You get cheap leads, but they never pick up the phone.
2.  **Black Box:** You won't know *where* your leads are coming from.
3.  **Scale Strategy:** PMax is great for **Scaling** once you have 50-100 leads recorded. Use VAC to build the "Quality Data", then feed that data to PMax later.

---

## 💡 Strategy 1: YouTube Video Action (The "Visual Hook")
**Best for:** Students & Housewives watching content.
**Why:** Cheaper than Search. Visual trust.

### **Audience Segments (Targeting)**
Instead of relying on broad interest, use **Custom Segments** (Intent-based). This targets people searching for these things on Google/YouTube.

#### **A. For Housewives (High Quality)**
*   **Custom Segment Name:** "Housewife Business Interest"
*   **People who search for these terms:**
    *   *cooking recipes (broad but active)*
    *   *tiffin service business ideas*
    *   *parlour course at home*
    *   *small business ideas for ladies*
    *   *work from home for women*
*   **Demographics:** Female, Age 25-45, Parent Status: "Parent" (Optional but good).

#### **B. For Students/Youth (High Volume)**
*   **Custom Segment Name:** "Career & Motivation"
*   **People who browse websites similar to:**
    *   *naukri.com*
    *   *linkedin.com*
    *   *internshala.com*
*   **People who search for:**
    *   *Sandeep Maheshwari* (Motivation)
    *   *Vivek Bindra* (Business)
    *   *Josh Talks*
    *   *Sonu Sharma* (Network Marketing - High Intent!)
    *   *how to earn money online for students* (Careful with this one)
*   **Demographics:** Male/Female, Age 18-24.

---

## 🔍 Strategy 2: Google Search Ads (High Intent)
**Best for:** People actively looking *right now*.
**Why:** Higher quality, slightly higher cost.

### **Safe Keywords (Broad Match Modifier)**
*   `"part time job in [City Name]"`
*   `"online business ideas"`
*   `"start dropshipping india"` (Captures business intent)
*   `"freelance work for beginners"`
*   `"digital marketing career"`

**Avoid Keywords:** "MLM join", "Chain system", "Pyramid scheme".

---

## ⚙️ Campaign Setup: Step-by-Step

### **Step 1: Campaign Creation**
1.  **New Campaign** -> **Leads**.
2.  **Campaign Type:** Video (for YouTube) OR Search.
3.  **Select Goal:** "Lead Form Submission".
4.  **Bidding Strategy:**
    *   Start with **Maximize Conversions** (Let Google find the best people).
    *   Set a **Target CPA** (Cost Per Action) of **₹30** initially. If no leads in 24h, increase to ₹50.

### **Step 2: The Lead Form (Critical for CRM)**
1.  Under "Ads & Assets", create a **Lead Form**.
2.  **Headline:** "Free Mentorship Session".
3.  **Description:** "Learn how to build a digital career. Apply for a callback."
4.  **Questions:** Name, Phone, City (Optional).
5.  **Submission Message:** "Thanks! Our team will call you shortly."

---

## ✍️ High-Converting Ad Copy (Copy-Paste)
**Use these mixed options. Google will test and show the best one.**

### **A. Short Headlines (15 Chars)**
1.  `Digital Project`
2.  `Work Digitally`
3.  `New Opportunity`
4.  `Business Idea`
5.  `Start Today`

### **B. Long Headlines (90 Chars)**
1.  `Turn your scrolling time into a productive digital asset. Step-by-step guidance.`
2.  `Looking for ambitious students & housewives for a new digital project.`
3.  `Build a second income source from home without affecting your current routine.`
4.  `Learn how to start a digital business with zero prior experience.`

### **C. Descriptions (90 Chars)**
1.  `Free mentorship program for beginners. Learn high-income skills from mobile.`
2.  `Join our community of digital entrepreneurs. Flexible hours for students.`
3.  `Don't just watch content, create a future. Apply for a selection call today.`
4.  `No disturbing your job or studies. Work smart on social media.`

---

### **Step 3: Connect to Google Sheets (For Automation)**
1.  In the Lead Form settings, scroll to "Lead Delivery Options".
2.  Click **"Download leads in a Google Sheet"**.
3.  Link your Google Account. It will create a new sheet (e.g., "Google Ads Leads").
4.  **Paste our specific Script** into this sheet (instructions below).

---

## 🔗 Final Connection: Google Sheet → Supabase (CRM)
**Once your campaign is live:**

1.  Open the Google Sheet created by Google Ads.
2.  Go to `Extensions` > `Apps Script`.
3.  Delete any code there.
4.  **Paste the code** I provided (`Google_Ads_Integration.gs`).
5.  Click `Run` > `setupTimeTrigger`.
6.  **Done!**
    *   Google Ad gets Lead -> Puts in Sheet -> Script reads Sheet -> Sends to LeadFlow CRM -> Lead assigned to User.

---

## 💰 Budget Recommendation
*   **Daily Budget:** ₹500 - ₹1,000 (Start small).
*   **Expected CPL (Cost Per Lead):**
    *   YouTube: ₹15 - ₹40
    *   Search: ₹30 - ₹80
