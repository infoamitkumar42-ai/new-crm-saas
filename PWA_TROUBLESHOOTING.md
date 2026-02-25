# 🚀 PWA Troubleshooting Guide

## "Loading Workspace" Fix (v6.1)

If users see "Loading Workspace..." for more than 5 seconds, the new system (v6.1) automatically:
1.  **Stops Waiting:** It cancels the long wait.
2.  **Opens App Immediately:** It loads a "Temporary Profile" so the user can see the dashboard.
3.  **Background Sync:** It continues to fetch the real data (Leads/Settings) in the background.

### What users might see
*   **Momentary "0 Leads":** When the app first opens on a slow connection, it might show "0 Leads" for 2-3 seconds.
*   **Auto-Update:** After a few seconds, the real number (e.g., "55 Leads") will pop in automatically.

### If it's still stuck?
1.  Click the **"Force Refresh App"** button (appears after 15s).
2.  Close the app completely and reopen.

### Technical Detail
*   **Old Timeout:** 15s wait x 3 retries = ~45 seconds delay.
*   **New Timeout:** **5 seconds strict.** Instant fallback.
