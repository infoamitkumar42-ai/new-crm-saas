# ADR-003: Night Backlog System

**Date**: 2025
**Status**: Active (fixed 2026-03-13)

## Decision

Leads arriving between 10PM-8AM IST are NOT assigned immediately.
They are saved with `status = 'Night_Backlog'` and assigned at 10AM.

## Context

Network marketing calls/contacts work best during business hours.
Assigning leads at 2AM means members either miss the notification or call
the prospect at an inappropriate time. Night backlog ensures leads reach
members at the start of business day.

## Implementation

In `meta-webhook` Edge Function:
```typescript
const istHour = new Date().toLocaleString('en-US', {
  timeZone: 'Asia/Kolkata', hour: 'numeric', hour12: false
});

if (parseInt(istHour) >= 22 || parseInt(istHour) < 8) {
  // Night hours — save as backlog
  await supabase.from('leads').insert({ ...leadData, status: 'Night_Backlog' });
} else {
  // Business hours — assign immediately
  const assignee = await getRPCBestAssignee(team_code);
  // ... assign and notify
}
```

## Known Fix (2026-03-13)

Previous bug: status mismatch — webhook saved `'night_backlog'` (lowercase) but
`process-backlog` queried for `'Night_Backlog'`. Fixed by standardizing to `'Night_Backlog'`.

## Cron Schedule

`process-backlog` runs at:
- 10:00 AM IST (main backlog clearance)
- Every 10 minutes (sweeper for any stragglers)
