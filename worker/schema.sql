-- whybit pre-orders (Cloudflare D1)
-- create once:  npx wrangler d1 execute whybit-preorders --remote --file=worker/schema.sql
CREATE TABLE IF NOT EXISTS preorders (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  name        TEXT    NOT NULL,
  email       TEXT    NOT NULL,
  phone       TEXT    NOT NULL,
  city        TEXT    NOT NULL,
  pincode     TEXT    NOT NULL,
  kit         TEXT    NOT NULL,
  qty         INTEGER NOT NULL DEFAULT 1,
  notes       TEXT,
  status      TEXT    NOT NULL DEFAULT 'reserved',   -- reserved | waitlist | cancelled
  ip_hash     TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS preorders_email ON preorders (email);
CREATE INDEX IF NOT EXISTS preorders_ip_time ON preorders (ip_hash, created_at);
