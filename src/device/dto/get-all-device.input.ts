import { ArgsType, Field, Int, registerEnumType } from '@nestjs/graphql';

export enum DeviceOrderBy {
  ID = 'id',
  NAME = 'name',
  LOGGED_USER_NAME = 'loggedUserName',
  MAC = 'mac',
  OWNER_ID = 'ownerId',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  STATUS = 'status',
}

registerEnumType(DeviceOrderBy, {
  name: 'DeviceOrderBy',
});

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

  @Field(() => DeviceOrderBy, { nullable: true })
  orderBy?: DeviceOrderBy;

  @Field(() => OrderDirection, {
    nullable: true,
    defaultValue: OrderDirection.ASC,
  })
  orderDirection?: OrderDirection;
}
