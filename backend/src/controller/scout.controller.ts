import { Body, Controller, Get, Post } from '@nestjs/common';
import { ScoutService } from '../service/scout.service';
import { ScoutEntity } from '../type/scout';

@Controller('api/scouts')
export class ScoutController {
  constructor(private readonly scoutService: ScoutService) {}

  @Get()
  findAll() {
    return this.scoutService.findAll();
  }

  @Post()
  create(@Body() body: ScoutEntity) {
    return this.scoutService.create(body);
  }
}
