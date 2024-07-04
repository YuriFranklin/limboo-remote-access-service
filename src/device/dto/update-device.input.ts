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
export class UpdateDeviceInput {
  @Field()
  @IsString()
  @IsNotEmpty({ message: 'Cannot be empty.' })
  @IsOptional()
  name: string;

  @Field()
  @IsString()
  @IsNotEmpty({ message: 'Cannot be empty.' })
  @IsOptional()
  loggedUserName: string;

  @Field()
  @IsString()
  @IsNotEmpty({ message: 'Cannot be empty.' })
  @IsOptional()
  mac: string;

  @Field()
  @IsString()
  @IsNotEmpty({ message: 'Cannot be empty.' })
  ownerId: string;

  @Field(() => [String])
  @IsArray()
  coOwnersId: string[];

  @Field()
  @IsBoolean()
  @IsNotEmpty({ message: 'Cannot be empty.' })
  @IsOptional()
  canHostConnections: boolean;

  @Field(() => SpecsInput)
  @ValidateNested()
  @Type(() => SpecsInput)
  @IsOptional()
  specs: SpecsInput;
}
