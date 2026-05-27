import type {
  GenerateScoutDraftRequest,
  GenerateScoutDraftResponse,
  GeneratedScoutSample,
} from '../type/scout'
import { apiClient } from './client'

export async function fetchGeneratedScoutSample(): Promise<GeneratedScoutSample> {
  const { data } = await apiClient.get<GeneratedScoutSample>('/api/ai/generate')
  return data
}

export async function generateScoutDraft(
  payload: GenerateScoutDraftRequest,
): Promise<GenerateScoutDraftResponse> {
  const { data } = await apiClient.post<GenerateScoutDraftResponse>(
    '/api/scout-drafts/generate',
    payload,
  )
  return data
}
