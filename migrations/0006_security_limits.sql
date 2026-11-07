CREATE TABLE security_buckets (
  id TEXT PRIMARY KEY,
  used INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX security_buckets_expiry ON security_buckets(expires_at);
