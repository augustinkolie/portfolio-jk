import { Module } from '@nestjs/common';
import { AdminExpertisesController, ExpertisesController } from './expertises.controller.js';
import { ExpertisesService } from './expertises.service.js';

@Module({
  controllers: [ExpertisesController, AdminExpertisesController],
  providers: [ExpertisesService],
})
export class ExpertisesModule {}
