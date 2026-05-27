/** スカウト文（API の JSON と同じ形。新規作成時は id / createdAt は未送信） */
export interface ScoutEntity {
  id?: string
  createdAt?: string
  creator: string
  title: string
  body: string
  status?: string
}

export interface GeneratedScoutSample {
  body: string
}
