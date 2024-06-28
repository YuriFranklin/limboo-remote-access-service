import { InputType, Field } from '@nestjs/graphql';
import { IsArray, IsBoolean, IsNotEmpty, IsString } from 'class-validator';

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

  @Field(() => [String])
  @IsArray()
  @IsNotEmpty({ message: 'Owners ID array cannot be empty.' })
  ownersId: string[];

  @Field()
  @IsBoolean()
  @IsNotEmpty({ message: 'Cannot be empty.' })
  canHostConnections: boolean;
}
