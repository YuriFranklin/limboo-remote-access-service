import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class CreateSessionInput {
  @Field()
  deviceId: string;

  @Field(() => [String], { nullable: true })
  watchers?: string[];
}
