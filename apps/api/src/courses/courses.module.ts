import { Module } from '@nestjs/common';
import { MediaModule } from '../media/media.module.js';
import { AdminCoursesController, CoursesController, EnrollmentsController } from './courses.controller.js';
import { CoursesService } from './courses.service.js';
import { EnrollmentsService } from './enrollments.service.js';

@Module({
  imports: [MediaModule],
  controllers: [CoursesController, EnrollmentsController, AdminCoursesController],
  providers: [CoursesService, EnrollmentsService],
})
export class CoursesModule {}
