# OFFER PLAYBOOK — August ₹11/Lead Offer

> **Status: 🟢 LIVE — 2026-08-04 ko apply kiya gaya, Amit ki approval ke baad.**
> Owner: Amit Kumar | Applied: 2026-08-04
> Ye file offer ko **ON aur OFF** dono karne ka exact runbook hai. Baad mein dobara chalana ho to yahi steps repeat karo.
>
> **Abhi kya pending hai:** Cloudflare Pages redeploy (webhook ka naya PLAN_CONFIG live hone ke liye)
> aur uske baad users ko mail. Mail tab tak mat bhejo jab tak ek real payment se
> end-to-end verify na ho jaye.

---

## 1. Offer ka core logic (internal — user ko nahi batana)

User ko dikhta hai: **"Same price, ~2x leads — ₹11/lead"**

Andar ka math: **Fresh leads count bilkul same rehta hai** (jitni aaj hai). Extra leads sirf
**recycled pool** se aati hain — purani Call Back / Contacted / Interested / Follow-up leads jo
**expired/inactive members** ke paas padi hain aur mar chuki hain.

Recycled lead ka ad-cost = **₹0** (wo ad-spend pehle hi ho chuka tha).
Isliye COGS bilkul nahi badhta → **margin same rehta hai**, sirf marketed lead-count double dikhta hai.

| Plan | Price | Fresh (unchanged, ₹11 CPL) | Recycled top-up (₹0) | **Offer Total** | Aaj ka Total | Real COGS |
|---|---|---|---|---|---|---|
| Starter | ₹999 | 45 | +45 | **90** | 50 | ₹495 (same) |
| Supervisor | ₹1,499 | 70 | +66 | **136** | 80 | ₹770 (same) |
| Weekly Boost | ₹1,999 | 84 | +97 | **181** | 92 | ₹924 (same) |

Manager + Turbo Boost — **offer se bahar** (kam bikte hain: 13 aur 17 sales lifetime).
Top 3 sellers hi liye gaye hain: Starter 182 sales, Weekly Boost 91, Supervisor 80.

**UI/UX rule:** Recycled leads user ko bilkul normal leads jaisi dikhengi. RPC already
`status='Fresh'` set karta hai aur `notes` clear kar deta hai. DB mein internal record
(`lead_type='recycled'`, `original_user_id`, `original_status`, `recycle_count`) rehta hai —
wo user ko kabhi dikhta nahi hai.

---

## 2. ⛔ BLOCKER — recycle engine abhi 0 leads deta hai

Engine poora bana hua hai, lekin **`assign_recycled_leads` RPC live mein 0 rows return karta hai.**
Cron ON karne se kuch nahi hoga — silently zero assign hoga aur offer under-deliver kar jayega.

**Root cause:** RPC ka Gujarat-exclusion filter NULL-unsafe hai:

```sql
AND NOT (l.state ILIKE '%gujarat%' OR l.city ILIKE '%gujarat%' OR ...)
```

Agar `l.state` NULL ho to `NULL ILIKE '...'` = NULL → poora `NOT (...)` = NULL → row **excluded**.

**Verified:** eligible pool ke **saare 1,046 leads mein `state` NULL hai** (in purani leads mein
state column populate hi nahi hua tha). Isliye pool = 0.

**Fix (1 line, COALESCE add karna):**

```sql
AND NOT (COALESCE(l.state,'') ILIKE '%gujarat%' OR COALESCE(l.city,'') ILIKE '%gujarat%'
      OR COALESCE(l.city,'') ILIKE '%ahmedabad%' OR COALESCE(l.city,'') ILIKE '%surat%'
      OR COALESCE(l.city,'') ILIKE '%vadodara%'  OR COALESCE(l.city,'') ILIKE '%rajkot%'
      OR COALESCE(l.city,'') ILIKE '%vapi%'      OR COALESCE(l.city,'') ILIKE '%deesa%'
      OR COALESCE(l.city,'') ILIKE '%gandhinagar%' OR COALESCE(l.city,'') ILIKE '%baroda%')
```

Fix ke baad pool: **1,041 leads** (baaki sab filters same rakhte hue).

---

## 3. Recycle pool ki asli capacity (ye limit hai — dhyan se)

Verified counts (NULL-safe filter ke saath, `recycle_count<=1`, valid phone):

### ✅ LOCKED POOL (Amit ne 2026-08-04 ko confirm kiya)

Base pool **+ July ki saari teams ki Call Back leads**:

| Source | Leads |
|---|---|
| A. 2–6 mahine purani (Call Back/Contacted/Interested/Follow-up), inactive owner, 3 teams | 1,041 |
| B. July Call Back — **ECO@WIN12** | 60 |
| C. July Call Back — **TEAMFIRE** | 39 |
| **TOTAL POOL** | **1,140** |

Ye sab leads un members ke paas thi jo ab **inactive / expired** hain — yaani mari hui hain,
koi unpe kaam nahi kar raha.

⚠️ **13 July Call Back leads exclude ki gayi hain** — wo abhi bhi **active members**
(Jasnoor, Gurdeep type) ke paas hain aur unka follow-up live chal raha hai. RPC ka guard
(`u.is_active = false OR u.payment_status IN ('expired','inactive')`) inhe apne aap
chhod deta hai. Include karna ho to alag se bolna padega — double-calling ka risk hai.

### Baaki options (agar aage aur inventory chahiye)

| Pool option | Leads |
|---|---|
| D. Any age + inactive owner, 3 teams | 1,996 |
| E. Any age + inactive owner, sabhi teams | 2,364 |

**Kitne buyers handle kar sakte hain (Pool = 1,140 ke hisaab se):**

| Plan | Recycled/buyer | Max buyers |
|---|---|---|
| Starter | 45 | ~25 |
| Supervisor | 66 | ~17 |
| Weekly Boost | 97 | ~11 |

➡️ **Mixed ~22 buyers tak safe hai.** Usse zyada bike to pool sookh jayega aur baad wale
buyers ko promised quota nahi milega. Agar 2-din ki window mein 22+ expected hain to
Pool D (1,996) pe jaana padega.

### RPC mein kya badlega is pool ke liye

Age-window condition ko widen karna hoga taaki July Call Back leads bhi aa sakein:

```sql
-- PEHLE (sirf 2-6 mahine purani):
AND l.created_at > NOW() - INTERVAL '6 months'
AND l.created_at < NOW() - INTERVAL '2 months'
AND u.team_code IN ('TEAMFIRE','TEAMSIMRAN','TEAMRAJ')

-- BAAD MEIN (2-6 mahine purani  OR  July ki Call Back, sabhi teams):
AND (
     (    l.created_at > NOW() - INTERVAL '6 months'
      AND l.created_at < NOW() - INTERVAL '2 months'
      AND u.team_code IN ('TEAMFIRE','TEAMSIMRAN','TEAMRAJ') )
  OR (    l.status = 'Call Back'
      AND (l.created_at AT TIME ZONE 'Asia/Kolkata') >= '2026-07-01'
      AND (l.created_at AT TIME ZONE 'Asia/Kolkata') <  '2026-08-01' )
)
```

Baaki saare guards (inactive owner, recycle_count, phone valid, Gujarat exclude,
self-dedupe) **bilkul waise ke waise** rahenge.

---

## 4. ⚠️ Daily limit vs total leads — decision chahiye

Plans quota-based hain, lekin advertised **duration** ke andar itni leads deliver karne ke liye
daily limit badhani padegi:

| Plan | Offer total | Advertised duration | Aaj daily_limit | Chahiye/din |
|---|---|---|---|---|
| Starter | 90 | 10 din | 5 | **9** |
| Supervisor | 136 | 12 din | 6 | **11** |
| Weekly Boost | 181 | 7 din | 12 | **26** |

Do raaste:
- **(a) daily_limit badhao** — duration advertised jaisa hi rahega (recommended, honest)
- **(b) daily_limit same rakho** — leads milengi poori, par zyada din lagenge
  (Starter 90 leads @5/din = 18 din, jabki poster pe "10 Days" likha hai) ❌ complaint risk

**Recommendation: (a)** — poster pe jo duration likha hai wo actually deliver ho.

---

## 5. Kya-kya change hoga (full list)

### DB (SQL — approval ke baad)
| # | Object | Change | Reversible? |
|---|---|---|---|
| 1 | `assign_recycled_leads` RPC | NULL-safe COALESCE fix | Ye **permanent bugfix** hai, offer ke saath revert nahi hoga |
| 2 | `system_config.offer_config` | **NAYA row** — master ON/OFF switch + offer numbers | Row delete = OFF |
| 3 | `system_config.plan_fresh_config` | fresh/recycled daily counts update | Backup se restore |
| 4 | `plan_config` table | starter/supervisor/weekly_boost ke `total_leads`, `daily_leads` | Backup se restore |
| 5 | Cron job 22 `recycled-afternoon-batch` | `active: false → true` | Wapas false |

**Koi schema change nahi** — na koi column add/remove, na table alter. Sirf data rows.

### Code (PR ke through)
| File | Change |
|---|---|
| `functions/api/razorpay-webhook.ts` | `PLAN_CONFIG` — 3 plans ke `totalLeads`, `dailyLeads`, `fresh_count`, `recycled_count` |
| `components/Subscription.tsx` | 3 plan cards pe offer numbers + "AUGUST OFFER" badge |
| `components/OfferBanner.tsx` | **NAYA** — dashboard banner |
| `views/MemberDashboard.tsx` | Banner mount karna (1 line) |
| `views/Landing.tsx` | Public pricing section ke numbers |

**LOCKED files ko haath nahi lagega:** `useAuth.tsx`, `supabaseClient.ts`, `App.tsx`,
`vite.config.ts`, `src/sw.ts` — sab untouched.

---

## 6. Existing users pe asar — ZERO

- `PLAN_CONFIG` sirf **naye payments** pe apply hota hai (webhook payment ke waqt padhta hai).
- Jo users ka plan already active hai, unka `total_leads_promised` **bilkul nahi badlega**.
- Recycler sirf un users ko chhuta hai jinka `recycled_leads_quota > recycled_leads_received`.
  Purane users ka quota 0 hai (2026-06-06 ko zero kiya gaya tha) → wo automatically skip honge.
- Recycled leads **kabhi bhi active member se nahi cheeni jaati** — RPC mein hard guard hai
  (`u.is_active = false OR u.payment_status IN ('expired','inactive')`).

---

## 7. BACKUP PLAN (offer apply karne se PEHLE)

```sql
-- Backup table banao (ek hi table mein sab kuch, timestamped)
CREATE TABLE IF NOT EXISTS offer_backup_20260804 AS
SELECT 'plan_config' AS src, to_jsonb(t) AS data FROM plan_config t
UNION ALL
SELECT 'system_config', to_jsonb(t) FROM system_config t
UNION ALL
SELECT 'cron_job_22', to_jsonb(t) FROM cron.job t WHERE jobid = 22;

-- Verify
SELECT src, count(*) FROM offer_backup_20260804 GROUP BY src;
```

Code side: current state git mein already commit hai (`c206078`), toh revert ke liye
`git revert <offer-commit-sha>` kaafi hai.

---

## 8. OFFER ON — steps (2026-08-04 ko ye sab ho chuka hai)

```
☑ 1. Backup table offer_backup_20260804 banaya (RPC ki purani definition bhi usi mein)
☑ 2. RPC fix apply — pool 0 → 1,140 verified
☑ 3. system_config.plan_fresh_config update (fresh/recycled daily split)
☑ 4. plan_config update (total_leads + daily_leads + max_replacements)
☑ 5. Edge function assign-recycled-leads v12 deploy (OFFER_MODE=true, verify_jwt:false)
☑ 6. Code push (UI + banner + webhook PLAN_CONFIG)
☑ 7. Live test — 8 leads assign hui, sab verified (neeche section 12)
☑ 8. Cron job 22 activate (roz 3:30 PM IST)
□ 9. Cloudflare Pages redeploy  ← ZAROORI, warna webhook purana quota dega
□ 10. Ek real payment se end-to-end verify
□ 11. Tabhi mail bhejo users ko
```

## 9. OFFER OFF — steps (jab Amit bole)

```
□ 1. Cron job 22 band karo:
       SELECT cron.alter_job(22, active := false);
       -- NOTE: `UPDATE cron.job SET active=false` kaam NAHI karta (permission denied)

□ 2. plan_config restore:
       UPDATE plan_config SET total_leads=50,  daily_leads=5,  max_replacements=5  WHERE plan_name='starter';
       UPDATE plan_config SET total_leads=80,  daily_leads=7,  max_replacements=10 WHERE plan_name='supervisor';
       UPDATE plan_config SET total_leads=92,  daily_leads=12, max_replacements=8  WHERE plan_name='weekly_boost';

□ 3. system_config.plan_fresh_config restore backup se:
       UPDATE system_config s SET config_value = (b.data->>'config_value')::jsonb
       FROM offer_backup_20260804 b
       WHERE s.config_key='plan_fresh_config'
         AND b.src='system_config' AND b.data->>'config_key'='plan_fresh_config';

□ 4. Code side (ek PR mein):
       - config/offer.ts               → OFFER_ACTIVE = false
       - functions/api/razorpay-webhook.ts → PLAN_CONFIG mein commented NORMAL values wapas
       - supabase/functions/assign-recycled-leads/index.ts → OFFER_MODE = false (+ redeploy)
       - views/Landing.tsx             → 50/80 counts + "Fresh Leads/Day" wording wapas

□ 5. Cloudflare Pages redeploy

□ 6. Verify: Subscription page pe 50/80/92 wapas dikhe, dashboard banner gayab ho,
     aur `SELECT active FROM cron.job WHERE jobid=22` → false
```

⚠️ **Jo users offer ke dauraan khareed chuke honge unka quota nahi chhinega** — unka
`total_leads_promised` already set ho chuka hoga, wo poori leads paayenge. Sirf naye
buyers ko normal plan milega. Ye jaan-boojh kar aisa hai (paid promise honour karna).

⚠️ **`daily_limit` ka side effect:** `trg_sync_user_plan_fields` trigger har user-row
UPDATE par `plan_config.daily_leads` se `daily_limit` sync karta hai. Isliye offer ON
karte hi maujooda starter users ka daily_limit 5 → 9 ho jata hai (unka total quota 50
wahi rehta hai, bas roz zyada leads mil sakti hain). Offer OFF karne par step 2 ke baad
ye apne aap wapas 5 ho jayega — alag se kuch nahi karna.

⚠️ **Jo users offer ke dauraan khareed chuke honge unka quota nahi chhinega** — unka
`total_leads_promised` already set ho chuka hoga, wo poori leads paayenge. Sirf naye
buyers ko normal plan milega. Ye jaan-boojh kar aisa hai (paid promise honour karna).

---

## 10. Poster ke liye GPT/Image prompt

```
Create a premium, eye-catching promotional poster for an Indian SaaS lead-generation
product called "LeadFlow CRM". Portrait format, 4:5 aspect ratio (1080x1350).

HEADLINE (largest element, top): "AUGUST MEGA OFFER"
SUBHEAD directly below: "Same Price. Double Leads."
A bold circular starburst badge on the top-right corner reading: "ONLY ₹11 PER LEAD"

MAIN CONTENT — three glassmorphic pricing cards in a vertical stack, each showing a
plan with the OLD lead count struck through in grey and the NEW count in large bold
green with an upward arrow:
  Card 1 — "STARTER"       ₹999   |  50 leads (struck out) → 90 LEADS
  Card 2 — "SUPERVISOR"    ₹1,499 |  80 leads (struck out) → 136 LEADS   [ribbon: MOST POPULAR]
  Card 3 — "WEEKLY BOOST"  ₹1,999 |  92 leads (struck out) → 181 LEADS   [ribbon: BEST VALUE]

BOTTOM STRIP: an urgency bar in bright amber/red with a small clock icon reading
"OFFER VALID FOR 2 DAYS ONLY — GRAB IT NOW"
Below that, small clean footer text: "www.leadflowcrm.in"

STYLE: modern Indian fintech/SaaS aesthetic. Deep indigo-to-violet gradient background
with subtle light streaks and soft sparkles. Glassmorphism cards with soft white borders
and gentle drop shadows. High contrast, premium feel, similar polish to Razorpay or
CRED marketing creatives. Bold geometric sans-serif typography (Poppins / Montserrat style).
Accent colours: electric blue, violet, and gold. Leave clean breathing space — not cluttered.
No stock photos of people. No spelling errors. All text must be crisp and perfectly legible.
```

---

## 11. Decisions (Amit ne 2026-08-04 ko confirm kiye)

1. **Pool:** base + July ki saari teams ki Call Back leads = **1,140** ✅
2. **daily_limit:** badhaya — starter 9, supervisor 11, weekly_boost 26 ✅
3. **Offer window:** 2 din (`endsAt` = 2026-08-06 23:59 IST, `config/offer.ts` mein) ✅
4. **Banner:** countdown timer ke saath, dismiss button bhi ✅
5. **Recycled leads ka timestamp:** user ko aaj ka dikhna chahiye ✅
   → RPC `assigned_at = NOW()` set karta hai aur UI (`MemberDashboard.tsx:1271`)
     `assigned_at` hi display karta hai, `created_at` nahi. Isliye ye pehle se hi
     sahi kaam karta hai — koi change nahi chahiye tha.
   → **`created_at` ko deliberately haath nahi lagaya.** Wahi asli record hai jisse
     duplicate-detection, "kis date ki leads" wali audit queries, CAPI event_time
     aur khud recycler ka age-window chalta hai. Overwrite karne se ye sab tootta.

---

## 12. Live test result (2026-08-04, 16:02 IST)

Recycler manually chalaya gaya cron ON karne se pehle:

```json
{"success":true,"users_processed":3,"leads_assigned":8,
 "details":[{"user":"kaurgurmeet0418@gmail.com","plan":"starter","assigned":4},
            {"user":"sranjasnoor11@gmail.com","plan":"starter","assigned":4}]}
```

| Verification | Result |
|---|---|
| UI pe dikhne wala time (`assigned_at`) | 08-04 16:02 — aaj ka ✅ |
| Asli `created_at` (internal) | 20–23 July — surakshit ✅ |
| `status` | `Fresh` ✅ |
| Purane owner ke `notes` | Clear ho gaye ✅ |
| Purane owner | Manav, Goldy, Arsh, Sandeep — **sab inactive** ✅ |
| Kis pool se aayi | July Call Back leads ✅ |
| Counter drift (dono users) | **0** ✅ |
| Himanshu | 0 leads (recycled_quota=0) — sahi ✅ |

Pool ab: 1,140 − 8 = **1,132 baaki**.
