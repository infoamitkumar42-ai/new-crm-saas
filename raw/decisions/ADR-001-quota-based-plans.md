# ADR-001: Quota-Based Plan Expiry (Not Time-Based)

**Date**: 2025 (original design)
**Status**: Active

## Decision

Plans expire when `total_leads_received >= total_leads_promised`.
NOT when a time period ends. `valid_until` is set to 2099 as placeholder — ignored.

## Context

Network marketing professionals want a guaranteed number of leads, not a time window.
A user on a "starter" plan wants exactly 55 leads — whether that takes 11 days or 20 days.

## Consequences

- Counter accuracy is CRITICAL. Must use `increment_user_lead_counters` RPC atomically.
- Admin cannot set time-based expiry — must manually adjust `total_leads_promised`.
- Plan renewal adds to existing quota (cumulative).
- `daily_limit` column stores TOTAL plan leads (misnamed) — RPC divides by days internally.

## Implementation

```sql
-- Check expiry
SELECT (total_leads_received >= total_leads_promised) AS is_expired
FROM users WHERE id = $user_id;

-- NEVER do this:
UPDATE users SET leads_today = leads_today + 1 WHERE id = $user_id;

-- ALWAYS do this:
SELECT increment_user_lead_counters($user_id);
```
