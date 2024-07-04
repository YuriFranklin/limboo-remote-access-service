import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Device } from '../device.entity';

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
  @Field(() => [Device])
  devices: Device[];

  @Field(() => DevicePagination)
  pagination: DevicePagination;
}
