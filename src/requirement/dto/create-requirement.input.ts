import { Field, InputType } from '@nestjs/graphql';
import {
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { RequestTypes } from '../requirement.entity';

@InputType()
export class CreateRequirementInput {
  @Field()
  @IsString()
  @IsNotEmpty({ message: 'Cannot be empty.' })
  ownerId: string;

  @Field(() => RequestTypes)
  @IsEnum(RequestTypes, { message: 'Type must be a valid RequestTypes value.' })
  type: RequestTypes;

  @Field(() => Object, { nullable: true })
  @IsOptional()
  @IsObject({ message: 'Payload must be an object.' })
  payload?: Record<string, any>;
}
