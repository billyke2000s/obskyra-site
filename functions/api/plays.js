// Cloudflare Pages Function: total "plays" (visits) counter.
// Needs a D1 database bound to the Pages project as PLAYS_DB.
// The table is created automatically on first use.
//
// GET  /api/plays -> { plays: <total> }            (read only)
// POST /api/plays -> { plays: <total after +1> }   (counts one visit)
//
// The browser only POSTs once per tab session (see js/plays.js), so
// refreshing the page does not add to the total. Nothing about the
// visitor is stored: the table holds a single number.

const HEADERS = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' };
const reply = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: HEADERS });

const CREATE_TABLE =
  'CREATE TABLE IF NOT EXISTS plays (id INTEGER PRIMARY KEY CHECK (id = 1), total INTEGER NOT NULL)';
const INCREMENT =
  'INSERT INTO plays (id, total) VALUES (1, 1) ON CONFLICT(id) DO UPDATE SET total = total + 1 RETURNING total';
const READ = 'SELECT total FROM plays WHERE id = 1';

async function run(db, sql) {
  try {
    return await db.prepare(sql).first();
  } catch (error) {
    if (!/no such table/i.test(String(error && error.message))) throw error;
    await db.prepare(CREATE_TABLE).run();
    return await db.prepare(sql).first();
  }
}

function toCount(row) {
  const total = row ? Number(row.total) : 0;
  return Number.isSafeInteger(total) && total >= 0 ? total : null;
}

export async function onRequestGet({ env }) {
  if (!env.PLAYS_DB) return reply({ error: 'Counter not configured' }, 503);
  try {
    const plays = toCount(await run(env.PLAYS_DB, READ));
    return plays === null ? reply({ error: 'Counter unavailable' }, 503) : reply({ plays });
  } catch (_) {
    return reply({ error: 'Counter unavailable' }, 503);
  }
}

export async function onRequestPost({ request, env }) {
  if (!env.PLAYS_DB) return reply({ error: 'Counter not configured' }, 503);
  // Only accept counts sent by this site's own pages.
  const origin = request.headers.get('Origin');
  if (origin && origin !== new URL(request.url).origin) return reply({ error: 'Forbidden' }, 403);
  try {
    const plays = toCount(await run(env.PLAYS_DB, INCREMENT));
    return plays === null ? reply({ error: 'Counter unavailable' }, 503) : reply({ plays });
  } catch (_) {
    return reply({ error: 'Counter unavailable' }, 503);
  }
}
