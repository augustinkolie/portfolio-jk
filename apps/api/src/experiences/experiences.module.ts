import { Module } from '@nestjs/common';
import { AdminExperiencesController, ExperiencesController } from './experiences.controller.js';
import { ExperiencesService } from './experiences.service.js';

@Module({
  controllers: [ExperiencesController, AdminExperiencesController],
  providers: [ExperiencesService],
})
export class ExperiencesModule {}
