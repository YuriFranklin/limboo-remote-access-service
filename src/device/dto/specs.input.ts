import { InputType, Field, Int } from '@nestjs/graphql';
import { IsString, IsInt } from 'class-validator';

@InputType()
export class SpecsInput {
  @Field()
  @IsString()
  cpuName: string;

  @Field(() => Int)
  @IsInt()
  ram: number;

  @Field(() => Int)
  @IsInt()
  diskTotal: number;

  @Field()
  @IsString()
  architecture: string;

  @Field()
  @IsString()
  platform: string;

  @Field()
  @IsString()
  os: string;
}
