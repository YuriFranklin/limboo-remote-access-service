import { InputType, Field } from '@nestjs/graphql';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { SpecsInput } from './specs.input';
import { Type } from 'class-transformer';

@InputType()
export class PatchDeviceInput {
  @Field()
  @IsString()
  @IsOptional()
  @IsNotEmpty({ message: 'Cannot be empty.' })
  name?: string;

  @Field(() => [String])
  @IsArray()
  @IsOptional()
  coOwnersId?: string[];

  @Field()
  @IsBoolean()
  @IsNotEmpty({ message: 'Cannot be empty.' })
  @IsOptional()
  canHostConnections?: boolean;

  @Field(() => SpecsInput)
  @ValidateNested()
  @Type(() => SpecsInput)
  @IsOptional()
  specs?: SpecsInput;
}
