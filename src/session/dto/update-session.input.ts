import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class UpdateSessionInput {
  @Field({ nullable: true })
  duration?: string;

  @Field(() => [String], { nullable: true })
  watchers?: string[];
}
