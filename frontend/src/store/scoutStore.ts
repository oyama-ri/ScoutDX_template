import { defineStore } from 'pinia'
import { createScout, fetchScouts } from '../api/scoutApi'
import type { ScoutEntity } from '../type/scout'

interface ScoutState {
  scouts: ScoutEntity[]
  loading: boolean
  error: string | null
}

export const useScoutStore = defineStore('scout', {
  state: (): ScoutState => ({
    scouts: [],
    loading: false,
    error: null,
  }),

  actions: {
    async loadScouts() {
      this.loading = true
      this.error = null
      try {
        this.scouts = await fetchScouts()
      } catch (e) {
        this.error = 'スカウト文の取得に失敗しました'
        console.error(e)
      } finally {
        this.loading = false
      }
    },

    async addScout(payload: ScoutEntity) {
      this.loading = true
      this.error = null
      try {
        await createScout(payload)
        await this.loadScouts()
      } catch (e) {
        this.error = 'スカウト文の作成に失敗しました'
        console.error(e)
        throw e
      } finally {
        this.loading = false
      }
    },
  },
})
