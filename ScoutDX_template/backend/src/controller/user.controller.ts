import { Controller, Get } from '@nestjs/common';
import { CreatorUserResponse } from '../type/workflow';
import { UserService } from '../service/user.service';

@Controller('api/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('creators')
  findCreators(): Promise<CreatorUserResponse[]> {
    return this.userService.findCreators();
  }
}
