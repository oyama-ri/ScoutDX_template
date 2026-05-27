import { Injectable } from '@nestjs/common';
import {
  GeneratedScoutContent,
  JobDraftInput,
} from '../type/workflow';
import { ScoutTextGenerator } from './scout-text-generator.interface';

@Injectable()
export class FixedTemplateScoutTextGeneratorService
  implements ScoutTextGenerator
{
  generateFromJobDraft(input: JobDraftInput): GeneratedScoutContent {
    const title = `${input.companyName} ${input.jobTitle}のご案内`;
    const body =
      `はじめまして。${input.companyName}の採用担当です。\n\n` +
      `このたび、${input.jobTitle}のポジションでご連絡いたしました。\n` +
      `勤務地は${input.location}、勤務時間は${input.workingHours}を想定しています。\n\n` +
      `【業務内容】\n${input.description}\n\n` +
      `【必須条件】\n${input.requirements}\n\n` +
      `【福利厚生・待遇】\n${input.benefits}\n\n` +
      `ご興味をお持ちいただけましたら、ぜひ一度お話しさせてください。`;

    return { title, body };
  }
}
