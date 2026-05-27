import { BadRequestException, Injectable } from '@nestjs/common';
import { ScoutRepository } from '../repository/scout.repository';
import { ScoutEntity } from '../type/scout';

@Injectable()
export class ScoutService {
  constructor(private readonly scoutRepository: ScoutRepository) {}

  findAll(): Promise<ScoutEntity[]> {
    return this.scoutRepository.findAll();
  }

  async create(input: ScoutEntity): Promise<ScoutEntity> {
    if (!input.creator?.trim() || !input.title?.trim() || !input.body?.trim()) {
      throw new BadRequestException('作成者・タイトル・本文は必須です');
    }

    const scout = new ScoutEntity();
    scout.id = this.generateId();
    scout.creator = input.creator.trim();
    scout.title = input.title.trim();
    scout.body = input.body.trim();
    scout.status = input.status?.trim() || 'DRAFT';

    return this.scoutRepository.save(scout);
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 9).toUpperCase();
  }
}
