import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum DeviceStatus {
  HOSTING = 'hosting',
  AVAILABLE = 'available',
  OFFLINE = 'offline',
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
  name: string;

  @Column()
  loggedUserName: string;

  @Column()
  mac: string;

  @Column({ type: 'json' })
  ownersId: string[];

  @Column()
  canHostConnections: boolean;

  @CreateDateColumn({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  @Field(() => Date)
  createdAt: Date;

  @UpdateDateColumn({
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  @Field(() => Date)
  updatedAt: Date;

  @Field(() => DeviceStatus, { nullable: true })
  status?: DeviceStatus;
}
