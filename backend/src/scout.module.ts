import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiGenerateController } from './controller/ai-generate.controller';
import { ScoutController } from './controller/scout.controller';
import { ScoutRepository } from './repository/scout.repository';
import { AiGenerateService } from './service/ai-generate.service';
import { ScoutService } from './service/scout.service';
import { ScoutEntity } from './type/scout';

@Module({
  imports: [TypeOrmModule.forFeature([ScoutEntity])],
  controllers: [ScoutController, AiGenerateController],
  providers: [ScoutService, ScoutRepository, AiGenerateService],
})
export class ScoutModule {}
