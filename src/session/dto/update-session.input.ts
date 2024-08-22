import { InputType, Field } from '@nestjs/graphql';
import { WatcherInput } from './watcher.input';

@InputType()
export class UpdateSessionInput {
  @Field({ nullable: true })
  duration?: string;

  @Field(() => [WatcherInput], { nullable: true })
  watchers?: WatcherInput[];
}
