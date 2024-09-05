import { Inject, Injectable, Logger } from '@nestjs/common';
import { Requirement } from './requirement.entity';
import { APOLLO_CLIENT } from 'src/common/constants/constants';
import { ApolloClient, gql, NormalizedCacheObject } from '@apollo/client/core';

@Injectable()
export class RequirementService {
  private readonly logger = new Logger(RequirementService.name);

  constructor(
    @Inject(APOLLO_CLIENT)
    private readonly apolloClient: ApolloClient<NormalizedCacheObject>,
  ) {}

  async findRequirementById(id: string): Promise<Requirement> {
    const REQUIREMENT_BY_ID = gql`
      query GetRequirementById($id: String!) {
        requirement(id: $id) {
          id
          ownerId
          requesterId
          requestedAt
          requestedAt
          respondedAt
          status
          type
          payload
        }
      }
    `;

    try {
      const result = await this.apolloClient.query<{
        requirement: Requirement;
      }>({
        query: REQUIREMENT_BY_ID,
        variables: { id },
      });
      return result.data.requirement;
    } catch (error) {
      this.logger.error('Error fetching data:', error);
    }
  }
}
