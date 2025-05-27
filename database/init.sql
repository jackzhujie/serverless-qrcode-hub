-- 创建映射表
CREATE TABLE IF NOT EXISTS mappings (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER,
  is_wechat INTEGER DEFAULT 0,
  wechat_data TEXT,
  custom_data TEXT
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_mappings_expires_at ON mappings(expires_at);
CREATE INDEX IF NOT EXISTS idx_mappings_created_at ON mappings(created_at);
CREATE INDEX IF NOT EXISTS idx_mappings_is_wechat ON mappings(is_wechat);