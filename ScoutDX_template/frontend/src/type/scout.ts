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

export type UserRole = 'CREATOR' | 'SALES_APPROVER' | 'ADMIN'

export type ScoutStatus =
  | 'DRAFT'
  | 'PENDING_SALES'
  | 'PENDING_MANAGER'
  | 'REJECTED'
  | 'AVAILABLE'

export interface JobDraftInput {
  companyName: string
  jobTitle: string
  departmentName?: string
  location: string
  salary?: string
  workingHours: string
  description: string
  requirements: string
  benefits: string
  targetAge: string
  targetGender: string
  targetJob: string
  freeText?: string
}

export interface GenerateScoutDraftRequest {
  actorUserId?: string
  jobDraft: JobDraftInput
}

export interface JobDraftResponse {
  id: string
  companyName: string
  jobTitle: string
  departmentName?: string
  location: string
  salary?: string
  workingHours: string
  description: string
  requirements: string
  benefits: string
  targetAge: string
  targetGender: string
  targetJob: string
  freeText?: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface ScoutTextResponse {
  id: string
  jobDraftId: string
  title: string
  body: string
  status: ScoutStatus
  createdBy: string
  version: number
  createdAt: string
  updatedAt: string
}

export interface GenerateScoutDraftResponse {
  jobDraft: JobDraftResponse
  scoutText: ScoutTextResponse
}

export interface CreatorUser {
  id: string
  name: string
  role: UserRole
}
