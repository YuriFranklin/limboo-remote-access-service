import { Field, ObjectType, Int } from '@nestjs/graphql';

@ObjectType()
export class Specs {
  @Field()
  cpuName: string;

  @Field(() => Int)
  ram: number;

  @Field(() => Int)
  diskTotal: number;

  @Field()
  architecture: string;

  @Field()
  platform: string;

  @Field()
  os: string;
}
