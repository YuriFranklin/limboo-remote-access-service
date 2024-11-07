import { Field, ID, Int, ObjectType, registerEnumType } from '@nestjs/graphql';
import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Specs } from './specs.entity';
import { User } from 'src/user/user.entity';
import { IsOptional } from 'class-validator';

@ObjectType()
export class CachedDevice {
  @Field(() => DeviceStatus)
  status: DeviceStatus;

  @Field()
  updatedAt: string;

  @Field(() => Int)
  retries: number;

  @Field(() => String, { nullable: true })
  ip?: string;

  @Field(() => Date, { nullable: true })
  iddle?: Date;

  @Field(() => [String], { nullable: true })
  socketIds?: string[];

  @Field(() => [String], { nullable: true })
  hostingSessions?: string[];

  @Field(() => [String], { nullable: true })
  watchingSessions?: string[];

  @Field(() => String)
  accountId: string;
}

export enum DeviceStatus {
  HOSTING = 'hosting',
  AVAILABLE = 'available',
  OFFLINE = 'offline',
  NOT_RESPONDING = 'not responding',
  UNKNOWN = 'unknown',
}

registerEnumType(DeviceStatus, {
  name: 'DeviceStatus',
});

@ObjectType()
@Entity()
export class Device {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => ID)
  id: string;

  @Column()
  @Field()
  name: string;

  @Column()
  @Field()
  loggedUserName: string;

  @Column({ unique: true })
  @Field()
  mac: string;

  @Column()
  @Field()
  ownerId: string;

  @Field(() => User, { nullable: true })
  owner?: User;

  @Column({ type: 'json', nullable: true, array: true })
  @Field(() => [String], { nullable: true })
  @IsOptional()
  coOwnersId?: string[];

  @Field(() => [User], { nullable: true })
  coOwners?: User[];

  @Column()
  @Field()
  canHostConnections: boolean;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  @Field(() => Date)
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  @Field(() => Date)
  updatedAt: Date;

  @Field(() => DeviceStatus, { nullable: true })
  status?: DeviceStatus;

  @Column({ type: 'json', nullable: true })
  @Field(() => Specs)
  specs?: Specs;
}

@ObjectType()
export class ExtendedDevice extends Device {
  @Field(() => String, { nullable: true })
  status?: DeviceStatus;

  @Field({ nullable: true })
  retries?: number;

  @Field({ nullable: true })
  ip?: string;

  @Field(() => Date, { nullable: true })
  iddle?: Date;

  @Field(() => [String], { nullable: true })
  socketIds?: string[];

  @Field(() => [String], { nullable: true })
  hostingSessions?: string[];

  @Field(() => [String], { nullable: true })
  watchingSessions?: string[];
}
