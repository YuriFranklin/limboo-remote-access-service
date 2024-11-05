import { Field, Int, ObjectType } from '@nestjs/graphql';
import { ExtendedDevice } from '../device.entity';

@ObjectType()
export class DevicePagination {
  @Field(() => Int)
  limit: number;

  @Field(() => Int)
  totalCount: number;

  @Field(() => Int)
  totalPages: number;
}

@ObjectType()
export class GetAllDeviceOutput {
  @Field(() => [ExtendedDevice])
  devices: ExtendedDevice[];

  @Field(() => DevicePagination)
  pagination: DevicePagination;
}
