-- テーブル関係（ざっくり）:
-- users
--   ├─ job_drafts (created_by)
--   ├─ scout_texts (created_by)
--   └─ approval_histories (actor_id)
-- job_drafts
--   └─ scout_texts (job_draft_id)
-- scout_texts
--   └─ approval_histories (scout_text_id)
-- approval_histories
--   └─ history_reject_checklists (history_id)
-- reject_checklist_master
--   └─ history_reject_checklists (checklist_item_id)

-- ------------------------------------------------------
-- users: ログインユーザー情報
-- role は CHECK 制約で 3種類に限定
-- ------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(50) PRIMARY KEY,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(30) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_users_role CHECK (role IN ('CREATOR', 'SALES_APPROVER', 'ADMIN'))
);

-- ------------------------------------------------------
-- job_drafts: 求人の下書き
-- created_by は users.id を参照（存在しないユーザーIDは不可）
-- ------------------------------------------------------
CREATE TABLE IF NOT EXISTS job_drafts (
  id VARCHAR(50) PRIMARY KEY,
  company_name VARCHAR(255) NOT NULL,
  job_title VARCHAR(255) NOT NULL,
  department_name VARCHAR(255),
  location VARCHAR(255) NOT NULL,
  salary VARCHAR(255),
  working_hours VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT NOT NULL,
  benefits TEXT NOT NULL,
  target_age VARCHAR(100) NOT NULL,
  target_gender VARCHAR(100) NOT NULL,
  target_job VARCHAR(255) NOT NULL,
  free_text TEXT,
  created_by VARCHAR(50) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_job_drafts_created_by FOREIGN KEY (created_by) REFERENCES users(id)
);

-- ------------------------------------------------------
-- scout_texts: スカウト文面
-- job_draft_id が UNIQUE なので、1つの下書きに1つの本文を想定
-- status は CHECK 制約で状態を限定（業務フローを守る）
-- ------------------------------------------------------
CREATE TABLE IF NOT EXISTS scout_texts (
  id VARCHAR(50) PRIMARY KEY,
  job_draft_id VARCHAR(50) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  status VARCHAR(30) NOT NULL,
  created_by VARCHAR(50) NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_scout_texts_job_draft_id FOREIGN KEY (job_draft_id) REFERENCES job_drafts(id),
  CONSTRAINT fk_scout_texts_created_by FOREIGN KEY (created_by) REFERENCES users(id),
  CONSTRAINT chk_scout_texts_status CHECK (
    status IN ('DRAFT', 'PENDING_SALES', 'PENDING_MANAGER', 'REJECTED', 'AVAILABLE')
  ),
  CONSTRAINT chk_scout_texts_version CHECK (version >= 1)
);

-- ------------------------------------------------------
-- approval_histories: 承認アクションの履歴
-- どの本文に対して、誰が、どの状態からどの状態へ変えたかを保存
-- ------------------------------------------------------
CREATE TABLE IF NOT EXISTS approval_histories (
  id VARCHAR(50) PRIMARY KEY,
  scout_text_id VARCHAR(50) NOT NULL,
  actor_id VARCHAR(50) NOT NULL,
  action_type VARCHAR(30) NOT NULL,
  from_status VARCHAR(30) NOT NULL,
  to_status VARCHAR(30) NOT NULL,
  comment TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_approval_histories_scout_text_id FOREIGN KEY (scout_text_id) REFERENCES scout_texts(id),
  CONSTRAINT fk_approval_histories_actor_id FOREIGN KEY (actor_id) REFERENCES users(id),
  CONSTRAINT chk_approval_histories_action_type CHECK (
    action_type IN ('SUBMIT', 'SALES_APPROVE', 'SALES_REJECT', 'MANAGER_APPROVE', 'MANAGER_REJECT')
  ),
  CONSTRAINT chk_approval_histories_from_status CHECK (
    from_status IN ('DRAFT', 'PENDING_SALES', 'PENDING_MANAGER', 'REJECTED', 'AVAILABLE')
  ),
  CONSTRAINT chk_approval_histories_to_status CHECK (
    to_status IN ('DRAFT', 'PENDING_SALES', 'PENDING_MANAGER', 'REJECTED', 'AVAILABLE')
  )
);

-- ------------------------------------------------------
-- reject_checklist_master: 差戻し理由のマスタ
-- target_role で「営業向け項目」か「管理者向け項目」かを区別
-- ------------------------------------------------------
CREATE TABLE IF NOT EXISTS reject_checklist_master (
  id VARCHAR(50) PRIMARY KEY,
  target_role VARCHAR(30) NOT NULL,
  item_text VARCHAR(255) NOT NULL,
  display_order INTEGER NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_reject_checklist_master_target_role CHECK (target_role IN ('SALES_APPROVER', 'ADMIN')),
  CONSTRAINT chk_reject_checklist_master_display_order CHECK (display_order >= 1)
);

-- ------------------------------------------------------
-- history_reject_checklists: 差戻し履歴とチェック項目の中間テーブル
-- UNIQUE (history_id, checklist_item_id) で同じ項目の重複紐付けを防止
-- ------------------------------------------------------
CREATE TABLE IF NOT EXISTS history_reject_checklists (
  id VARCHAR(50) PRIMARY KEY,
  history_id VARCHAR(50) NOT NULL,
  checklist_item_id VARCHAR(50) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_history_reject_checklists_history_id FOREIGN KEY (history_id) REFERENCES approval_histories(id),
  CONSTRAINT fk_history_reject_checklists_checklist_item_id FOREIGN KEY (checklist_item_id) REFERENCES reject_checklist_master(id),
  CONSTRAINT uq_history_reject_checklists UNIQUE (history_id, checklist_item_id)
);

-- ------------------------------------------------------
-- INDEX: 検索を速くするための設定
-- 一覧表示や絞り込みでよく使う列に付与
-- ------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_job_drafts_created_by ON job_drafts(created_by);
CREATE INDEX IF NOT EXISTS idx_scout_texts_status ON scout_texts(status);
CREATE INDEX IF NOT EXISTS idx_approval_histories_scout_text_id_created_at ON approval_histories(scout_text_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_approval_histories_actor_id ON approval_histories(actor_id);
CREATE INDEX IF NOT EXISTS idx_history_reject_checklists_history_id ON history_reject_checklists(history_id);


-- ------------------------------------------------------
-- scouts: 旧サンプルAPI互換テーブル
-- 新しいワークフローテーブル群とは別に、既存API互換のため残す
-- ------------------------------------------------------
CREATE TABLE IF NOT EXISTS scouts (
  id VARCHAR(50) PRIMARY KEY,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  creator VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'DRAFT'
);
