import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { IsObject, IsOptional } from 'class-validator';
import GraphQLJSON from 'graphql-type-json';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

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
@Entity()
export class Requirement {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => ID)
  id: string;

  @Column()
  @Field()
  ownerId: string;

  @Column()
  @Field()
  requesterId: string;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  @Field(() => Date)
  requestedAt: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  @Field(() => Date)
  respondedAt: Date;

  @Field(() => RequestStatus)
  @Column()
  status: RequestStatus = RequestStatus.PENDING;

  @Field(() => RequestTypes)
  @Column()
  type: RequestTypes;

  @Field(() => GraphQLJSON, { nullable: true })
  @IsOptional()
  @IsObject()
  @Column({
    type: 'json',
    nullable: true,
  })
  payload?: unknown;
}
