import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class WatcherInput {
  @Field()
  id: string;

  @Field()
  isControlling?: boolean;
}
