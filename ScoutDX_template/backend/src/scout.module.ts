import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiGenerateController } from './controller/ai-generate.controller';
import { JobDraftRegistrationController } from './controller/job-draft-registration.controller';
import { ScoutApprovalRequestController } from './controller/scout-approval-request.controller';
import { ScoutController } from './controller/scout.controller';
import { UserController } from './controller/user.controller';
import { ScoutRepository } from './repository/scout.repository';
import { AiGenerateService } from './service/ai-generate.service';
import { FixedTemplateScoutTextGeneratorService } from './service/fixed-template-scout-text-generator.service';
import { JobDraftRegistrationService } from './service/job-draft-registration.service';
import { ScoutApprovalRequestService } from './service/scout-approval-request.service';
import { ScoutService } from './service/scout.service';
import { UserService } from './service/user.service';
import { ScoutEntity } from './type/scout';

@Module({
  imports: [TypeOrmModule.forFeature([ScoutEntity])],
  controllers: [
    ScoutController,
    AiGenerateController,
    JobDraftRegistrationController,
    ScoutApprovalRequestController,
    UserController,
  ],
  providers: [
    ScoutService,
    ScoutRepository,
    AiGenerateService,
    JobDraftRegistrationService,
    FixedTemplateScoutTextGeneratorService,
    ScoutApprovalRequestService,
    UserService,
  ],
})
export class ScoutModule {}
