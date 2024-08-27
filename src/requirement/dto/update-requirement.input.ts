import { Field, InputType } from '@nestjs/graphql';
import { IsEnum } from 'class-validator';
import { RequestStatus } from '../requirement.entity';

@InputType()
export class UpdateRequirementInput {
  @Field(() => RequestStatus)
  @IsEnum(RequestStatus, {
    message: 'Type must be a valid RequestStatus value.',
  })
  status: RequestStatus;
}
