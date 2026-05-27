<template>
  <div class="page-wrap">
    <div class="page">
      <header class="page-header">
        <button type="button" class="back-button" @click="handleBack">戻る</button>
        <h1>求人ドラフト登録</h1>
        <p>求人情報を入力してスカウトを作成します</p>
      </header>

      <form class="form" @submit.prevent="handleSubmit">
        <section class="card">
          <h2>求人情報</h2>

          <label>
            会社名<span class="required">*</span>
            <input
              v-model="form.companyName"
              type="text"
              placeholder="例：株式会社テックバーション"
              required
            />
          </label>

          <label>
            募集職種<span class="required">*</span>
            <input
              v-model="form.jobTitle"
              type="text"
              placeholder="例：企画営業"
              required
            />
          </label>

          <label>
            部署名
            <input
              v-model="form.departmentName"
              type="text"
              placeholder="例：営業企画部"
            />
          </label>

          <label>
            勤務地<span class="required">*</span>
            <input
              v-model="form.location"
              type="text"
              placeholder="例：東京都港区"
              required
            />
          </label>

          <label>
            給与
            <input
              v-model="form.salary"
              type="text"
              placeholder="例：年収500万円〜800万円"
            />
          </label>

          <label>
            勤務時間<span class="required">*</span>
            <input
              v-model="form.workingHours"
              type="text"
              placeholder="例：9:00-18:00"
              required
            />
          </label>

          <label>
            業務内容<span class="required">*</span>
            <textarea
              v-model="form.description"
              rows="4"
              placeholder="業務内容を入力してください"
              required
            />
          </label>

          <label>
            必須条件<span class="required">*</span>
            <textarea
              v-model="form.requirements"
              rows="4"
              placeholder="改行して複数入力できます"
              required
            />
          </label>

          <label>
            福利厚生・待遇<span class="required">*</span>
            <textarea
              v-model="form.benefits"
              rows="4"
              placeholder="改行して複数入力できます"
              required
            />
          </label>

          <label>
            自由記述欄
            <textarea
              v-model="form.freeText"
              rows="4"
              placeholder="任意で補足事項を入力してください"
            />
          </label>
        </section>

        <section class="card">
          <h2>対象者情報</h2>

          <label>
            対象者年齢
            <input
              v-model="form.targetAge"
              type="text"
              placeholder="例：25〜35歳"
            />
          </label>

          <label>
            対象者希望職種
            <input
              v-model="form.targetJob"
              type="text"
              placeholder="例：フロントエンドエンジニア"
            />
          </label>

          <label>
            対象者性別
            <input
              v-model="form.targetGender"
              type="text"
              placeholder="例：不問"
            />
          </label>
        </section>

        <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>

        <div class="actions">
          <button type="button" class="cancel-button" @click="handleCancel">キャンセル</button>
          <button type="submit" class="submit-button" :disabled="isSubmitting">
            {{ isSubmitting ? '生成中...' : '保存してスカウトを生成' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { generateScoutDraft } from '../api/aiApi'
import { useScoutDraftFlowStore } from '../store/scoutDraftFlowStore'
import type { GenerateScoutDraftRequest } from '../type/scout'

interface JobDraftForm {
  companyName: string
  jobTitle: string
  departmentName: string
  location: string
  salary: string
  workingHours: string
  description: string
  requirements: string
  benefits: string
  freeText: string
  targetAge: string
  targetJob: string
  targetGender: string
}

const initialForm: JobDraftForm = {
  companyName: '',
  jobTitle: '',
  departmentName: '',
  location: '',
  salary: '',
  workingHours: '',
  description: '',
  requirements: '',
  benefits: '',
  freeText: '',
  targetAge: '',
  targetJob: '',
  targetGender: '',
}

const router = useRouter()
const flowStore = useScoutDraftFlowStore()
const form = reactive<JobDraftForm>({ ...initialForm })
const errorMessage = ref('')
const isSubmitting = ref(false)

function handleBack() {
  window.history.back()
}

function handleCancel() {
  resetForm()
  errorMessage.value = ''
}

async function handleSubmit() {
  errorMessage.value = ''

  const payload: GenerateScoutDraftRequest = {
    jobDraft: {
      companyName: form.companyName.trim(),
      jobTitle: form.jobTitle.trim(),
      departmentName: form.departmentName.trim() || undefined,
      location: form.location.trim(),
      salary: form.salary.trim() || undefined,
      workingHours: form.workingHours.trim(),
      description: form.description.trim(),
      requirements: form.requirements.trim(),
      benefits: form.benefits.trim(),
      targetAge: form.targetAge.trim(),
      targetJob: form.targetJob.trim(),
      targetGender: form.targetGender.trim(),
      freeText: form.freeText.trim() || undefined,
    },
  }

  isSubmitting.value = true

  try {
    const response = await generateScoutDraft(payload)
    flowStore.setGeneratedDraft(response)
    await router.push({
      name: 'scoutDraftDetail',
      params: { id: response.scoutText.id },
    })
  } catch (error: unknown) {
    const axiosLikeError = error as {
      response?: {
        data?: {
          message?: string | string[]
        }
      }
    }
    const message = axiosLikeError.response?.data?.message

    if (Array.isArray(message)) {
      errorMessage.value = message.join(' / ')
    } else if (typeof message === 'string') {
      errorMessage.value = message
    } else {
      errorMessage.value = '求人ドラフトの生成に失敗しました。入力内容を確認してください。'
    }
  } finally {
    isSubmitting.value = false
  }
}

function resetForm() {
  form.companyName = initialForm.companyName
  form.jobTitle = initialForm.jobTitle
  form.departmentName = initialForm.departmentName
  form.location = initialForm.location
  form.salary = initialForm.salary
  form.workingHours = initialForm.workingHours
  form.description = initialForm.description
  form.requirements = initialForm.requirements
  form.benefits = initialForm.benefits
  form.freeText = initialForm.freeText
  form.targetAge = initialForm.targetAge
  form.targetJob = initialForm.targetJob
  form.targetGender = initialForm.targetGender
}
</script>

<style scoped>
.page-wrap {
  min-height: 100vh;
  background: #eef1f4;
  padding: 24px 0;
}

.page {
  max-width: 880px;
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

.form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.card {
  background: #ffffff;
  border: 1px solid #d9e2ec;
  border-radius: 12px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.card h2 {
  margin: 0 0 6px;
  font-size: 1.05rem;
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

input::placeholder,
textarea::placeholder {
  color: #9aa5b1;
}

.required {
  color: #c92a2a;
  margin-left: 2px;
}

.error-message {
  margin: 0;
  color: #b42318;
  font-size: 0.9rem;
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

.submit-button:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .page {
    padding: 0 14px 20px;
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
