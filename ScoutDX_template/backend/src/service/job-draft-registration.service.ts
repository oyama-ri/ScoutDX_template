import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { randomUUID } from 'crypto';
import {
  GenerateScoutDraftRequest,
  GenerateScoutDraftResponse,
  JobDraftInput,
  JobDraftResponse,
  SCOUT_STATUS,
  ScoutTextResponse,
  USER_ROLE,
} from '../type/workflow';
import { FixedTemplateScoutTextGeneratorService } from './fixed-template-scout-text-generator.service';

interface UserRow {
  id: string;
  role: string;
}

interface JobDraftRow {
  id: string;
  company_name: string;
  job_title: string;
  department_name: string | null;
  location: string;
  salary: string | null;
  working_hours: string;
  description: string;
  requirements: string;
  benefits: string;
  target_age: string;
  target_gender: string;
  target_job: string;
  free_text: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface ScoutTextRow {
  id: string;
  job_draft_id: string;
  title: string;
  body: string;
  status: string;
  created_by: string;
  version: number;
  created_at: string;
  updated_at: string;
}

@Injectable()
export class JobDraftRegistrationService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly scoutTextGenerator: FixedTemplateScoutTextGeneratorService,
  ) {}

  async generateDraftFromJobDraft(
    request: GenerateScoutDraftRequest,
  ): Promise<GenerateScoutDraftResponse> {
    this.validateRequest(request);

    const normalizedJobDraft = this.normalizeJobDraft(request.jobDraft);

    return this.dataSource.transaction(async (manager) => {
      const actorUserId = await this.resolveActorUserId(
        manager,
        request.actorUserId,
      );

      const jobDraftId = randomUUID();
      const scoutTextId = randomUUID();
      const generatedScout = this.scoutTextGenerator.generateFromJobDraft(
        normalizedJobDraft,
      );

      await manager.query(
        `INSERT INTO job_drafts (
          id, company_name, job_title, department_name, location, salary, working_hours,
          description, requirements, benefits, target_age, target_gender, target_job, free_text, created_by
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11, $12, $13, $14, $15
        )`,
        [
          jobDraftId,
          normalizedJobDraft.companyName,
          normalizedJobDraft.jobTitle,
          normalizedJobDraft.departmentName ?? null,
          normalizedJobDraft.location,
          normalizedJobDraft.salary ?? null,
          normalizedJobDraft.workingHours,
          normalizedJobDraft.description,
          normalizedJobDraft.requirements,
          normalizedJobDraft.benefits,
          normalizedJobDraft.targetAge,
          normalizedJobDraft.targetGender,
          normalizedJobDraft.targetJob,
          normalizedJobDraft.freeText ?? null,
          actorUserId,
        ],
      );

      await manager.query(
        `INSERT INTO scout_texts (
          id, job_draft_id, title, body, status, created_by, version
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7
        )`,
        [
          scoutTextId,
          jobDraftId,
          generatedScout.title,
          generatedScout.body,
          SCOUT_STATUS.DRAFT,
          actorUserId,
          1,
        ],
      );

      const jobDraftRows = (await manager.query(
        'SELECT * FROM job_drafts WHERE id = $1',
        [jobDraftId],
      )) as JobDraftRow[];
      const scoutTextRows = (await manager.query(
        'SELECT * FROM scout_texts WHERE id = $1',
        [scoutTextId],
      )) as ScoutTextRow[];

      if (jobDraftRows.length === 0 || scoutTextRows.length === 0) {
        throw new InternalServerErrorException(
          '生成結果の読み取りに失敗しました',
        );
      }

      return {
        jobDraft: this.mapJobDraftRow(jobDraftRows[0]),
        scoutText: this.mapScoutTextRow(scoutTextRows[0]),
      };
    });
  }

  private validateRequest(request: GenerateScoutDraftRequest): void {
    if (!request || typeof request !== 'object') {
      throw new BadRequestException('リクエスト形式が不正です');
    }

    if (!request.jobDraft) {
      throw new BadRequestException('jobDraftは必須です');
    }

    this.assertRequiredText(request.jobDraft.companyName, 'companyName');
    this.assertRequiredText(request.jobDraft.jobTitle, 'jobTitle');
    this.assertRequiredText(request.jobDraft.location, 'location');
    this.assertRequiredText(request.jobDraft.workingHours, 'workingHours');
    this.assertRequiredText(request.jobDraft.description, 'description');
    this.assertRequiredText(request.jobDraft.requirements, 'requirements');
    this.assertRequiredText(request.jobDraft.benefits, 'benefits');
    this.assertRequiredText(request.jobDraft.targetAge, 'targetAge');
    this.assertRequiredText(request.jobDraft.targetGender, 'targetGender');
    this.assertRequiredText(request.jobDraft.targetJob, 'targetJob');
  }

  private assertRequiredText(value: string | undefined, field: string): void {
    if (!value || !value.trim()) {
      throw new BadRequestException(`${field}は必須です`);
    }
  }

  private async resolveActorUserId(
    manager: EntityManager,
    requestedActorUserId?: string,
  ): Promise<string> {
    const trimmedActorUserId = requestedActorUserId?.trim();

    if (trimmedActorUserId) {
      const requestedUsers = (await manager.query(
        'SELECT id, role FROM users WHERE id = $1',
        [trimmedActorUserId],
      )) as UserRow[];

      if (requestedUsers.length === 0) {
        throw new BadRequestException('指定されたユーザーが存在しません');
      }

      if (requestedUsers[0].role !== USER_ROLE.CREATOR) {
        throw new BadRequestException('作成者ユーザーのみドラフト生成できます');
      }

      return trimmedActorUserId;
    }

    const creatorUsers = (await manager.query(
      'SELECT id, role FROM users WHERE role = $1 ORDER BY id ASC LIMIT 1',
      [USER_ROLE.CREATOR],
    )) as UserRow[];

    if (creatorUsers.length === 0) {
      throw new BadRequestException('作成者ユーザーが存在しません');
    }

    return creatorUsers[0].id;
  }

  private normalizeJobDraft(input: JobDraftInput): JobDraftInput {
    return {
      companyName: input.companyName.trim(),
      jobTitle: input.jobTitle.trim(),
      departmentName: input.departmentName?.trim() || undefined,
      location: input.location.trim(),
      salary: input.salary?.trim() || undefined,
      workingHours: input.workingHours.trim(),
      description: input.description.trim(),
      requirements: input.requirements.trim(),
      benefits: input.benefits.trim(),
      targetAge: input.targetAge.trim(),
      targetGender: input.targetGender.trim(),
      targetJob: input.targetJob.trim(),
      freeText: input.freeText?.trim() || undefined,
    };
  }

  private mapJobDraftRow(row: JobDraftRow): JobDraftResponse {
    return {
      id: row.id,
      companyName: row.company_name,
      jobTitle: row.job_title,
      departmentName: row.department_name ?? undefined,
      location: row.location,
      salary: row.salary ?? undefined,
      workingHours: row.working_hours,
      description: row.description,
      requirements: row.requirements,
      benefits: row.benefits,
      targetAge: row.target_age,
      targetGender: row.target_gender,
      targetJob: row.target_job,
      freeText: row.free_text ?? undefined,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapScoutTextRow(row: ScoutTextRow): ScoutTextResponse {
    return {
      id: row.id,
      jobDraftId: row.job_draft_id,
      title: row.title,
      body: row.body,
      status: row.status as ScoutTextResponse['status'],
      createdBy: row.created_by,
      version: row.version,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
