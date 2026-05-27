-- ======================================================
-- v2 workflow schema
-- ======================================================

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(50) PRIMARY KEY,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(30) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_users_role CHECK (role IN ('CREATOR', 'SALES_APPROVER', 'ADMIN'))
);

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

CREATE TABLE IF NOT EXISTS history_reject_checklists (
  id VARCHAR(50) PRIMARY KEY,
  history_id VARCHAR(50) NOT NULL,
  checklist_item_id VARCHAR(50) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_history_reject_checklists_history_id FOREIGN KEY (history_id) REFERENCES approval_histories(id),
  CONSTRAINT fk_history_reject_checklists_checklist_item_id FOREIGN KEY (checklist_item_id) REFERENCES reject_checklist_master(id),
  CONSTRAINT uq_history_reject_checklists UNIQUE (history_id, checklist_item_id)
);

CREATE INDEX IF NOT EXISTS idx_job_drafts_created_by ON job_drafts(created_by);
CREATE INDEX IF NOT EXISTS idx_scout_texts_status ON scout_texts(status);
CREATE INDEX IF NOT EXISTS idx_approval_histories_scout_text_id_created_at ON approval_histories(scout_text_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_approval_histories_actor_id ON approval_histories(actor_id);
CREATE INDEX IF NOT EXISTS idx_history_reject_checklists_history_id ON history_reject_checklists(history_id);

-- ======================================================
-- legacy compatibility table
-- NOTE: Keep this table while existing sample API depends on it.
-- ======================================================
CREATE TABLE IF NOT EXISTS scouts (
  id VARCHAR(50) PRIMARY KEY,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  creator VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'DRAFT'
);
