<template>
  <div class="page">
    <header class="page-header">
      <h1>スカウト文 接続確認</h1>
      <p>バックエンド API との GET / POST が動作することを確認する画面です</p>
    </header>

    <section class="card">
      <h2>新規作成（POST）</h2>
      <form @submit.prevent="handleSubmit">
        <label>
          作成者
          <input v-model="form.creator" type="text" placeholder="山田太郎" required />
        </label>
        <label>
          タイトル
          <input v-model="form.title" type="text" placeholder="エンジニア向けスカウト" required />
        </label>
        <label>
          本文
          <textarea v-model="form.body" rows="4" placeholder="スカウト文の本文..." required />
        </label>
        <button
          type="button"
          class="btn-secondary"
          :disabled="generating || store.loading"
          @click="handleGenerate"
        >
          {{ generating ? '生成中...' : 'AIで生成（サンプル）' }}
        </button>
        <button type="submit" :disabled="store.loading">作成する</button>
      </form>
    </section>

    <section class="card">
      <p v-if="store.loading" class="message">読み込み中...</p>
      <p v-else-if="store.error" class="message error">{{ store.error }}</p>
      <p v-else-if="store.scouts.length === 0" class="message">スカウト文がありません</p>

      <ul v-else class="scout-list">
        <li v-for="scout in store.scouts" :key="scout.id" class="scout-item">
          <div class="scout-meta">
            <span class="id">ID: {{ scout.id }}</span>
            <span class="status">{{ scout.status }}</span>
          </div>
          <h3>{{ scout.title }}</h3>
          <p class="body">{{ scout.body }}</p>
          <p class="footer">
            作成者: {{ scout.creator }} /
            作成日: {{ formatDate(scout.createdAt) }}
          </p>
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { fetchGeneratedScoutSample } from '../api/aiApi'
import { useScoutStore } from '../store/scoutStore'
import type { ScoutEntity } from '../type/scout'

const store = useScoutStore()

const form = reactive<Pick<ScoutEntity, 'creator' | 'title' | 'body'>>({
  creator: '',
  title: '',
  body: '',
})

const generating = ref(false)

async function handleGenerate() {
  generating.value = true
  try {
    const sample = await fetchGeneratedScoutSample()
    form.body = sample.body
  } catch (e) {
    console.error(e)
  } finally {
    generating.value = false
  }
}

async function handleSubmit() {
  const payload: ScoutEntity = { ...form }
  await store.addScout(payload)
  form.creator = ''
  form.title = ''
  form.body = ''
}

function formatDate(value: string | undefined) {
  if (!value) return '-'
  return new Date(value).toLocaleString('ja-JP')
}

onMounted(() => {
  store.loadScouts()
})
</script>

<style scoped>
.page {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px;
  font-family: system-ui, sans-serif;
  color: #1a202c;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h1 {
  margin: 0 0 8px;
  font-size: 1.5rem;
}

.page-header p {
  margin: 0;
  color: #4a5568;
  font-size: 0.9rem;
}

.card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.card h2 {
  margin: 0 0 16px;
  font-size: 1.1rem;
}

form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.85rem;
  font-weight: 600;
}

input,
textarea {
  padding: 8px 10px;
  border: 1px solid #cbd5e0;
  border-radius: 6px;
  font-size: 0.95rem;
}

button {
  align-self: flex-start;
  padding: 8px 16px;
  background: #3182ce;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #fff;
  color: #3182ce;
  border: 1px solid #3182ce;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.list-header h2 {
  margin: 0;
}

.scout-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.scout-item {
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 12px;
  background: #f7fafc;
}

.scout-meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: #718096;
  margin-bottom: 6px;
}

.scout-item h3 {
  margin: 0 0 8px;
  font-size: 1rem;
}

.body {
  margin: 0 0 8px;
  white-space: pre-wrap;
  line-height: 1.5;
}

.footer {
  margin: 0;
  font-size: 0.8rem;
  color: #4a5568;
}

.message {
  color: #718096;
}

.message.error {
  color: #c53030;
}
</style>
