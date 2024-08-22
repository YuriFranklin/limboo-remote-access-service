import { Field, Int, ObjectType } from '@nestjs/graphql';
import { GetSessionOutput } from './get-session-output';

@ObjectType()
class SessionPagination {
  @Field(() => Int)
  limit: number;

  @Field(() => Int)
  totalCount: number;

  @Field(() => Int)
  totalPages: number;
}

@ObjectType()
class Criterias {
  @Field(() => String)
  startDate: string;

  @Field(() => String)
  endDate: string;
}

@ObjectType()
export class GetAllSessionOutput {
  @Field(() => GetSessionOutput)
  sessions: GetSessionOutput[];

  @Field(() => SessionPagination)
  pagination: SessionPagination;

  @Field(() => Criterias)
  criterias: Criterias;
}
