// Cloudflare Pages Function; bind a KV namespace as SITE_VISITORS in Pages settings.
// Anonymous per-tab session IDs expire after 120 seconds without a heartbeat.
// KV is eventually consistent: the count is approximate, not instantaneous.
export async function onRequestPost({ request, env }) {
  const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
  const reply = (data, status = 200) => new Response(JSON.stringify(data), { status, headers });
  if (!env.SITE_VISITORS) return reply({ error: 'Visitor storage not configured' }, 503);
  try {
    const body = await request.json();
    if (typeof body.id !== 'string' || !/^[a-f0-9-]{36}$/i.test(body.id)) return reply({ error: 'Invalid session' }, 400);
    await env.SITE_VISITORS.put('online:' + body.id, '1', { expirationTtl: 120 });
    let online = 0;
    let cursor;
    do {
      const page = await env.SITE_VISITORS.list({ prefix: 'online:', limit: 1000, ...(cursor ? { cursor } : {}) });
      online += page.keys.length;
      cursor = page.list_complete ? undefined : page.cursor;
    } while (cursor && online < 10000);
    return reply({ online });
  } catch (_) { return reply({ error: 'Visitor count unavailable' }, 503); }
}
