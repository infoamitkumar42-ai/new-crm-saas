# SNAPCHAT AUTOMATION BRIEF — LeadFlow CRM

> Reference document for the Snapchat → Google Sheet → Cloudflare Worker → Supabase automation.
> Created: 2026-06-08. Update this file if any decision changes.

---

## Overview

Snapchat lead ads → Google Sheet (via Snapchat native integration) → Google Apps Script → Cloudflare Worker → Supabase `assign_lead_round_robin` RPC → round-robin assignment to active users (multi-team).

---

## Architecture

```
Snapchat Lead Ad
    ↓
Google Sheet (Snapchat native integration auto-fills rows)
    ↓
Google Apps Script (polls every 1 min via time-trigger)
    ↓ POST with X-Webhook-Secret header
Cloudflare Worker: snapchat-webhook
    ↓ formId → lead_sources table (server-side team resolution)
    ↓ phone sanitize + validate
    ↓ assign_lead_round_robin RPC (SECURITY DEFINER)
Supabase PostgreSQL
    ↓
trigger_update_user_lead_count (AFTER INSERT) → auto-updates leads_today + total_leads_received
    ↓
trigger_push_notification (AFTER INSERT) → push notification to assigned user
```

---

## Confirmed Decisions

### 1. Routing (source_key = formId)
- `formId` from Snapchat sheet = `source_key` (permanent identifier, never changes).
- `formName` = display label only, not used for routing.
- Routing table: `lead_sources` (source_key PK → team_code).
- New Snapchat form = just add a row to `lead_sources`, zero code change.

### 2. Team Merge Logic
- TEAMFIRE + TEAMSIMRAN are treated as ONE pool.
- `lead_sources.team_code = 'TEAMFIRE,TEAMSIMRAN'` (comma-separated).
- RPC receives `text[]` and uses `team_code = ANY(p_team_codes)`.
- No inter-team priority — one flat round-robin pool.
- Future team merges: just update comma-separated value, no code change.

### 3. Plan Priority
- Use `users.plan_weight DESC` (NOT hardcoded plan_name tierMap).
- `plan_weight` is auto-set by trigger `trg_sync_user_plan_fields` from `plan_config` table.
- New plans added to `plan_config` → weight auto-propagates, zero code change.

### 4. Counter Updates
- RPC does NOT manually update `leads_today` / `total_leads_received`.
- `trigger_update_user_lead_count` (AFTER INSERT on leads) handles this automatically.
- `exec_sql` RPC is NEVER used (security risk + double-count risk).

### 5. form_id Storage
- `leads.form_id` column (already exists) stores the Snapchat formId.
- Enables future reporting/joins by form source.
- RPC param: `p_form_id text`.

### 6. Duplicate Logic (30-day window, Phase 1)
- Same phone in `leads` table within last 30 days → `status = 'Duplicate'`, no assignment.
- Older than 30 days → treat as fresh (re-engagement), normal round-robin.
- Constant `DUPLICATE_WINDOW_DAYS = 30` — change in one place to tune.

### 7. Phone Validation
- Sanitize: strip all non-digits, take last 10 characters.
- Validate: `^[6789]\d{9}$` (Indian mobile numbers).
- Invalid → `status = 'Invalid'`, no assignment, stored for audit.

### 8. City Field
- `customField1` from Snapchat sheet → `city`.
- Hard-coded for Phase 1. Do NOT implement per-form field_map yet.
- Future design note: add `field_map JSONB` column to `lead_sources` for per-form custom field mapping (Phase 2).

### 9. Source String
- Format: `'Snapchat - <formName>'` (e.g., `'Snapchat - Business Opportunity Form'`).
- Stored in `leads.source`.

---

## Database Objects Created

### Table: `lead_sources`
```
source_key   TEXT PK       -- Snapchat formId (permanent)
platform     TEXT          -- 'snapchat', 'meta', 'google' etc.
team_code    TEXT          -- 'TEAMFIRE' or 'TEAMFIRE,TEAMSIMRAN' (comma-sep)
display_name TEXT          -- Human-readable form/page name
is_active    BOOLEAN       -- false = skip this source
created_at   TIMESTAMPTZ
```
RLS: enabled. No policies = anon/auth users have no access. service_role bypasses RLS.

### Function: `assign_lead_round_robin`
```
assign_lead_round_robin(
  p_name       text,
  p_phone      text,
  p_city       text,
  p_source     text,
  p_form_id    text,
  p_team_codes text[]
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
```
Returns: `{ "status": "Assigned|Queued|Duplicate", "lead_id": uuid, "assigned_to": uuid|null }`

### Worker: snapchat-webhook (Cloudflare)
- Separate from meta-webhook (v47 untouched).
- Validates `X-Webhook-Secret` header against env `SNAPCHAT_WEBHOOK_SECRET`.
- Calls Supabase directly with service role key (not through ISP-bypass proxy).

---

## Google Sheet Column Mapping (Snapchat)
| Sheet Column | Maps To |
|---|---|
| `fullName` | `name` |
| `phoneNumber` | `phone` (sanitize + validate) |
| `customField1` | `city` |
| `formId` | `source_key` (for lead_sources lookup) |
| `formName` | `display_name` in source string |

---

## Phase 2 Notes (NOT implemented yet)
- **Re-assign duplicate to original user**: if same phone comes in again AND original user is still active → assign to same user (relationship continuity). Currently: status='Duplicate', not assigned.
- **Per-form field mapping**: `field_map JSONB` column in `lead_sources` for custom column names per Snapchat form.
- **Google Ads / other platforms**: same `lead_sources` table, different `platform` value + separate Worker.

---

## Security Rules
- Team code NEVER trusted from client/sheet — always resolved server-side from `lead_sources`.
- Worker validates secret before processing any payload.
- RPC is SECURITY DEFINER — RLS bypassed internally, but no user data leaks to caller.
- Supabase service role key only in Worker env vars (never exposed to frontend).
