import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { GenerateScoutDraftResponse } from '../type/scout'

export const useScoutDraftFlowStore = defineStore('scoutDraftFlow', () => {
  const generatedDraft = ref<GenerateScoutDraftResponse | null>(null)

  function setGeneratedDraft(payload: GenerateScoutDraftResponse) {
    generatedDraft.value = payload
  }

  function clearGeneratedDraft() {
    generatedDraft.value = null
  }

  return {
    generatedDraft,
    setGeneratedDraft,
    clearGeneratedDraft,
  }
})
