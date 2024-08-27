import {
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Requirement } from './requirement.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NATS_JS } from 'src/common/constants/constants';
import { JetStreamClient } from 'nats';
import { CreateRequirementInput } from './dto/create-requirement.input';
import { UpdateRequirementInput } from './dto/update-requirement.input';

@Injectable()
export class RequirementService {
  private readonly logger = new Logger(RequirementService.name);

  constructor(
    @InjectRepository(Requirement)
    private requirementRepository: Repository<Requirement>,
    @Inject(NATS_JS)
    private jetStream: JetStreamClient,
  ) {}

  async createRequirement(
    data: CreateRequirementInput,
    user: { sub: string; name?: string; email?: string },
  ): Promise<Requirement> {
    const requirement = this.requirementRepository.create({
      ...data,
      requesterId: user.sub,
    });

    const savedRequirement = await this.requirementRepository.save(requirement);

    if (!savedRequirement)
      throw new InternalServerErrorException(
        'An exception has occurred on server.',
      );

    await this.jetStream.publish('requirements:create', savedRequirement.id);

    return savedRequirement;
  }

  async updateRequirement(
    id: string,
    data: UpdateRequirementInput,
    user?: { sub: string; name?: string; email?: string },
  ): Promise<Requirement> {
    const requirement = await this.findRequirementById(id);

    if (!requirement) throw new NotFoundException('Requirement not found.');

    if (user && requirement.ownerId !== user.sub)
      throw new ForbiddenException('Not authorized.');

    const preUpdatedRequirement = { ...requirement, status: data.status };

    await this.requirementRepository.update({ id }, preUpdatedRequirement);

    return preUpdatedRequirement;
  }

  async findRequirementById(id: string): Promise<Requirement> {
    const requirement = await this.requirementRepository.findOne({
      where: { id },
    });

    if (!requirement) throw new NotFoundException('Requirement not found.');

    await this.jetStream.publish('requirements:update', requirement.id);

    return requirement;
  }
}