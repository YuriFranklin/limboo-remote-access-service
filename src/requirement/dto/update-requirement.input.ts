import { Field, InputType, registerEnumType } from '@nestjs/graphql';
import { IsEnum } from 'class-validator';
import { RequestStatus } from '../requirement.entity';

registerEnumType(RequestStatus, {
  name: 'RequestStatus',
});

@InputType()
export class UpdateRequirementInput {
  @Field(() => RequestStatus)
  @IsEnum(RequestStatus, {
    message: 'Type must be a valid RequestStatus value.',
  })
  status: RequestStatus;
}
