-- ============================================================================
-- YA² Transport — SQLite schema (created automatically on first start).
-- Mirrors schema.oracle.sql so the data model is the same on both databases.
-- ============================================================================

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id             TEXT PRIMARY KEY,
  name           TEXT NOT NULL,
  email          TEXT NOT NULL UNIQUE,
  phone          TEXT,
  password_hash  TEXT,
  google_id      TEXT UNIQUE,
  created_at     TEXT NOT NULL,
  updated_at     TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash  TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  expires_at  TEXT NOT NULL,
  created_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_user_ix ON sessions (user_id);

CREATE TABLE IF NOT EXISTS password_resets (
  token_hash  TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  expires_at  TEXT NOT NULL,
  used_at     TEXT
);

CREATE TABLE IF NOT EXISTS addresses (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  label       TEXT NOT NULL,
  name        TEXT NOT NULL,
  phone       TEXT NOT NULL,
  line1       TEXT NOT NULL,
  city        TEXT NOT NULL,
  state       TEXT NOT NULL,
  pincode     TEXT NOT NULL,
  created_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS addresses_user_ix ON addresses (user_id);

CREATE TABLE IF NOT EXISTS quotes (
  id                 TEXT PRIMARY KEY,
  user_id            TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  mode               TEXT NOT NULL,
  pickup_state       TEXT NOT NULL,
  destination_state  TEXT NOT NULL,
  pickup_city        TEXT,
  destination_city   TEXT,
  weight_kg          REAL NOT NULL,
  cargo_type         TEXT NOT NULL,
  speed              TEXT NOT NULL,
  total              INTEGER NOT NULL,
  transit_label      TEXT NOT NULL,
  created_at         TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS quotes_user_ix ON quotes (user_id);

CREATE TABLE IF NOT EXISTS shipments (
  id                  TEXT PRIMARY KEY,
  user_id             TEXT NOT NULL REFERENCES users (id),
  booking_id          TEXT NOT NULL UNIQUE,
  tracking_id         TEXT UNIQUE,
  status              TEXT NOT NULL,
  mode                TEXT NOT NULL,
  speed               TEXT NOT NULL,
  cargo_type          TEXT NOT NULL,
  weight_kg           REAL NOT NULL,
  sender_name         TEXT NOT NULL,
  sender_phone        TEXT NOT NULL,
  sender_address      TEXT NOT NULL,
  sender_city         TEXT NOT NULL,
  sender_state        TEXT NOT NULL,
  sender_pincode      TEXT NOT NULL,
  receiver_name       TEXT NOT NULL,
  receiver_phone      TEXT NOT NULL,
  receiver_address    TEXT NOT NULL,
  receiver_city       TEXT NOT NULL,
  receiver_state      TEXT NOT NULL,
  receiver_pincode    TEXT NOT NULL,
  price               INTEGER NOT NULL,
  breakdown_json      TEXT NOT NULL,
  estimated_delivery  TEXT,
  created_at          TEXT NOT NULL,
  paid_at             TEXT
);
CREATE INDEX IF NOT EXISTS shipments_user_ix ON shipments (user_id);

CREATE TABLE IF NOT EXISTS shipment_events (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  shipment_id  TEXT NOT NULL REFERENCES shipments (id) ON DELETE CASCADE,
  stage        TEXT NOT NULL,
  event_at     TEXT NOT NULL,
  location     TEXT NOT NULL,
  note         TEXT
);
CREATE INDEX IF NOT EXISTS events_shipment_ix ON shipment_events (shipment_id, event_at);

CREATE TABLE IF NOT EXISTS payments (
  id                   TEXT PRIMARY KEY,
  shipment_id          TEXT NOT NULL REFERENCES shipments (id),
  user_id              TEXT NOT NULL REFERENCES users (id),
  provider             TEXT NOT NULL,
  order_id             TEXT NOT NULL UNIQUE,
  amount               INTEGER NOT NULL,
  status               TEXT NOT NULL,
  method               TEXT,
  provider_payment_id  TEXT,
  created_at           TEXT NOT NULL,
  paid_at              TEXT
);

CREATE TABLE IF NOT EXISTS contact_messages (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL,
  phone       TEXT,
  subject     TEXT NOT NULL,
  message     TEXT NOT NULL,
  created_at  TEXT NOT NULL
);

-- Per-account history (dashboard → History)
CREATE TABLE IF NOT EXISTS activity (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  type        TEXT NOT NULL,
  title       TEXT NOT NULL,
  detail      TEXT,
  ref         TEXT,
  created_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS activity_user_ix ON activity (user_id, created_at);

CREATE TABLE IF NOT EXISTS counters (
  name   TEXT PRIMARY KEY,
  value  INTEGER NOT NULL
);
INSERT OR IGNORE INTO counters (name, value) VALUES ('tracking_seq', 1400);
