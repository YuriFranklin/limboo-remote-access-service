import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Device } from 'src/device/device.entity';
import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { BeforeUpdate } from 'typeorm';

@ObjectType()
@Entity()
export class Session {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => ID)
  id: string;

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

  @Column({ nullable: true })
  @Field(() => String, { nullable: true })
  duration: string;

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

  @Column({ nullable: true })
  deviceId: string;

  @ManyToMany(() => Device, { eager: true, nullable: true })
  @JoinTable()
  @Field(() => [Device], { nullable: true })
  watchers?: Device[];
}
