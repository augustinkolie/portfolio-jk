import { Module } from '@nestjs/common';
import { MediaModule } from '../media/media.module.js';
import { AdminPlansController, PlansController } from './plans.controller.js';
import { PlansService } from './plans.service.js';

@Module({
  imports: [MediaModule],
  controllers: [PlansController, AdminPlansController],
  providers: [PlansService],
})
export class PlansModule {}
