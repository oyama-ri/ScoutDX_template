-- =========================================================
-- ScoutDX DB Schema (PostgreSQL)
-- =========================================================
-- Why:
-- - 業務ルールを DB でも守るため、Enum / FK / CHECK / Trigger を使って不正データを抑止する
-- - アプリ層でのバリデーション漏れ時にも、最低限の整合性を壊さない
-- =========================================================

-- 既存初期版テーブルがある場合の衝突回避（初期開発向け）
-- 本番運用では DROP ではなくマイグレーションで差分適用してください
-- DROP TABLE IF EXISTS check_results CASCADE;
-- DROP TABLE IF EXISTS scout_rejections CASCADE;
-- DROP TABLE IF EXISTS approval_histories CASCADE;
-- DROP TABLE IF EXISTS scouts CASCADE;
-- DROP TABLE IF EXISTS check_items CASCADE;
-- DROP TABLE IF EXISTS scout_targets CASCADE;
-- DROP TABLE IF EXISTS job_drafts CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;

-- DROP TYPE IF EXISTS approval_action CASCADE;
-- DROP TYPE IF EXISTS scout_status CASCADE;
-- DROP TYPE IF EXISTS user_role CASCADE;

-- 文字列のハードコードを防ぐため Enum 化
CREATE TYPE user_role AS ENUM (
  'CREATOR',
  'SALES_APPROVER',
  'ADMIN'
);

CREATE TYPE scout_status AS ENUM (
  'DRAFT',
  'PENDING_SALES',
  'PENDING_MANAGER',
  'REJECTED',
  'AVAILABLE'
);

CREATE TYPE approval_action AS ENUM (
  'SUBMIT_SALES',
  'APPROVE_SALES',
  'APPROVE_MANAGER',
  'REJECT_SALES',
  'REJECT_MANAGER'
);

-- ---------------------------------------------------------
-- users
-- ---------------------------------------------------------
CREATE TABLE users (
  user_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_name VARCHAR(100) NOT NULL,
  login_id VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role user_role NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------
-- job_drafts
-- ---------------------------------------------------------
CREATE TABLE job_drafts (
  job_draft_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  creator_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
  company_name VARCHAR(255) NOT NULL,
  job_title VARCHAR(255) NOT NULL,
  job_description TEXT NOT NULL,
  required_skills TEXT NOT NULL,
  work_location VARCHAR(255) NOT NULL,
  salary_unit_price VARCHAR(100) NOT NULL,
  working_hours VARCHAR(100) NOT NULL,
  free_note TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------
-- scout_targets
-- ---------------------------------------------------------
CREATE TABLE scout_targets (
  target_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  age INTEGER NOT NULL CHECK (age >= 0),
  gender VARCHAR(50) NOT NULL,
  desired_job_title VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------
-- scouts
-- ---------------------------------------------------------
CREATE TABLE scouts (
  scout_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  job_draft_id INTEGER NOT NULL REFERENCES job_drafts(job_draft_id) ON DELETE RESTRICT,
  creator_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
  target_id INTEGER NOT NULL REFERENCES scout_targets(target_id) ON DELETE RESTRICT,
  scout_content TEXT NOT NULL,
  status scout_status NOT NULL DEFAULT 'DRAFT',
  deadline_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_scouts_status ON scouts(status);
CREATE INDEX idx_scouts_creator_id ON scouts(creator_id);
CREATE INDEX idx_scouts_job_draft_id ON scouts(job_draft_id);
CREATE INDEX idx_scouts_target_id ON scouts(target_id);

-- ---------------------------------------------------------
-- approval_histories
-- ---------------------------------------------------------
CREATE TABLE approval_histories (
  history_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  scout_id INTEGER NOT NULL REFERENCES scouts(scout_id) ON DELETE CASCADE,
  actor_user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
  action approval_action NOT NULL,
  executed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  comment TEXT NULL
);

CREATE INDEX idx_approval_histories_scout_id ON approval_histories(scout_id);
CREATE INDEX idx_approval_histories_actor_user_id ON approval_histories(actor_user_id);

-- ---------------------------------------------------------
-- check_items
-- ---------------------------------------------------------
CREATE TABLE check_items (
  check_item_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  item_name VARCHAR(255) NOT NULL,
  target_role user_role NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------
-- check_results
-- ---------------------------------------------------------
CREATE TABLE check_results (
  check_result_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  scout_id INTEGER NOT NULL REFERENCES scouts(scout_id) ON DELETE CASCADE,
  check_item_id INTEGER NOT NULL REFERENCES check_items(check_item_id) ON DELETE RESTRICT,
  checked_by_user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
  is_checked BOOLEAN NOT NULL,
  checked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (scout_id, check_item_id)
);

CREATE INDEX idx_check_results_scout_id ON check_results(scout_id);

-- ---------------------------------------------------------
-- scout_rejections
-- 差戻し理由を「必須チェック項目」と「任意コメント」に分離保持する
-- ---------------------------------------------------------
CREATE TABLE scout_rejections (
  rejection_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  scout_id INTEGER NOT NULL REFERENCES scouts(scout_id) ON DELETE CASCADE,
  rejected_by_user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
  check_item_id INTEGER NOT NULL REFERENCES check_items(check_item_id) ON DELETE RESTRICT,
  revision_request_comment TEXT NULL,
  rejected_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_latest BOOLEAN NOT NULL DEFAULT TRUE
);

-- 1つのスカウトにつき最新差戻し理由は常に1件だけ
CREATE UNIQUE INDEX ux_scout_rejections_latest_one
  ON scout_rejections(scout_id)
  WHERE is_latest = TRUE;

CREATE INDEX idx_scout_rejections_scout_id ON scout_rejections(scout_id);

-- ---------------------------------------------------------
-- updated_at 自動更新トリガー
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_job_drafts_updated_at
BEFORE UPDATE ON job_drafts
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_scout_targets_updated_at
BEFORE UPDATE ON scout_targets
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_scouts_updated_at
BEFORE UPDATE ON scouts
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_check_items_updated_at
BEFORE UPDATE ON check_items
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------
-- ステータス遷移ガード
-- Why:
-- - 不正遷移を DB レベルでも拒否し、ワークフロー崩壊を防ぐ
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION guard_scout_status_transition()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = OLD.status THEN
    RETURN NEW;
  END IF;

  IF OLD.status = 'DRAFT' AND NEW.status = 'PENDING_SALES' THEN
    RETURN NEW;
  END IF;

  IF OLD.status = 'PENDING_SALES' AND NEW.status IN ('PENDING_MANAGER', 'REJECTED') THEN
    RETURN NEW;
  END IF;

  IF OLD.status = 'PENDING_MANAGER' AND NEW.status IN ('AVAILABLE', 'REJECTED') THEN
    RETURN NEW;
  END IF;

  IF OLD.status = 'REJECTED' AND NEW.status = 'DRAFT' THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'Invalid status transition: % -> %', OLD.status, NEW.status;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_guard_scout_status_transition
BEFORE UPDATE OF status ON scouts
FOR EACH ROW
EXECUTE FUNCTION guard_scout_status_transition();

-- ---------------------------------------------------------
-- イミュータブルガード
-- Why:
-- - 承認待ち・利用可能状態は作成者含め編集不可という業務要件を DB で強制
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION guard_scout_content_immutable()
RETURNS TRIGGER AS $$
BEGIN
  -- 旧状態が承認待ち or 利用可能なら、本文系の更新を禁止
  IF OLD.status IN ('PENDING_SALES', 'PENDING_MANAGER', 'AVAILABLE') THEN
    IF NEW.scout_content IS DISTINCT FROM OLD.scout_content
       OR NEW.job_draft_id IS DISTINCT FROM OLD.job_draft_id
       OR NEW.target_id IS DISTINCT FROM OLD.target_id
       OR NEW.deadline_at IS DISTINCT FROM OLD.deadline_at THEN
      RAISE EXCEPTION 'Scout is immutable in current status: %', OLD.status;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_guard_scout_content_immutable
BEFORE UPDATE ON scouts
FOR EACH ROW
EXECUTE FUNCTION guard_scout_content_immutable();-- スカウト文テーブル（初回起動時に自動作成）
CREATE TABLE IF NOT EXISTS scouts (
  id VARCHAR(50) PRIMARY KEY,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  creator VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'DRAFT'
);
