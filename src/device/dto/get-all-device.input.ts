import { ArgsType, Field, Int } from '@nestjs/graphql';

@ArgsType()
export class GetAllDeviceInput {
  @Field(() => Int, { defaultValue: 100, nullable: true })
  limit?: number;

  @Field(() => Int, { defaultValue: 0, nullable: true })
  offset?: number;

  @Field({ nullable: true })
  userId?: string;
}
