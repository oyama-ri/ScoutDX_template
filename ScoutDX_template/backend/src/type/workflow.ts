export const USER_ROLE = {
  CREATOR: 'CREATOR',
  SALES_APPROVER: 'SALES_APPROVER',
  ADMIN: 'ADMIN',
} as const;

export type UserRole = (typeof USER_ROLE)[keyof typeof USER_ROLE];

export const SCOUT_STATUS = {
  DRAFT: 'DRAFT',
  PENDING_SALES: 'PENDING_SALES',
  PENDING_MANAGER: 'PENDING_MANAGER',
  REJECTED: 'REJECTED',
  AVAILABLE: 'AVAILABLE',
} as const;

export type ScoutStatus = (typeof SCOUT_STATUS)[keyof typeof SCOUT_STATUS];

export const APPROVAL_ACTION = {
  SUBMIT: 'SUBMIT',
  SALES_APPROVE: 'SALES_APPROVE',
  SALES_REJECT: 'SALES_REJECT',
  MANAGER_APPROVE: 'MANAGER_APPROVE',
  MANAGER_REJECT: 'MANAGER_REJECT',
} as const;

export type ApprovalAction =
  (typeof APPROVAL_ACTION)[keyof typeof APPROVAL_ACTION];

export interface JobDraftInput {
  companyName: string;
  jobTitle: string;
  departmentName?: string;
  location: string;
  salary?: string;
  workingHours: string;
  description: string;
  requirements: string;
  benefits: string;
  targetAge: string;
  targetGender: string;
  targetJob: string;
  freeText?: string;
}

export interface GenerateScoutDraftRequest {
  actorUserId?: string;
  jobDraft: JobDraftInput;
}

export interface JobDraftResponse {
  id: string;
  companyName: string;
  jobTitle: string;
  departmentName?: string;
  location: string;
  salary?: string;
  workingHours: string;
  description: string;
  requirements: string;
  benefits: string;
  targetAge: string;
  targetGender: string;
  targetJob: string;
  freeText?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScoutTextResponse {
  id: string;
  jobDraftId: string;
  title: string;
  body: string;
  status: ScoutStatus;
  createdBy: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface GenerateScoutDraftResponse {
  jobDraft: JobDraftResponse;
  scoutText: ScoutTextResponse;
}

export interface CreatorUserResponse {
  id: string;
  name: string;
  role: UserRole;
}

export interface GeneratedScoutContent {
  title: string;
  body: string;
}

export interface SubmitApprovalRequest {
  actorUserId: string;
}

export interface SubmitApprovalResponse {
  scoutText: ScoutTextResponse;
}
