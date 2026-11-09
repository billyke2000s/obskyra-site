# Live counters

The homepage has two optional live features. Both run as Cloudflare Pages Functions (the `functions/` folder) and both stay **hidden** if they aren't set up or can't be reached, so the page never shows an error.

## Play counter (holographic "PLAYED" sticker on the photo card)

- Shows the total number of visits as `PLAYED 000,000` between the name and "STREAMER + VLOGGER".
- Each browser tab counts once (`sessionStorage` key `obskyra-played`), so refreshing doesn't add to the total.
- Only browsers that run JavaScript are counted, so most bots and crawlers aren't.
- The database holds a single number. Nothing about the visitor is stored.
- The foil follows the mouse on desktop, shimmers on its own on touch screens, and stays still when "reduce motion" is on.

Setup (once):

1. Cloudflare dashboard → Storage & databases → D1 → create a database (for example `obskyra-plays`).
2. Workers & Pages → `obskyra-site` → Settings → Bindings → add a **D1 database** binding named `PLAYS_DB` pointing at it. Add it for Production and Preview.
3. Redeploy. The `plays` table is created automatically on the first visit.

Free-plan headroom: one write per visit; D1's free plan allows 100,000 rows written per day (checked November 2026).

Known limit: the count can be inflated by someone deliberately calling `POST /api/plays` repeatedly. Cross-site requests are rejected, but scripts can still do it.

To change the number (for example to reset it), open the database's console in the Cloudflare dashboard and run `UPDATE plays SET total = 0 WHERE id = 1;`.

## Twitch live badge (under "Watch on Twitch")

- Shows `LIVE ON TWITCH / N WATCHING` with a red dot when live, or `TWITCH / OFFLINE` otherwise.
- Checks once a minute while the tab is visible. Results are cached for 60 seconds so all visitors share one Twitch lookup, and the Twitch login token is reused rather than requested every time.

Setup (once):

1. Register an application at <https://dev.twitch.tv/console/apps> (OAuth redirect URL can be `http://localhost`; category "Website Integration").
2. Workers & Pages → `obskyra-site` → Settings → Variables and Secrets → add `TWITCH_CLIENT_ID` and `TWITCH_CLIENT_SECRET` (type **Secret**). Never put the secret in browser code or commit it.
3. Redeploy.

## Testing locally

```sh
npx wrangler pages dev . --d1 PLAYS_DB=local-plays --binding TWITCH_CLIENT_ID=... --binding TWITCH_CLIENT_SECRET=...
```

Then check `http://localhost:8788/api/plays` and `/api/twitch-viewers`.
