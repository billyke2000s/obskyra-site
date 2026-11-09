// Cloudflare Pages Function: is Obskyra live on Twitch, and how many are watching?
// Set TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET as encrypted secrets in the
// Pages project settings. Without them this returns 503 and the badge stays hidden.

const CHANNEL = 'obskyra';
const CACHE_SECONDS = 60;

// Twitch app tokens last weeks, so reuse one while this worker instance is alive
// instead of asking Twitch for a new token on every request.
let cachedToken = null;
let cachedTokenExpiry = 0;

const respond = (body, status = 200, maxAge = 0) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': maxAge ? `public, max-age=${maxAge}` : 'no-store'
    }
  });

async function getToken(env, forceNew = false) {
  if (!forceNew && cachedToken && Date.now() < cachedTokenExpiry) return cachedToken;
  const response = await fetch('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: env.TWITCH_CLIENT_ID,
      client_secret: env.TWITCH_CLIENT_SECRET,
      grant_type: 'client_credentials'
    })
  });
  if (!response.ok) throw new Error('Twitch authentication failed');
  const data = await response.json();
  if (typeof data.access_token !== 'string') throw new Error('Twitch returned no token');
  cachedToken = data.access_token;
  // Renew a minute early; fall back to one hour if Twitch omits expires_in.
  const lifetime = Number.isFinite(data.expires_in) ? data.expires_in : 3600;
  cachedTokenExpiry = Date.now() + Math.max(0, lifetime - 60) * 1000;
  return cachedToken;
}

async function lookupStream(env, token) {
  return fetch(`https://api.twitch.tv/helix/streams?user_login=${CHANNEL}`, {
    headers: { 'Client-ID': env.TWITCH_CLIENT_ID, Authorization: `Bearer ${token}` }
  });
}

export async function onRequestGet({ request, env, waitUntil }) {
  if (!env.TWITCH_CLIENT_ID || !env.TWITCH_CLIENT_SECRET) {
    return respond({ error: 'Twitch credentials not configured' }, 503);
  }

  // Share one Twitch lookup per minute between all visitors at this location.
  const cache = typeof caches !== 'undefined' ? caches.default : null;
  const cacheKey = new Request(new URL('/api/twitch-viewers', request.url).toString(), { method: 'GET' });
  if (cache) {
    const hit = await cache.match(cacheKey);
    if (hit) return hit;
  }

  try {
    let response = await lookupStream(env, await getToken(env));
    if (response.status === 401) response = await lookupStream(env, await getToken(env, true));
    if (!response.ok) return respond({ error: 'Twitch stream lookup failed' }, 502);

    const result = await response.json();
    const stream = Array.isArray(result.data) ? result.data[0] : undefined;
    const body = stream && Number.isSafeInteger(stream.viewer_count)
      ? { live: true, viewers: stream.viewer_count }
      : { live: false, viewers: 0 };

    const fresh = respond(body, 200, CACHE_SECONDS);
    if (cache) waitUntil(cache.put(cacheKey, fresh.clone()));
    return fresh;
  } catch (_) {
    return respond({ error: 'Twitch temporarily unavailable' }, 502);
  }
}
