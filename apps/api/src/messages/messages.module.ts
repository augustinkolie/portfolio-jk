import { Module } from '@nestjs/common';
import { AdminMessagesController, ContactController } from './messages.controller.js';
import { MessagesService } from './messages.service.js';

@Module({
  controllers: [ContactController, AdminMessagesController],
  providers: [MessagesService],
})
export class MessagesModule {}
