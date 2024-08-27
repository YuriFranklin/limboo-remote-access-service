import { Logger, UseGuards } from '@nestjs/common';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import {
  AuthenticatedUser,
  AuthGuard,
  RoleGuard,
  RoleMatchingMode,
  Roles,
} from 'nest-keycloak-connect';
import { Requirement } from './requirement.entity';
import { CreateRequirementInput } from './dto/create-requirement.input';
import { RequirementService } from './requirement.service';
import { LogService } from 'src/log/log.service';
import { EventType, LogLevel } from 'src/log/log.entity';
import { ConfigService } from '@nestjs/config';
import { UpdateRequirementInput } from './dto/update-requirement.input';

@Resolver('Requirements')
@UseGuards(AuthGuard, RoleGuard)
export class RequirementResolver {
  private readonly logger = new Logger(RequirementResolver.name);

  constructor(
    private readonly requirementService: RequirementService,
    private readonly logService: LogService,
    private readonly configService: ConfigService,
  ) {}

  @Roles({
    roles: ['realm:can_use_remote_connections'],
    mode: RoleMatchingMode.ANY,
  })
  @Mutation(() => Requirement)
  async createRequirement(
    @Args('data')
    data: CreateRequirementInput,
    @AuthenticatedUser()
    user: { sub: string; name?: string; email?: string },
  ): Promise<Requirement> {
    const requirement = await this.requirementService.createRequirement(
      data,
      user,
    );

    await this.logService.createLog({
      level: LogLevel.INFO,
      payload: requirement,
      message: 'created an requirement.',
      operation: `${this.configService.get<string>('serviceName')}:requirement:create`,
      eventType: EventType.CREATE,
      userId: user.sub,
    });

    return requirement;
  }

  @Roles({
    roles: ['realm:can_use_remote_connections'],
    mode: RoleMatchingMode.ANY,
  })
  @Mutation(() => Requirement)
  async updateRequirement(
    id: string,
    @Args('data')
    data: UpdateRequirementInput,
    @AuthenticatedUser()
    user?: { sub: string; name?: string; email?: string },
  ): Promise<Requirement> {
    const updatedRequirement = await this.requirementService.updateRequirement(
      id,
      data,
      user,
    );

    await this.logService.createLog({
      level: LogLevel.INFO,
      payload: data,
      message: 'updated an requirement.',
      operation: `${this.configService.get<string>('serviceName')}:requirement:update`,
      eventType: EventType.CREATE,
      userId: user.sub,
    });

    return updatedRequirement;
  }
}
