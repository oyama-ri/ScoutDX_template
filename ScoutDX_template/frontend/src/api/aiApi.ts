import type { GeneratedScoutSample } from '../type/scout'
import { apiClient } from './client'

export async function fetchGeneratedScoutSample(): Promise<GeneratedScoutSample> {
  const { data } = await apiClient.get<GeneratedScoutSample>('/api/ai/generate')
  return data
}
