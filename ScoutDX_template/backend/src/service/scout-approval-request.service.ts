import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DataSource } from 'typeorm';
import {
  APPROVAL_ACTION,
  SCOUT_STATUS,
  ScoutTextResponse,
  SubmitApprovalRequest,
  SubmitApprovalResponse,
  USER_ROLE,
} from '../type/workflow';

interface UserRow {
  id: string;
  role: string;
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
export class ScoutApprovalRequestService {
  constructor(private readonly dataSource: DataSource) {}

  async submitRequest(
    scoutTextId: string,
    request: SubmitApprovalRequest,
  ): Promise<SubmitApprovalResponse> {
    if (!scoutTextId?.trim()) {
      throw new BadRequestException('scoutTextIdは必須です');
    }

    if (!request?.actorUserId?.trim()) {
      throw new BadRequestException('actorUserIdは必須です');
    }

    const normalizedScoutTextId = scoutTextId.trim();
    const normalizedActorId = request.actorUserId.trim();

    return this.dataSource.transaction(async (manager) => {
      const users = (await manager.query(
        'SELECT id, role FROM users WHERE id = $1',
        [normalizedActorId],
      )) as UserRow[];

      if (users.length === 0) {
        throw new BadRequestException('指定されたユーザーが存在しません');
      }

      if (users[0].role !== USER_ROLE.CREATOR) {
        throw new ForbiddenException('作成者のみ承認申請できます');
      }

      const scoutTextRows = (await manager.query(
        'SELECT * FROM scout_texts WHERE id = $1',
        [normalizedScoutTextId],
      )) as ScoutTextRow[];

      if (scoutTextRows.length === 0) {
        throw new NotFoundException('対象のスカウト文が見つかりません');
      }

      const currentScoutText = scoutTextRows[0];

      if (currentScoutText.created_by !== normalizedActorId) {
        throw new ForbiddenException(
          '自分が作成したスカウト文のみ承認申請できます',
        );
      }

      const canSubmit =
        currentScoutText.status === SCOUT_STATUS.DRAFT ||
        currentScoutText.status === SCOUT_STATUS.REJECTED;

      if (!canSubmit) {
        throw new ConflictException(
          '下書きまたは差戻し状態のみ承認申請できます',
        );
      }

      await manager.query(
        `UPDATE scout_texts
         SET status = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [SCOUT_STATUS.PENDING_SALES, normalizedScoutTextId],
      );

      await manager.query(
        `INSERT INTO approval_histories (
          id, scout_text_id, actor_id, action_type, from_status, to_status, comment
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7
        )`,
        [
          randomUUID(),
          normalizedScoutTextId,
          normalizedActorId,
          APPROVAL_ACTION.SUBMIT,
          currentScoutText.status,
          SCOUT_STATUS.PENDING_SALES,
          null,
        ],
      );

      const updatedRows = (await manager.query(
        'SELECT * FROM scout_texts WHERE id = $1',
        [normalizedScoutTextId],
      )) as ScoutTextRow[];

      return {
        scoutText: this.mapScoutTextRow(updatedRows[0]),
      };
    });
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
