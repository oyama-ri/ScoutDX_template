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
          <h2>基本情報</h2>

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
            基幹職種
            <input
              v-model="form.coreJobType"
              type="text"
              placeholder="例：企画営業"
            />
          </label>

          <label>
            給与<span class="required">*</span>
            <input
              v-model="form.salary"
              type="text"
              placeholder="例：年収500万円〜800万円"
              required
            />
          </label>

          <fieldset class="fieldset">
            <legend>雇用形態<span class="required">*</span></legend>
            <div class="checkbox-group">
              <label class="checkbox-item">
                <input v-model="form.employmentTypes" type="checkbox" value="正社員" />
                <span>正社員</span>
              </label>
              <label class="checkbox-item">
                <input v-model="form.employmentTypes" type="checkbox" value="契約社員" />
                <span>契約社員</span>
              </label>
              <label class="checkbox-item">
                <input v-model="form.employmentTypes" type="checkbox" value="派遣社員" />
                <span>派遣社員</span>
              </label>
              <label class="checkbox-item">
                <input v-model="form.employmentTypes" type="checkbox" value="業務委託" />
                <span>業務委託</span>
              </label>
            </div>
          </fieldset>
        </section>

        <section class="card">
          <h2>詳細情報</h2>

          <label>
            業種/職種<span class="required">*</span>
            <textarea
              v-model="form.industryAndRole"
              rows="4"
              placeholder="自由記述で入力してください"
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
            年齢
            <input
              v-model="form.targetAge"
              type="text"
              placeholder="例：25〜35歳"
            />
          </label>

          <label>
            性別
            <input
              v-model="form.targetGender"
              type="text"
              placeholder="例：不問"
            />
          </label>

          <label>
            希望職種
            <input
              v-model="form.targetJob"
              type="text"
              placeholder="例：フロントエンドエンジニア"
            />
          </label>
        </section>

        <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>

        <div class="actions">
          <button type="button" class="cancel-button" @click="handleCancel">キャンセル</button>
          <button type="submit" class="submit-button">保存してスカウトを送信</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'

interface JobDraftForm {
  companyName: string
  coreJobType: string
  salary: string
  employmentTypes: string[]
  industryAndRole: string
  requirements: string
  benefits: string
  freeText: string
  targetAge: string
  targetGender: string
  targetJob: string
}

const initialForm: JobDraftForm = {
  companyName: '',
  coreJobType: '',
  salary: '',
  employmentTypes: [],
  industryAndRole: '',
  requirements: '',
  benefits: '',
  freeText: '',
  targetAge: '',
  targetGender: '',
  targetJob: '',
}

const form = reactive<JobDraftForm>({ ...initialForm })
const errorMessage = ref('')

function handleBack() {
  window.history.back()
}

function handleCancel() {
  resetForm()
  errorMessage.value = ''
}

function handleSubmit() {
  errorMessage.value = ''

  if (form.employmentTypes.length === 0) {
    errorMessage.value = '雇用形態を1つ以上選択してください'
    return
  }

  // 今回はフォーム作成までを対象にし、送信処理は次実装でAPI接続する。
  window.alert('保存してスカウトを送信しました（画面実装版）')
}

function resetForm() {
  form.companyName = initialForm.companyName
  form.coreJobType = initialForm.coreJobType
  form.salary = initialForm.salary
  form.employmentTypes = [...initialForm.employmentTypes]
  form.industryAndRole = initialForm.industryAndRole
  form.requirements = initialForm.requirements
  form.benefits = initialForm.benefits
  form.freeText = initialForm.freeText
  form.targetAge = initialForm.targetAge
  form.targetGender = initialForm.targetGender
  form.targetJob = initialForm.targetJob
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

.fieldset {
  margin: 0;
  border: 1px solid #d9e2ec;
  border-radius: 8px;
  padding: 12px;
}

.fieldset legend {
  padding: 0 6px;
  font-size: 0.9rem;
  font-weight: 600;
}

.checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.checkbox-item {
  display: inline-flex;
  align-items: center;
  flex-direction: row;
  gap: 6px;
  font-weight: 500;
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
