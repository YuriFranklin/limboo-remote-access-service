import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  ManyToMany,
  JoinTable,
  Column,
  BeforeUpdate,
} from 'typeorm';
import { Device } from 'src/device/device.entity';
import { ObjectType, Field, ID } from '@nestjs/graphql';

export type CachedSession = {
  hostId: string;
  watchersId: string;
  createdAt: Date;
};

@ObjectType()
@Entity()
export class Session {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => ID)
  id: string;

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

  @Column({ nullable: true })
  @Field(() => String, { nullable: true })
  duration?: string;

  @BeforeUpdate()
  calculateDuration() {
    const diff = Math.abs(this.updatedAt.getTime() - this.createdAt.getTime());
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    this.duration = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  @ManyToOne(() => Device, { eager: true })
  @JoinColumn({ name: 'deviceId' })
  @Field(() => Device, { nullable: true })
  hostDevice: Device;

  @Column()
  deviceId: string;

  @ManyToMany(() => Device, { eager: true, nullable: true })
  @JoinTable()
  @Field(() => [Device], { nullable: true })
  watchers?: Device[];
}
