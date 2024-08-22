import { ArgsType, Field, Int, registerEnumType } from '@nestjs/graphql';
import { Device } from '../device.entity';

export enum OrderDirection {
  ASC = 'ASC',
  DESC = 'DESC',
}

registerEnumType(OrderDirection, {
  name: 'OrderDirection',
});

@ArgsType()
export class GetAllDeviceInput {
  @Field(() => Int, { defaultValue: 100, nullable: true })
  limit?: number;

  @Field(() => Int, { defaultValue: 0, nullable: true })
  offset?: number;

  @Field({ nullable: true })
  userId?: string;

  @Field({ nullable: true })
  orderBy?: keyof Device;

  @Field(() => OrderDirection, {
    nullable: true,
    defaultValue: OrderDirection.ASC,
  })
  orderDirection?: OrderDirection;
}
