import type { CreatorUser } from '../type/scout'
import { apiClient } from './client'

export async function fetchCreatorUsers(): Promise<CreatorUser[]> {
  const { data } = await apiClient.get<CreatorUser[]>('/api/users/creators')
  return data
}
