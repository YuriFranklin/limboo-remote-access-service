import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  RequestStatus,
  RequestTypes,
  Requirement,
} from 'src/requirement/requirement.entity';
import { RequirementService } from 'src/requirement/requirement.service';
import { DeviceService } from './device.service';

@Controller('device')
export class DeviceController {
  constructor(
    private readonly requirementService: RequirementService,
    private readonly deviceService: DeviceService,
  ) {}

  @MessagePattern('requirements:update')
  async update(@Payload() id: string): Promise<void> {
    const requirement = await this.requirementService.findRequirementById(id);

    if (
      requirement.type === RequestTypes.USE_DEVICE &&
      requirement.status === RequestStatus.APPROVED
    ) {
      const typedRequirement = requirement as Requirement & {
        payload: { deviceId: string };
      };

      this.deviceService.addCoOwner(
        typedRequirement.payload.deviceId,
        requirement.requesterId,
      );
    }
  }
}
