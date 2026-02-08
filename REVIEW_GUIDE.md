# 🔍 Manual Review Checklist - 73 Users Quota Exceeded

## Executive Summary

After fixing counters, **73 users** have exceeded their quota (`total_leads_received >= total_leads_promised`).

**System is already auto-blocking all 73 users** - they cannot receive new leads.

---

## Review Process

### Step 1: Run Full Analysis

Execute `MANUAL_REVIEW_73_USERS.sql` **STEP 1** to get complete list with:
- Payment count
- Payment dates
- Payment amounts
- Automated decision helper

### Step 2: Categorize Users

Results will show 5 categories:

#### 🔴 MULTIPLE PAYMENTS - LIKELY RENEWED
**Action:** Update `total_leads_promised` to reflect all payments
```sql
-- Example: User paid 3 times for 50-lead plan
UPDATE users 
SET total_leads_promised = 150  -- 3 × 50
WHERE email = 'user@example.com';
```

#### 🟡 HAS PENDING PAYMENT
**Action:** Verify payment status first
1. Check payment gateway
2. Contact user if needed
3. Wait for confirmation
4. **DO NOT proceed until verified**

#### 🟠 RECENT PAYMENT (<7 days)
**Action:** Verify if renewal or first payment
1. Check if quota was already updated
2. If renewal but quota not updated → Update it
3. If first payment → Leave as is

#### 🟢 OLD PAYMENT (30+ days, single)
**Action:** Safe to keep blocked
- User genuinely exhausted quota
- Needs to renew to receive more leads
- No action needed

#### 🟡 MANUAL REVIEW NEEDED
**Action:** Case-by-case review
- Check payment history manually
- Contact user if unclear
- Make informed decision

---

## Step 3: Identify Renewals

Run **STEP 3** from `MANUAL_REVIEW_73_USERS.sql`:

This shows users with `2+` completed payments = **definite renewals**

**For each:**
1. Calculate correct quota: `payments × plan_quota`
2. Update `total_leads_promised`
3. Verify user gets unblocked

---

## Step 4: Get Payment Details

Run **STEP 2** to see complete payment history:
- All payments with dates
- Payment status
- Days since payment

Use this to verify renewal claims.

---

## Critical Rules

### ✅ DO Update Quota If:
- User has 2+ completed payments
- Recent payment is verified renewal
- Payment gateway confirms payment

### ❌ DO NOT Update If:
- Only 1 payment, 30+ days old
- Pending payment unverified
- Unclear payment status

### ⚠️ WAIT Before Action If:
- Pending payments exist
- Recent payment (<7 days) needs verification
- User claims renewal but payment unclear

---

## Sample Update Query

```sql
-- For users who renewed (2+ payments)
UPDATE users 
SET total_leads_promised = [payments_count] * [plan_quota]
WHERE email IN (
    'user1@example.com',  -- 2 payments × 50 = 100
    'user2@example.com'   -- 3 payments × 100 = 300
);
```

---

## Next Steps

1. **Run STEP 1** - Get full list with review status
2. **Review flagged cases** - Focus on 🔴 and 🟡 first
3. **Run STEP 3** - Get definite renewals
4. **Update quotas** - For verified renewals only
5. **Document decisions** - Keep record of actions taken

---

## Important Notes

- System already blocking all 73 users (RPC enforces quota)
- Fixing quota will **auto-unblock** them
- No code changes needed - just data updates
- Be conservative - if unsure, verify first!

---

**Status:** Ready for manual review
**Priority:** High - affects 73 active users
**Risk:** Blocking paying customers if quotas not updated
