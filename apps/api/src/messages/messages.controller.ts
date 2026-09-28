import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { ContactMessageDto, DashboardDto, NotificationsDto, Paginated } from '@btp/shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import {
  CreateContactMessageDto,
  MessagesQueryDto,
  UpdateMessageDto,
} from './dto/message.dto.js';
import { MessagesService } from './messages.service.js';

@Controller('contact')
export class ContactController {
  constructor(private readonly messages: MessagesService) {}

  /** 5 messages par quart d'heure et par adresse IP. */
  @Post()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ default: { limit: 5, ttl: 15 * 60_000 } })
  create(@Body() dto: CreateContactMessageDto): Promise<void> {
    return this.messages.create(dto);
  }
}

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminMessagesController {
  constructor(private readonly messages: MessagesService) {}

  @Get('dashboard')
  dashboard(): Promise<DashboardDto> {
    return this.messages.dashboard();
  }

  @Get('notifications')
  notifications(): Promise<NotificationsDto> {
    return this.messages.notifications();
  }

  @Get('messages')
  list(@Query() query: MessagesQueryDto): Promise<Paginated<ContactMessageDto>> {
    return this.messages.list(query);
  }

  @Get('messages/:id')
  open(@Param('id') id: string): Promise<ContactMessageDto> {
    return this.messages.open(id);
  }

  @Patch('messages/:id')
  update(@Param('id') id: string, @Body() dto: UpdateMessageDto): Promise<ContactMessageDto> {
    return this.messages.update(id, dto);
  }

  @Delete('messages/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): Promise<void> {
    return this.messages.remove(id);
  }
}
