import { ArgsType, Field, Int } from '@nestjs/graphql';
import { IsDateString, IsOptional } from 'class-validator';

@ArgsType()
export class GetAllSessionInput {
  @Field(() => Int, { defaultValue: 100, nullable: true })
  limit?: number;

  @Field(() => Int, { defaultValue: 0, nullable: true })
  offset?: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @Field({ nullable: true })
  deviceId?: string;
}
