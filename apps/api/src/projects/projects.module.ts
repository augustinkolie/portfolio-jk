import { Module } from '@nestjs/common';
import { MediaModule } from '../media/media.module.js';
import { AdminProjectsController, ProjectsController } from './projects.controller.js';
import { ProjectsService } from './projects.service.js';

@Module({
  imports: [MediaModule],
  controllers: [ProjectsController, AdminProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
