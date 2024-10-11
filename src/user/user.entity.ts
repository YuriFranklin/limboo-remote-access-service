import { Directive, Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
@Directive('@extends')
@Directive('@key(fields: "id")')
export class User {
  @Field(() => ID)
  @Directive('@external')
  id: string;

  @Field()
  @Directive('@external')
  username: string;

  @Field()
  @Directive('@external')
  enabled: boolean;

  @Field()
  @Directive('@external')
  firstName: string;

  @Field({ nullable: true })
  @Directive('@external')
  lastName?: string;

  @Field()
  @Directive('@external')
  createdAt: string;

  @Field({ nullable: true })
  @Directive('@external')
  email?: string;
}
