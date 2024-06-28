import { InputType, Field } from '@nestjs/graphql';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

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

  @Field(() => [String])
  @IsArray()
  @IsNotEmpty({ message: 'Owners ID array cannot be empty.' })
  @IsOptional()
  ownersId: string[];

  @Field()
  @IsBoolean()
  @IsNotEmpty({ message: 'Cannot be empty.' })
  @IsOptional()
  canHostConnections: boolean;
}
