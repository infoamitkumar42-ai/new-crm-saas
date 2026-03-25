# 📊 Lead Counters Full Audit Report

Maine pure database aur codebase ka deeply audit kiya hai (KUCH BHI MODIFY NAHI KIYA HAi). 
Ye rahi aapki answers and root cause analysis.

## 1. COUNTER UPDATE LOCATIONS
Here are the exact locations where counter variables are modified:

- **`total_leads_received`**: 
  - **Increment**: `supabase/migrations/20260313000000_add_increment_user_lead_counters.sql` (Line 23). `COALESCE(total_leads_received, 0) + 1` happens on every new lead assignment via PostgreSQL RPC.
  - **Set/Overwrite**: `functions/api/razorpay-webhook.ts` (Line 148). `total_leads_received: realLeadsCount`. Webhook overwrites this with the historical count during renewal.

- **`total_leads_promised`**:
  - **Set/Overwrite**: `functions/api/razorpay-webhook.ts` (Line 147). `total_leads_promised: newTotalLeadsPromised`.

- **`leads_today`**:
  - **Increment**: `supabase/migrations/..._add_increment_user_lead_counters.sql` (Line 22).
  - **Reset**: `functions/api/razorpay-webhook.ts` (Line 152) resets it to `0` upon payment. (Also likely reset by cron job daily).

---

## 2. PLAN RENEWAL & ACTIVATION LOGIC
**Exact Code Flow in `razorpay-webhook.ts` (Lines 126-148):**
1. **Fetch REAL count**: Webhook runs an API call: `fetch /rest/v1/leads?user_id=eq.${userId}`. (Note: It uses `user_id` column, not `assigned_to`). Gives `realLeadsCount`.
2. **Cumulate Promised**: `newTotalLeadsPromised = realLeadsCount + config.totalLeads`. Example: If `realLeadsCount` was 50, and user buys a 55-lead plan, `total_leads_promised` becomes 105.
3. **Overwrite Received**: `total_leads_received` is set to `realLeadsCount` (e.g. 50).
4. **Conclusion**: The user is correctly promised 55 *new* leads because `105 (promised) - 50 (received) = 55`. **Both values stack cumulatively.**

---

## 3. PLAN CONFIGURATIONS
Based on `PLAN_CONFIG` inside `razorpay-webhook.ts`:
- **Starter**: 55 leads (`price: 999`)
- **Supervisor**: 115 leads (`price: 1999`)
- **Manager**: 176 leads (`price: 2999`)
- **Weekly Boost**: 92 leads (`price: 1999`)
- **Turbo Boost**: 108 leads (`price: 2499`)

---

## 4. MISMATCH REPORT
I ran the `[total_leads_received] vs [actual rows currently in leads table]` query. 
**100% of the 40 active users have a mismatch.**

### Top Mismatches (Counter shows huge number, but Actual Rows are very less/Zero):
1. **samandeepkaur1216@gmail.com** (weekly_boost) | Counter: 296 | Actual: 0 | Promised: 389
2. **princyrani303@gmail.com** (supervisor) | Counter: 215 | Actual: 0 | Promised: 318
3. **gurnoor1311singh@gmail.com** (turbo_boost) | Counter: 214 | Actual: 0 | Promised: 332
4. **surjitsingh1067@gmail.com** (supervisor) | Counter: 198 | Actual: 35 | Promised: 322

*Note: Some users have NEGATIVE mismatches (Actual > Counter), meaning they were assigned leads manually bypassing the RPC, or webhook reset their counter wrong.*
- **sipreet73@gmail.com** | Counter: 26 | Actual: 130
- **sranjasnoor11@gmail.com** | Counter: 38 | Actual: 143

---

## 5. OVER-QUOTA USERS (Are any users improperly active?)
**Result:** `0 users`. 
Currently, **NO** active users have `total_leads_received >= total_leads_promised`. The `check-quota-expiry` logic is working correctly and successfully deactivating them when they reach the quota.

---

## 6. ROOT CAUSE ANALYSIS (The Core Bugs)

**Bug 1: The "Ghost Leads" Discrepancy (Why actual rows = 0 but counter = 200+)**
`total_leads_received` is a **running lifetime integer counter** (incremented via RPC). However, when old leads are deleted, rejected, or re-assigned to another user via the dashboard, the original user's `total_leads_received` counter **IS NEVER DECREMENTED**. Hence, historical counters will forever diverge from current `COUNT(l.id)`.

**Bug 2: Webhook uses `user_id` instead of `assigned_to`**
In `razorpay-webhook.ts`:
```typescript
`${supabaseUrl}/rest/v1/leads?user_id=eq.${userId}&select=*&head=true`
```
It counts leads where `user_id` = User's ID. In your database, leads are mapped using `assigned_to`. If `user_id` is null or points to the creator/manager, the webhook will calculate `realLeadsCount` incorrectly during renewal, breaking the cumulative logic.

---

## 7. IMPACT
- **40 out of 40 active users (100%)** are affected by the counter stringently deviating from their actual DB rows. 
- Because the quota check compares `received >= promised`, the system is mathematically still shutting them down at the right time (if they don't get negative mismatches). 
- However, users with negative mismatches (like *sipreet73* and *sranjasnoor11*) have received WAY MORE leads than their counter says, meaning they are getting **free/extra leads** before being deactivated.

---

## 8. RECOMMENDED FIX APPROACH (Action Plan)
*Do not implement anything until you confirm.*

1. **Code Fix (Webhook):** Change `user_id=eq.${userId}` to `assigned_to=eq.${userId}` in `razorpay-webhook.ts` to ensure the true counting of all-time received leads.
2. **Code Fix (Reassignment):** Write an RPC/trigger so that if a lead is manually reassigned or deleted, the old owner's `total_leads_received` decreases by 1, or decouple quota logic from a lifetime counter entirely.
3. **Data Fix (SQL):** We should run a one-time SQL script to mathematically recalculate and hard-set `total_leads_received` to strictly match `actual_rows` for all users, and shift `total_leads_promised` down accordingly so they still have the correct remaining balance.

**Aap batayein kya karna hai? Mismatch Data ko SQL se fix karun ya sirf code update karun?**
