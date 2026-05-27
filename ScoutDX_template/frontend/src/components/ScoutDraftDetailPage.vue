<template>
  <div class="page-wrap">
    <div class="page">
      <header class="page-header">
        <button type="button" class="back-button" @click="goHome">求人入力へ戻る</button>
        <h1>スカウト文 詳細確認・編集</h1>
        <p>生成されたスカウト文を確認し、必要に応じて編集できます</p>
      </header>

      <section v-if="!generated" class="card empty-card">
        <p>表示するスカウト文がありません。先に求人ドラフトを生成してください。</p>
      </section>

      <template v-else>
        <section class="card meta-grid">
          <div>
            <h2>スカウト情報</h2>
            <p><span>ID:</span> {{ generated.scoutText.id }}</p>
            <p><span>ステータス:</span> {{ generated.scoutText.status }}</p>
            <p><span>作成者:</span> {{ generated.scoutText.createdBy }}</p>
          </div>
          <div>
            <h2>求人情報</h2>
            <p><span>会社名:</span> {{ generated.jobDraft.companyName }}</p>
            <p><span>職種:</span> {{ generated.jobDraft.jobTitle }}</p>
            <p><span>勤務地:</span> {{ generated.jobDraft.location }}</p>
          </div>
        </section>

        <section class="card">
          <h2>スカウト文編集</h2>

          <label>
            タイトル
            <input v-model="editableTitle" type="text" />
          </label>

          <label>
            本文
            <textarea v-model="editableBody" rows="16" />
          </label>
        </section>

        <div class="actions">
          <button type="button" class="cancel-button" @click="goHome">求人入力へ戻る</button>
          <button type="button" class="submit-button" @click="showEditedMessage">
            編集内容を反映（画面内）
          </button>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useScoutDraftFlowStore } from '../store/scoutDraftFlowStore'

const router = useRouter()
const flowStore = useScoutDraftFlowStore()

const generated = computed(() => flowStore.generatedDraft)
const editableTitle = ref('')
const editableBody = ref('')

watch(
  generated,
  (value) => {
    editableTitle.value = value?.scoutText.title ?? ''
    editableBody.value = value?.scoutText.body ?? ''
  },
  { immediate: true },
)

function goHome() {
  router.push({ name: 'home' })
}

function showEditedMessage() {
  window.alert('編集内容を画面に反映しました。保存APIは次実装で接続します。')
}
</script>

<style scoped>
.page-wrap {
  min-height: 100vh;
  background: #eef1f4;
  padding: 24px 0;
}

.page {
  max-width: 920px;
  margin: 0 auto;
  padding: 0 24px 24px;
  font-family: system-ui, sans-serif;
  color: #1f2933;
}

.page-header {
  margin-bottom: 20px;
}

.back-button {
  border: 1px solid #c9d1d9;
  background: #f8fafc;
  color: #2f3a45;
  border-radius: 8px;
  padding: 8px 14px;
  font-size: 0.9rem;
  cursor: pointer;
  margin-bottom: 14px;
}

.page-header h1 {
  margin: 0;
  font-size: 1.7rem;
}

.page-header p {
  margin: 8px 0 0;
  color: #52606d;
  font-size: 0.95rem;
}

.card {
  background: #ffffff;
  border: 1px solid #d9e2ec;
  border-radius: 12px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.card h2 {
  margin: 0 0 6px;
  font-size: 1.05rem;
}

.meta-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.meta-grid p {
  margin: 0;
}

.meta-grid span {
  font-weight: 700;
}

.empty-card {
  color: #52606d;
}

label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.9rem;
  font-weight: 600;
}

input,
textarea {
  padding: 10px 12px;
  border: 1px solid #bcccdc;
  border-radius: 8px;
  font-size: 0.95rem;
  color: #102a43;
  background: #ffffff;
}

.actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.cancel-button,
.submit-button {
  border-radius: 8px;
  padding: 10px 16px;
  cursor: pointer;
  font-weight: 700;
  font-size: 0.93rem;
}

.cancel-button {
  border: 1px solid #9aa5b1;
  background: #f5f7fa;
  color: #334e68;
}

.submit-button {
  border: 1px solid #111111;
  background: #111111;
  color: #ffffff;
}

@media (max-width: 768px) {
  .page {
    padding: 0 14px 20px;
  }

  .meta-grid {
    grid-template-columns: 1fr;
  }

  .actions {
    flex-direction: column-reverse;
    align-items: stretch;
  }

  .cancel-button,
  .submit-button {
    width: 100%;
  }
}
</style>
