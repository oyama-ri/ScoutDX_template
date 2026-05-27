import { Controller, Get } from '@nestjs/common';
import { AiGenerateService } from '../service/ai-generate.service';

@Controller('api/ai')
export class AiGenerateController {
  constructor(private readonly aiGenerateService: AiGenerateService) {}

  @Get('generate')
  generate() {
    return this.aiGenerateService.getSample();
  }
}
