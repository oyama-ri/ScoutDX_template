# スカウト文作成援助システム API設計（初版）

## 0. この設計の根拠と範囲

### 根拠（確認できた事実）
- 業務要件の元資料: `sample/システムについて.txt`
- 現在のDB定義: `db/init.sql`
- 現在の実装はサンプル最小構成: `backend/src/controller/scout.controller.ts`, `backend/src/controller/ai-generate.controller.ts`

### 設計対象
- 今回のタスク「ドラフト文生成機能」を中心に、将来の承認ワークフローまで破綻しないAPI設計

### 不明点（要確認）
- 認証方式（JWT / セッション / 固定ユーザー切替）
- 監査ログの保持期間
- 差戻しチェック項目マスタの初期データ運用

上記は現時点で仕様書に実装レベルの記載がないため、ここでは「わかりません」。

---

## 1. データ構造（TypeScript DTO / Domain）

以下はアプリ層の型。DB列名は `db/init.sql` どおりスネークケース、APIはキャメルケースで扱う。

```ts
export const UserRole = {
  CREATOR: 'CREATOR',
  SALES_APPROVER: 'SALES_APPROVER',
  ADMIN: 'ADMIN',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const ScoutStatus = {
  DRAFT: 'DRAFT',
  PENDING_SALES: 'PENDING_SALES',
  PENDING_MANAGER: 'PENDING_MANAGER',
  REJECTED: 'REJECTED',
  AVAILABLE: 'AVAILABLE',
} as const;
export type ScoutStatus = (typeof ScoutStatus)[keyof typeof ScoutStatus];

export const ApprovalActionType = {
  SUBMIT: 'SUBMIT',
  SALES_APPROVE: 'SALES_APPROVE',
  SALES_REJECT: 'SALES_REJECT',
  MANAGER_APPROVE: 'MANAGER_APPROVE',
  MANAGER_REJECT: 'MANAGER_REJECT',
} as const;
export type ApprovalActionType = (typeof ApprovalActionType)[keyof typeof ApprovalActionType];

export interface JobDraft {
  id: string;
  companyName: string;
  jobTitle: string;
  departmentName?: string;
  location: string;
  salary?: string;
  workingHours: string;
  description: string;
  requirements: string;
  benefits: string;
  targetAge: string;
  targetGender: string;
  targetJob: string;
  freeText?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScoutText {
  id: string;
  jobDraftId: string;
  title: string;
  body: string;
  status: ScoutStatus;
  createdBy: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface ApprovalHistory {
  id: string;
  scoutTextId: string;
  actorId: string;
  actionType: ApprovalActionType;
  fromStatus: ScoutStatus;
  toStatus: ScoutStatus;
  comment?: string;
  createdAt: string;
}

export interface RejectChecklistMaster {
  id: string;
  targetRole: Extract<UserRole, 'SALES_APPROVER' | 'ADMIN'>;
  itemText: string;
  displayOrder: number;
  isActive: boolean;
}

export interface RejectReason {
  checklistItemIds: string[]; // 必須（1件以上）
  requestComment?: string; // 任意
}

export interface LatestRejectInfo {
  rejectedAt: string;
  rejectedBy: string;
  checklistItems: Array<{ id: string; itemText: string }>;
  requestComment?: string;
}
```

### 1-1. 生成用DTO

```ts
export interface GenerateScoutDraftRequest {
  actorUserId: string; // CREATOR
  jobDraft: {
    companyName: string;
    jobTitle: string;
    departmentName?: string;
    location: string;
    salary?: string;
    workingHours: string;
    description: string;
    requirements: string;
    benefits: string;
    targetAge: string;
    targetGender: string;
    targetJob: string;
    freeText?: string;
  };
}

export interface GenerateScoutDraftResponse {
  jobDraft: JobDraft;
  scoutText: ScoutText;
}
```

### 1-2. 編集・申請・承認DTO

```ts
export interface UpdateScoutDraftRequest {
  actorUserId: string; // CREATOR
  title: string;
  body: string;
}

export interface SubmitForApprovalRequest {
  actorUserId: string; // CREATOR
}

export interface ApproveScoutRequest {
  actorUserId: string; // SALES_APPROVER or ADMIN
}

export interface RejectScoutRequest {
  actorUserId: string; // SALES_APPROVER or ADMIN
  rejectReason: RejectReason;
}
```

---

## 2. 状態遷移とガード条件

## 2-1. 正規遷移
- DRAFT -> PENDING_SALES（作成者が承認申請）
- REJECTED -> PENDING_SALES（作成者が修正後に再申請）
- PENDING_SALES -> PENDING_MANAGER（営業承認者が承認）
- PENDING_MANAGER -> AVAILABLE（管理者が承認）
- PENDING_SALES -> REJECTED（営業承認者が差戻し）
- PENDING_MANAGER -> REJECTED（管理者が差戻し）

## 2-2. ロール別操作制約
- CREATOR
  - 可能: 生成、DRAFT/REJECTEDの編集、承認申請
  - 不可: 承認、差戻し
- SALES_APPROVER
  - 可能: PENDING_SALESの承認/差戻し
  - 不可: 作成、編集、PENDING_MANAGERの操作
- ADMIN
  - 可能: PENDING_MANAGERの承認/差戻し
  - 不可: 作成、編集、PENDING_SALESの操作

## 2-3. イミュータブルガード（重要）
- DRAFT/REJECTED 以外（PENDING_SALES, PENDING_MANAGER, AVAILABLE）は編集APIで常に拒否する
- これにより、承認待ちと利用可能データの改ざんを防ぐ

## 2-4. 差戻しデータの必須ルール
- 差戻し時、`checklistItemIds` は1件以上必須
- `requestComment` は任意
- 一覧/詳細APIでは「最新の差戻し理由」を返す

---

## 3. APIエンドポイント設計

ベースパス: `/api`

## 3-1. 今回の主対象（ドラフト文生成）

### POST /api/scout-drafts/generate
- 目的: 求人ドラフト保存 + 固定文面生成 + スカウト文DRAFT作成を一括実行
- 利用ロール: CREATOR
- Request: `GenerateScoutDraftRequest`
- Response: `GenerateScoutDraftResponse`
- 主なエラー
  - 400: 必須入力不足
  - 403: ロール不正
  - 409: 同一求人ドラフトに既存スカウトがある（UNIQUE違反）

## 3-2. 作成者向け

### GET /api/scout-texts
- 目的: 一覧取得（作成者は自分のデータ中心）
- クエリ例: `status`, `createdBy`, `page`, `pageSize`

### GET /api/scout-texts/:id
- 目的: 詳細取得（最新差戻し理由を含む）

### PATCH /api/scout-texts/:id
- 目的: DRAFT/REJECTED のみ編集
- Request: `UpdateScoutDraftRequest`

### POST /api/scout-texts/:id/submit
- 目的: 承認申請（DRAFT/REJECTED -> PENDING_SALES）
- Request: `SubmitForApprovalRequest`

## 3-3. 承認者向け

### GET /api/approvals/pending
- 目的: 自ロールが処理可能な承認待ち一覧
- SALES_APPROVER は PENDING_SALES のみ
- ADMIN は PENDING_MANAGER のみ

### POST /api/scout-texts/:id/approve
- 目的: 承認
- SALES_APPROVER: PENDING_SALES -> PENDING_MANAGER
- ADMIN: PENDING_MANAGER -> AVAILABLE
- Request: `ApproveScoutRequest`

### POST /api/scout-texts/:id/reject
- 目的: 差戻し
- Request: `RejectScoutRequest`

## 3-4. 差戻しチェック項目

### GET /api/reject-checklists
- 目的: 差戻し時の選択肢取得
- クエリ例: `targetRole=SALES_APPROVER|ADMIN`

---

## 4. AI連携抽象化方針

固定文面生成はインターフェース分離する。

```ts
export interface ScoutTextGenerator {
  generateFromJobDraft(input: JobDraft): Promise<{ title: string; body: string }>;
}
```

- 現在実装: `FixedTemplateScoutTextGenerator`
- 将来実装: `OpenAiScoutTextGenerator` など
- サービス層は `ScoutTextGenerator` に依存し、具体実装をDIで差し替える

理由:
- 今の固定文面要件を満たしつつ、将来の実AI接続時にサービス層の改修範囲を限定できる

---

## 5. エラーレスポンス方針

```ts
export interface ApiErrorResponse {
  code:
    | 'VALIDATION_ERROR'
    | 'FORBIDDEN_OPERATION'
    | 'INVALID_STATUS_TRANSITION'
    | 'NOT_FOUND'
    | 'CONFLICT'
    | 'INTERNAL_ERROR';
  message: string;
  details?: unknown;
}
```

- 権限違反は 403
- 状態遷移違反は 409
- 入力不備は 400

---

## 6. 初回実装順（最小）

1. `POST /api/scout-drafts/generate` を実装
2. `GET /api/scout-texts/:id` を実装
3. `PATCH /api/scout-texts/:id` にイミュータブルガード実装
4. `POST /api/scout-texts/:id/submit` を実装

この順なら「求人ドラフト登録 -> 固定文面生成 -> 編集 -> 承認申請」までを最短で動かせる。
