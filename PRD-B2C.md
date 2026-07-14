# PRD (DRAFT v0.1) — LeadFlow B2C / Individual Lead Marketplace

> **Status: DRAFT — brainstorm input ke liye.** Ye final plan NAHI hai. Amit apna research/brainstorm karke jo final decide karega, uske baad v1.0 lock hoga. Har section ke end mein "🤔 Decide Karna Hai" points hain — wahi brainstorm ka agenda hai.
>
> Author: Claude (draft), Owner: Amit Kumar
> Date: 2026-07-13
> Related: PRD.md (existing team-based product), CLAUDE.md

---

## 1. Vision & Positioning

**Ek line mein:** Jo insaan kisi team/manager ke under nahi hai — akela direct-selling agent, chhota business, ya naya networker — wo bhi LeadFlow se qualified leads khareed sake, apni marzi ke budget pe, bina kisi manager ke through aaye.

**Ye kya NAHI hai:** Ye existing team-model (manager → team → round-robin) ka replacement nahi hai. Wo B2B2C engine chalta rahega as-is. Ye ek **parallel revenue stream** hai — same lead-generation engine, naya customer segment, naya packaging.

**Long-term positioning (pichli discussion se):** "Operating system for direct-selling teams" — CRM feature hai, leads feature hai; asli product hai Customer Acquisition + Distribution + Follow-up + Performance ka poora infrastructure. B2C isi ka individual-buyer entry-point hai.

---

## 2. Problem / Market Insight (jo humne discuss kiya)

1. Market mein real demand **sasti leads** ki hai — log ₹10-20/lead tak sochte hain, ₹999 upfront har kisi ke bas ki baat nahi.
2. Bahut se individual agents already agencies/vendors se leads khareedte hain (proven behavior — demand create nahi karni, capture karni hai).
3. Ek hi fresh-exclusive quality sab ko afford nahi hoti → **honest tiering** chahiye: jo sasta chahta hai usko shared/rotation lead milegi, LEKIN clearly labeled — recycled ko "fresh" bol ke bechna nahi hai (JustDial model: ek lead 3-4 buyers ko, sabko pata hai shared hai).
4. Current system mein individual ke liye entry hi nahi hai — signup ke baad bina team_code ke user unrouted pada rehta hai (Parveen kaur case yaad hai — team_code NULL = kabhi lead nahi milti).

---

## 3. Target Personas

| Persona | Kaun | Budget | Kya chahiye |
|---|---|---|---|
| **P1: Solo Networker** | Kisi MLM (FLP/Herbalife/Vestige...) ka independent distributor, koi manager nahi | ₹200–₹1000/mahina | Thodi-thodi leads, roz 1-3, sasti |
| **P2: Serious Individual** | Full-time direct seller, apna chhota downline banana chahta hai | ₹1000–₹3000/mahina | Fresh exclusive leads, current starter-plan jaisi quality |
| **P3: Micro-business** | Local service/coaching/insurance agent type (future) | ₹500–₹2000 | Pay-per-lead, sirf jitni use karega utna paisa |

---

## 4. Product Model — 2 building blocks

### 4.1 Wallet (pay-per-lead ka base)
- User wallet mein paise daalta hai (Razorpay) — minimum top-up hoga (e.g. ₹200, decide karna hai).
- Har lead deliver hone pe wallet se us lead ke tier ka price deduct.
- Wallet balance < next lead price → delivery pause + recharge nudge.
- Wallet = prepaid, refund policy simple: unused balance refundable nahi, sirf lead-replacement policy hai (invalid number = free replacement, jaisa abhi hai).

### 4.2 Lead Tiers (honest labeling — core principle)

| Tier | Kya hai | Exclusivity | Draft price (decide karna hai) |
|---|---|---|---|
| **T1: Exclusive Fresh** | Bilkul nayi Meta lead, sirf isi buyer ko | 1 buyer | ₹35–₹50/lead |
| **T2: Shared Fresh** | Nayi lead, max 3 buyers ko simultaneously | 3 buyers | ₹15–₹20/lead |
| **T3: Rotation/Aged** | 7+ din purani ya pehle kisi aur ko di gayi lead, dobara circulate | 3–4 buyers | ₹8–₹12/lead |

**Non-negotiable rule:** Dashboard pe har lead pe uska tier badge dikhega (Exclusive / Shared / Rotation). Jo becha wahi dikhega. Ye trust hi ye product ka moat hai — agency-market mein sab isi pe cheating karte hain.

---

## 5. User Journey (MVP)

1. **Signup** → role = `individual` (naya concept — na member, na manager). Team_code ki zaroorat hi nahi.
2. **Onboarding** → apni company/niche select (FLP, Herbalife, Vestige, generic work-from-home...), city/state preference (optional filter).
3. **Wallet top-up** → Razorpay, minimum ₹X.
4. **Tier choose** → T1/T2/T3 + daily cap set kare (e.g. max 3 leads/din — overspend protection).
5. **Leads milna shuru** → same dashboard experience jo members ko milta hai (lead card, status tags, notes, lead_details, push notification).
6. **Follow-up + status tags** → Interested/Follow-up/Closed → CAPI signal (existing pipeline reuse).
7. **Wallet khatam** → pause + WhatsApp/push nudge → recharge → resume.

---

## 6. Technical Architecture (existing system pe kaise baithega)

**Principle: naya engine nahi banana — existing engine mein ek naya pool aur ek billing layer.**

### 6.1 Reuse (as-is ya minor tweak)
- `leads` table, `lead_details`, dedup, Invalid/Duplicate handling — as-is.
- `meta-webhook` / `sheet-lead-intake` — as-is (sirf naya routing target).
- Member dashboard UI — largely as-is (individual ke liye wallet widget add).
- Push notifications, CAPI pipeline, Razorpay — as-is.
- Round-robin RPC pattern — adapt (see 6.3).

### 6.2 Naya banana padega
| Component | Kya |
|---|---|
| `wallets` table | user_id, balance_paise, updated_at |
| `wallet_transactions` table | credit/debit ledger — har top-up, har lead-debit, har replacement-credit ka row (audit-proof) |
| `lead_purchases` table | lead_id × buyer_id × tier × price — shared leads mein ek lead ke multiple buyer rows |
| Individual signup flow | role='individual', no team_code, no manager |
| Tier assignment logic | naya "DIRECT pool": jo leads kisi team-campaign ki nahi hain (ya dedicated B2C campaign se aayi hain) wo is pool mein |
| Rotation engine | T3 ke liye: aged/already-delivered leads ko re-circulate karne wala job — **sirf tier-labeled, kabhi fresh bol ke nahi** |
| Wallet-aware distributor | round-robin ki jagah: eligible buyers (balance ≥ price, daily cap left, niche/city match) mein fairness se distribute + atomic debit |

### 6.3 Distribution difference (important design point)
Team model: lead → `get_best_assignee_for_team(team_code)` → 1 user.
B2C model: lead → DIRECT pool → T1 hai to 1 buyer, T2/T3 hai to N buyers (har buyer ka apna `lead_purchases` row + apna debit). `leads.assigned_to` single-FK hai — shared leads ke liye assignment `lead_purchases` mein hogi, `assigned_to` legacy compat ke liye pehla buyer. (Schema change hai → SQL pehle dikhana hoga, approval ke baad hi.)

### 6.4 Lead supply kahan se
- **Phase 1:** Dedicated B2C Meta campaigns (generic "online business opportunity" audience — jo already ₹11 CPL de raha hai). Economics: CPL ₹11–15 vs T1 ₹35-50 (exclusive) ya T2 ₹15×3=₹45 (shared) — dono profitable on paper. **Ye math hi pilot mein validate karna hai.**
- Team-campaigns ki leads B2C mein NAHI jayengi (double-dip risk, quality complaint) — pools bilkul alag.

---

## 7. MVP Scope (Phase 1) vs Later

### MVP (isse zyada kuch nahi)
- [ ] Individual signup + onboarding (company/niche select)
- [ ] Wallet + Razorpay top-up + transaction ledger
- [ ] Sirf **T2 Shared Fresh** ek hi tier se shuru (sabse simple economics, min complexity) — *ya T1? → decide karna hai*
- [ ] DIRECT pool + wallet-aware distribution
- [ ] Dashboard: wallet balance, leads, tier badge
- [ ] Daily cap + auto-pause on low balance
- [ ] 1 dedicated B2C ad campaign

### Explicitly OUT of MVP
- Rotation/T3 engine (recycled inventory system baad mein)
- Multi-company niche-specific campaigns
- WhatsApp AI / auto-qualification / lead scoring
- CRM-only SaaS mode (Phase 2 alag product line)
- Referral/affiliate for individuals

---

## 8. Success Metrics (pilot)

Pichli discussion ka principle: **Repeat purchase > cheap CPL.**

| Metric | Target (draft) |
|---|---|
| Pilot buyers | 20–30 individuals |
| Wallet repeat top-up rate (30 din) | ≥ 40% |
| Lead delivery → complaint rate | < 10% |
| Gross margin per lead (ad cost vs revenue) | ≥ 50% |
| Buyer jo 2nd month bhi active | ≥ 30% |

---

## 9. Risks

1. **Support load** — 100 chhote buyers > 5 bade managers. Self-serve + WhatsApp bot zaroori, warna operationally doob jayenge.
2. **Quality complaints on shared leads** — labeling clear na hui to trust khatam. Mitigation: tier badge + onboarding pe clear expectation-setting.
3. **Cannibalization** — team-model ke members sochenge "main ₹999 kyun doon jab ₹200 wallet se kaam chal jata". Mitigation: pools alag, quality/exclusivity difference clear, aur team-model mein manager-support ka value hai.
4. **Refund/chargeback drama** — chhote ticket size pe log jaldi Razorpay dispute karte hain. Wallet T&C + replacement policy upfront.
5. **Ad-supply dependency** — sari inventory humari ads se; CPL badha to margin gone. Track weekly.

---

## 10. 🤔 Decide Karna Hai (Amit ke brainstorm ka agenda)

1. **Pricing lock:** T1/T2/T3 exact prices? Minimum top-up kitna?
2. **MVP tier:** Ek tier se shuru karein to kaunsa — T2 shared (volume, sasta) ya T1 exclusive (simple, no sharing complexity)?
3. **Niche targeting MVP mein chahiye ya nahi?** (City/company filter pe lead matching complexity badh jati hai — bina iske generic pool sabko same leads)
4. **Rotation (T3) inventory kahan se?** Sirf B2C pool ki purani leads, ya team-pool ki 30+ din purani unconverted leads bhi (unke original buyer ki consent/policy ka sawal)?
5. **Shared lead ka max buyers** — 3 ya 4? (JustDial 3-4 karta hai)
6. **Individual ka dashboard alag view banega ya member-dashboard hi reuse hoga wallet-widget ke saath?**
7. **Launch kaise validate karein** — pehle 20 buyers manually (WhatsApp pe khud onboard karke concierge-style), ya seedha self-serve build?
8. **B2C brand same rahega (LeadFlow) ya alag naam** (leadflowcrm.in pe hi /direct section)?
9. **GST/invoice** — chhote buyers ko invoice chahiye hoga? Compliance check.
10. **Same Meta ad-account ya alag** — B2C campaigns ke liye (risk isolation)?

---

*Next step (agreed process): Amit brainstorm/research → final answers upar ke 10 points pe → PRD v1.0 lock → design (screens + DB schema SQL approval ke saath) → build plan review → build.*
