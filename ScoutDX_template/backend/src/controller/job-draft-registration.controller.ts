import { Body, Controller, Post } from '@nestjs/common';
import { JobDraftRegistrationService } from '../service/job-draft-registration.service';
import {
  GenerateScoutDraftRequest,
  GenerateScoutDraftResponse,
} from '../type/workflow';

@Controller('api/scout-drafts')
export class JobDraftRegistrationController {
  constructor(
    private readonly jobDraftRegistrationService: JobDraftRegistrationService,
  ) {}

  @Post('generate')
  generateDraft(
    @Body() body: GenerateScoutDraftRequest,
  ): Promise<GenerateScoutDraftResponse> {
    return this.jobDraftRegistrationService.generateDraftFromJobDraft(body);
  }
}
