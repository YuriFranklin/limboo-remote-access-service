import { InputType, Field } from '@nestjs/graphql';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from 'class-validator';
import { SpecsInput } from './specs.input';
import { Type } from 'class-transformer';

@InputType()
export class CreateDeviceInput {
  @Field()
  @IsString()
  @IsNotEmpty({ message: 'Cannot be empty.' })
  name: string;

  @Field()
  @IsString()
  @IsNotEmpty({ message: 'Cannot be empty.' })
  loggedUserName: string;

  @Field()
  @IsString()
  @IsNotEmpty({ message: 'Cannot be empty.' })
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
  canHostConnections: boolean;

  @Field(() => SpecsInput)
  @ValidateNested()
  @Type(() => SpecsInput)
  specs: SpecsInput;
}