import { InputType, Field } from '@nestjs/graphql';
import { WatcherInput } from './watcher.input';

@InputType()
export class CreateSessionInput {
  @Field()
  deviceId: string;

  @Field(() => [WatcherInput], { nullable: true })
  watchers?: WatcherInput[];
}
