# スカウト文 実装テンプレート

受講生向けの演習用テンプレートです。フロントエンド・バックエンド・PostgreSQL を `docker compose` で一括起動できます。

## 構成

| ディレクトリ | 説明 |
|-------------|------|
| `frontend/` | Vue 3 + Vite + Vue Router + Pinia |
| `backend/` | NestJS + TypeORM |
| `db/` | PostgreSQL 初期化 SQL |

### フロントエンド構成

```
frontend/src/
  api/          # API クライアント
  components/   # ScoutPage.vue（1画面のみ）
  router/       # Vue Router
  store/        # Pinia
  type/         # 型定義（JSDoc）
```

### バックエンド構成

```
backend/src/
  controller/   # GET / POST
  service/      # ビジネスロジック
  repository/   # DB アクセス
  type/         # Entity・リクエスト用の型（scout.ts）
```

### データベース（scouts テーブル）

| カラム | 説明 |
|--------|------|
| id | スカウト文ID |
| created_at | 作成日 |
| creator | 作成者 |
| title | タイトル |
| body | 本文 |
| status | ステータス |

初回の PostgreSQL 起動時に `db/init.sql` が自動実行され、テーブルが作成されます。

---

## クイックスタート

### 前提

- Docker / Docker Compose が使えること

### 一括起動

```bash
docker compose up --build
```

| サービス | URL |
|---------|-----|
| フロントエンド | http://localhost:5173 |
| バックエンド API | http://localhost:3000/api/scouts |
| PostgreSQL | localhost:5433 |

ブラウザで http://localhost:5173 を開き、スカウト文の作成・一覧表示ができれば接続確認完了です。

`backend/`・`frontend/` のソースはコンテナにマウントされており、保存するとバックエンドは自動再起動、フロントは Vite の HMR で反映されます（初回起動後に `docker compose up` を一度やり直す必要がある場合があります）。

### 停止

```bash
# コンテナ停止
docker compose stop

# コンテナ停止 + 削除
docker compose down

# DB ボリュームも含めて完全削除（データ初期化）
docker compose down -v
```

---

## よく使うコマンド

### Docker Compose

```bash
# バックグラウンド起動
docker compose up -d --build

# ログ確認（全サービス）
docker compose logs -f

# 特定サービスのログ
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f postgres

# コンテナ一覧
docker compose ps

# イメージ再ビルドのみ
docker compose build
```

### コンテナに入る

```bash
# PostgreSQL
docker compose exec postgres sh

# バックエンド
docker compose exec backend sh
```

### SQL 実行（ワンライナー）
対話的に psql を使う場合:

```bash
docker compose exec postgres psql -U postgres -d scout_db
```

### API 動作確認（curl）

```bash
# 一覧取得
curl http://localhost:3000/api/scouts

# 新規作成
curl -X POST http://localhost:3000/api/scouts \
  -H "Content-Type: application/json" \
  -d '{"creator":"山田太郎","title":"テスト","body":"本文です"}'
```

---

## ローカル開発（Docker なし）

PostgreSQL のみ Docker で起動し、フロント・バックエンドはホストで動かす場合の例です。

```bash
# DB のみ起動
docker compose up -d postgres

# バックエンド
cd backend
npm install
npm run start:dev

# フロントエンド（別ターミナル）
cd frontend
npm install
npm run dev
```

環境変数（バックエンド）:

| 変数 | デフォルト |
|------|-----------|
| DB_HOST | localhost |
| DB_PORT | 5433 |
| DB_USER | postgres |
| DB_PASSWORD | password123 |
| DB_NAME | scout_db |

---

## 演習の進め方（例）

1. テンプレートを起動し、画面から作成・一覧が動くことを確認
2. `backend/src/` の各レイヤー（controller → service → repository）を読む
3. `frontend/src/` の api / store / component の流れを追う
4. 要件に合わせて機能を追加していく

テストコードは含めていません。受講生が必要に応じて追加してください。
