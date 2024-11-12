import { ObjectType, Field } from '@nestjs/graphql';
import { Session } from '../session.entity';
import { ExtendedDevice } from 'src/device/device.entity';

@ObjectType()
export class GetSessionOutput extends Session {
  @Field(() => Boolean, { nullable: true })
  isLiving?: boolean;

  @Field(() => [DeviceWithControl], { nullable: true })
  watchers?: DeviceWithControl[];
}

@ObjectType()
export class DeviceWithControl extends ExtendedDevice {
  @Field(() => Boolean)
  isControlling: boolean;
}
