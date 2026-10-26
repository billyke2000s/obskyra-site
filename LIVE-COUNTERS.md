# Live counters setup

The homepage has two subtle counters. Both use Cloudflare Pages Functions; **do not expose Twitch client secrets in browser code**.

## Website visitors

1. Create a Cloudflare Workers KV namespace for active sessions.
2. In the Cloudflare Pages project, go to Settings > Bindings and add a KV namespace binding named `SITE_VISITORS`.
3. Redeploy the project. The website calls `/api/site-visitors` every 45 seconds while the tab is visible.

A random ID is held in sessionStorage per tab; no IP addresses are stored by this feature. IDs expire after 120 seconds of inactivity. Because Workers KV is eventually consistent, the number is an **approximate count of active browser tabs**, not an exact count of distinct people. Reloads generally retain the same tab ID.

## Twitch viewers

1. Register an app in the Twitch developer console.
2. In Cloudflare Pages project settings, configure `TWITCH_CLIENT_ID` and `TWITCH_CLIENT_SECRET` as environment variables/secrets (protect the secret).
3. Redeploy. The site checks `/api/twitch-viewers` about once per minute.

When Twitch is offline the badge says OFFLINE. If credentials or backend bindings are missing, badges show UNAVAILABLE rather than fabricated numbers.

**Deployment:** These API routes require Cloudflare Pages Functions support. A static-only deployment or incompatible build pipeline will not serve the endpoints. Test both routes after deploying.
