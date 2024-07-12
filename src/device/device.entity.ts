import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Specs } from './specs.entity';

export type CachedDevice = {
  status: DeviceStatus;
  updatedAt: Date;
  retries: number;
};

export enum DeviceStatus {
  HOSTING = 'hosting',
  AVAILABLE = 'available',
  OFFLINE = 'offline',
  NOT_RESPONDING = 'not responding',
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

  @Column()
  @Field()
  mac: string;

  @Column()
  @Field()
  ownerId: string;

  @Column({ type: 'json', nullable: true })
  @Field(() => [String], { nullable: true })
  coOwnersId?: string[];

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
