import { BadRequestException, Injectable } from '@nestjs/common';
import { ScoutRepository } from '../repository/scout.repository';
import { ScoutEntity } from '../type/scout';
import { canEditByCreator, isValidStatus, ScoutStatus } from '../store/statusうウェイター';

@Injectable()
export class ScoutService {
  constructor(private readonly scoutRepository: ScoutRepository) { }

  findAll(): Promise<ScoutEntity[]> {
    return this.scoutRepository.findAll();
  }

  async create(input: ScoutEntity): Promise<ScoutEntity> {
    if (!input.creator?.trim() || !input.title?.trim() || !input.body?.trim()) {
      throw new BadRequestException('作成者・タイトル・本文は必須です');
    }


    if (input.status !== undefined && !isValidStatus(input.status)) {
      throw new BadRequestException('不正なステータスです');
    }

    const requestedStatus = input.status ?? ScoutStatus.DRAFT;
    if (!canEditByCreator(requestedStatus)) {
      // 作成者の新規作成で承認待ち/利用可能を受け入れると業務フローを壊す
      throw new BadRequestException('作成時に指定できないステータスです');
    }

    const scout = new ScoutEntity();
    scout.id = this.generateId();
    scout.creator = input.creator.trim();
    scout.title = input.title.trim();
    scout.body = input.body.trim();
    scout.status = requestedStatus;

    return this.scoutRepository.save(scout);
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 9).toUpperCase();
  }
}