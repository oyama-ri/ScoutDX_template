import { Body, Controller, Param, Post } from '@nestjs/common';
import { ScoutApprovalRequestService } from '../service/scout-approval-request.service';
import {
  SubmitApprovalRequest,
  SubmitApprovalResponse,
} from '../type/workflow';

@Controller('api/scout-texts')
export class ScoutApprovalRequestController {
  constructor(
    private readonly scoutApprovalRequestService: ScoutApprovalRequestService,
  ) {}

  @Post(':id/request')
  submitApprovalRequest(
    @Param('id') id: string,
    @Body() body: SubmitApprovalRequest,
  ): Promise<SubmitApprovalResponse> {
    return this.scoutApprovalRequestService.submitRequest(id, body);
  }
}
