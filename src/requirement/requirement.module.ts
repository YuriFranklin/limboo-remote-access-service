import { Module } from '@nestjs/common';
import { RequirementService } from './requirement.service';
import { ApolloModule } from 'src/apollo/apollo.module';

@Module({
  providers: [RequirementService],
  exports: [RequirementService],
  imports: [ApolloModule],
})
export class RequirementModule {}
