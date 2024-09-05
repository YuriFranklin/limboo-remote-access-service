import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { IsObject, IsOptional } from 'class-validator';
import GraphQLJSON from 'graphql-type-json';

export enum RequestTypes {
  USE_DEVICE = 'use_device',
}

export enum RequestStatus {
  PENDING = 'pending',
  REJECTED = 'rejected',
  APPROVED = 'approved',
}

registerEnumType(RequestTypes, {
  name: 'RequestTypes',
});

registerEnumType(RequestStatus, {
  name: 'RequestStatus',
});

@ObjectType()
export class Requirement {
  @Field(() => ID)
  id: string;

  @Field()
  ownerId: string;

  @Field()
  requesterId: string;

  @Field(() => Date)
  requestedAt: Date;

  @Field(() => Date)
  respondedAt: Date;

  @Field(() => RequestStatus)
  status: RequestStatus = RequestStatus.PENDING;

  @Field(() => RequestTypes)
  type: RequestTypes;

  @Field(() => GraphQLJSON, { nullable: true })
  @IsOptional()
  @IsObject()
  payload?: unknown;
}
