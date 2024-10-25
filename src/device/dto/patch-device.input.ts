import { InputType, Field } from '@nestjs/graphql';
import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { SpecsInput } from './specs.input';
import { Type } from 'class-transformer';

@InputType()
export class PatchDeviceInput {
  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  name?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  loggedUserName?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  mac?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  ownerId?: string;

  @Field(() => [String], { nullable: true })
  @IsArray()
  @IsOptional()
  coOwnersId?: string[];

  @Field({ nullable: true })
  @IsBoolean()
  @IsOptional()
  canHostConnections?: boolean;

  @Field(() => SpecsInput, { nullable: true })
  @ValidateNested()
  @Type(() => SpecsInput)
  @IsOptional()
  specs?: SpecsInput;
}
