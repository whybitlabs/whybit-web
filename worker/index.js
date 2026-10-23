/* ============================================================
   whybit. — worker/index.js
   Static site + a tiny pre-order API.
   Every request that isn't /api/* is handed straight to the
   static assets, exactly as before.

   API
     GET  /api/preorder/status   → { open, cap, reserved, left }
     POST /api/preorder          → reserve (or waitlist when full)
     GET  /api/preorder/export   → CSV of every reservation
                                   (header  Authorization: Bearer <ADMIN_KEY>)

   Bindings (wrangler.jsonc): DB (D1), ASSETS.  Secret: ADMIN_KEY.
   If DB isn't bound yet, the API answers { open:false } and the
   form on the home page says "reservations open soon".
   ============================================================ */

const CAP = 20;                       // units in the first batch
const KITS = ['lun-e-rc-kit'];        // what can be reserved (prices announced later)
const MAX_QTY = 2;

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function reservedCount(db) {
  const row = await db.prepare("SELECT COALESCE(SUM(qty),0) AS n FROM preorders WHERE status = 'reserved'").first();
  return row ? Number(row.n) : 0;
}

const clean = (v, max) => String(v ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max);

async function status(env) {
  if (!env.DB) return json({ open: false, cap: CAP, reserved: 0, left: CAP });
  const n = await reservedCount(env.DB);
  return json({ open: true, cap: CAP, reserved: n, left: Math.max(0, CAP - n) });
}

async function reserve(request, env) {
  if (!env.DB) return json({ ok: false, error: 'reservations open soon' }, 503);
  let body;
  try { body = await request.json(); } catch { return json({ ok: false, error: 'send the form as json' }, 400); }

  // honeypot: real people never fill the hidden "company" field
  if (clean(body.company, 100)) return json({ ok: true, status: 'reserved', left: null });

  const f = {
    name: clean(body.name, 80),
    email: clean(body.email, 120).toLowerCase(),
    phone: clean(body.phone, 20),
    city: clean(body.city, 60),
    pincode: clean(body.pincode, 6),
    kit: clean(body.kit, 40) || KITS[0],
    qty: Math.round(Number(body.qty) || 1),
    notes: clean(body.notes, 500),
  };
  const errors = {};
  if (f.name.length < 2) errors.name = 'add your name';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email)) errors.email = 'that email doesn\'t look right';
  if (!/^\+?[0-9 ]{10,15}$/.test(f.phone)) errors.phone = 'a 10-digit phone number, please';
  if (f.city.length < 2) errors.city = 'add your city';
  if (!/^[1-9][0-9]{5}$/.test(f.pincode)) errors.pincode = 'a 6-digit pin code';
  if (!KITS.includes(f.kit)) errors.kit = 'pick a kit';
  if (f.qty < 1 || f.qty > MAX_QTY) errors.qty = `1 or ${MAX_QTY}`;
  if (Object.keys(errors).length) return json({ ok: false, error: 'check the highlighted fields', fields: errors }, 422);

  const ipHash = await sha256((request.headers.get('cf-connecting-ip') || '') + (env.ADMIN_KEY || 'whybit'));
  const recent = await env.DB.prepare(
    "SELECT COUNT(*) AS n FROM preorders WHERE ip_hash = ? AND created_at > datetime('now','-1 hour')"
  ).bind(ipHash).first();
  if (recent && Number(recent.n) >= 5) return json({ ok: false, error: 'too many tries — give it an hour' }, 429);

  const existing = await env.DB.prepare('SELECT id, status FROM preorders WHERE email = ?').bind(f.email).first();
  if (existing) return json({ ok: true, already: true, status: existing.status, left: Math.max(0, CAP - (await reservedCount(env.DB))) });

  const n = await reservedCount(env.DB);
  const st = n + f.qty <= CAP ? 'reserved' : 'waitlist';
  await env.DB.prepare(
    'INSERT INTO preorders (name,email,phone,city,pincode,kit,qty,notes,status,ip_hash) VALUES (?,?,?,?,?,?,?,?,?,?)'
  ).bind(f.name, f.email, f.phone, f.city, f.pincode, f.kit, f.qty, f.notes, st, ipHash).run();

  const left = Math.max(0, CAP - (st === 'reserved' ? n + f.qty : n));
  return json({ ok: true, status: st, left });
}

async function exportCsv(request, env) {
  const auth = request.headers.get('authorization') || '';
  if (!env.ADMIN_KEY || auth !== `Bearer ${env.ADMIN_KEY}`) return json({ error: 'not allowed' }, 401);
  if (!env.DB) return json({ error: 'database not bound' }, 503);
  const { results } = await env.DB.prepare(
    'SELECT id,created_at,name,email,phone,city,pincode,kit,qty,status,notes FROM preorders ORDER BY id'
  ).all();
  const cols = ['id', 'created_at', 'name', 'email', 'phone', 'city', 'pincode', 'kit', 'qty', 'status', 'notes'];
  // quote every cell; neutralise leading = + - @ so a spreadsheet never runs a submitted value as a formula
  const esc = (v) => { let t = String(v ?? ''); if (/^[=+\-@]/.test(t)) t = "'" + t; return `"${t.replace(/"/g, '""')}"`; };
  const csv = [cols.join(','), ...results.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n');
  return new Response(csv, {
    headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': 'attachment; filename="whybit-preorders.csv"', 'cache-control': 'no-store' },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) {
      try {
        if (url.pathname === '/api/preorder/status' && request.method === 'GET') return await status(env);
        if (url.pathname === '/api/preorder' && request.method === 'POST') return await reserve(request, env);
        if (url.pathname === '/api/preorder/export' && request.method === 'GET') return await exportCsv(request, env);
        return json({ error: 'not found' }, 404);
      } catch (e) {
        return json({ ok: false, error: 'something broke on our side — try again in a minute' }, 500);
      }
    }
    return env.ASSETS.fetch(request);
  },
};
