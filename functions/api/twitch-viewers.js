// Cloudflare Pages Function. Set TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET
// as encrypted environment secrets in your Pages project settings.
export async function onRequestGet({ env }) {
  const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=30, s-maxage=60' };
  const respond = (body, status = 200) => new Response(JSON.stringify(body), { status, headers });
  if (!env.TWITCH_CLIENT_ID || !env.TWITCH_CLIENT_SECRET) return respond({ error: 'Twitch credentials not configured' }, 503);
  try {
    const tokenResponse = await fetch('https://id.twitch.tv/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: env.TWITCH_CLIENT_ID,
        client_secret: env.TWITCH_CLIENT_SECRET,
        grant_type: 'client_credentials'
      })
    });
    if (!tokenResponse.ok) return respond({ error: 'Twitch authentication failed' }, 502);
    const token = await tokenResponse.json();
    const response = await fetch('https://api.twitch.tv/helix/streams?user_login=obskyra', {
      headers: { 'Client-ID': env.TWITCH_CLIENT_ID, Authorization: 'Bearer ' + token.access_token }
    });
    if (!response.ok) return respond({ error: 'Twitch stream lookup failed' }, 502);
    const result = await response.json();
    const stream = result.data?.[0];
    return respond(stream ? { live: true, viewers: stream.viewer_count } : { live: false, viewers: 0 });
  } catch (_) {
    return respond({ error: 'Twitch temporarily unavailable' }, 502);
  }
}
