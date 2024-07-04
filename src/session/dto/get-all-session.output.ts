import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Session } from '../session.entity';

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
  @Field(() => [Session])
  sessions: Session[];

  @Field(() => SessionPagination)
  pagination: SessionPagination;

  @Field(() => Criterias)
  criterias: Criterias;
}
