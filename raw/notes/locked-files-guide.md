# Locked Files — What They Do and Why Not to Touch Them

## auth/useAuth.tsx (v6.4)

Auth provider + session management.
- `autoRefreshToken: false` is intentional — prevents background token refresh that breaks admin sessions
- Admin sessions expire after ~1hr (known issue, workaround: page reload)
- Uses `getSession()` NOT `getUser()` — getUser() causes 403 on expired tokens
- DO NOT MODIFY without explicit user approval

## supabaseClient.ts (v4.0)

Supabase client configured with Cloudflare proxy.
- Data requests → `api.leadflowcrm.in`
- Auth requests → direct Supabase URL
- This split routing is intentional (ISP bypass)
- DO NOT MODIFY

## App.tsx

Router + PWA cleanup logic.
- Contains service worker cleanup code that is fragile
- Wrong cleanup order = push notifications break for all users
- DO NOT MODIFY

## vite.config.ts

PWA configuration.
- `injectionPoint: undefined` is INTENTIONAL
- Removing this breaks the service worker injection
- DO NOT MODIFY

## src/sw.ts

Service worker for push notifications.
- Handles background push message display
- No localStorage access (service workers don't have it)
- DO NOT MODIFY

## Common Mistakes to Avoid

1. Don't call `supabase.auth.getUser()` — use `getSession()` instead
2. Don't use `localStorage` in service worker context
3. Don't add `autoRefreshToken: true` thinking it's an improvement
4. Don't change proxy URLs in supabaseClient.ts
